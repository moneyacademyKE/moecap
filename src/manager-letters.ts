import { readFileSync } from "node:fs";

/**
 * Renders the manager-letters block that sits inside the 13F Letters section.
 *
 * The rest of that section is hand-written prose in src/content.ts. This block
 * is generated from data/13f-letters.json, which only ever contains URLs that
 * scripts/verify-13f-letters.ts fetched successfully. Nothing here is typed by
 * hand, so nothing here can rot without the next build noticing.
 */

export interface LetterEntry {
  manager: string;
  url: string;
  kind: "pdf" | "page";
  bytes: number;
  title: string;
  period: string | null;
  root?: boolean;
}

interface LettersFile {
  generatedAt: string;
  managers: LetterEntry[];
  noPublicLetters: string[];
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bare(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

/** What someone actually gets when they click: a PDF, an archive, a research desk. */
export function letterKind(e: LetterEntry): "pdf" | "letters" | "research" | "firm" {
  if (e.kind === "pdf") return "pdf";
  const u = e.url.toLowerCase();
  if (/letter|missive|memo|commentary|newsletter/.test(u)) return "letters";
  if (/insight|research|perspective|thinking|article|viewpoint|outlook/.test(u)) return "research";
  return "firm";
}

const GROUPS: Array<{ key: ReturnType<typeof letterKind>; label: string; blurb: string }> = [
  {
    key: "pdf",
    label: "Letter as filed",
    blurb: "A single quarterly letter, linked as the document itself.",
  },
  {
    key: "letters",
    label: "Letter archives",
    blurb: "The firm's own running archive of letters to shareholders and partners.",
  },
  {
    key: "research",
    label: "Research desks",
    blurb: "No separate letter, but a public archive of the same market commentary in article form.",
  },
  {
    key: "firm",
    label: "Firm news",
    blurb: "Commentary published as press releases or presentations rather than a letter.",
  },
];

function tag(e: LetterEntry): string {
  const kind = letterKind(e);
  const label = kind === "pdf" ? "PDF" : kind === "letters" ? "archive" : kind === "research" ? "research" : "news";
  return e.period ? `<span class="ml-tag">${esc(label)} · ${esc(e.period)}</span>` : `<span class="ml-tag">${esc(label)}</span>`;
}

function row(e: LetterEntry): string {
  return `      <li class="ml-row"><a href="${esc(e.url)}" rel="noopener">${esc(e.manager)}</a> ${tag(e)}</li>`;
}

const CSS = `<style>
  .ml-wrap { margin-top: 1.5rem; }
  .ml-lede { color: var(--meta); max-width: 62ch; }
  .ml-stats { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.25rem 0 0.5rem; }
  .ml-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem 0.9rem; min-width: 8rem; }
  .ml-stat b { display: block; font-size: 1.15rem; color: var(--accent); line-height: 1.2; }
  .ml-stat span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--meta); }
  .ml-group { margin-top: 1.75rem; }
  .ml-head { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--meta); border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; margin-bottom: 0.25rem; }
  .ml-blurb { color: var(--meta); font-size: 0.8rem; margin: 0.4rem 0 0.6rem; }
  .ml-list { list-style: none; margin: 0; padding: 0; }
  .ml-row { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; align-items: baseline; justify-content: space-between; padding: 0.4rem 0.25rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  .ml-row:last-child { border-bottom: none; }
  .ml-row a { color: var(--link); }
  .ml-tag { color: var(--meta); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ml-note { color: var(--meta); font-size: 0.78rem; margin-top: 1.5rem; }
</style>`;

export function renderManagerLetters(dataPath: string): string {
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as LettersFile;
  const linked = data.managers.filter((m) => m.root !== true);
  const total = linked.length + data.noPublicLetters.length;
  const pdfs = linked.filter((m) => letterKind(m) === "pdf").length;

  const stats = `<div class="ml-stats">
      <div class="ml-stat"><b>${linked.length}</b><span>of ${total} managers link a letter</span></div>
      <div class="ml-stat"><b>${pdfs}</b><span>quarterly letters as PDF</span></div>
      <div class="ml-stat"><b>${esc(data.generatedAt)}</b><span>links last fetched</span></div>
    </div>`;

  const groups = GROUPS.map((g) => {
    const rows = linked.filter((m) => letterKind(m) === g.key);
    if (!rows.length) return "";
    return `<div class="ml-group">
    <h3 class="ml-head">${esc(g.label)} (${rows.length})</h3>
    <p class="ml-blurb">${esc(g.blurb)}</p>
    <ul class="ml-list">
${rows.map(row).join("\n")}
    </ul>
  </div>`;
  }).join("\n");

  return `${CSS}
<div class="ml-wrap">
  <p class="ml-lede">A 13F tells you what a manager owned. The letter is where they explain why — and it is the only part of the job that is optional. Of the ${total} managers in the 13F directory, ${linked.length} publish something we can link: a quarterly letter, a running archive, or a research desk that does the same work in article form. The biggest multi-managers publish nothing at all, as policy rather than oversight, so ${data.noPublicLetters.length} names below have no entry — that gap is information too.</p>
  ${stats}
  ${groups}
  <p class="ml-note">Every link on this page was fetched during the build that produced it; anything that returned an error, a PDF-shaped compliance filing, or a bare homepage was dropped rather than shipped. Links point at each firm's own publication, so the letter opens where the manager wrote it. Periods shown are taken from the link itself, and not every archive exposes one.</p>
</div>`;
}