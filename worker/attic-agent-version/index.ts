/**
 * index.ts — moecap-prices Cloudflare Worker.
 *
 * Scheduled (hourly cron): THREE bulk fetches — one per venue —
 *   1. Binance USD-M futures  GET /fapi/v1/ticker/price
 *   2. Bitget v2 mix market    GET /api/v2/mix/market/tickers?productType=usdt-futures
 *   3. OKX v5                  GET /api/v5/market/tickers?instType=SWAP
 * Each response is the venue's FULL ticker universe in one payload (~450-750
 * rows), so the manifest's 170 US-stock perps are covered by exactly three
 * requests. Quotes are merged by venue priority (binance > bitget > okx),
 * every manifest row is hydrated via the pure ratio module (P/E and cap
 * scaled by live/basis; a ±35% day-over-day discontinuity guard freezes
 * them and flags the ticker), and one payload is put into KV:
 *   { asOf, entries: { TICKER: { p, pe, cap, raw, review? } }, flagged, sources }
 *
 * Fetch (HTTP): GET /prices serves that payload with permissive CORS so the
 * static Cloudflare Pages site (src/hydrate.js) can patch price/PE/cap
 * client-side. Every venue fetch is independently guarded: one venue failing
 * never blocks the others — a degraded snapshot is always written, with the
 * failure recorded in `sources`.
 *
 * Zero-npm (ADR-003): minimal ambient KV/scheduled types are declared below
 * instead of importing @cloudflare/workers-types.
 */

import {
  computeAll,
  parseBinanceBulk,
  parseBitgetBulk,
  parseOkxBulk,
  type Manifest,
  type PricesPayload,
  type VenueBulk,
  type VenueName,
} from "./ratio";

/* ------------------------------------------------------------------ */
/* Minimal ambient types (no @cloudflare/workers-types dependency)     */
/* ------------------------------------------------------------------ */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  /** KV namespace holding the seeded `manifest` (basis.json) and `prices`. */
  PRICES: KVNamespace;
}

export interface ScheduledController {
  cron: string;
  scheduledTime: number;
  noRetry(): void;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/* ------------------------------------------------------------------ */
/* KV layout                                                           */
/* ------------------------------------------------------------------ */

/** basis.json content, uploaded by the setup script (scripts/setup-cloudflare.sh). */
export const MANIFEST_KEY = "manifest";
/** The hydrated /prices payload (also the next run's guard baseline). */
export const PRICES_KEY = "prices";
/** Hourly refresh; a snapshot survives a week of cron outages before expiring. */
export const SNAPSHOT_TTL_SECONDS = 7 * 24 * 60 * 60;

/* ------------------------------------------------------------------ */
/* The three bulk venue sources                                        */
/* ------------------------------------------------------------------ */

export const VENUE_URLS: Record<VenueName, string> = {
  binance: "https://fapi.binance.com/fapi/v1/ticker/price",
  bitget: "https://api.bitget.com/api/v2/mix/market/tickers?productType=usdt-futures",
  okx: "https://www.okx.com/api/v5/market/tickers?instType=SWAP",
};

const VENUE_PARSERS: Record<VenueName, (payload: unknown) => Record<string, number>> = {
  binance: parseBinanceBulk,
  bitget: parseBitgetBulk,
  okx: parseOkxBulk,
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/** Fetch one venue's full ticker universe and parse it to { symbol: price }. */
export async function fetchVenueBulk(venue: VenueName): Promise<Record<string, number>> {
  const res = await fetch(VENUE_URLS[venue], { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${venue} HTTP ${res.status}`);
  const payload = await res.json();
  const parsed = VENUE_PARSERS[venue](payload);
  if (Object.keys(parsed).length === 0) throw new Error(`${venue} returned no usable tickers`);
  return parsed;
}

type Guarded<T> = { ok: true; value: T } | { ok: false; error: string };

async function guard<T>(promise: Promise<T>): Promise<Guarded<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ------------------------------------------------------------------ */
/* Scheduled handler: 3 bulk fetches → hydrate → KV put                */
/* ------------------------------------------------------------------ */

export async function runHydration(env: Env): Promise<PricesPayload> {
  const [manifest, prev] = await Promise.all([
    guard(env.PRICES.get<Manifest>(MANIFEST_KEY, "json")),
    guard(env.PRICES.get<PricesPayload>(PRICES_KEY, "json")),
  ]);

  // The three bulk fetches — one per venue, in parallel, independently guarded.
  const [binance, bitget, okx] = await Promise.all(
    (["binance", "bitget", "okx"] as const).map((venue) => guard(fetchVenueBulk(venue))),
  );
  const results = { binance, bitget, okx };

  const bulk: VenueBulk = {
    binance: binance.ok ? binance.value : {},
    bitget: bitget.ok ? bitget.value : {},
    okx: okx.ok ? okx.value : {},
  };

  const { entries, flagged } = computeAll(
    manifest.ok ? manifest.value : null,
    bulk,
    prev.ok ? prev.value : null,
  );

  const sources: PricesPayload["sources"] = {};
  for (const venue of ["binance", "bitget", "okx"] as const) {
    const r = results[venue];
    sources[venue] = r.ok
      ? { ok: true, count: Object.keys(r.value).length }
      : { ok: false, count: 0, error: r.error };
  }

  return { asOf: new Date().toISOString(), entries, flagged, sources };
}

export async function scheduled(
  _controller: ScheduledController,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  const payload = await runHydration(env);
  await env.PRICES.put(PRICES_KEY, JSON.stringify(payload), {
    expirationTtl: SNAPSHOT_TTL_SECONDS,
  });
}

/* ------------------------------------------------------------------ */
/* Fetch handler: GET /prices (CORS) for the static site's hydrate.js  */
/* ------------------------------------------------------------------ */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra },
  });
}

async function handleFetch(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (pathname === "/prices" || pathname === "/prices.json") {
    if (request.method !== "GET") {
      return jsonResponse({ error: "method not allowed" }, 405, { Allow: "GET, OPTIONS" });
    }
    const raw = await env.PRICES.get(PRICES_KEY);
    if (raw === null) {
      return jsonResponse({ error: "no price snapshot available yet" }, 503);
    }
    return new Response(raw, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        ...CORS_HEADERS,
      },
    });
  }

  return jsonResponse({ error: "not found", path: pathname }, 404);
}

export default {
  fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleFetch(request, env);
  },
  scheduled,
};
