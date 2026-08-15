// Seeds the moecap-prices KV manifest ("basis.json") from us-stocks.json.
//
// For each entry: venue symbols come from its own trade-link lines, authored
// P/E / cap from the meta block, and the basis price is the live venue price
// right now. Ratios are computed against this basis at seed time, so publish a
// fresh manifest whenever authored numbers are edited.
//
// Run: bun scripts/seed-prices.ts [--out basis.json]

import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { parseStockIdeas } from "../src/us-stocks";
import {
  extractVenues,
  parseBinanceBulk,
  parseBitgetBulk,
  parseOkxBulk,
  parseCap,
  parsePe,
  pickLivePrice,
  type Manifest,
  type ManifestRow,
  type VenueBulk,
} from "../worker/src/ratio";

const BASE = process.cwd();
const outPath = process.argv.find((a) => a !== "--out" && !a.startsWith("--") && a.endsWith(".json"))
  ?? join(BASE, "basis.json");

async function fetchBulk(): Promise<VenueBulk> {
  const [b, g, o] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/ticker/price").then((r) => r.json()),
    fetch("https://api.bitget.com/api/v2/mix/market/tickers?productType=usdt-futures").then((r) => r.json()),
    fetch("https://www.okx.com/api/v5/market/tickers?instType=SWAP").then((r) => r.json()),
  ]);
  return {
    binance: parseBinanceBulk(b),
    bitget: parseBitgetBulk(g),
    okx: parseOkxBulk(o),
  };
}

function parseAuthoredCap(meta: { market_cap_formatted?: string; market_cap?: string }): number | null {
  const fromFormatted = parseCap(meta.market_cap_formatted);
  if (fromFormatted != null) return fromFormatted;
  // Raw market_cap follows the renderer's implied billions convention.
  if (meta.market_cap && /^[\d.]+$/.test(meta.market_cap)) {
    const n = Number(meta.market_cap);
    if (Number.isFinite(n) && n > 0) return n * 1e9;
  }
  return parseCap(meta.market_cap);
}

const stocks = parseStockIdeas(join(BASE, "us-stocks.json"));
if (stocks.length === 0) {
  console.error("no stock ideas parsed from us-stocks.json");
  process.exit(1);
}

const bulk = await fetchBulk();
const tickers: Record<string, ManifestRow> = {};
let noVenue = 0;
let noPrice = 0;

for (const s of stocks) {
  const venues = extractVenues(s.body);
  if (venues.length === 0) { noVenue++; continue; }

  const row: ManifestRow = {
    ticker: s.ticker,
    venues,
    peAuthored: parsePe(s.meta.pe_ratio),
    capAuthored: parseAuthoredCap(s.meta),
    basis: 0,
  };

  const live = pickLivePrice(row, bulk);
  if (live == null) { noPrice++; console.warn(`  ⚠ no live price: ${s.ticker} (${venues.map((v) => v.venue).join("/")})`); continue; }

  row.basis = live;
  tickers[s.ticker.toUpperCase()] = row;
}

const manifest: Manifest = { seededAt: new Date().toISOString(), tickers };
writeFileSync(outPath, JSON.stringify(manifest, null, 2));

const n = Object.keys(tickers).length;
console.log(`manifest: ${n}/${stocks.length} tickers (skipped: ${noVenue} no venue links, ${noPrice} no live price)`);
console.log(`wrote ${outPath}`);
if (n === 0) process.exit(1);
