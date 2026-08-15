import { describe, expect, test } from "bun:test";
import {
  computeAll,
  computeEntry,
  extractVenues,
  formatCap,
  formatPe,
  formatPrice,
  isDiscontinuity,
  parseBinanceBulk,
  parseBitgetBulk,
  parseCap,
  parseOkxBulk,
  parsePe,
  pickLivePrice,
  venueFromHref,
  type Manifest,
  type ManifestRow,
  type VenueBulk,
} from "../worker/src/ratio";

describe("parsePe", () => {
  test("parses plain and decorated numbers", () => {
    expect(parsePe("28.4")).toBe(28.4);
    expect(parsePe("46")).toBe(46);
    expect(parsePe(" 31.0 ")).toBe(31.0);
  });
  test("rejects N/A, junk, and non-positive", () => {
    expect(parsePe("N/A")).toBeNull();
    expect(parsePe(undefined)).toBeNull();
    expect(parsePe("abc")).toBeNull();
    expect(parsePe("0")).toBeNull();
    expect(parsePe("-5")).toBeNull();
  });
});

describe("parseCap", () => {
  test("parses short units", () => {
    expect(parseCap("$4.65T")).toBe(4.65e12);
    expect(parseCap("$980.5B")).toBe(980.5e9);
    expect(parseCap("$57 Million")).toBe(57e6);
    expect(parseCap("$1.2 trillion")).toBeCloseTo(1.2e12);
  });
  test("rejects N/A and junk", () => {
    expect(parseCap("N/A")).toBeNull();
    expect(parseCap(undefined)).toBeNull();
    expect(parseCap("growth co")).toBeNull();
  });
});

describe("formatting", () => {
  test("price with thousands separators", () => {
    expect(formatPrice(1234.5)).toBe("$1,234.50");
    expect(formatPrice(305.933)).toBe("$305.93");
  });
  test("PE one decimal", () => {
    expect(formatPe(46.41)).toBe("46.4");
  });
  test("cap tiers", () => {
    expect(formatCap(4.65e12)).toBe("$4.65T");
    expect(formatCap(980e9)).toBe("$980.0B");
    expect(formatCap(57e6)).toBe("$57M");
  });
});

describe("isDiscontinuity", () => {
  test("inside band is not a discontinuity", () => {
    expect(isDiscontinuity(100, 100)).toBe(false);
    expect(isDiscontinuity(130, 100)).toBe(false); // +30%
    expect(isDiscontinuity(70, 100)).toBe(false); // -30%
    // (exact ±35% boundary deliberately untested — float-adjacent by nature)
  });
  test("outside band flags", () => {
    expect(isDiscontinuity(136, 100)).toBe(true);
    expect(isDiscontinuity(64, 100)).toBe(true);
    expect(isDiscontinuity(4, 100)).toBe(true); // 25:1 split signature
  });
  test("degenerate inputs are safe", () => {
    expect(isDiscontinuity(NaN, 100)).toBe(false);
    expect(isDiscontinuity(100, 0)).toBe(false);
  });
});

describe("computeEntry", () => {
  const row: ManifestRow = {
    ticker: "TEST",
    venues: [{ venue: "bitget", symbol: "TESTUSDT" }],
    peAuthored: 40,
    capAuthored: 1e12,
    basis: 100,
  };

  test("scales PE and cap by live/basis ratio", () => {
    const e = computeEntry(row, 120, 110)!; // +9% vs prev — inside guard band
    expect(e.p).toBe("$120.00");
    expect(e.pe).toBe("48.0");
    expect(e.cap).toBe("$1.20T");
    expect(e.review).toBeUndefined();
  });

  test("null authored fields stay null", () => {
    const sparse = { ...row, peAuthored: null, capAuthored: null };
    const e = computeEntry(sparse, 120, 100)!;
    expect(e.pe).toBeNull();
    expect(e.cap).toBeNull();
  });

  test("discontinuity freezes PE/cap and flags review", () => {
    const e = computeEntry(row, 4, 100)!; // 25:1 split shape
    expect(e.p).toBe("$4.00");
    expect(e.pe).toBeNull();
    expect(e.cap).toBeNull();
    expect(e.review).toBe(true);
  });

  test("no live price returns null (authored numbers stand)", () => {
    expect(computeEntry(row, null, 100)).toBeNull();
  });

  test("first run uses basis as previous price", () => {
    const e = computeEntry(row, 110, null)!;
    expect(e.review).toBeUndefined();
    expect(e.pe).toBe("44.0");
  });
});

describe("computeAll", () => {
  const manifest: Manifest = {
    seededAt: "2026-08-15T00:00:00Z",
    tickers: {
      AAA: { ticker: "AAA", venues: [{ venue: "binance", symbol: "AAAUSDT" }], peAuthored: 10, capAuthored: 1e9, basis: 100 },
      SPLIT: { ticker: "SPLIT", venues: [{ venue: "okx", symbol: "SPLIT-USDT-SWAP" }], peAuthored: 20, capAuthored: 2e9, basis: 100 },
      GONE: { ticker: "GONE", venues: [{ venue: "binance", symbol: "GONEUSDT" }], peAuthored: 5, capAuthored: 5e8, basis: 50 },
    },
  };
  const bulk: VenueBulk = {
    binance: { AAAUSDT: 120, GONEUSDT: NaN },
    bitget: {},
    okx: { "SPLIT-USDT-SWAP": 4 },
  };

  test("computes entries, skips dead symbols, flags discontinuities", () => {
    const payload = computeAll(manifest, bulk, null);
    expect(Object.keys(payload.entries).sort()).toEqual(["AAA", "SPLIT"]);
    expect(payload.entries.AAA.pe).toBe("12.0");
    expect(payload.flagged).toEqual(["SPLIT"]);
    expect(payload.entries.SPLIT.review).toBe(true);
  });

  test("previous payload provides the guard baseline", () => {
    const prev = computeAll(manifest, bulk, null);
    // SPLIT re-run at 4 (same as prev raw 4) — no NEW discontinuity, but PE is
    // now computable only if basis ratio holds; ratio 4/100 = 0.04 is a 96%
    // collapse vs basis. Guard compares vs PREV raw (4), so it passes —
    // documenting intended behavior: guard is day-over-day, not vs-seed.
    const second = computeAll(manifest, bulk, prev);
    expect(second.flagged).toEqual([]);
  });
});

describe("bulk parsers", () => {
  test("binance fapi shape", () => {
    const m = parseBinanceBulk([{ symbol: "AAPLUSDT", price: "305.5" }, { symbol: "X", price: "bad" }, "junk"]);
    expect(m).toEqual({ AAPLUSDT: 305.5 });
  });
  test("bitget v2 shape", () => {
    const m = parseBitgetBulk({ data: [{ symbol: "AAPLUSDT", lastPr: "306" }], msg: "ok" });
    expect(m).toEqual({ AAPLUSDT: 306 });
  });
  test("okx v5 shape", () => {
    const m = parseOkxBulk({ code: "0", data: [{ instId: "AAPL-USDT-SWAP", last: "307" }] });
    expect(m).toEqual({ "AAPL-USDT-SWAP": 307 });
  });
  test("non-array input yields empty map", () => {
    expect(parseBinanceBulk({ error: 1 })).toEqual({});
    expect(parseBitgetBulk(null)).toEqual({});
    expect(parseOkxBulk([])).toEqual({});
  });
});

describe("venue refs from authored links", () => {
  test("real URL shapes from us-stocks.json", () => {
    expect(venueFromHref("https://www.binance.com/en/futures/AMATUSDT")).toEqual({ venue: "binance", symbol: "AMATUSDT" });
    expect(venueFromHref("https://www.bitget.com/futures/usdt/AALUSDT")).toEqual({ venue: "bitget", symbol: "AALUSDT" });
    expect(venueFromHref("https://www.okx.com/trade-swap/aaoi-usdt-swap")).toEqual({ venue: "okx", symbol: "AAOI-USDT-SWAP" });
    expect(venueFromHref("https://example.com/nope")).toBeNull();
  });

  test("extractVenues dedupes across link lines", () => {
    const body = [
      '<p>Trade This Idea:</p>',
      '<a href="https://www.bitget.com/futures/usdt/SPYUSDT">Bitget</a>',
      '<a href="https://www.binance.com/en/futures/SPYUSDT">Binance</a>',
      '<a href="https://www.bitget.com/futures/usdt/SPYUSDT">Bitget again</a>',
      '<a href="https://www.okx.com/trade-swap/spy-usdt-swap">OKX</a>',
    ].join("\n");
    const refs = extractVenues(body);
    expect(refs.map((r) => r.venue)).toEqual(["bitget", "binance", "okx"]);
  });
});

describe("pickLivePrice priority", () => {
  const row: ManifestRow = {
    ticker: "X",
    venues: [
      { venue: "okx", symbol: "X-USDT-SWAP" },
      { venue: "binance", symbol: "XUSDT" },
      { venue: "bitget", symbol: "XUSDT" },
    ],
    peAuthored: null,
    capAuthored: null,
    basis: 10,
  };
  const bulk: VenueBulk = {
    binance: { XUSDT: 11 },
    bitget: { XUSDT: 12 },
    okx: { "X-USDT-SWAP": 13 },
  };
  test("binance wins over the others regardless of link order", () => {
    expect(pickLivePrice(row, bulk)).toBe(11);
  });
  test("falls through when the priority venue is missing", () => {
    expect(pickLivePrice(row, { ...bulk, binance: {} })).toBe(12);
    expect(pickLivePrice(row, { binance: {}, bitget: {}, okx: bulk.okx })).toBe(13);
    expect(pickLivePrice(row, { binance: {}, bitget: {}, okx: {} })).toBeNull();
  });
});
