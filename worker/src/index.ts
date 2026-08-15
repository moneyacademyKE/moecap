// moecap-prices: cron Worker that keeps hydrated stock prices in KV.
//
// Scheduled (hourly): 3 bulk venue fetches -> ratio math -> KV "prices".
// Fetch: serves /prices (and /) with CORS so the static page can hydrate.

import {
  computeAll,
  parseBitgetBulk,
  parseBinanceBulk,
  parseOkxBulk,
  type Manifest,
  type PricesPayload,
  type VenueBulk,
} from "./ratio";

export interface Env {
  PRICES: KVNamespace;
}

const VENUE_ENDPOINTS = {
  binance: "https://fapi.binance.com/fapi/v1/ticker/price",
  bitget: "https://api.bitget.com/api/v2/mix/market/tickers?productType=usdt-futures",
  okx: "https://www.okx.com/api/v5/market/tickers?instType=SWAP",
} as const;

async function fetchVenueBulk(): Promise<VenueBulk> {
  const [b, g, o] = await Promise.all([
    fetch(VENUE_ENDPOINTS.binance).then((r) => r.json()),
    fetch(VENUE_ENDPOINTS.bitget).then((r) => r.json()),
    fetch(VENUE_ENDPOINTS.okx).then((r) => r.json()),
  ]);
  return {
    binance: parseBinanceBulk(b),
    bitget: parseBitgetBulk(g),
    okx: parseOkxBulk(o),
  };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const manifest = await env.PRICES.get<Manifest>("manifest", "json");
    if (!manifest || Object.keys(manifest.tickers).length === 0) {
      console.log("no manifest in KV — run scripts/setup-cloudflare.sh to seed");
      return;
    }

    const bulk = await fetchVenueBulk();
    const prev = await env.PRICES.get<PricesPayload>("prices", "json");
    const payload = computeAll(manifest, bulk, prev);

    await env.PRICES.put("prices", JSON.stringify(payload));
    console.log(
      `prices updated: ${Object.keys(payload.entries).length} entries, ` +
        `${payload.flagged.length} flagged (${payload.flagged.join(", ") || "none"})`
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    const headers = {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
      "access-control-allow-origin": "*",
    };

    if (path === "/prices" || path === "/") {
      const prices = await env.PRICES.get("prices");
      if (!prices) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(prices, { headers });
    }

    if (path === "/manifest") {
      const manifest = await env.PRICES.get("manifest");
      if (!manifest) return new Response('{"error":"not seeded"}', { status: 503, headers });
      return new Response(manifest, { headers });
    }

    return new Response('{"error":"not found"}', { status: 404, headers });
  },
};
