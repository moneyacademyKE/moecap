/**
 * Discovers and VERIFIES the quarterly-letter links for the 100 managers whose
 * 13F filings the site tracks.
 *
 * The seed file says where a manager publishes; it does not prove the URL is a
 * letter, or that it still resolves. So every candidate is fetched here, and a
 * link only reaches the output when it returned a real document in this run.
 * Nothing is guessed from a URL pattern.
 *
 * Compliance paper is not a letter: Form CRS, ADV Part 2A, TCFD and
 * stewardship filings all live on the same sites and match "report", which is
 * how the first run "verified" an impersonation alert as Hotchkis & Wiley's
 * quarterly letter. Those are rejected outright, not down-weighted.
 *
 *   bun scripts/resolve-13f-letters.ts [--limit N] [--manager "Name"]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.cwd();
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const TIMEOUT_MS = 12_000;
const CONCURRENCY = 6;

interface Seed {
  manager: string;
  urls: string[];
  reason?: string;
}

interface Candidate {
  url: string;
  score: number;
  kind: "pdf" | "html";
  bytes: number;
  title: string;
  period: string | null;
  why: string;
}

interface Resolved {
  manager: string;
  seed: string;
  candidates: Candidate[];
  chosen?: Candidate;
  error?: string;
}

/** Quarter label from a URL or document title; EDGAR-style MM-DD-YYYY included. */
export function periodFrom(text: string): string | null {
  let m = text.match(/(20\d{2})[-_/ ]?(0[1-9]|1[0-2])[-_/ ]?(0[1-9]|[12]\d|3[01])/);
  if (m) {
    const [, y, mo, d] = m;
    const eom = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(mo) - 1];
    if (Number(d) >= eom - 1) return `Q${Math.ceil(Number(mo) / 3)} ${y}`;
  }
  m = text.match(/(?:q|1q|2q|3q|4q)[-_ ]?([1-4])[-_ ]?(20\d{2})/i);
  if (m) return `Q${m[1]} ${m[2]}`;
  m = text.match(/(20\d{2})[-_ ]?(?:q|1q|2q|3q|4q)[-_ ]?([1-4])/i);
  if (m) return `Q${m[2]} ${m[1]}`;
  m = text.match(/(?:first|second|third|fourth)[-_ ]quarter[-_ ]?(20\d{2})/i);
  if (m) {
    const idx = ["first", "second", "third", "fourth"].indexOf(m[0].split(/[-_ ]/)[0].toLowerCase());
    return `Q${idx + 1} ${m[1]}`;
  }
  return null;
}

/** Regulatory paperwork and site furniture — never a letter. */
const NOT_A_LETTER =
  /form[-_ ]?(crs|adv|n-csr|n-1a|13f|d\b|4\b)|adv[-_ ]?part|tcfd|stewardship|prospectus|kiid|impersonat|fact[-_ ]?sheet|factsheet|distribution|privacy|cookie|terms|login|signin|careers|contact|disclaimer|accessib|subscribe|newsletter|twitter|linkedin|facebook|youtube|instagram|mailto:|tel:|javascript:|policy|complian|slavery|modern-slavery|sfdr|vote|proxy|annual-report/i;
/** What a letter actually looks like. */
const LETTERISH = /letter|commentar|quarter|shareholder|outlook|memo|perspectiv|market-commentary|missive|insights/i;
/** A collection page: where the letters live, rather than one letter. */
const INDEX_PAGE =
  /\/(letters?|commentary|commentaries|quarterly-letters|quarterly-commentary|shareholder-letters|investor-letters|annual-letters|annual-reports|missives|insights|news-insights|research|publications)(\/|$|\.html?$)/i;

function scoreLink(href: string, text: string): { score: number; why: string[]; dead: boolean } {
  const hay = `${href} ${text}`;
  if (NOT_A_LETTER.test(hay)) return { score: -99, why: ["compliance/nav"], dead: true };
  if (!LETTERISH.test(hay)) return { score: -99, why: ["not letterish"], dead: true };
  let score = 0;
  const why: string[] = [];
  const add = (points: number, label: string) => {
    score += points;
    why.push(`${points > 0 ? "+" : ""}${points} ${label}`);
  };
  const isPdf = /\.pdf($|\?)/i.test(href);
  if (isPdf) add(30, "PDF");
  // The letters *index* is the durable link: PDFs rot, index pages do not.
  if (!isPdf && INDEX_PAGE.test(href)) add(45, "index page");
  if (/letter/i.test(hay)) add(26, "letter");
  if (/commentar|missive/i.test(hay)) add(20, "commentary");
  if (/quarter|q[1-4]|1q|2q|3q|4q/i.test(hay)) add(14, "quarterly");
  const year = Number((hay.match(/20(2[0-9])/) || [])[1] || 0);
  if (year) add((year - 22) * 4, `year 20${year}`);
  // A dated slug three levels deep is one article, not the collection.
  const depth = new URL(href).pathname.split("/").filter(Boolean).length;
  if (!isPdf && depth > 2) add(-25, "deep article");
  return { score, why, dead: false };
}

function absolute(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
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
      headers: { "user-agent": UA, accept: "text/html,application/pdf,*/*", "accept-language": "en-US,en;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

function titleOf(html: string): string {
  const t = html.match(/<title[^>]*>([^<]{0,160})/i);
  return t ? t[1].replace(/\s+/g, " ").trim() : "";
}

function extractLinks(html: string, base: string): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const abs = absolute(m[1].trim(), base);
    if (!abs) continue;
    out.push({ url: abs, text: m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() });
  }
  return out;
}

async function verify(url: string, why: string[], score: number): Promise<Candidate | null> {
  const res = await get(url);
  if (!res || !res.ok) return null;
  const type = res.headers.get("content-type") || "";
  if (type.includes("pdf")) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (new TextDecoder().decode(buf.slice(0, 5)) !== "%PDF-") return null;
    if (buf.byteLength < 20_000) return null;
    const body = new TextDecoder("latin1").decode(buf.slice(0, 4096));
    return {
      url,
      score,
      kind: "pdf",
      bytes: buf.byteLength,
      title: (body.match(/\/Title\s*\(([^)]{3,160})\)/) || [])[1] || "",
      period: periodFrom(url) || periodFrom(body),
      why: why.join(", "),
    };
  }
  if (!type.includes("html")) return null;
  const html = await res.text();
  if (html.length < 2_000) return null;
  const title = titleOf(html);
  return {
    url,
    score,
    kind: "html",
    bytes: html.length,
    title,
    period: periodFrom(url) || periodFrom(title),
    why: why.join(", "),
  };
}

/** Harvest candidates from one page: the page itself is checked first. */
async function harvest(pageUrl: string, seen: Set<string>): Promise<Candidate[]> {
  const res = await get(pageUrl);
  if (!res || !res.ok) return [];
  const type = res.headers.get("content-type") || "";
  if (type.includes("pdf")) {
    const direct = await verify(pageUrl, ["seed"], 60);
    return direct ? [direct] : [];
  }
  const html = await res.text();
  const found: Candidate[] = [];
  // A seed that IS a letters index is already the answer; no need to crawl it.
  if (INDEX_PAGE.test(pageUrl)) {
    const self = await verify(pageUrl, ["seed is index"], 70);
    if (self) found.push(self);
  }
  const links = extractLinks(html, pageUrl)
    .map((l) => ({ ...l, ...scoreLink(l.url, l.text) }))
    .filter((l) => !l.dead && l.score > 25 && !seen.has(l.url))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  for (const l of links) {
    seen.add(l.url);
    const ok = await verify(l.url, l.why, l.score);
    if (ok) found.push(ok);
  }
  return found;
}

/** Common letters-index paths, tried when a manager's own site hides its links behind JS. */
const GUESSES = [
  "letters",
  "letters/",
  "commentary",
  "quarterly-letters",
  "investor-letters",
  "annual-letters",
  "shareholder-letters",
  "news-insights",
  "insights",
  "research",
  "news",
];

/** <loc> entries from a sitemap or sitemap index. */
function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}

/**
 * Sitemap pass: fund sites are usually WordPress-shaped, so the letters exist
 * as URLs even when the homepage builds its nav in JavaScript and the crawler
 * sees nothing. robots.txt names the sitemap; an index names the children.
 */
async function fromSitemaps(origin: string, seen: Set<string>): Promise<Candidate[]> {
  const maps = new Set<string>([`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/wp-sitemap.xml`]);
  const robots = await get(`${origin}/robots.txt`);
  if (robots && robots.ok) {
    for (const line of (await robots.text()).split("\n")) {
      const m = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (m) maps.add(m[1]);
    }
  }
  const urls: string[] = [];
  for (const map of maps) {
    const res = await get(map);
    if (!res || !res.ok) continue;
    const body = await res.text();
    for (const loc of locs(body)) {
      if (/\.xml($|\?)/i.test(loc)) {
        if (urls.length > 400) continue;
        const child = await get(loc);
        if (child && child.ok) urls.push(...locs(await child.text()));
      } else {
        urls.push(loc);
      }
    }
    if (urls.length) break;
  }
  const picked = urls
    .map((u) => ({ url: u, ...scoreLink(u, "") }))
    .filter((c) => !c.dead && c.score > 25 && !seen.has(c.url))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const found: Candidate[] = [];
  for (const p of picked) {
    seen.add(p.url);
    const ok = await verify(p.url, p.why, p.score);
    if (ok) found.push(ok);
  }
  return found;
}

async function resolve(seed: Seed): Promise<Resolved> {
  const out: Resolved = { manager: seed.manager, seed: seed.urls[0] || "", candidates: [] };
  if (!seed.urls.length) {
    out.error = seed.reason || "no public letters";
    return out;
  }
  const seen = new Set<string>();
  for (const url of seed.urls) out.candidates.push(...(await harvest(url, seen)));
  let host = "";
  try {
    host = new URL(seed.urls[0]).origin;
  } catch {
    host = "";
  }
  const reachable = host ? await get(`${host}/`) : null;
  if (!out.candidates.length && reachable && reachable.ok) {
    out.candidates.push(...(await fromSitemaps(host, seen)));
  }
  if (!out.candidates.length && reachable && reachable.ok) {
    for (const path of GUESSES) {
      if (out.candidates.length) break;
      out.candidates.push(...(await harvest(`${host}/${path}`, seen)));
    }
  }
  out.candidates.sort((a, b) => b.score - a.score);
  out.chosen = out.candidates[0];
  if (!out.chosen && !out.error) {
    const home = await get(seed.urls[0]);
    out.error = home ? `seed ${seed.urls[0]} -> ${home.status}, no letter link found` : `seed ${seed.urls[0]} -> unreachable`;
  }
  return out;
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
  const only = args.includes("--manager") ? args[args.indexOf("--manager") + 1] : null;

  const seeds = JSON.parse(readFileSync(join(BASE, "data", "13f-letter-seeds.json"), "utf8")).seeds as Seed[];
  const queue = seeds.filter((s) => (only ? s.manager === only : true)).slice(0, limit);

  const results = await pool(queue, CONCURRENCY, resolve);
  for (const r of results.sort((a, b) => a.manager.localeCompare(b.manager))) {
    const p = r.chosen;
    console.log(
      `${p ? "✓" : "·"} ${r.manager.padEnd(34)} ${p ? `${p.kind} ${String(p.period || "—").padEnd(9)} ${p.url.slice(0, 88)}` : r.error}`,
    );
  }

  writeFileSync(join(BASE, "data", "13f-letters.raw.json"), JSON.stringify({ seeds: queue.length, results }, null, 2));
  console.log(`\n${results.filter((r) => r.chosen).length}/${results.length} managers with a verified letter link`);
}