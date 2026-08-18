#!/usr/bin/env bun
// Enriches the 13F holders index with share counts and quarter-over-quarter
// position changes: for every fund already in holders.json, fetch the SAME
// fund's previous-quarter 13F-HR infotable and diff shares held per ticker.
// Adds per-entry: shares, prevShares, prevValueUsd, sharesDeltaPct,
// prevStatus ("held" | "new" | "unknown"). In place, back-compatible: the
// digest renders deltas only when present.
//
// Usage:
//   bun scripts/build-13f-deltas.ts --holders scripts/out/holders.json \
//       --cur-index /tmp/master.idx --prev-index /tmp/master-prev.idx
//
// Indexes are EDGAR full-index master.idx files for the CALENDAR quarters in
// which each data quarter's filings landed (cur data Q2↔filed Q3, prev Q1↔Q2).

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "Moecap Research admin@moecapital.com";

const args = process.argv.slice(2);
const arg = (name: string, dflt?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const HOLDERS = arg("holders", "scripts/out/holders.json");
const CUR_INDEX = arg("cur-index", "/tmp/master.idx");
const PREV_INDEX = arg("prev-index", "/tmp/master-prev.idx");
const WORKERS = Number(arg("workers", "6"));

// --- rate-limited fetch (mirrors build-13f-index.ts) -----------------------
let launched = 0;
let windowStart = Date.now();
async function politeFetch(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    if (launched >= 9 && Date.now() - windowStart < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - (Date.now() - windowStart)));
    }
    if (Date.now() - windowStart >= 1000) { windowStart = Date.now(); launched = 0; }
    launched++;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (res.status === 403 || res.status === 429) {
        if (attempt >= 4) throw new Error(`rate-limited after retries: ${url}`);
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return res;
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

// --- latest 13F-HR per CIK from a master.idx, restricted to wanted CIKs ----
interface Filing { cik: number; accession: string; filed: string; }
function loadFilings(path: string, wanted: Set<number>): Map<number, Filing> {
  const latest = new Map<number, Filing>();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^(\d+)\|(.+)\|13F-HR(\/A)?\|(\d{4}-\d{2}-\d{2})\|edgar\/data\/\d+\/(\d+-\d+-\d+)\.txt$/);
    if (!m) continue;
    const cik = Number(m[1]);
    if (!wanted.has(cik)) continue;
    const f: Filing = { cik, accession: m[5], filed: m[4] };
    const prev = latest.get(cik);
    if (!prev || f.filed >= prev.filed) latest.set(cik, f);
  }
  return latest;
}

const accNoDash = (a: string) => a.replace(/-/g, "");
async function fetchInfoTableXml(f: Filing): Promise<string> {
  const base = `https://www.sec.gov/Archives/edgar/data/${f.cik}/${accNoDash(f.accession)}`;
  const idx = await (await politeFetch(`${base}/index.json`)).json() as any;
  const items = idx.directory.item.filter((i: any) => /\.xml$/i.test(i.name) && !/^primary_doc/i.test(i.name));
  const item = items.find((i: any) => /(info.*table|13f)/i.test(i.name)) ||
    items.sort((a: any, b: any) => (b.size || 0) - (a.size || 0))[0];
  if (!item) throw new Error(`no infotable xml in ${base}`);
  return (await politeFetch(`${base}/${item.name}`)).text();
}

// Sum value and shares per OUR ticker from an infotable, with the same
// per-filer units detection as the index build (median implied price/share).
async function holdingsByTicker(xml: string, cusipToTicker: Record<string, string>): Promise<Map<string, { usd: number; shares: number }>> {
  interface Row { ticker: string | null; value: number; shares: number; isSh: boolean; pps: number | null; }
  const rows: Row[] = [];
  for (const m of xml.matchAll(/<infoTable[\s\S]*?<\/infoTable>/g)) {
    const block = m[0];
    const value = Number(block.match(/<value>(\d+)</)?.[1] || 0);
    const cusip = block.match(/<cusip>([^<]+)</)?.[1]?.replace(/[^A-Z0-9]/gi, "");
    const ticker = cusip ? cusipToTicker[cusip] ?? null : null;
    const shares = Number(block.match(/<sshPrnamt>(\d+)</)?.[1] || 0);
    const type = block.match(/<sshPrnamtType>(\w+)</)?.[1];
    rows.push({ ticker, value, shares, isSh: type === "SH", pps: type === "SH" && shares > 0 && value > 0 ? value / shares : null });
  }
  const pps = rows.map((r) => r.pps).filter((p): p is number => p !== null).sort((a, b) => a - b);
  const scale = pps.length && pps[Math.floor(pps.length / 2)] > 50000 ? 0.001 : 1;
  const out = new Map<string, { usd: number; shares: number }>();
  for (const r of rows) {
    if (!r.ticker) continue;
    const cur = out.get(r.ticker) || { usd: 0, shares: 0 };
    cur.usd += r.value * scale;
    if (r.isSh) cur.shares += r.shares;
    out.set(r.ticker, cur);
  }
  return out;
}

// --- main -------------------------------------------------------------------
const holders = JSON.parse(readFileSync(HOLDERS, "utf8"));
const cusips: Record<string, string> = JSON.parse(readFileSync("scripts/out/cusips.json", "utf8"));
const cusipToTicker: Record<string, string> = {};
for (const [t, c] of Object.entries(cusips)) cusipToTicker[c] = t;

// Where does each fund appear? cik -> [{ticker, entry}]
const refs = new Map<number, Array<{ ticker: string }>>();
const wanted = new Set<number>();
for (const [ticker, entries] of Object.entries<any[]>(holders.entries)) {
  for (const e of entries) {
    wanted.add(e.cik);
    const arr = refs.get(e.cik) || [];
    arr.push({ ticker });
    refs.set(e.cik, arr);
  }
}

const curFilings = loadFilings(CUR_INDEX, wanted);
const prevFilings = loadFilings(PREV_INDEX, wanted);
console.error(`funds in holders: ${wanted.size} · cur filings found: ${curFilings.size} · prev filings found: ${prevFilings.size}`);

const ciks = [...wanted];
let done = 0, enriched = 0, newPositions = 0, noPrev = 0, failed = 0;

async function worker(): Promise<void> {
  for (;;) {
    const i = done++;
    if (i >= ciks.length) return;
    const cik = ciks[i];
    try {
      const cur = curFilings.has(cik)
        ? await holdingsByTicker(await fetchInfoTableXml(curFilings.get(cik)!), cusipToTicker)
        : new Map<string, { usd: number; shares: number }>();
      const prev = prevFilings.has(cik)
        ? await holdingsByTicker(await fetchInfoTableXml(prevFilings.get(cik)!), cusipToTicker)
        : null;
      for (const { ticker } of refs.get(cik) || []) {
        for (const e of holders.entries[ticker] || []) {
          if (e.cik !== cik) continue;
          const c = cur.get(ticker);
          if (c && c.shares > 0) e.shares = Math.round(c.shares);
          if (prev === null) { e.prevStatus = "unknown"; noPrev++; continue; }
          const p = prev.get(ticker);
          if (!p || p.shares === 0) {
            e.prevStatus = "new"; e.prevShares = 0; e.prevValueUsd = 0; newPositions++;
          } else {
            e.prevStatus = "held";
            e.prevShares = Math.round(p.shares);
            e.prevValueUsd = Math.round(p.usd);
            if (e.shares && e.shares > 0)
              e.sharesDeltaPct = +(((e.shares / p.shares) - 1) * 100).toFixed(1);
          }
          enriched++;
        }
      }
    } catch (err) {
      failed++;
      if (failed <= 10) console.error(`fail cik ${cik}: ${err instanceof Error ? err.message : err}`);
    }
    if (done % 50 === 0 || done === ciks.length) console.error(`  ${done}/${ciks.length} (${failed} failed)`);
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));

holders.deltas = {
  computedAt: new Date().toISOString(),
  curIndexFilings: curFilings.size,
  prevIndexFilings: prevFilings.size,
  fundsFailed: failed,
};
writeFileSync(HOLDERS, JSON.stringify(holders));
console.error(`enriched ${enriched} fund-positions · ${newPositions} new · ${noPrev} unknown-prev · ${failed} funds failed`);
if (!existsSync(HOLDERS)) throw new Error("write failed");
