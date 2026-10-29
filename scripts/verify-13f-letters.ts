/**
 * Turns the hand-picked letter pages into the data the site renders.
 *
 * Every URL here is fetched NOW. A pick only survives when it answered with a
 * real document (PDF magic bytes, or a page with actual content), because the
 * previous 13F Letters section shipped four dead links that nobody checked.
 * Managers with nothing public are kept, with the reason, so the page can say
 * how much of the list it actually covers instead of implying it covers all.
 *
 *   bun scripts/verify-13f-letters.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { periodFrom } from "./resolve-13f-letters";

const BASE = process.cwd();
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface LetterEntry {
  manager: string;
  url: string;
  kind: "pdf" | "page";
  root?: boolean;
  period: string | null;
  title: string;
  bytes: number;
}

interface Pick {
  manager: string;
  urls: string[];
}

async function fetchOk(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/pdf,*/*", "accept-language": "en-US,en;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return null;
  }
}

function titleOf(html: string): string {
  const t = html.match(/<title[^>]*>([^<]{0,160})/i);
  return t ? t[1].replace(/\s+/g, " ").trim() : "";
}

/** Fetch a URL and report whether it is a document a reader can actually open. */
export async function verifyUrl(url: string): Promise<Omit<LetterEntry, "manager"> | null> {
  const res = await fetchOk(url);
  if (!res || !res.ok) return null;
  const type = res.headers.get("content-type") || "";
  if (type.includes("pdf")) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (new TextDecoder().decode(buf.slice(0, 5)) !== "%PDF-") return null;
    if (buf.byteLength < 20_000) return null;
    const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
    return {
      url,
      kind: "pdf",
      bytes: buf.byteLength,
      title: (head.match(/\/Title\s*\(([^)]{3,160})\)/) || [])[1] || "",
      period: periodFrom(url),
    };
  }
  if (!type.includes("html")) return null;
  const html = await res.text();
  if (html.length < 2_000) return null;
  const title = titleOf(html);
  return {
    url,
    kind: "page",
    bytes: html.length,
    title,
    period: periodFrom(url) || periodFrom(title),
    root: new URL(url).pathname === "/",
  };
}

/** A page that lists letters, found in the site's sitemap when the nav hides it. */
const LETTER_INDEX = /\/(letters?|commentary|commentaries|quarterly-letters|quarterly-commentary|shareholder-letters|investor-letters|annual-letters|missives|publications|insights)\/?$/i;

async function sitemapIndexes(origin: string): Promise<string[]> {
  const maps = new Set<string>([`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/wp-sitemap.xml`]);
  const robots = await fetchOk(`${origin}/robots.txt`);
  if (robots && robots.ok) {
    for (const line of (await robots.text()).split("\n")) {
      const m = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (m) maps.add(m[1]);
    }
  }
  const urls: string[] = [];
  for (const map of maps) {
    const res = await fetchOk(map);
    if (!res || !res.ok) continue;
    const body = await res.text();
    const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    for (const loc of locs) {
      if (!/\.xml($|\?)/i.test(loc)) {
        urls.push(loc);
        continue;
      }
      if (urls.length > 400) continue;
      const child = await fetchOk(loc);
      if (child && child.ok) urls.push(...[...(await child.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]));
    }
    if (urls.length) break;
  }
  return urls.filter((u) => LETTER_INDEX.test(new URL(u).pathname) && !/privacy|terms|policy|compliance/i.test(u));
}

/** When a pick only reaches the homepage, look for the real letters index. */
async function promoteFromSitemap(url: string): Promise<Omit<LetterEntry, "manager"> | null> {
  const origin = new URL(url).origin;
  const host = new URL(url).hostname.replace(/^www\./, "");
  const candidates = (await sitemapIndexes(origin))
    // A sitemap that points at a sister domain is a different company, not a letters page.
    .filter((c) => new URL(c).hostname.replace(/^www\./, "") === host)
    .slice(0, 8);
  for (const candidate of candidates) {
    const hit = await verifyUrl(candidate);
    if (hit) return hit;
  }
  return null;
}

/** When every pick fails, ask the sitemap what letter pages the site publishes. */
async function lettersFromSitemap(origin: string): Promise<Omit<LetterEntry, "manager"> | null> {
  const urls = await sitemapIndexes(origin).catch(() => [] as string[]);
  const loose = urls.length ? urls : [];
  // Index paths first, then dated letters; never a compliance document.
  const ranked = loose
    .filter((u) => !/privacy|terms|policy|complian|form-|adv-part|tcfd|stewardship|prospectus/i.test(u))
    .filter((u) => /letter|commentar|quarter|shareholder|missive/i.test(u))
    .sort((a, b) => (b.match(/20(2[5-9])/)?.[1] || "0") .localeCompare(a.match(/20(2[5-9])/)?.[1] || "0"))
    .slice(0, 6);
  for (const candidate of ranked) {
    const hit = await verifyUrl(candidate);
    if (hit) return hit;
  }

  return null;
}

if (import.meta.main) {
  const picks = JSON.parse(readFileSync(join(BASE, "data", "13f-letters.picks.json"), "utf8")).picks as Pick[];
  const seeds = JSON.parse(readFileSync(join(BASE, "data", "13f-letter-seeds.json"), "utf8")).seeds as {
    manager: string;
    urls: string[];
    reason?: string;
  }[];
  const all = JSON.parse(readFileSync(join(BASE, "data", "13f-superinvestors.json"), "utf8")).managers as {
    name: string;
  }[];

  const linked: LetterEntry[] = [];
  const missing: { manager: string; reason: string }[] = [];

  for (const pick of picks) {
    let hit: Omit<LetterEntry, "manager"> | null = null;
    const tried: string[] = [];
    for (const url of pick.urls) {
      tried.push(url);
      hit = await verifyUrl(url);
      if (hit) break;
    }
    if (hit) {
      // A homepage is not a letters page: try the sitemap before settling for it.
      if (hit.kind === "page" && new URL(hit.url).pathname === "/") {
        const promoted = await promoteFromSitemap(hit.url).catch(() => null);
        if (promoted) hit = promoted;
      }
      linked.push({ manager: pick.manager, ...hit });
      console.log(`✓ ${pick.manager.padEnd(34)} ${hit.kind.padEnd(4)} ${hit.url.slice(0, 88)}`);
    } else {
      // Last resort: the site's sitemap may name a letters page the nav hides.
      const origin = new URL(pick.urls[0]).origin;
      const deep = await lettersFromSitemap(origin).catch(() => null);
      if (deep) {
        linked.push({ manager: pick.manager, ...deep });
        console.log(`✓ ${pick.manager.padEnd(34)} ${deep.kind.padEnd(4)} ${deep.url.slice(0, 88)} (sitemap)`);
      } else {
        missing.push({ manager: pick.manager, reason: `no verifiable page (tried ${tried.length})` });
        console.log(`· ${pick.manager.padEnd(34)} none of ${tried.length} candidates verified`);
      }
    }
  }

  // A homepage is not a letter. Anything that only resolved to the site root gets demoted:
  // the manager probably does publish, but there is no crawlable index to link, and a root
  // link reads as "we couldn't find it" dressed up as a citation.
  const rooted = linked.filter((l) => l.root === true);
  for (const r of rooted) {
    missing.push({ manager: r.manager, reason: "publishes letters but exposes no crawlable index" });
  }
  const published = linked.filter((l) => l.root !== true);
  if (rooted.length) console.log(`\n${rooted.length} site-root-only entries demoted: ${rooted.map((r) => r.manager).join(", ")}`);

  const covered = new Set(linked.map((l) => l.manager));
  for (const seed of seeds) {
    if (covered.has(seed.manager)) continue;
    if (!seed.urls.length) {
      missing.push({ manager: seed.manager, reason: seed.reason || "no public letters" });
    } else if (!missing.some((m) => m.manager === seed.manager)) {
      missing.push({ manager: seed.manager, reason: "not publicly verifiable" });
    }
  }

  const unknown = all.filter((m) => !covered.has(m.name) && !missing.some((x) => x.manager === m.name));
  for (const u of unknown) missing.push({ manager: u.name, reason: "no public letters" });

  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "Fund websites and manager letter archives, fetched and verified by scripts/verify-13f-letters.ts",
    note: "Every link below returned a document in the verification run. Managers without public letters are listed so the coverage figure is honest rather than flattering.",
    managers: published.sort((a, b) => a.manager.localeCompare(b.manager)),
    noPublicLetters: missing.map((m) => m.manager).sort(),
  };
  writeFileSync(join(BASE, "data", "13f-letters.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`\n${published.length}/${all.length} managers linked, ${out.noPublicLetters.length} without a public letter`);
}