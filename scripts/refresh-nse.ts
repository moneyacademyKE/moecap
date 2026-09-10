// Refresh NSE equity prices from TradingView's scanner API (reachable from
// GitHub Actions runners) and emit the nse payload for the worker's KV.
//
// Source history: the worker cron scraped afx.kwayisi.org hourly until
// ~2026-08-20, when kwayisi started dropping datacenter traffic (Cloudflare
// AND GitHub/Azure — connection timeout, not HTTP 403; verified from both
// networks). TradingView covers the NSE as exchange NSEKE and cross-validates
// 1:1 against kwayisi (SCOM/EQTY/KCB/ABSA/NMG exact match, 2026-09-10).
//
// Ticker universe: keys of the current KV payload — the same set the site and
// digest already render. New listings enter via the research pipeline, not
// this transport. Shape stays {asOf, live, source, prices} so nothing
// downstream changes.
//
// Usage: bun scripts/refresh-nse.ts [output.json]
// Then:  bunx wrangler kv key put nse --namespace-id <id> --path <out> --remote

const WORKER = "https://moecap-prices.iamkingori.workers.dev";
const TV = "https://scanner.tradingview.com/symbol";
const CHUNK = 20;

async function fetchTvClose(ticker: string): Promise<number | null> {
  const url = `${TV}?symbol=NSEKE%3A${encodeURIComponent(ticker)}&fields=close%2Ccurrency`;
  const res = await fetch(url, { headers: { "user-agent": "moecap-price-refresh/1.0" } });
  if (!res.ok) return null;
  const json: any = await res.json();
  return json?.currency === "KES" && typeof json?.close === "number" ? json.close : null;
}

async function main() {
  const prev: any = await (await fetch(`${WORKER}/nse`)).json();
  const tickers = Object.keys(prev?.prices ?? {});
  if (tickers.length === 0) throw new Error("no ticker universe in KV nse payload");

  const prices: Record<string, number> = {};
  const missed: string[] = [];
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const settled = await Promise.allSettled(tickers.slice(i, i + CHUNK).map(async (t) => ({ t, p: await fetchTvClose(t) })));
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value.p != null) prices[r.value.t] = r.value.p;
      else missed.push(r.status === "fulfilled" ? r.value.t : "?");
    }
    process.stdout.write(`\rfetched ${Math.min(i + CHUNK, tickers.length)}/${tickers.length}`);
  }
  console.log(`\ntv: ${Object.keys(prices).length} priced, missed: ${missed.join(", ") || "none"}`);
  // NSE lists 60+ equities; below 50 the source shape changed — fail loudly
  // instead of silently shrinking the terminal's universe.
  if (Object.keys(prices).length < 50) throw new Error("tradingview sanity: too few tickers priced — refusing to write");

  const out = process.argv[2] ?? "/tmp/nse.json";
  await Bun.write(out, JSON.stringify({ asOf: new Date().toISOString(), live: true, source: "tradingview:NSEKE", prices }));
  console.log(`wrote ${out}`);
}

main();
