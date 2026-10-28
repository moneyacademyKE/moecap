#!/usr/bin/env bun
// Enrich the curated 13F manager list with what each one actually reports:
// latest as-of period, portfolio value, position count, and top holdings.
//
// Usage:
//   bun scripts/build-13f-superinvestors.ts [--limit N] [--out data/13f-superinvestors.json]
//
// Input:  data/13f-superinvestors.raw.json (cik + accession from the resolver)
// Output: data/13f-superinvestors.json
//
// Data source: SEC EDGAR 13F-HR filings (public domain). Quarterly; filed up to
// 45 days after quarter end. Politeness: declared User-Agent, <=9 request
// starts/sec, 30s timeout, retries with backoff.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "Moecap Research admin@moecapital.com";
const TOP_N = 10;
const args = process.argv.slice(2);
const arg = (name: string, dflt: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const LIMIT = Number(arg("limit", "0")) || undefined;
const OUT = arg("out", "data/13f-superinvestors.json");

// --- rate-limited fetch ----------------------------------------------------
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

// --- ticker lookup --------------------------------------------------------
const SUFFIXES = new Set(
  ("INC INCORPORATED CORP CORPORATION CO COMPANY LTD LIMITED PLC LLC LP LLP " +
    "PARTNERS PARTNERSHIP TRUST THE HOLDINGS GROUP SA NV AG").split(" ")
);
function normName(s: string): string {
  return s
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !SUFFIXES.has(w))
    .join(" ");
}

// CUSIP -> ticker for the tickers this site covers, learned earlier.
// The cache is stored ticker-first ({"AAPL":"037833100"}); invert it.
function coveredCusips(): Record<string, string> {
  const p = "scripts/out/cusips.json";
  if (!existsSync(p)) return {};
  try {
    const byTicker: Record<string, string> = JSON.parse(readFileSync(p, "utf8"));
    const out: Record<string, string> = {};
    for (const [ticker, cusip] of Object.entries(byTicker)) {
      if (cusip) out[String(cusip).toUpperCase()] = ticker;
    }
    return out;
  } catch {
    return {};
  }
}

// EDGAR writes periodOfReport as MM-DD-YYYY; accept ISO too.
function periodLabel(periodEnd: string): string {
  const iso = periodEnd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const us = periodEnd.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const year = iso ? iso[1] : us ? us[3] : "";
  const month = iso ? Number(iso[2]) : us ? Number(us[1]) : 0;
  if (!year || !month) return periodEnd;
  const q = Math.floor((month - 1) / 3) + 1;
  return `Q${q} ${year}`;
}

function isoDate(d: string): string {
  const us = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return us ? `${us[3]}-${us[1]}-${us[2]}` : d;
}

interface Holding { issuer: string; cusip: string; valueUsd: number; weightPct: number; shares: number }

// Issuer names arrive XML-escaped (STATE STR SPDR S&amp;P 500 ETF).
function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

// Some filers submit an all-zero placeholder infotable (issuer "None", value 0)
// for the current quarter. Walk back to the newest earlier 13F-HR that has data.
async function previous13F(cik: string, beforeAcc: string) {
  const j = (await (await politeFetch(
    `https://data.sec.gov/submissions/CIK${String(cik).padStart(10, "0")}.json`
  )).json()) as any;
  const r = j?.filings?.recent;
  if (!r) return null;
  const cur = String(beforeAcc).replace(/-/g, "");
  const rows: { form: string; acc: string; date: string }[] = [];
  for (let i = 0; i < r.form.length; i++) {
    if (!/^13F-HR$/.test(r.form[i])) continue;
    const acc = String(r.accessionNumber[i]).replace(/-/g, "");
    if (acc === cur) continue;
    rows.push({ form: r.form[i], acc, date: r.filingDate[i] });
  }
  // Submissions arrays are newest-first, so rows[0] is the previous quarter.
  return rows[0] || null;
}

async function fetchFiling(m: any, cusipToTicker: Record<string, string>) {
  const accNoDash = String(m.accession).replace(/-/g, "");
  const base = `https://www.sec.gov/Archives/edgar/data/${m.cik}/${accNoDash}`;
  const idx = (await (await politeFetch(`${base}/index.json`)).json()) as any;
  const items: any[] = idx.directory.item || [];

  // As-of period lives in primary_doc.xml -> periodOfReport. Fall back to the
  // submission form type line ("2026-06-30") only if the primary doc is absent.
  const primary = items.find((i) => /^primary_doc\.xml$/i.test(i.name));
  let periodEnd = "";
  if (primary) {
    const xml = await (await politeFetch(`${base}/${primary.name}`)).text();
    periodEnd = xml.match(/<(?:[\w-]+:)?periodOfReport>([\d-]+)</)?.[1] || "";
  }

  // Infotable filenames follow no convention: take the obvious match, else the
  // largest non-primary XML.
  const xmls = items.filter((i) => /\.xml$/i.test(i.name) && !/^primary_doc/i.test(i.name));
  const info =
    xmls.find((i) => /(info.*table|13f)/i.test(i.name)) ||
    xmls.sort((a, b) => (b.size || 0) - (a.size || 0))[0];
  if (!info) throw new Error(`no infotable xml in ${base}`);
  const table = await (await politeFetch(`${base}/${info.name}`)).text();

  interface Row { issuer: string; cusip: string; value: number; shares: number; pps: number | null }
  const rows: Row[] = [];
  // 13F XML is often namespaced (<ns1:infoTable>) and infotable files follow no
  // naming convention at all (Baupost ships BGLLCQ22026.xml).
  const blocks = table.match(/<(?:[\w-]+:)?infoTable[\s\S]*?<\/(?:[\w-]+:)?infoTable>/g) || [];
  for (const block of blocks) {
    const value = Number(block.match(/<(?:[\w-]+:)?value>(\d+)</)?.[1] || 0);
    const shares = Number(block.match(/<(?:[\w-]+:)?sshPrnamt>(\d+)</)?.[1] || 0);
    const type = block.match(/<(?:[\w-]+:)?sshPrnamtType>(\w+)</)?.[1];
    const issuer = (block.match(/<(?:[\w-]+:)?nameOfIssuer>([^<]+)</)?.[1] || "").trim();
    const cusip = (block.match(/<(?:[\w-]+:)?cusip>([^<]+)</)?.[1] || "").replace(/[^A-Z0-9]/gi, "");
    rows.push({
      issuer: unescapeXml(issuer), cusip, value, shares,
      pps: type === "SH" && shares > 0 && value > 0 ? value / shares : null,
    });
  }
  if (!rows.length) throw new Error(`empty infotable in ${base}`);

  // Value units vary by filer agent: the spec says thousands, many modern
  // filings write dollars. Detect per filing from the median implied price per
  // share: a thousands filing yields a pps ~1000x too small (sub-dollar), while
  // a dollars filing lands in the normal $5-$5,000 range.
  const pps = rows.map((r) => r.pps).filter((p): p is number => p !== null).sort((a, b) => a - b);
  const median = pps.length ? pps[Math.floor(pps.length / 2)] : 0;
  const scale = median > 0 && median < 5 ? 1000 : 1;

  let portfolioUsd = 0;
  const byCusip = new Map<string, Holding>();
  for (const r of rows) {
    const usd = Math.round(r.value * scale);
    portfolioUsd += usd;
    const key = r.cusip || r.issuer;
    const prev = byCusip.get(key);
    if (prev) {
      prev.valueUsd += usd;
      prev.shares += r.shares;
    } else {
      byCusip.set(key, {
        issuer: r.issuer, cusip: r.cusip,
        valueUsd: usd, weightPct: 0, shares: r.shares,
      });
    }
  }
  const holdings = [...byCusip.values()]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, TOP_N)
    .map((h) => ({
      issuer: h.issuer,
      ticker: cusipToTicker[h.cusip] || "",
      valueUsd: h.valueUsd,
      weightPct: portfolioUsd ? +((h.valueUsd / portfolioUsd) * 100).toFixed(1) : 0,
      shares: h.shares,
    }));

  return {
    periodEnd: isoDate(periodEnd) || String(m.lastFiled),
    portfolioUsd,
    positions: byCusip.size,
    holdings,
    url: `${base}/${m.accession}-index.htm`,
    unitsScaled: scale !== 1,
  };
}

async function main() {
  const raw = JSON.parse(readFileSync("data/13f-superinvestors.raw.json", "utf8"));
  const cusipToTicker = coveredCusips();
  const managers: any[] = raw.managers.slice(0, LIMIT || raw.managers.length);
  const out: any[] = [];
  let failed = 0;

  for (const [i, m] of managers.entries()) {
    process.stderr.write(`\r  ${i + 1}/${managers.length} ${m.name.slice(0, 40)}`.padEnd(60));
    try {
      let data = await fetchFiling(m, cusipToTicker);
      let filed = m.lastFiled;
      // A stub filing (all zeros) is not a portfolio — use the prior quarter.
      if (data.portfolioUsd < 1e6) {
        const prev = await previous13F(String(m.cik), m.accession);
        if (prev) {
          data = await fetchFiling({ ...m, accession: prev.acc, lastFiled: prev.date }, cusipToTicker);
          filed = prev.date;
          console.error(`\n  note: ${m.name} latest filing is a stub; fell back to ${prev.date}`);
        }
      }
      out.push({
        name: m.name, role: m.role, tier: m.tier, cik: m.cik,
        edgarName: m.edgarName, filed,
        period: periodLabel(data.periodEnd), periodEnd: data.periodEnd,
        portfolioUsd: data.portfolioUsd, positions: data.positions,
        holdings: data.holdings, url: data.url,
        unitsScaled: data.unitsScaled,
      });
    } catch (e) {
      failed++;
      console.error(`\n  FAIL ${m.name} (${m.cik}): ${e instanceof Error ? e.message : e}`);
    }
  }
  process.stderr.write("\n");

  const periods: Record<string, number> = {};
  for (const m of out) periods[m.period] = (periods[m.period] || 0) + 1;
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "SEC EDGAR 13F-HR filings (public domain)",
        note:
          "Each manager's most recent 13F-HR as of the build date. 13F data is quarterly and " +
          "filed up to 45 days after quarter end, so periods differ by manager — early filers " +
          "show a newer quarter than late ones. Figures are the reportable long positions in " +
          "the filing, not total firm AUM.",
        method: raw.method,
        periods,
        managers: out,
      },
      null,
      1
    )
  );
  console.error(
    `wrote ${out.length}/${managers.length} managers (${failed} failed) to ${OUT}; periods: ${JSON.stringify(periods)}`
  );
}

await main();