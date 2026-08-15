// Computes a PricesPayload snapshot from the seeded manifest (basis.json) +
// live venue prices. Uploaded as the KV "prices" key for the first deployment
// or manual reseed (the hourly cron refreshes it thereafter).
//
// Run: bun scripts/snapshot-prices.ts [--out prices.json]

import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import {
  computeAll,
  parseBinanceBulk,
  parseBitgetBulk,
  parseOkxBulk,
  type Manifest,
  type PricesPayload,
  type VenueBulk,
} from "../worker/src/ratio";

const BASE = process.cwd();
const outPath = process.argv.find((a) => a !== "--out" && !a.startsWith("--") && a.endsWith(".json"))
  ?? join(BASE, "prices.json");

const manifest: Manifest = JSON.parse(readFileSync(join(BASE, "basis.json"), "utf8"));
if (!manifest?.tickers || Object.keys(manifest.tickers).length === 0) {
  console.error("basis.json has no tickers — run scripts/seed-prices.ts first");
  process.exit(1);
}

const [b, g, o] = await Promise.all([
  fetch("https://fapi.binance.com/fapi/v1/ticker/price").then((r) => r.json()),
  fetch("https://api.bitget.com/api/v2/mix/market/tickers?productType=usdt-futures").then((r) => r.json()),
  fetch("https://www.okx.com/api/v5/market/tickers?instType=SWAP").then((r) => r.json()),
]);
const bulk: VenueBulk = {
  binance: parseBinanceBulk(b),
  bitget: parseBitgetBulk(g),
  okx: parseOkxBulk(o),
};

const payload: PricesPayload = computeAll(manifest, bulk, null);
writeFileSync(outPath, JSON.stringify(payload, null, 2));

const n = Object.keys(payload.entries).length;
console.log(`prices snapshot: ${n}/${Object.keys(manifest.tickers).length} entries, flagged: ${payload.flagged.length} (${payload.flagged.join(", ") || "none"})`);
console.log(`wrote ${outPath}`);
if (n === 0) process.exit(1);
