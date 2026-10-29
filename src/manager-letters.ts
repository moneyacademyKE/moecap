import { readFileSync } from "node:fs";

/**
 * Renders the manager-letters block that sits inside the 13F Letters section.
 *
 * Deliberately the same shape as the hand-written quarters above it: an <h3>
 * per group and a <ul> of links. No cards, no chips, no bespoke CSS. The
 * section is a reading list, so it looks like one.
 *
 * The data in data/13f-letters.json only ever contains URLs that
 * scripts/verify-13f-letters.ts fetched successfully during the build.
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

/** Titles arrive as raw page <title> text, entities and all. */
function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ");
}

/** What someone actually gets when they click: a PDF, an archive, a research desk. */
export function letterKind(e: LetterEntry): "pdf" | "letters" | "research" | "firm" {
  if (e.kind === "pdf") return "pdf";
  const u = e.url.toLowerCase();
  if (/letter|missive|memo|commentary|newsletter/.test(u)) return "letters";
  if (/insight|research|perspective|thinking|article|viewpoint|outlook/.test(u)) return "research";
  return "firm";
}

const GROUPS: Array<{ key: ReturnType<typeof letterKind>; label: string; fallback: string }> = [
  { key: "pdf", label: "Quarterly Letters", fallback: "quarterly letter" },
  { key: "letters", label: "Letter Archives", fallback: "letter archive" },
  { key: "research", label: "Research & Commentary", fallback: "research & commentary" },
  { key: "firm", label: "Firm News", fallback: "news & presentations" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * One line of description, the way the hand-written quarters above read:
 * short, specific, and never a restatement of the group heading.
 */
export function describe(e: LetterEntry): string {
  let t = decode(e.title ?? "").replace(/\s+/g, " ").trim();
  // Page titles are usually "Thing - Firm | Firm" or "Firm - Thing"; keep the
  // half that is not simply the firm's own name repeated back at you.
  const parts = t.split(/\s+[|—–-]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    t = norm(parts[0]) === norm(e.manager) ? parts[1] : parts[0];
  }
  // "Letters to our partners │Giverny Capital": no spaces around the divider.
  const bar = t.split("│").map((p) => p.trim()).filter(Boolean);
  if (bar.length > 1 && norm(bar[bar.length - 1]) === norm(e.manager)) t = bar[0];
  if (t.length > 60) t = `${t.slice(0, 57).trimEnd()}…`;
  if (norm(t) === norm(e.manager)) t = "";
  const kind = GROUPS.find((g) => g.key === letterKind(e))?.fallback ?? "letter";
  if (!t) return e.period ? `${kind}, ${e.period}` : kind;
  if (e.period && !t.includes(e.period)) return `${t}, ${e.period}`;
  return t;
}

function rows(list: LetterEntry[]): string {
  return list
    .map((e) => `        <li><a href="${esc(e.url)}">${esc(e.manager)}</a> — ${esc(describe(e))}</li>`)
    .join("\n");
}

export function renderManagerLetters(dataPath: string): string {
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as LettersFile;
  const linked = data.managers.filter((m) => m.root !== true);
  const total = linked.length + data.noPublicLetters.length;

  const blocks = GROUPS.map((g) => {
    const group = linked.filter((m) => letterKind(m) === g.key);
    if (!group.length) return "";
    return `<h3>${esc(g.label)}</h3>
      <ul>
${rows(group)}
      </ul>`;
  }).filter(Boolean);

  return [
    `<p>${linked.length} of the ${total} managers in the 13F directory publish something we can link: a quarterly letter, a running archive, or a research desk that does the same work in article form. The rest publish nothing at all, as policy rather than oversight, and are counted here rather than named.</p>`,
    ...blocks,
    `<p>Every link above was fetched during the build that produced it; anything that returned an error, a compliance filing, or a bare homepage was dropped rather than shipped.</p>`,
  ].join("\n      ");
}