// Pure price-ratio math for moecap price hydration.
// No I/O here — everything is data-in/data-out so tests cover the whole contract.

export type Venue = "binance" | "bitget" | "okx";

export interface VenueRef {
  venue: Venue;
  symbol: string;
}

export interface ManifestRow {
  ticker: string;
  venues: VenueRef[];
  peAuthored: number | null;
  capAuthored: number | null;
  basis: number; // live venue price when the manifest was seeded
}

export interface Manifest {
  seededAt: string;
  tickers: Record<string, ManifestRow>;
}

export interface PriceEntry {
  p: string; // display price, e.g. "$1,234.56"
  raw: number; // live price, next run's guard baseline
  pe: string | null; // scaled display P/E, null = keep authored
  cap: string | null; // scaled display cap, null = keep authored
  review?: true; // discontinuity detected — numbers need a human look
}

export interface PricesPayload {
  asOf: string;
  entries: Record<string, PriceEntry>;
  flagged: string[];
}

// --- parsing authored display strings -------------------------------------

export function parsePe(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const CAP_UNITS: Record<string, number> = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 };

export function parseCap(s: string | undefined): number | null {
  if (!s) return null;
  const short = s.match(/\$\s*([\d.]+)\s*([TBMK])/i);
  if (short) {
    const n = Number(short[1]);
    return Number.isFinite(n) ? n * CAP_UNITS[short[2].toUpperCase()] : null;
  }
  const long = s.match(/\$\s*([\d.]+)\s*(trillion|billion|million)/i);
  if (long) {
    const n = Number(long[1]);
    const unit = long[2][0].toUpperCase();
    return Number.isFinite(n) ? n * CAP_UNITS[unit] : null;
  }
  return null;
}

// --- display formatting ----------------------------------------------------

export function formatPrice(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPe(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

// --- split / discontinuity guard -------------------------------------------

export const GUARD_BAND = 0.35;

/** True when the move since the previous run is a discontinuity (>±35% in one step). */
export function isDiscontinuity(live: number, last: number): boolean {
  if (!Number.isFinite(live) || !Number.isFinite(last) || last <= 0) return false;
  return Math.abs(live / last - 1) > GUARD_BAND;
}

// --- core computation --------------------------------------------------------

/**
 * One ticker's hydrated entry. Returns null when no live price exists
 * (hydration then leaves the authored numbers untouched).
 */
export function computeEntry(
  row: ManifestRow,
  live: number | null,
  lastPrice: number | null
): PriceEntry | null {
  if (live == null || !Number.isFinite(live) || live <= 0) return null;

  const last = lastPrice ?? row.basis;
  const guard = isDiscontinuity(live, last);
  const ratio = live / row.basis;

  // After a discontinuity the ratio basis is broken (likely split): update the
  // price, drop derived fields back to authored, flag for review.
  let pe: string | null = null;
  let cap: string | null = null;
  let review: true | undefined;
  if (guard) {
    review = true;
  } else {
    if (row.peAuthored != null) pe = formatPe(row.peAuthored * ratio);
    if (row.capAuthored != null) cap = formatCap(row.capAuthored * ratio);
  }

  return { p: formatPrice(live), raw: live, pe, cap, ...(review ? { review } : {}) };
}

export function computeAll(
  manifest: Manifest,
  bulk: VenueBulk,
  prev: PricesPayload | null
): PricesPayload {
  const entries: Record<string, PriceEntry> = {};
  const flagged: string[] = [];

  for (const [ticker, row] of Object.entries(manifest.tickers)) {
    const live = pickLivePrice(row, bulk);
    const lastPrice = prev?.entries[ticker]?.raw ?? null;
    const entry = computeEntry(row, live, lastPrice);
    if (entry) {
      entries[ticker] = entry;
      if (entry.review) flagged.push(ticker);
    }
  }

  return { asOf: new Date().toISOString(), entries, flagged };
}

// --- venue bulk extraction ---------------------------------------------------

export interface VenueBulk {
  binance: Record<string, number>; // fapi /ticker/price: [{symbol, price}]
  bitget: Record<string, number>; // v2 mix tickers: data:[{symbol, lastPr}]
  okx: Record<string, number>; // v5 tickers SWAP: data:[{instId, last}]
}

export function parseBinanceBulk(json: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(json)) return out;
  for (const t of json) {
    const p = Number(t?.price);
    if (t?.symbol && Number.isFinite(p)) out[t.symbol] = p;
  }
  return out;
}

export function parseBitgetBulk(json: any): Record<string, number> {
  const out: Record<string, number> = {};
  const rows = json?.data;
  if (!Array.isArray(rows)) return out;
  for (const t of rows) {
    const p = Number(t?.lastPr);
    if (t?.symbol && Number.isFinite(p)) out[t.symbol] = p;
  }
  return out;
}

export function parseOkxBulk(json: any): Record<string, number> {
  const out: Record<string, number> = {};
  const rows = json?.data;
  if (!Array.isArray(rows)) return out;
  for (const t of rows) {
    const p = Number(t?.last);
    if (t?.instId && Number.isFinite(p)) out[t.instId] = p;
  }
  return out;
}

/** Stable venue priority: binance → bitget → okx; first symbol with a price wins. */
const VENUE_ORDER: Venue[] = ["binance", "bitget", "okx"];

export function pickLivePrice(row: ManifestRow, bulk: VenueBulk): number | null {
  for (const venue of VENUE_ORDER) {
    for (const ref of row.venues) {
      if (ref.venue !== venue) continue;
      const p = bulk[venue][ref.symbol];
      if (p != null && Number.isFinite(p) && p > 0) return p;
    }
  }
  return null;
}

// --- venue refs from authored link lines (for the seed script) ---------------

export function venueFromHref(href: string): VenueRef | null {
  let m = href.match(/binance\.com\/[a-z/]*futures\/([A-Z0-9]+)/);
  if (m) return { venue: "binance", symbol: m[1] };
  m = href.match(/bitget\.com\/[a-z/]*futures\/(?:[a-z]+\/)?([A-Z0-9]+)/);
  if (m) return { venue: "bitget", symbol: m[1] };
  m = href.match(/okx\.com\/(?:[a-z-]+\/)*trade-swap\/([a-z0-9]+)-usdt-swap/);
  if (m) return { venue: "okx", symbol: `${m[1].toUpperCase()}-USDT-SWAP` };
  return null;
}

/** Extract deduped venue refs from an entry body's raw <a href> link lines. */
export function extractVenues(body: string): VenueRef[] {
  const seen = new Set<string>();
  const out: VenueRef[] = [];
  for (const m of body.matchAll(/href="(https:[^"]+)"/g)) {
    const ref = venueFromHref(m[1]);
    if (!ref) continue;
    const key = `${ref.venue}:${ref.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}
