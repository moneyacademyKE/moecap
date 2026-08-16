// 13F ingest pipeline — institutional holders index for the moecap watchlist.
//
// What it does
//   1. Reads the watchlist from us-stocks.json (via src/us-stocks.ts, same as the site build).
//   2. Scans the SEC EDGAR full-index (form.gz) for 13F-HR / 13F-HR/A filings in a quarter.
//      Amendment dedupe: latest filing per CIK wins.
//   3. Stream-parses each filing's infotable.xml extracting ONLY <cusip> + <value>
//      (plus <nameOfIssuer> for the pre-filter), never buffering the whole file.
//   4. Computes per-fund weights (holding value / fund total), then inverts the
//      matrix into per-ticker top-5 holders.
//
// CUSIP -> ticker mapping
//   The NASDAQ Trader symbol directories (nasdaqlisted.txt / otherlisted.txt) no
//   longer publish a CUSIP column (removed upstream), so mapping runs in the
//   inverse direction through OpenFIGI v3 (Bloomberg, free guest tier): the
//   8-char CUSIP prefixes parsed from the 13F infotables are batch-POSTed
//   (100 jobs/request) and resolved to tickers, which are then checked against
//   the watchlist. A local name pre-filter (13F <nameOfIssuer> vs watchlist
//   company names) bounds the lookups, and every result is cached in
//   data/13f-cusip-cache.json so repeat runs cost zero API calls.
//
// EDGAR politeness
//   Declared User-Agent (env EDGAR_UA to override) and a global request gate
//   that spaces request starts >= MIN_INTERVAL_MS apart (8 rps ceiling,
//   spec limit 10). Peak observed rate is measured and reported.
//
// Run
//   bun scripts/build-13f-index.ts [--sample 20] [--year 2026] [--qtr 3]
//        [--seed 13] [--out data/13f-holders.json]
//        [--max-cusip-lookups 1500] [--refresh-cusips]
//
// Outputs
//   data/13f-holders.json   per-ticker top-5 holders (consumed by /holders route)
//   data/13f-cusip-cache.json  cusip8 -> { ticker, name } cache

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";
import { parseStockIdeas } from "../src/us-stocks";

// ---------------------------------------------------------------- config ---

const BASE = process.cwd();

function argNumber(flag: string, fallback: number): number {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return fallback;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}
const hasFlag = (f: string) => process.argv.includes(f);

const now = new Date();
const SAMPLE = argNumber("--sample", 0);
const YEAR = argNumber("--year", now.getUTCFullYear());
const QTR = argNumber("--qtr", Math.floor(now.getUTCMonth() / 3) + 1);
const SEED = argNumber("--seed", 13);
const MAX_CUSIP_LOOKUPS = argNumber("--max-cusip-lookups", 1500);
const REFRESH_CUSIPS = hasFlag("--refresh-cusips");

const OUT_PATH =
  process.argv.find((a, i) => process.argv[i - 1] === "--out") ?? join(BASE, "data", "13f-holders.json");
const CUSIP_CACHE_PATH = join(BASE, "data", "13f-cusip-cache.json");

// EDGAR asks for "Company Name contact@email" style identification.
const USER_AGENT =
  process.env.EDGAR_UA ?? "moecap-13f-research/1.0 (static site research pipeline; contact: admin@moecap.pages.dev)";
const OPENFIGI_KEY = process.env.OPENFIGI_API_KEY;

// Politeness: request starts are spaced at least this far apart (8 rps ceiling; EDGAR max is 10).
const MIN_INTERVAL_MS = 125;
const MAX_RETRIES = 3;

// ------------------------------------------------------------ rate limit ---

const requestTimes: number[] = [];
let lastRequestAt = 0;

function observedPeakRps(): number {
  let peak = 0;
  for (let i = 0; i < requestTimes.length; i++) {
    const windowStart = requestTimes[i];
    let count = 0;
    for (let j = i; j < requestTimes.length && requestTimes[j] - windowStart < 1000; j++) count++;
    if (count > peak) peak = count;
  }
  return peak;
}

async function gate(): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  requestTimes.push(lastRequestAt);
}

async function politeFetch(url: string, init?: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await gate();
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": USER_AGENT, ...(init?.headers ?? {}) },
        signal: AbortSignal.timeout(180_000),
      });
      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        throw lastErr;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === MAX_RETRIES) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ------------------------------------------------------------- utilities ---

function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (1103515245 * s + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const SUFFIX_TOKENS = new Set([
  "INC", "INCORPORATED", "CORP", "CORPORATION", "CO", "COMPANY", "COMPANIES", "LTD", "LIMITED",
  "PLC", "SA", "NV", "AG", "SE", "LP", "LLC", "HOLDINGS", "HOLDING", "GROUP", "TRUST",
  "PARTNERS", "THE", "COM", "COMMON", "ORD", "SHS", "SHARES", "ADS", "CL", "CLASS", "STK", "A", "B", "C",
]);

function normalizeName(raw: string): string {
  let s = raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Iteratively drop trailing corporate suffix tokens ("APPLE INC" -> "APPLE").
  let tokens = s.split(" ");
  while (tokens.length > 1 && SUFFIX_TOKENS.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

function significantTokens(normalized: string): string[] {
  return normalized.split(" ").filter((t) => t.length >= 3 && !SUFFIX_TOKENS.has(t));
}

function cusipKey(rawCusip: string): string | null {
  const c = rawCusip.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 8 && c.length !== 9) return null;
  if (!/^[A-Z0-9]+$/.test(c)) return null;
  return c.slice(0, 8); // issuer(6)+issue(2); check digit (9th) is optional in 13F data
}

function tickerKey(t: string): string {
  return t.toUpperCase().replace(/[^A-Z0-9]/g, ""); // "BRK.B" and "BRK/B" -> "BRKB"
}

// --------------------------------------------------------- EDGAR scanning ---

interface FilingRow {
  cik: number;
  name: string;
  form: "13F-HR" | "13F-HR/A";
  date: string;
  accession: string; // e.g. 0001214659-26-010148
  dir: string;       // edgar/data/{cik}/{accession-no-dashes}
}

async function fetch13FIndex(year: number, qtr: number): Promise<FilingRow[]> {
  const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/QTR${qtr}/form.gz`;
  console.log(`↓ EDGAR full-index ${year} QTR${qtr}: ${url}`);
  const res = await politeFetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const text = gunzipSync(buf).toString("latin1");

  const rows: FilingRow[] = [];
  const lineRe =
    /^(13F-HR(?:\/A)?)\s+(.+?)\s{2,}(\d{6,})\s+(\d{4}-\d{2}-\d{2})\s+(edgar\/data\/\d+\/\S+?\.txt)\s*$/;
  for (const line of text.split("\n")) {
    const m = lineRe.exec(line);
    if (!m) continue;
    const file = m[5]; // edgar/data/{cik}/{accession}.txt
    const accession = file.split("/").pop()!.replace(/\.txt$/, "");
    rows.push({
      form: m[1] as FilingRow["form"],
      name: m[2].trim(),
      cik: Number(m[3]),
      date: m[4],
      accession,
      dir: `edgar/data/${m[3]}/${accession.replace(/-/g, "")}`,
    });
  }
  return rows;
}

/** Latest filing per CIK wins (13F-HR/A amendments supersede originals). */
function dedupeByCik(rows: FilingRow[]): { picked: FilingRow[]; superseded: number } {
  const byCik = new Map<number, FilingRow>();
  for (const r of rows) {
    const prev = byCik.get(r.cik);
    // Tie-break on accession serial so a same-day re-file supersedes.
    if (!prev || r.date > prev.date || (r.date === prev.date && r.accession > prev.accession)) {
      byCik.set(r.cik, r);
    }
  }
  const all = [...rows];
  const picked = [...byCik.values()].sort((a, b) => a.cik - b.cik);
  return { picked, superseded: all.length - picked.length };
}

// ------------------------------------------------- infotable stream parse ---

interface FundParse {
  holdings: Map<string, number>; // cusip8 -> summed value (USD)
  names: Map<string, string>;    // cusip8 -> a representative nameOfIssuer
  rows: number;
}

const NAME_CUSIP_RE = /<nameOfIssuer>([^<]+)<\/nameOfIssuer>\s*<titleOfClass>[^<]*<\/titleOfClass>\s*<cusip>([^<]+)<\/cusip>/g;
// 2025+ EDGAR 13F schema allows an optional <figi> between <cusip> and <value>.
const CUSIP_VALUE_RE = /<cusip>\s*([^<]+?)\s*<\/cusip>(?:\s*<figi>[^<]*<\/figi>)?\s*<value>\s*([^<]+?)\s*<\/value>/g;

/**
 * Streaming, chunk-boundary-safe parser. The buffer is only ever advanced to
 * just after the last complete `</value>`, so a `<cusip>`/`<value>` pair split
 * across chunks is reassembled on the next read and never double-counted
 * (pairs are only counted once fully closed).
 */
async function streamParseInfotable(res: Response): Promise<FundParse> {
  const out: FundParse = { holdings: new Map(), names: new Map(), rows: 0 };
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let skippedValues = 0;

  const digest = (final: boolean) => {
    for (const m of buffer.matchAll(NAME_CUSIP_RE)) {
      const key = cusipKey(m[2]);
      if (key && !out.names.has(key)) out.names.set(key, m[1].trim());
    }
    for (const m of buffer.matchAll(CUSIP_VALUE_RE)) {
      const key = cusipKey(m[1]);
      const value = Number(m[2]);
      if (!key || !Number.isFinite(value) || value < 0) {
        skippedValues++;
        continue;
      }
      out.holdings.set(key, (out.holdings.get(key) ?? 0) + value);
      out.rows++;
    }
    if (!final) {
      const cut = buffer.lastIndexOf("</value>");
      buffer = cut === -1 ? buffer : buffer.slice(cut + 8);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    if (buffer.length > 8_000_000) buffer = buffer.slice(-4_000_000); // pathological safety valve
    digest(false);
  }
  buffer += decoder.decode();
  digest(true);

  if (skippedValues > 0) console.warn(`   ⚠ skipped ${skippedValues} unparseable value rows`);
  return out;
}

interface FundResult extends FundParse {
  cik: number;
  name: string;
  form: string;
  date: string;
  total: number;
  failures: number; // holdings rows whose weight falls outside (0, 1]
}

async function processFiling(f: FilingRow): Promise<FundResult | { error: string }> {
  const indexUrl = `https://www.sec.gov/Archives/${f.dir}/index.json`;
  let files: { name: string; size?: string }[] = [];
  try {
    const res = await politeFetch(indexUrl);
    const j: any = await res.json();
    files = j?.directory?.item ?? j?.directory?.files ?? [];
  } catch (e) {
    return { error: `index.json: ${(e as Error).message}` };
  }
  // Infotable files are usually "infotable.xml" but filers may name them
  // anything ("WealthQ2.xml"), so rank non-header XMLs by size and verify by
  // attempting a parse — accept the first candidate that yields holdings.
  const candidates = files
    .filter((x) => /\.xml$/i.test(x.name) && !/hdr|primary|summary|index/i.test(x.name))
    .sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))
    .slice(0, 3);
  if (candidates.length === 0) return { error: "no candidate infotable xml in filing" };

  let lastError = "no holdings parsed";
  for (const cand of candidates) {
    const infoUrl = `https://www.sec.gov/Archives/${f.dir}/${cand.name}`;
    let parsed: FundParse;
    try {
      const res = await politeFetch(infoUrl, { headers: { Accept: "application/xml" } });
      parsed = await streamParseInfotable(res);
    } catch (e) {
      lastError = `infotable ${cand.name}: ${(e as Error).message}`;
      continue;
    }
    if (parsed.holdings.size === 0) {
      lastError = `${cand.name}: 0 holdings parsed`;
      continue;
    }
    let total = 0;
    for (const v of parsed.holdings.values()) total += v;
    if (!(total > 0)) {
      lastError = `${cand.name}: non-positive portfolio total (${total})`;
      continue;
    }
    let failures = 0;
    for (const v of parsed.holdings.values()) {
      const w = v / total;
      if (!(w > 0 && w <= 1 + 1e-9)) failures++;
    }
    return { ...parsed, cik: f.cik, name: f.name, form: f.form, date: f.date, total, failures };
  }
  return { error: lastError };
}

// ---------------------------------------------------- cusip -> ticker map ---

interface CusipCacheEntry { ticker: string | null; name?: string; exchCode?: string; queried: string }
type CusipCache = Record<string, CusipCacheEntry>;

function loadCusipCache(): CusipCache {
  if (REFRESH_CUSIPS || !existsSync(CUSIP_CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CUSIP_CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

/** Loose name pre-filter: would this 13F issuer name plausibly be a watchlist company? */
function plausibleTickers(name13f: string, watchByNorm: Map<string, string>, watchByFirstTok: Map<string, string[]>): string[] {
  const norm = normalizeName(name13f);
  const hits = new Set<string>();
  const exact = watchByNorm.get(norm);
  if (exact) hits.add(exact);
  if (norm.length >= 5) {
    for (const [wn, t] of watchByNorm) {
      if (wn.length >= 5 && (norm.startsWith(wn + " ") || wn.startsWith(norm + " "))) hits.add(t);
    }
  }
  const toks = significantTokens(norm);
  if (toks.length > 0) {
    for (const t of watchByFirstTok.get(toks[0]) ?? []) hits.add(t);
    if (toks[0].length >= 4) {
      for (const [ft, ts] of watchByFirstTok) if (ft.startsWith(toks[0]) || toks[0].startsWith(ft)) for (const t of ts) hits.add(t);
    }
  }
  return [...hits];
}

async function resolveCusips(
  candidates: { cusip: string; names: string[]; maxWeight: number }[],
  watchKeyToTicker: Map<string, string>,
  cache: CusipCache,
): Promise<void> {
  const todo = candidates.filter((c) => !cache[c.cusip]);
  console.log(`   OpenFIGI: ${candidates.length} candidate cusips, ${candidates.length - todo.length} cached, ${Math.min(todo.length, MAX_CUSIP_LOOKUPS)} to resolve`);
  const queue = todo.slice(0, MAX_CUSIP_LOOKUPS);
  if (todo.length > MAX_CUSIP_LOOKUPS) console.warn(`   ⚠ capping lookups at ${MAX_CUSIP_LOOKUPS} (--max-cusip-lookups to raise)`);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (OPENFIGI_KEY) headers["X-OPENFIGI-API-KEY"] = OPENFIGI_KEY;

  const BATCH = 10; // OpenFIGI v3 rejects larger batches with HTTP 413
  for (let i = 0; i < queue.length; i += BATCH) {
    const batch = queue.slice(i, i + BATCH);
    const body = batch.map((c) => ({ idType: "ID_CUSIP_8_CHR", idValue: c.cusip }));
    let results: any[] | null = null;
    let ok = false;
    try {
      const res = await fetch("https://api.openfigi.com/v3/mapping", { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) {
        results = await res.json();
        ok = true;
      } else console.warn(`   ⚠ OpenFIGI batch HTTP ${res.status} (cusips left unmatched, not cached)`);
    } catch (e) {
      console.warn(`   ⚠ OpenFIGI batch failed: ${(e as Error).message}`);
    }
    if (!ok) continue;
    for (let j = 0; j < batch.length; j++) {
      const entry: CusipCacheEntry = { ticker: null, queried: new Date().toISOString() };
      const data = results?.[j]?.data;
      if (Array.isArray(data)) {
        const pick = data.find((d: any) => d.exchCode === "US" && d.ticker) ?? data.find((d: any) => d.ticker);
        if (pick?.ticker) {
          const t = watchKeyToTicker.get(tickerKey(pick.ticker));
          if (t) {
            entry.ticker = t;
            entry.name = pick.name;
            entry.exchCode = pick.exchCode;
          }
        }
      }
      cache[batch[j].cusip] = entry;
    }
    if (i + BATCH < queue.length) await new Promise((r) => setTimeout(r, 400)); // be gentle with the guest tier
  }
}

// ------------------------------------------------------------------ main ---

async function main() {
  console.log(`13F ingest — ${YEAR} QTR${QTR}${SAMPLE ? ` (sample ${SAMPLE}, seed ${SEED})` : " (full)"}`);
  console.log(`UA: ${USER_AGENT}`);

  // 1. Watchlist
  const ideas = parseStockIdeas(join(BASE, "us-stocks.json"));
  if (ideas.length === 0) throw new Error("no tickers parsed from us-stocks.json");
  const watchByNorm = new Map<string, string>();
  const watchByFirstTok = new Map<string, string[]>();
  const watchKeyToTicker = new Map<string, string>();
  for (const idea of ideas) {
    const norm = normalizeName(idea.meta.company_name ?? idea.ticker);
    if (!watchByNorm.has(norm)) watchByNorm.set(norm, idea.ticker);
    watchKeyToTicker.set(tickerKey(idea.ticker), idea.ticker);
    const toks = significantTokens(norm);
    if (toks.length > 0) {
      const first = toks[0];
      const arr = watchByFirstTok.get(first) ?? [];
      if (!arr.includes(idea.ticker)) arr.push(idea.ticker);
      watchByFirstTok.set(first, arr);
    }
  }
  console.log(`Watchlist: ${ideas.length} tickers from us-stocks.json`);

  // 2. EDGAR full-index + amendment dedupe
  const rows = await fetch13FIndex(YEAR, QTR);
  const hrRows = rows.filter((r) => r.form === "13F-HR" || r.form === "13F-HR/A");
  if (hrRows.length === 0) throw new Error("no 13F-HR rows found in full-index");
  const { picked, superseded } = dedupeByCik(hrRows);
  console.log(
    `Index: ${hrRows.length} 13F rows (${hrRows.filter((r) => r.form === "13F-HR/A").length} amendments), ` +
      `${picked.length} unique CIKs after dedupe (${superseded} superseded)`
  );

  // 3. Pick filings (seeded sample or full)
  let selected = picked;
  if (SAMPLE > 0 && SAMPLE < picked.length) {
    const rand = lcg(SEED);
    selected = [...picked];
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }
    selected = selected.slice(0, SAMPLE);
  }

  // 4. Stream-parse infotables
  const funds: FundResult[] = [];
  const errors: { cik: number; name: string; error: string }[] = [];
  for (let i = 0; i < selected.length; i++) {
    const f = selected[i];
    process.stdout.write(`[${i + 1}/${selected.length}] CIK ${f.cik} ${f.name.slice(0, 44).padEnd(44)} `);
    const r = await processFiling(f);
    if ("error" in r) {
      errors.push({ cik: f.cik, name: f.name, error: r.error });
      console.log(`✗ ${r.error}`);
    } else {
      funds.push(r);
      console.log(`✓ ${r.rows} holdings, total $${(r.total / 1e9).toFixed(2)}B${r.failures ? `, ⚠ ${r.failures} bad weights` : ""}`);
    }
  }
  if (funds.length === 0) throw new Error("no filings parsed successfully");
  console.log(`Parsed ${funds.length}/${selected.length} filings (${errors.length} errors)`);

  // Sanity: amendment dedupe means every CIK appears at most once.
  const cikCounts = new Map<number, number>();
  for (const f of funds) cikCounts.set(f.cik, (cikCounts.get(f.cik) ?? 0) + 1);
  const dupCiks = [...cikCounts.values()].filter((n) => n > 1).length;

  // 5. Union cusips -> candidates via name pre-filter
  const cusipInfo = new Map<string, { names: Set<string>; maxWeight: number; totalValue: number }>();
  for (const f of funds) {
    for (const [cusip, value] of f.holdings) {
      const e = cusipInfo.get(cusip) ?? { names: new Set<string>(), maxWeight: 0, totalValue: 0 };
      e.names.add(f.names.get(cusip) ?? "");
      e.maxWeight = Math.max(e.maxWeight, value / f.total);
      e.totalValue += value;
      cusipInfo.set(cusip, e);
    }
  }
  const candidates: { cusip: string; names: string[]; maxWeight: number }[] = [];
  for (const [cusip, e] of cusipInfo) {
    for (const n of e.names) {
      if (plausibleTickers(n, watchByNorm, watchByFirstTok).length > 0) {
        candidates.push({ cusip, names: [...e.names], maxWeight: e.maxWeight });
        break;
      }
    }
  }
  candidates.sort((a, b) => b.maxWeight - a.maxWeight); // most conviction-heavy first under the cap
  console.log(`Cusips: ${cusipInfo.size} unique across funds; ${candidates.length} pass the watchlist name pre-filter`);

  // 6. Resolve cusip -> ticker (OpenFIGI, cached)
  const cache = loadCusipCache();
  await resolveCusips(candidates, watchKeyToTicker, cache);
  mkdirSync(dirname(CUSIP_CACHE_PATH), { recursive: true });
  writeFileSync(CUSIP_CACHE_PATH, JSON.stringify(cache, null, 2));

  // 7. Invert: per-ticker holders, ranked by reported value, top 5
  const holdersByTicker = new Map<string, { cusip: string; holders: { fund: string; cik: number; form: string; filedAt: string; valueUsd: number; weight: number }[] }>();
  let weightViolations = 0;
  for (const f of funds) {
    for (const [cusip, value] of f.holdings) {
      const ticker = cache[cusip]?.ticker;
      if (!ticker) continue;
      const weight = value / f.total;
      if (!(weight > 0 && weight <= 1 + 1e-9)) {
        weightViolations++;
        continue;
      }
      const entry = holdersByTicker.get(ticker) ?? { cusip, holders: [] };
      entry.holders.push({ fund: f.name, cik: f.cik, form: f.form, filedAt: f.date, valueUsd: Math.round(value), weight: Math.round(weight * 1e6) / 1e6 });
      holdersByTicker.set(ticker, entry);
    }
  }
  for (const e of holdersByTicker.values()) e.holders.sort((a, b) => b.valueUsd - a.valueUsd || a.cik - b.cik);

  // 8. Emit artifact
  interface Holder { fund: string; cik: number; filedAt: string; valueUsd: number; weight: number }
  const tickers: Record<string, { cusip: string; holderCount: number; top5: Holder[] }> = {};
  for (const [ticker, e] of [...holdersByTicker.entries()].sort((a, b) => b[1].holders.length - a[1].holders.length)) {
    tickers[ticker] = { cusip: e.cusip, holderCount: e.holders.length, top5: e.holders.slice(0, 5) };
  }
  const artifact = {
    generatedAt: new Date().toISOString(),
    source: { index: `SEC EDGAR full-index ${YEAR} QTR${QTR}`, forms: ["13F-HR", "13F-HR/A"], dedupe: "latest filing per CIK wins" },
    sample: SAMPLE > 0 ? { size: SAMPLE, seed: SEED, universe: picked.length } : null,
    stats: {
      watchlistTickers: ideas.length,
      filingsSelected: selected.length,
      filingsParsed: funds.length,
      filingsFailed: errors.length,
      uniqueCusips: cusipInfo.size,
      cusipCandidates: candidates.length,
      cusipsResolved: Object.values(cache).filter((c) => c.ticker).length,
      tickersWithHolders: Object.keys(tickers).length,
      weightViolations,
      duplicateCiksAfterDedupe: dupCiks,
      peakRequestsPerSecond: observedPeakRps(),
    },
    holders: tickers,
  };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(artifact, null, 2));

  // 9. Report
  console.log("\n==== summary ====");
  console.log(`weights: all in (0,1] except ${weightViolations} violations; duplicate CIKs after dedupe: ${dupCiks}`);
  console.log(`politeness: ${requestTimes.length} requests, peak ${observedPeakRps()}/s (cap ${Math.floor(1000 / MIN_INTERVAL_MS)}/s, EDGAR limit 10/s)`);
  console.log(`tickers with holders: ${Object.keys(tickers).length}/${ideas.length}`);
  const sampleTickers = Object.keys(tickers).slice(0, 8);
  for (const t of sampleTickers) {
    const top = tickers[t].top5[0];
    console.log(`  ${t.padEnd(6)} cusip ${tickers[t].cusip}  #1 ${top.fund.slice(0, 30).padEnd(30)} $${(top.valueUsd / 1e6).toFixed(1)}M  ${(top.weight * 100).toFixed(1)}% of fund`);
  }
  console.log(`\nwrote ${OUT_PATH}`);
  console.log(`wrote ${CUSIP_CACHE_PATH}`);

  if (weightViolations > 0 || dupCiks > 0) {
    console.error("SANITY FAILURE: weight violations or duplicate CIKs detected");
    process.exit(1);
  }
  if (Object.keys(tickers).length === 0) {
    console.error("no watchlist tickers matched any parsed holding — check cusip cache / pre-filter");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
