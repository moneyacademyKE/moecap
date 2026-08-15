/**
 * ratio.ts — pure price/cap/PE hydration math for the moecap-prices worker.
 *
 * Zero I/O. Zero environment access. Every function is deterministic and
 * total (returns `null`/`false`/`{}` instead of throwing on unusable input),
 * so the whole module is directly unit-testable and safely reusable on the
 * edge runtime, in the seed script, and in tests/prices.test.ts.
 *
 * Domain conventions (mirroring the us-stocks.json frontmatter dialect):
 *   - `market_cap` arrives unitless ("191.8" ⇒ billions of USD), suffixed
 *     ("$2.77T", "$0.81B"), or worded ("$57 Million"). Caps are handled
 *     internally as absolute USD (dollars) to stay unit-safe.
 *   - `pe_ratio` is a bare number string or "N/A".
 *   - `stock_price` is a "$"-prefixed, possibly comma-grouped string.
 *
 * Hydration model: authored P/E and cap are valid as-of the seed price
 * (`basis`); they are kept current by scaling with live/basis. A ±35%
 * day-over-day discontinuity guard (splits, bad prints, venue chaos) freezes
 * pe/cap to null — the authored build numbers then stand — and flags the
 * ticker for review.
 */

/* ------------------------------------------------------------------ */
/* Parsing & formatting core                                           */
/* ------------------------------------------------------------------ */

/** Strip currency symbols, grouping commas and whitespace; parse to a number. */
export function parseNum(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "" || cleaned === "-" || /^n\/a$/i.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const CAP_MULTIPLIERS: Record<string, number> = {
  k: 1e3,
  m: 1e6,
  mm: 1e6,
  b: 1e9,
  bn: 1e9,
  t: 1e12,
  tn: 1e12,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
};

/**
 * Parse a market cap expression into absolute USD (dollars).
 * Unitless values are interpreted as billions (the frontmatter convention:
 * `market_cap: 191.8` ⇒ $191.8B). Returns `null` when nothing usable remains.
 */
export function parseCap(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).toLowerCase().replace(/[$,\s]/g, "");
  if (text === "" || text === "n/a") return null;
  const match = text.match(/^([\d.]+)(millions?|billions?|trillions?|mm|bn|tn|m|b|t|k)?\.?$/);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base) || base <= 0) return null;
  const suffix = (match[2] ?? "").replace(/s$/, "");
  // Unitless numbers in our data dialect mean billions; explicit suffix wins.
  const multiplier = suffix ? (CAP_MULTIPLIERS[suffix] ?? 1e9) : 1e9;
  const dollars = base * multiplier;
  return Number.isFinite(dollars) ? dollars : null;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/**
 * Format absolute USD as the display string used across the dashboard
 * ("$2.77T", "$191.8B", "$57M", "$0B"). Canonical precision:
 * T ⇒ 2 decimals, B ⇒ 1 decimal, M ⇒ 0 decimals.
 */
export function formatCap(dollars: number | null | undefined): string {
  if (dollars === null || dollars === undefined || !Number.isFinite(dollars) || dollars <= 0) return "$0B";
  if (dollars >= 1e12) return `$${round(dollars / 1e12, 2).toFixed(2)}T`;
  const b = round(dollars / 1e9, 1);
  if (b >= 1000) return `$${round(b / 1000, 2).toFixed(2)}T`; // 999.99e9 ⇒ "$1.00T", not "$1000.0B"
  if (dollars >= 1e9) return `$${b.toFixed(1)}B`;
  const m = Math.round(dollars / 1e6);
  if (m >= 1000) return `$${round(m / 1000, 1).toFixed(1)}B`; // 999.6e6 ⇒ "$1.0B", not "$1000M"
  return `$${m}M`;
}

/** Parse a P/E expression; non-positive or absent values yield `null`. */
export function parsePE(raw: string | number | null | undefined): number | null {
  const n = parseNum(raw);
  return n !== null && n > 0 ? n : null;
}

/** Camel-case alias kept for the seed script / tests contract. */
export const parsePe = parsePE;

/** Format a P/E for display ("71.8", "108.0"); `null` ⇒ "N/A". */
export function formatPE(pe: number | null | undefined): string {
  return pe === null || pe === undefined || !Number.isFinite(pe) ? "N/A" : pe.toFixed(1);
}

/** Camel-case alias kept for the seed script / tests contract. */
export const formatPe = formatPE;

/** Parse a price expression ("$389.39", "1,234.50", 42) into a plain number. */
export function parsePrice(raw: string | number | null | undefined): number | null {
  const n = parseNum(raw);
  return n !== null && n > 0 ? n : null;
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a price with thousands separators ("$1,234.50"); `null` ⇒ "N/A". */
export function formatPrice(price: number | null | undefined, symbol = "$"): string {
  if (price === null || price === undefined || !Number.isFinite(price)) return "N/A";
  const [int, dec = "00"] = Math.abs(price).toFixed(2).split(".");
  const sign = price < 0 ? "-" : "";
  return `${sign}${symbol}${groupThousands(int)}.${dec}`;
}

/** newPrice / oldPrice when both are usable positives, else `null`. */
export function priceRatio(
  oldPrice: number | null | undefined,
  newPrice: number | null | undefined,
): number | null {
  const oldP = parsePrice(oldPrice);
  const newP = parsePrice(newPrice);
  if (oldP === null || newP === null) return null;
  return newP / oldP;
}

/** Percentage change from old to new, rounded to 1 decimal; `null` if unknown. */
export function pctChange(
  oldVal: number | null | undefined,
  newVal: number | null | undefined,
): number | null {
  const ratio = priceRatio(oldVal, newVal);
  return ratio === null ? null : round((ratio - 1) * 100, 1);
}

/* ------------------------------------------------------------------ */
/* Discontinuity guard (split / bad-print detector)                    */
/* ------------------------------------------------------------------ */

/** Default guard band: day-over-day moves beyond ±35% are suspect. */
export const GUARD_BAND = 0.35;
/** Tolerance so float dust at the exact boundary cannot flip the verdict. */
const BAND_EPS = 1e-9;

/**
 * True when new/prev falls outside the ±35% band — the signature of a stock
 * split, a bad print, or venue chaos rather than an honest intraday move.
 * Degenerate inputs (NaN, non-positive, missing) are never discontinuities:
 * when there is no trustworthy baseline, the guard stays out of the way.
 */
export function isDiscontinuity(
  newVal: number | null | undefined,
  prevVal: number | null | undefined,
  band: number = GUARD_BAND,
): boolean {
  const ratio = priceRatio(prevVal, newVal);
  if (ratio === null) return false;
  return ratio > 1 + band + BAND_EPS || ratio < 1 - band - BAND_EPS;
}

/* ------------------------------------------------------------------ */
/* Venue model: Binance / Bitget / OKX US-stock perp listings          */
/* ------------------------------------------------------------------ */

export type VenueName = "binance" | "bitget" | "okx";

export interface VenueRef {
  venue: VenueName;
  /** Symbol exactly as the venue keys it ("AMATUSDT", "AMAT-USDT-SWAP"). */
  symbol: string;
}

/** One bulk map per venue: venue symbol → last price. */
export interface VenueBulk {
  binance: Record<string, number>;
  bitget: Record<string, number>;
  okx: Record<string, number>;
}

/** Live-price priority: Binance first, then Bitget, then OKX. */
export const VENUE_PRIORITY: readonly VenueName[] = ["binance", "bitget", "okx"];

const VENUE_URL_PATTERNS: Array<{ venue: VenueName; re: RegExp }> = [
  { venue: "binance", re: /binance\.com\/(?:[a-z-]+\/)?futures\/([A-Za-z0-9]+)/ },
  { venue: "bitget", re: /bitget\.com\/futures\/[a-z]+\/([A-Za-z0-9]+)/ },
  { venue: "okx", re: /okx\.com\/trade-swap\/([A-Za-z0-9-]+)/ },
];

/**
 * Extract the venue reference from an authored "Trade This Idea" link.
 * Tails are normalized to upper-case ("aaoi-usdt-swap" ⇒ "AAOI-USDT-SWAP");
 * unknown hosts yield `null`.
 */
export function venueFromHref(href: string | null | undefined): VenueRef | null {
  if (!href || typeof href !== "string") return null;
  for (const { venue, re } of VENUE_URL_PATTERNS) {
    const match = href.match(re);
    if (match) return { venue, symbol: match[1].toUpperCase() };
  }
  return null;
}

/**
 * Scan an authored message body's anchor tags for venue links, deduped by
 * (venue, symbol) and kept in first-seen order.
 */
export function extractVenues(body: string | null | undefined): VenueRef[] {
  if (!body || typeof body !== "string") return [];
  const seen = new Set<string>();
  const refs: VenueRef[] = [];
  for (const match of body.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const ref = venueFromHref(match[1]);
    if (!ref) continue;
    const key = `${ref.venue}:${ref.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push(ref);
  }
  return refs;
}

/* ------------------------- bulk payload parsers --------------------- */

/**
 * Binance USD-M futures `GET /fapi/v1/ticker/price`:
 * `[{"symbol":"AMATUSDT","price":"506.64","time":...}, ...]`.
 */
export function parseBinanceBulk(payload: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(payload)) return out;
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const { symbol, price } = row as { symbol?: unknown; price?: unknown };
    if (typeof symbol !== "string") continue;
    const n = parsePrice(price as string | number);
    if (n === null) continue;
    out[symbol.toUpperCase()] = n;
  }
  return out;
}

/**
 * Bitget v2 mix market `GET /api/v2/mix/market/tickers?productType=usdt-futures`:
 * `{"msg":"success","data":[{"symbol":"AMATUSDT","lastPr":"506.9"}, ...]}`.
 */
export function parseBitgetBulk(payload: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  const rows = (payload as { data?: unknown } | null | undefined)?.data;
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { symbol, lastPr } = row as { symbol?: unknown; lastPr?: unknown };
    if (typeof symbol !== "string") continue;
    const n = parsePrice(lastPr as string | number);
    if (n === null) continue;
    out[symbol.toUpperCase()] = n;
  }
  return out;
}

/**
 * OKX v5 `GET /api/v5/market/tickers?instType=SWAP`:
 * `{"code":"0","data":[{"instId":"AMAT-USDT-SWAP","last":"506.54"}, ...]}`.
 */
export function parseOkxBulk(payload: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  const rows = (payload as { data?: unknown } | null | undefined)?.data;
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { instId, last } = row as { instId?: unknown; last?: unknown };
    if (typeof instId !== "string") continue;
    const n = parsePrice(last as string | number);
    if (n === null) continue;
    out[instId.toUpperCase()] = n;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Manifest + hydration computation                                    */
/* ------------------------------------------------------------------ */

/** One seeded ticker row (basis.json dialect, written by scripts/seed-prices.ts). */
export interface ManifestRow {
  ticker: string;
  venues: VenueRef[];
  /** Authored P/E from the message meta block; null when "N/A". */
  peAuthored: number | null;
  /** Authored market cap in absolute USD; null when unknown. */
  capAuthored: number | null;
  /** Live venue price at seed time — the as-of anchor for authored numbers. */
  basis: number;
}

export interface Manifest {
  seededAt?: string;
  tickers: Record<string, ManifestRow>;
}

/** One hydrated ticker as served by the worker (and consumed by hydrate.js). */
export interface PayloadEntry {
  /** Display price ("$1,234.50"). */
  p: string;
  /** Display P/E ("48.0") or null (authored value stands). */
  pe: string | null;
  /** Display cap ("$1.20T") or null (authored value stands). */
  cap: string | null;
  /** Raw numeric price — the next run's guard baseline. */
  raw: number;
  /** Present only when the discontinuity guard fired for this ticker. */
  review?: true;
}

/** Full /prices payload written to KV and served by the fetch handler. */
export interface PricesPayload {
  asOf?: string;
  entries: Record<string, PayloadEntry>;
  flagged?: string[];
  sources?: Partial<Record<VenueName, { ok: boolean; count: number; error?: string }>>;
}

function firstFinitePositive(values: Array<number | null | undefined>): number | null {
  for (const v of values) {
    const n = parsePrice(v as number);
    if (n !== null) return n;
  }
  return null;
}

/**
 * Pick this ticker's live price: venue priority (binance > bitget > okx)
 * wins regardless of link order, falling through to the next venue when the
 * preferred one has no usable quote for the symbol. `null` when none has.
 */
export function pickLivePrice(row: ManifestRow, bulk: VenueBulk): number | null {
  for (const venue of VENUE_PRIORITY) {
    const symbols = row.venues.filter((v) => v.venue === venue).map((v) => v.symbol);
    const price = firstFinitePositive(symbols.map((s) => bulk[venue][s]));
    if (price !== null) return price;
  }
  return null;
}

/**
 * Hydrate one manifest row with a live price.
 *   - Scaling ratio is live/basis: authored P/E and cap are valid as-of the
 *     seed price, so they track the price since seeding.
 *   - The guard compares live vs the previous run's raw price (falling back
 *     to basis on the first run): outside ±35%, pe/cap freeze to null (the
 *     authored build numbers stand) and the ticker is flagged for review.
 *   - `null` live price ⇒ `null` entry: the ticker keeps its authored render.
 */
export function computeEntry(
  row: ManifestRow,
  live: number | null | undefined,
  prev: number | null | undefined,
): PayloadEntry | null {
  const livePrice = parsePrice(live as number);
  if (livePrice === null) return null;

  const prevPrice = parsePrice(prev as number) ?? parsePrice(row.basis);
  const review = prevPrice !== null && isDiscontinuity(livePrice, prevPrice);

  const ratio = parsePrice(row.basis) !== null ? livePrice / (row.basis as number) : null;

  const pe =
    review || row.peAuthored === null || ratio === null
      ? null
      : formatPE(row.peAuthored * ratio);
  const cap =
    review || row.capAuthored === null || ratio === null
      ? null
      : formatCap(row.capAuthored * ratio);

  const entry: PayloadEntry = { p: formatPrice(livePrice), pe, cap, raw: livePrice };
  if (review) entry.review = true;
  return entry;
}

/**
 * Hydrate every manifest ticker that has a usable live quote. `prev` is the
 * previous /prices payload (its `raw` fields are the guard baselines; the
 * first run passes null and guards against basis instead). Returns the
 * entries map plus `flagged` — tickers whose P/E/cap were frozen pending
 * review, in manifest order.
 */
export function computeAll(
  manifest: Manifest | null | undefined,
  bulk: VenueBulk,
  prev: PricesPayload | null | undefined,
): { entries: Record<string, PayloadEntry>; flagged: string[] } {
  const entries: Record<string, PayloadEntry> = {};
  const flagged: string[] = [];
  const tickers = manifest?.tickers ?? {};
  for (const [ticker, row] of Object.entries(tickers)) {
    if (!row || !Array.isArray(row.venues)) continue;
    const live = pickLivePrice(row, bulk);
    if (live === null) continue;
    const prevRaw = prev?.entries?.[ticker]?.raw ?? null;
    const entry = computeEntry(row, live, prevRaw);
    if (entry === null) continue;
    entries[ticker] = entry;
    if (entry.review) flagged.push(ticker);
  }
  return { entries, flagged };
}
