/**
 * Re-points each manager's letter link at the PDF that CONTAINS the letter,
 * instead of the page that advertises it.
 *
 * The existing resolver proves a URL returns 200 and looks letter-shaped. That
 * is not the same as handing someone the letter: most managers publish an
 * index page with a dozen PDFs on it, and "Artisan Partners" linking to
 * /commentary/ makes the reader hunt. So this pass harvests the PDF links a
 * page actually carries, scores them for "this is the current letter", fetches
 * the winner and only keeps it when the bytes start with %PDF-.
 *
 * Compliance paper is rejected outright, same as in resolve-13f-letters.ts:
 * Form CRS, ADV, TCFD, stewardship and impersonation alerts all match "report"
 * and none of them is a letter.
 *
 *   bun scripts/resolve-13f-letter-pdfs.ts [--limit N] [--manager "Name"] [--dry]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { periodFrom } from "./resolve-13f-letters";

const BASE = process.cwd();
const FILE = join(BASE, "data/13f-letters.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 5;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

interface Entry {
  manager: string;
  url: string;
  kind: "pdf" | "page";
  bytes: number;
  title: string;
  period: string | null;
  root?: boolean;
  pdf?: string | null;
  pdfBytes?: number;
  pdfDate?: string | null;
  pdfWhy?: string;
}

interface LettersFile {
  generatedAt: string;
  managers: Entry[];
  noPublicLetters: string[];
}

interface Candidate {
  url: string;
  text: string;
  score: number;
  why: string[];
}

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const LIMIT = flag("--limit") ? Number(flag("--limit")) : Infinity;
const ONLY = flag("--manager");
const DRY = args.includes("--dry");

/** Compliance, tax and marketing collateral: never a letter, never a candidate. */
const REJECT =
  /form[-_ ]?crs|[a-z-]adv[-_ ]?part|part[-_ ]?2a|privacy|terms|cookie|disclosure|tax|k-?1|prospectus|fact[-_ ]?sheet|gips|stewardship|tcfd|proxy|10-?k|impersonat|dividend|distribution|brochure|webinar|transcript|press[-_ ]release|sub[-_ ]?adv|EqualOpportunity|code[-_ ]?of[-_ ]?ethics|fraud[-_ ]?alert|modern[-_ ]?slavery|cap[-_ ]?gain|complete[-_ ]?collection|best[-_ ]?of/i;

/** Words that mean "this document is the letter". */
function scoreOf(url: string, text: string, period: string | null): { score: number; why: string[] } {
  const s = `${url} ${text}`.toLowerCase();
  const why: string[] = [];
  let score = 0;
  const add = (n: number, label: string) => {
    score += n;
    why.push(label);
  };
  if (/form[-_ ]?crs|[a-z-]adv[-_ ]?part|part[-_ ]?2a|privacy|terms|cookie|disclosure|tax|k-?1|prospectus|fact[-_ ]?sheet|gips|stewardship|tcfd|proxy|10-?k|impersonat|dividend|distribution|brochure|webinar|transcript|press[-_ ]release|sub[-_ ]?adv|EqualOpportunity|code[-_ ]?of[-_ ]?ethics|fraud[-_ ]?alert|modern[-_ ]?slavery|cap[-_ ]?gain|complete[-_ ]?collection|best[-_ ]?of|Form%20ADV|Form-ADV/i.test(s)) return { score: -999, why: ["compliance"] };
  if (/shareholder letter|letter to (our )?(shareholders|partners|investors)|investor letter/.test(s))
    add(40, "letter");
  else if (/\bletters?\b/.test(s)) add(30, "letter");
  if (/quarterly (commentary|letter|report|update|review|performance)/.test(s)) add(30, "quarterly");
  else if (/commentary/.test(s)) add(22, "commentary");
  if (/insight|perspective|outlook|thinking|review/.test(s)) add(8, "insight");
  if (/\bmemo(s)?\b|shareholder|perspectives|missive|market-outlook|outlook/.test(s)) add(12, "shaped");
  if (/equity review|market review|annual report/.test(s)) add(16, "review");
  // The freshest complete quarter the section shows.
  if (/3q26|q3[-_ ]?26|q3[-_ ]?2026|2026[-_ ]?09|sep(t|tember)?[-_ ]?2026|09302026|30[-_ ]?sep/.test(s))
    add(45, "Q3 2026");
  else if (/2q26|q2[-_ ]?2026|2026[-_ ]?06|jun(e)?[-_ ]?2026/.test(s)) add(28, "Q2 2026");
  else if (/2026/.test(s)) add(18, "2026");
  if (/2025/.test(s)) add(4, "2025");
  // A bare year in a FILENAME is stale: berkshire/2004ltr.pdf outranks nothing.
  // Year-shaped anchor text is a quarter label, not a stale marker.
  if (/202[0-4]|201\d/.test(url) && !/202[0-4]|201\d/.test(text)) add(-45, "stale file");
  if (/\b(?:19|20)\d{2}\b/.test(text) && !/202[5-6]/.test(text)) add(-40, "stale title");
  if (period) {
    const q = period.toLowerCase().replace(/\s+/g, "[-_ ]?");
    if (new RegExp(q).test(s)) add(20, `period ${period}`);
  }
  if (/\/(letters?|commentary)\//.test(url)) add(10, "in letters dir");
  return { score, why };
}

function absolute(href: string, base: string): string | null {
  try {
    const u = new URL(href.replace(/&amp;/g, "&"), base);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

async function get(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/pdf,*/*",
        "accept-language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

/** Every PDF a page mentions, from anchors AND from inline JS/JSON config. */
export function pdfLinks(html: string, base: string): { url: string; text: string }[] {
  const found = new Map<string, string>();
  const anchor = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchor.exec(html))) {
    const abs = absolute(m[1], base);
    if (abs) found.set(abs, m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  }
  // Heavily scripted sites (AQR, Bridgewater, Wellington) never render the
  // link server-side; the path sits in a JSON blob or a data attribute instead.
  const raw = /["'`]([^"'`()\s]*\.pdf)(?:["'`])/gi;
  while ((m = raw.exec(html))) {
    const abs = absolute(m[1], base);
    if (abs && !found.has(abs)) found.set(abs, "");
  }
  return [...found].map(([url, text]) => ({ url, text }));
}

/** Links that name a letter but are not the document: follow one level down. */
export function followLinks(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (/\.pdf/i.test(m[1])) continue;
    const abs = absolute(m[1], base);
    if (!abs) continue;
    const text = m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (REJECT.test(abs) || REJECT.test(text)) continue;
    if (scoreOf(abs, text, null).score >= 25) out.push(abs);
  }
  return [...new Set(out)].slice(0, 4);
}

/** Client-rendered sites keep their documents in a JS bundle, not the DOM. */
export function scriptUrls(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /<script\b[^>]*src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!/data|insights|letters|index|bundle|app|main/i.test(m[1])) continue;
    const abs = absolute(m[1], base);
    if (abs && new URL(abs).origin === new URL(base).origin) out.push(abs);
  }
  return [...new Set(out)].slice(0, 3);
}

export function locsOf(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
}

interface Verified {
  bytes: number;
  title: string;
  date: string | null;
}

/** A PDF is only a PDF if the bytes say so; content-type is a suggestion. */
export async function verifyPdf(url: string): Promise<Verified | null> {
  const res = await get(url);
  if (!res || !res.ok) return null;
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength < 20_000 || buf.byteLength > MAX_PDF_BYTES) return null;
  if (new TextDecoder().decode(buf.slice(0, 5)) !== "%PDF-") return null;
  const head = new TextDecoder("latin1").decode(buf.slice(0, 8192));
  const title = (head.match(/\/Title\s*\(([^)]{3,160})\)/) || [])[1] || "";
  const created = (head.match(/\/CreationDate\s*\(D:(\d{4})(\d{2})?(\d{2})?/) || [])[0] || "";
  const dm = created.match(/(\d{4})(\d{2})(\d{2})/);
  return { bytes: buf.byteLength, title, date: dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : null };
}

/**
 * The archive's last listed year is not necessarily the latest letter: some
 * managers (Berkshire, most WordPress sites) publish the new file without
 * editing the index. Probe the next year before settling for an old PDF.
 */
async function freshest(cands: Candidate[]): Promise<Candidate[]> {
  if (!cands.length) return cands;
  const top = cands[0];
  const m = top.url.match(/(20\d{2})(?=[^0-9]*\.pdf)/i);
  if (!m || Number(m[1]) >= 2026) return cands;
  const next = top.url.replace(/20\d{2}(?=[^0-9]*\.pdf)/i, String(Number(m[1]) + 1));
  const ok = await verifyPdf(next);
  return ok ? [{ ...top, url: next, score: top.score + 60, why: [...top.why, "newer year probe"] }] : cands;
}

/**
 * Where a manager's PDF actually lives: the page, a JS bundle, a letter-shaped
 * sub-page, or a sitemap. Cheap sources first, sitemaps only when needed.
 */
async function gather(e: Entry): Promise<Candidate[]> {
  const page = await get(e.url);
  if (!page || !page.ok) return [];
  const html = await page.text();
  const origin = new URL(e.url).origin;
  const cands = new Map<string, Candidate>();

  const add = (url: string, text: string, bonus: number, from: string) => {
    if (REJECT.test(url) || REJECT.test(text)) return;
    if (!/^https?:\/\//i.test(url)) return;
    const { score, why } = scoreOf(url, text, e.period);
    // A candidate must say something letter-shaped, not merely be a PDF on the
    // page: equal-opportunity policies and ADV filings score zero and die here.
    if (score + bonus < 1 && !/letter|commentary|missive|memo|perspective/i.test(url)) return;
    const prev = cands.get(url);
    if (!prev || prev.score < score + bonus)
      cands.set(url, { url, text, score: score + bonus, why: [...why, from] });
  };

  for (const l of pdfLinks(html, e.url)) add(l.url, l.text, 0, "page");

  // Inline JSON carries titles next to paths: use that title as the text.
  const near = /["']([^"']+\.pdf)["']/gi;
  let nm: RegExpExecArray | null;
  while ((nm = near.exec(html))) {
    const ctx = html.slice(Math.max(0, nm.index - 260), nm.index);
    const title = (ctx.match(/(?:title|name)["'\s:=]+["']([^"']{6,90})["']/i) || [])[1] || "";
    if (title) add(nm[1].startsWith("http") ? nm[1] : new URL(nm[1], e.url).toString(), title, 6, "json");
  }

  const subs = followLinks(html, e.url);
  if (subs.length) {
    const pages = await Promise.all(subs.map((u) => get(u)));
    await Promise.all(
      pages.map(async (res, idx) => {
        if (!res || !res.ok) return;
        const type = res.headers.get("content-type") || "";
        if (type.includes("pdf")) return add(subs[idx], "letter", 20, "subpage-pdf");
        const sub = await res.text();
        for (const l of pdfLinks(sub, subs[idx])) add(l.url, l.text, 10, "subpage");
      })
    );
  }

  if (!cands.size) {
    const scripts = scriptUrls(html, e.url);
    const bundles = await Promise.all(scripts.map((u) => get(u)));
    await Promise.all(
      bundles.map(async (res, idx) => {
        if (!res || !res.ok) return;
        const js = await res.text();
        if (js.length > 6_000_000) return;
        for (const l of pdfLinks(js, scripts[idx])) add(l.url, l.text, 4, "js");
        const titled = /title:\s*['"]([^'"]{6,90})['"][^}]{0,200}?url:\s*['"]([^'"]+)['"]/g;
        let t: RegExpExecArray | null;
        while ((t = titled.exec(js))) {
          const abs = absolute(t[2], e.url);
          if (abs) add(abs, t[1], 6, "js-title");
        }
      })
    );
  }

  if (!cands.size) {
    for (const path of ["/sitemap.xml", "/sitemap_index.xml"]) {
      const res = await get(`${origin}${path}`);
      if (!res || !res.ok) continue;
      const locs = locsOf(await res.text());
      for (const loc of locs) if (/\.pdf$/i.test(loc)) add(loc, "sitemap", 0, "sitemap");
      // A sitemap index is a list of sitemaps; one level is enough.
      for (const sub of locs.filter((l) => /sitemap.*\.xml/i.test(l)).slice(0, 3)) {
        const sres = await get(sub);
        if (!sres || !sres.ok) continue;
        for (const loc of locsOf(await sres.text())) if (/\.pdf$/i.test(loc)) add(loc, "sitemap", 0, "sitemap");
      }
    }
  }

  return [...cands.values()].sort(
    (a, b) => b.score - a.score || Number(/20\d{2}/.exec(b.url)?.[0] ?? 0) - Number(/20\d{2}/.exec(a.url)?.[0] ?? 0)
  );
}

async function resolveEntry(e: Entry): Promise<Entry> {
  if (e.kind === "pdf") return { ...e, pdf: e.url, pdfBytes: e.bytes, pdfWhy: "already a pdf" };
  const scored = await freshest(await gather(e));
  if (!scored.length) return { ...e, pdf: null, pdfWhy: "no candidate pdf found" };

  for (const cand of scored.slice(0, 4)) {
    const ok = await verifyPdf(cand.url);
    if (!ok) continue;
    return {
      ...e,
      pdf: cand.url,
      pdfBytes: ok.bytes,
      pdfDate: ok.date,
      pdfWhy: `${cand.score}: ${cand.why.join(", ")}`,
    };
  }
  return { ...e, pdf: null, pdfWhy: "top candidates were not PDFs" };
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

async function main() {
  const data = JSON.parse(readFileSync(FILE, "utf8")) as LettersFile;
  const targets = data.managers
    .filter((m) => m.root !== true)
    .filter((m) => (ONLY ? m.manager.toLowerCase().includes(ONLY.toLowerCase()) : true))
    .slice(0, LIMIT);

  console.log(`Resolving specific PDFs for ${targets.length} managers...`);
  const done = await pool(targets, CONCURRENCY, resolveEntry);

  const byManager = new Map(done.map((d) => [d.manager, d]));
  const merged: LettersFile = {
    ...data,
    managers: data.managers.map((m) => byManager.get(m.manager) ?? m),
  };
  const hits = done.filter((d) => d.pdf).length;
  console.log(`\n${hits}/${done.length} managers now link a specific PDF\n`);
  for (const d of done.sort((a, b) => Number(!!b.pdf) - Number(!!a.pdf))) {
    const mark = d.pdf ? "PDF " : "page";
    const size = d.pdfBytes ? `${(d.pdfBytes / 1024).toFixed(0)}KB` : "--";
    console.log(`${mark} ${d.manager} | ${size} ${d.pdfDate ?? ""} | ${d.pdfWhy ?? ""}`);
    if (d.pdf && d.pdf !== d.url) console.log(`     ${d.pdf}`);
  }

  if (!DRY) {
    writeFileSync(FILE, `${JSON.stringify(merged, null, 2)}\n`);
    console.log(`\nwrote ${FILE}`);
  }
}

if (import.meta.main) await main();