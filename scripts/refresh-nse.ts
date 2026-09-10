// Refresh NSE equity prices from a network that can reach afx.kwayisi.org
// (GitHub Actions runners, or locally) and emit the nse payload for the
// worker's KV.
//
// Why this exists: kwayisi started blocking Cloudflare egress around
// 2026-08-20 — the worker cron's hourly fetch has thrown since, and KV kept
// serving the last good snapshot (digest showed "feed stale"). Same pattern
// as refresh-prices.ts: the pure parse lives in worker/src/nse.ts; this
// script is a transport, not a second brain. The worker keeps attempting its
// own fetch hourly — best-effort self-heal if CF egress is ever unblocked.
//
// Usage: bun scripts/refresh-nse.ts [output.json]
// Then:  bunx wrangler kv key put nse --namespace-id <id> --path <out> --remote

import { fetchNsePrices } from "../worker/src/nse";

async function main() {
  const payload = await fetchNsePrices();
  const count = Object.keys(payload.prices).length;
  // Stricter than the parser's 0-row guard: a partial page must not
  // overwrite a good snapshot. NSE lists 60+ equities; below 50 the page
  // shape changed and this should fail loudly, not silently degrade.
  if (count < 50) throw new Error(`kwayisi sanity: only ${count} tickers parsed — refusing to write`);

  const out = process.argv[2] ?? "/tmp/nse.json";
  await Bun.write(out, JSON.stringify(payload));
  console.log(`wrote ${out}: ${count} tickers, asOf ${payload.asOf}`);
}

main();
