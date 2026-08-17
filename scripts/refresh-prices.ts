// Refresh US stock prices from a network that can reach Yahoo (GitHub Actions
// runners, or locally) and emit a prices payload for the worker's KV.
//
// Why this exists: all three venue APIs (Binance/Bitget/OKX) block Cloudflare
// egress IPs, Yahoo edge-blocks CF too, and free Workers cap at 50
// subrequests/invocation — so per-ticker price fetching cannot live in the
// Worker. This script uses the SAME pure math (worker/src/ratio.ts); it is a
// transport, not a second brain.
//
// Usage: bun scripts/refresh-prices.ts [output.json]
// Then:  bunx wrangler kv key put prices --namespace-id <id> --path <out> --remote

import {
  computeAll,
  parseYahooChart,
  type Manifest,
  type PricesPayload,
  type VenueBulk,
} from "../worker/src/ratio";

const WORKER = "https://moecap-prices.iamkingori.workers.dev";
const CHUNK = 20;

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "user-agent": "moecap-price-refresh/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 60)}`);
  return res.json();
}

async function main() {
  const manifest: Manifest = await fetchJson(`${WORKER}/manifest`);
  const tickers = Object.values(manifest.tickers).map((r) => r.ticker);
  console.log(`manifest: ${tickers.length} tickers (seeded ${manifest.seededAt})`);

  let prev: PricesPayload | null = null;
  try {
    prev = await fetchJson(`${WORKER}/prices`);
  } catch {
    console.log("no previous payload — basis is the guard baseline");
  }

  const yahoo: Record<string, number> = {};
  let failures = 0;
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const chunk = tickers.slice(i, i + CHUNK);
    const settled = await Promise.allSettled(
      chunk.map(async (t) => ({
        t,
        p: parseYahooChart(
          await fetchJson(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=1d&interval=1d`
          )
        ),
      }))
    );
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value.p != null) yahoo[r.value.t] = r.value.p;
      else failures++;
    }
    process.stdout.write(`\rfetched ${Math.min(i + CHUNK, tickers.length)}/${tickers.length}`);
  }
  console.log(`\nyahoo: ${Object.keys(yahoo).length} priced, ${failures} failed`);
  if (failures > tickers.length * 0.1) throw new Error(`too many failures (${failures}) — aborting`);

  const bulk: VenueBulk = { binance: {}, bitget: {}, okx: {}, yahoo };
  const payload = computeAll(manifest, bulk, prev);
  const count = Object.keys(payload.entries).length;
  if (count === 0) throw new Error("empty payload — refusing to write");

  const out = process.argv[2] ?? "/tmp/prices.json";
  await Bun.write(out, JSON.stringify(payload));
  console.log(
    `wrote ${out}: ${count} entries, flagged: ${payload.flagged.join(", ") || "none"}`
  );
}

main();
