// moecap-prices: cron Worker that keeps hydrated stock prices in KV.
//
// Scheduled (hourly): 3 bulk venue fetches (each isolated — one blocked venue
// can't kill the batch) -> Yahoo v8 chart fallback for any ticker the venues
// didn't price -> ratio math -> KV "prices". NSE snapshot best-effort.
// Fetch: serves /prices, /nse, /manifest, /holders (CORS) for the static page,
// plus /refresh?key=... to run the whole refresh on demand with diagnostics.

import {
  computeAll,
  parseBitgetBulk,
  parseBinanceBulk,
  parseOkxBulk,
  type Manifest,
  type PricesPayload,
  type VenueBulk,
} from "./ratio";
import { fetchNsePrices } from "./nse";

export interface Env {
  PRICES: KVNamespace;
  REFRESH_KEY?: string;
}

const VENUE_ENDPOINTS = {
  binance: "https://fapi.binance.com/fapi/v1/ticker/price",
  bitget: "https://api.bitget.com/api/v2/mix/market/tickers?productType=usdt-futures",
  okx: "https://www.okx.com/api/v5/market/tickers?instType=SWAP",
} as const;

interface SourceDiag {
  source: string;
  ok: boolean;
  status?: number;
  rows: number;
  error?: string;
}

async function fetchJson(url: string): Promise<{ json: any; status: number }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`non-JSON body (${text.slice(0, 60)}…)`), { status: res.status });
  }
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return { json, status: res.status };
}

/** Fetch all venue maps independently — a blocked/failed venue yields {} + a diag row. */
async function fetchVenueBulk(): Promise<{ bulk: VenueBulk; diags: SourceDiag[] }> {
  const jobs: Array<{ name: keyof typeof VENUE_ENDPOINTS; parse: (j: any) => Record<string, number> }> = [
    { name: "binance", parse: parseBinanceBulk },
    { name: "bitget", parse: parseBitgetBulk },
    { name: "okx", parse: parseOkxBulk },
  ];
  const settled = await Promise.allSettled(
    jobs.map((j) => fetchJson(VENUE_ENDPOINTS[j.name]).then((r) => j.parse(r.json)))
  );
  const bulk: VenueBulk = { binance: {}, bitget: {}, okx: {} };
  const diags: SourceDiag[] = [];
  settled.forEach((s, i) => {
    const name = jobs[i].name;
    if (s.status === "fulfilled") {
      bulk[name] = s.value;
      diags.push({ source: name, ok: true, rows: Object.keys(s.value).length });
    } else {
      const reason: any = s.reason;
      diags.push({
        source: name,
        ok: false,
        status: reason?.status,
        rows: 0,
        error: String(reason?.message ?? reason),
      });
    }
  });
  return { bulk, diags };
}

/** Yahoo per-ticker fallback intentionally NOT here: CF egress is edge-blocked
 *  by Yahoo and the free plan caps at 50 subrequests/invocation. US prices are
 *  refreshed by the GitHub Actions job (scripts/refresh-prices.ts), which uses
 *  the same pure math in ratio.ts and writes to this worker's KV. */

export interface RefreshResult {
  ranAt: string;
  sources: SourceDiag[];
  entries: number;
  flagged: string[];
  wrotePrices: boolean;
  nse?: { ok: boolean; tickers?: number; error?: string };
}

async function runRefresh(env: Env): Promise<RefreshResult> {
  const ranAt = new Date().toISOString();
  const manifest = await env.PRICES.get<Manifest>("manifest", "json");
  if (!manifest || Object.keys(manifest.tickers).length === 0) {
    return { ranAt, sources: [], entries: 0, flagged: [], wrotePrices: false, nse: { ok: false, error: "no manifest in KV" } };
  }

  const { bulk, diags } = await fetchVenueBulk();
  const prev = await env.PRICES.get<PricesPayload>("prices", "json");

  const payload = computeAll(manifest, bulk, prev);
  // Never clobber a good snapshot with an empty one.
  const wrotePrices = Object.keys(payload.entries).length > 0;
  if (wrotePrices) await env.PRICES.put("prices", JSON.stringify(payload));

  const result: RefreshResult = {
    ranAt,
    sources: diags,
    entries: Object.keys(payload.entries).length,
    flagged: payload.flagged,
    wrotePrices,
    nse: { ok: false },
  };

  // NSE snapshot — best-effort; the last good KV value survives a failed fetch.
  try {
    const nse = await fetchNsePrices();
    await env.PRICES.put("nse", JSON.stringify(nse));
    result.nse = { ok: true, tickers: Object.keys(nse.prices).length };
  } catch (e) {
    result.nse = { ok: false, error: String(e) };
  }
  return result;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const r = await runRefresh(env);
    console.log(JSON.stringify(r));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    const headers = {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
      "access-control-allow-origin": "*",
    };

    if (path === "/refresh") {
      if (!env.REFRESH_KEY || url.searchParams.get("key") !== env.REFRESH_KEY) {
        return new Response('{"error":"unauthorized"}', { status: 401, headers });
      }
      const r = await runRefresh(env);
      return new Response(JSON.stringify(r, null, 2), { headers: { ...headers, "cache-control": "no-store" } });
    }

    if (path === "/prices" || path === "/") {
      const prices = await env.PRICES.get("prices");
      if (!prices) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(prices, { headers });
    }

    if (path === "/nse") {
      const nse = await env.PRICES.get("nse");
      if (!nse) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(nse, { headers });
    }

    if (path === "/manifest") {
      const manifest = await env.PRICES.get("manifest");
      if (!manifest) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(manifest, { headers });
    }

    if (path === "/holders") {
      const holders = await env.PRICES.get("holders");
      if (!holders) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(holders, {
        headers: { ...headers, "cache-control": "public, max-age=21600, s-maxage=21600" },
      });
    }

    if (path === "/history") {
      const history = await env.PRICES.get("history");
      if (!history) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(history, {
        headers: { ...headers, "cache-control": "public, max-age=21600, s-maxage=21600" },
      });
    }

    return new Response('{"error":"not found"}', { status: 404, headers });
  },
};
