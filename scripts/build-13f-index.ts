#!/usr/bin/env bun
// Builds the 13F holders index: which large funds hold each of our tickers
// as a significant part of their reported 13F portfolio, with links to the
// EDGAR filing. Data source: SEC EDGAR 13F-HR filings (public domain).
//
// Usage:
//   bun scripts/build-13f-index.ts --index /tmp/master.idx --data-quarter "Q2 2026"
//                                  [--only 1067983,2012383] [--sample N]
//                                  [--out scripts/out/holders.json] [--workers 5]
//
// The index file is an EDGAR full-index master.idx (cik|name|form|filed|path);
// download it from https://www.sec.gov/Archives/edgar/full-index/<Y>/QTR<Q>/master.gz
// for the quarter the filings were FILED in (13Fs land 0-45 days after the
// as-of quarter ends, so the as-of quarter's filings appear in the NEXT
// calendar quarter's index).
//
// Empirically handles: infotable filenames with no convention (falls back to
// the largest non-primary XML), per-filer value units (dollars vs thousands,
// detected via median implied price-per-share), and dual-class tickers
// (class-A CUSIP preferred where configured).
//
// EDGAR politeness: declared User-Agent, <=9 request starts/sec globally,
// 30s per-request timeout, retry with backoff.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const UA = "Moecap Research admin@moecapital.com";
const THRESHOLDS = { fundMinUsd: 1e9, weightPct: 3.0, topN: 5 };

// --- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const arg = (name: string, dflt?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const INDEX_FILE = arg("index", "/tmp/master.idx");
const DATA_QUARTER = arg("data-quarter", "Q2 2026");
const OUT = arg("out", "scripts/out/holders.json");
const ONLY = arg("only")?.split(",").map(Number);
const SAMPLE = Number(arg("sample", "0"));
const WORKERS = Number(arg("workers", "5"));
const OUTDIR = OUT.slice(0, OUT.lastIndexOf("/"));
for (const d of [OUTDIR, "scripts/out"]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

// --- name normalization ---------------------------------------------------
const SUFFIXES = new Set(
  ("INC INCORPORATED CORP CORPORATION CO COMPANY LTD LIMITED PLC LLC LP LLP " +
    "PARTNERS PARTNERSHIP TRUST THE")
    .split(" ")
);
function normName(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !SUFFIXES.has(w))
    .join(" ");
}

// --- rate-limited fetch with retries ---------------------------------------
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
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(30000),
      });
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

// --- inputs ----------------------------------------------------------------
function loadTickers(): string[] {
  const d = JSON.parse(readFileSync("us-stocks.json", "utf8"));
  const out: string[] = [];
  for (const m of d.messages) {
    const meta = m.text.match(/^---\n([\s\S]*?)\n---/);
    const t = meta?.[1].match(/^title:\s*(\S+)\s+-/m);
    if (t) out.push(t[1]);
  }
  return [...new Set(out)];
}

function secNameMap(): Record<string, string> {
  const p = "/tmp/company_tickers.json";
  if (!existsSync(p)) {
    throw new Error("run: curl -A 'Moecap Research admin@moecapital.com' -o /tmp/company_tickers.json https://www.sec.gov/files/company_tickers.json");
  }
  const d = JSON.parse(readFileSync(p, "utf8"));
  const map: Record<string, string> = {};
  for (const v of Object.values<any>(d)) map[v.ticker] = v.title;
  return map;
}

// --- filings from master.idx ----------------------------------------------
interface Filer { cik: number; name: string; accession: string; filed: string; }
function loadFilings(filter = true): Filer[] {
  const lines = readFileSync(INDEX_FILE, "utf8").split("\n");
  const latest = new Map<number, Filer>();
  for (const line of lines) {
    const m = line.match(/^(\d+)\|(.+)\|13F-HR(\/A)?\|(\d{4}-\d{2}-\d{2})\|edgar\/data\/\d+\/(\d+-\d+-\d+)\.txt$/);
    if (!m) continue;
    const f: Filer = { cik: Number(m[1]), name: m[2].trim(), accession: m[5], filed: m[4] };
    const prev = latest.get(f.cik);
    if (!prev || f.filed >= prev.filed) latest.set(f.cik, f);
  }
  let list = [...latest.values()];
  if (filter) {
    if (ONLY) list = list.filter((f) => ONLY.includes(f.cik));
    if (SAMPLE) list = list.slice(0, SAMPLE);
  }
  return list;
}

function accNoDash(a: string) { return a.replace(/-/g, ""); }
function filingUrl(f: Filer) {
  return `https://www.sec.gov/Archives/edgar/data/${f.cik}/${accNoDash(f.accession)}/${f.accession}-index.htm`;
}

// Infotable filenames follow no convention (form13fInfoTable.xml,
// informationtable.xml, KINGDON_13F_06302026.xml, bare 56757.xml ...).
// Take the obvious match, else the largest non-primary XML.
async function fetchInfoTable(f: Filer): Promise<string> {
  const base = `https://www.sec.gov/Archives/edgar/data/${f.cik}/${accNoDash(f.accession)}`;
  const idx = await (await politeFetch(`${base}/index.json`)).json() as any;
  const items = idx.directory.item.filter(
    (i: any) => /\.xml$/i.test(i.name) && !/^primary_doc/i.test(i.name)
  );
  const item =
    items.find((i: any) => /(info.*table|13f)/i.test(i.name)) ||
    items.sort((a: any, b: any) => (b.size || 0) - (a.size || 0))[0];
  if (!item) throw new Error(`no infotable xml in ${base}`);
  return (await politeFetch(`${base}/${item.name}`)).text();
}

// --- cusip bootstrap -------------------------------------------------------
// Learn cusip -> issuer-name pairs from one comprehensive filer's infotable,
// then join on SEC's official names (company_tickers.json).
const CLASS_A_ONLY: Record<string, boolean> = { GOOGL: true };
const isClassA = (title: string) => /\b(CLASS|CL)\s*A\b|COM/i.test(title);
async function bootstrapCusips(): Promise<Record<string, string>> {
  const cache = "scripts/out/cusips.json";
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, "utf8"));
  const brk = loadFilings(false).find((f) => f.name === "BlackRock, Inc.");
  if (!brk) throw new Error("BlackRock 13F not found in index for cusip bootstrap");
  const xml = await fetchInfoTable(brk);
  const nameToCusips = new Map<string, { cusip: string; classA: boolean }[]>();
  for (const m of xml.matchAll(/<infoTable[\s\S]*?<\/infoTable>/g)) {
    const block = m[0];
    const cusip = block.match(/<cusip>([^<]+)</)?.[1]?.replace(/[^A-Z0-9]/gi, "");
    const issuer = block.match(/<nameOfIssuer>([^<]+)</)?.[1];
    const title = block.match(/<titleOfClass>([^<]+)</)?.[1] || "";
    if (!cusip || !issuer) continue;
    const k = normName(issuer);
    if (!nameToCusips.has(k)) nameToCusips.set(k, []);
    const arr = nameToCusips.get(k)!;
    if (!arr.find((x) => x.cusip === cusip)) arr.push({ cusip, classA: isClassA(title) });
  }
  const names = secNameMap();
  const out: Record<string, string> = {};
  const unmatched: string[] = [];
  for (const t of loadTickers()) {
    const hits = nameToCusips.get(normName(names[t] || ""));
    if (!hits?.length) { unmatched.push(t); continue; }
    const a = CLASS_A_ONLY[t] ? hits.find((h) => h.classA) : undefined;
    out[t] = (a ?? hits[0]).cusip;
  }
  writeFileSync(cache, JSON.stringify(out, null, 1));
  console.error(`cusips: ${Object.keys(out).length} mapped, ${unmatched.length} unmatched (name-match fallback) — ${unmatched.join(",")}`);
  return out;
}

// --- main ------------------------------------------------------------------
interface FundResult { f: Filer; totalUsd: number; hits: Map<string, number>; } // hits: ticker -> $USD
async function main() {
  const filers = loadFilings();
  console.error(`filings: ${filers.length} unique CIKs from ${INDEX_FILE}; workers: ${WORKERS}`);
  const cusips = await bootstrapCusips();
  const cusipToTicker: Record<string, string> = {};
  for (const [t, c] of Object.entries(cusips)) cusipToTicker[c] = t;

  const names = secNameMap();
  const nameToTicker: Record<string, string> = {};
  for (const t of loadTickers()) nameToTicker[normName(names[t] || "")] = t;

  const results: FundResult[] = [];
  let next = 0, done = 0, skipped = 0, thousandsUnits = 0;

  async function processFiling(f: Filer): Promise<void> {
    const xml = await fetchInfoTable(f);
    // Rows first: value unit varies by filer agent (spec says thousands,
    // many modern filings write dollars). Detect per filing via median
    // implied price-per-share: real stocks trade $1-$50k.
    interface Row { ticker: string | null; value: number; pps: number | null; }
    const rows: Row[] = [];
    for (const m of xml.matchAll(/<infoTable[\s\S]*?<\/infoTable>/g)) {
      const block = m[0];
      const value = Number(block.match(/<value>(\d+)</)?.[1] || 0);
      const cusip = block.match(/<cusip>([^<]+)</)?.[1]?.replace(/[^A-Z0-9]/gi, "");
      const ticker = cusip
        ? cusipToTicker[cusip] ?? null
        : nameToTicker[normName(block.match(/<nameOfIssuer>([^<]+)</)?.[1] || "\u0000")] ?? null;
      const shares = Number(block.match(/<sshPrnamt>(\d+)</)?.[1] || 0);
      const type = block.match(/<sshPrnamtType>(\w+)</)?.[1];
      rows.push({ ticker, value, pps: type === "SH" && shares > 0 && value > 0 ? value / shares : null });
    }
    const pps = rows.map((r) => r.pps).filter((p): p is number => p !== null).sort((a, b) => a - b);
    const median = pps.length ? pps[Math.floor(pps.length / 2)] : 0;
    const scale = median > 50000 ? 0.001 : 1; // thousands -> dollars
    if (scale !== 1) thousandsUnits++;
    let totalUsd = 0;
    const hits = new Map<string, number>();
    for (const r of rows) {
      const usd = r.value * scale;
      totalUsd += usd;
      if (r.ticker) hits.set(r.ticker, (hits.get(r.ticker) || 0) + usd);
    }
    results.push({ f, totalUsd, hits });
  }

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= filers.length) return;
      const f = filers[i];
      try {
        await processFiling(f);
      } catch (e) {
        skipped++;
        if (skipped <= 10) console.error(`skip ${f.cik} ${f.name}: ${e instanceof Error ? e.message : e}`);
      }
      done++;
      if (done % 250 === 0 || done === filers.length) {
        writeFileSync(`${OUTDIR}/13f-progress.txt`, `${done}/${filers.length} done, ${skipped} skipped`);
        console.error(`  ${done}/${filers.length} (${skipped} skipped)`);
      }
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  console.error(`value units: ${thousandsUnits} filings in thousands, ${filers.length - skipped - thousandsUnits} in dollars`);

  const entries: Record<string, any[]> = {};
  for (const r of results) {
    if (r.totalUsd < THRESHOLDS.fundMinUsd) continue;
    for (const [ticker, valueUsd] of r.hits) {
      const weightPct = +((valueUsd / r.totalUsd) * 100).toFixed(2);
      if (weightPct < THRESHOLDS.weightPct) continue;
      (entries[ticker] ||= []).push({
        fund: r.f.name, cik: r.f.cik, weightPct,
        valueUsd: Math.round(valueUsd),
        filed: r.f.filed, url: filingUrl(r.f),
      });
    }
  }
  const covered: string[] = [];
  for (const t of Object.keys(entries)) {
    entries[t].sort((a, b) => b.weightPct - a.weightPct);
    entries[t] = entries[t].slice(0, THRESHOLDS.topN);
    covered.push(t);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    dataQuarter: DATA_QUARTER,
    thresholds: THRESHOLDS,
    filingsScanned: filers.length,
    entries,
  };
  writeFileSync(OUT, JSON.stringify(payload));
  const tickers = loadTickers();
  console.error(`holders: ${covered.length}/${tickers.length} tickers covered; filers scanned ${filers.length}, skipped ${skipped}`);
  console.error(`uncovered (first 20): ${tickers.filter((t) => !covered.includes(t)).slice(0, 20).join(",")}`);
}

await main();
