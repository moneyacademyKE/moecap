#!/usr/bin/env bun
// Resolve the curated 13F manager list (scripts/13f-candidates.ts) to CIKs
// that actually file.
//
// A candidate survives only if some CIK whose registered name matches one of
// its aliases filed a 13F-HR in the Q3-2026 or Q4-2026 EDGAR full index. For
// managers flagged with a pinned `cik` the pin wins: several famous funds have
// a same-named shell, RIA or foreign affiliate that files instead of the entity
// analysts read (Pershing Square Inc. vs the retired LP, Fisher Funds NZ vs
// Fisher Asset Management), and name matching cannot tell them apart.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CANDIDATES, type Candidate } from "./13f-candidates";

const CIK_FILE = "/tmp/cik-lookup.txt";
const INDEXES = ["/tmp/q4.idx", "/tmp/q3.idx"];
const KEEP = Number(process.env.KEEP || 100);

const SUFFIXES = new Set(
  ("INC INCORPORATED CORP CORPORATION CO COMPANY LTD LIMITED PLC LLC LP LLP " +
    "L P PARTNERS PARTNERSHIP TRUST THE MANAGEMENT MGMT ADVISORS ADVISERS " +
    "ADVISORY CAPITAL ASSET ASSETS INVESTMENT INVESTMENTS GROUP HOLDINGS " +
    "INTERNATIONAL INT L LS")
    .split(" ")
);

function norm(s: string): string {
  return s
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !SUFFIXES.has(w))
    .join(" ");
}

interface Filed { filed: string; name: string; accession: string }

// Only CIKs that filed a 13F-HR in a recent filing quarter, with EDGAR's own
// registered name and the accession number of their latest filing.
function filedCiks(): Map<number, Filed> {
  const out = new Map<number, Filed>();
  for (const idx of INDEXES) {
    if (!existsSync(idx)) throw new Error(`missing index ${idx}`);
    for (const line of readFileSync(idx, "utf8").split("\n")) {
      const m = line.match(
        /^(\d+)\|(.+)\|13F-HR(\/A)?\|(\d{4}-\d{2}-\d{2})\|edgar\/data\/\d+\/(\d+-\d+-\d+)\.txt$/
      );
      if (!m) continue;
      const cik = Number(m[1]);
      const prev = out.get(cik);
      if (!prev || m[4] >= prev.filed) {
        out.set(cik, { filed: m[4], name: m[2].trim(), accession: m[5] });
      }
    }
  }
  return out;
}

function cikNames(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const line of readFileSync(CIK_FILE, "utf8").split("\n")) {
    const m = line.match(/^(.*?):(\d{10}):$/);
    if (!m) continue;
    const key = norm(m[1]);
    if (!key) continue;
    const cik = Number(m[2]);
    const arr = out.get(key);
    if (arr) arr.push(cik);
    else out.set(key, [cik]);
  }
  return out;
}

interface Match { cik: number; hit: Filed; alias: string; exact: boolean }

function matchCandidate(
  c: Candidate,
  names: Map<string, number[]>,
  filed: Map<number, Filed>
): Match[] {
  const matches: Match[] = [];
  if (c.cik) {
    const hit = filed.get(c.cik);
    return hit ? [{ cik: c.cik, hit, alias: hit.name, exact: true }] : [];
  }
  for (const alias of c.aliases) {
    const key = norm(alias);
    for (const cik of names.get(key) || []) {
      const hit = filed.get(cik);
      if (hit) matches.push({ cik, hit, alias, exact: true });
    }
    // Loose pass: EDGAR appends state/entity qualifiers to registered names
    // ("BAUPOST GROUP LLC/MA", "SOUTHEASTERN ASSET MANAGEMENT INC/TN/"), so an
    // exact key can sit on a CIK that never files while the real filer is one
    // token away.
    for (const [k, list] of names) {
      if (k === key) continue;
      if (!k.startsWith(`${key} `) && !k.endsWith(` ${key}`)) continue;
      for (const cik of list) {
        const hit = filed.get(cik);
        if (hit) matches.push({ cik, hit, alias: k, exact: false });
      }
    }
  }
  const uniq = new Map<number, Match>();
  for (const m of matches) if (!uniq.has(m.cik)) uniq.set(m.cik, m);
  return [...uniq.values()].sort(
    (a, b) => Number(b.exact) - Number(a.exact) || (a.hit.filed < b.hit.filed ? 1 : -1)
  );
}

function main() {
  const filed = filedCiks();
  const names = cikNames();
  const resolved: any[] = [];
  const missing: string[] = [];

  for (const c of CANDIDATES) {
    const list = matchCandidate(c, names, filed);
    if (!list.length) {
      missing.push(`${c.name} — ${c.role}`);
      continue;
    }
    const best = list[0];
    resolved.push({
      name: c.name,
      role: c.role,
      tier: c.tier,
      cik: best.cik,
      edgarName: best.hit.name,
      lastFiled: best.hit.filed,
      accession: best.hit.accession,
      matchedAlias: best.alias,
      pinned: Boolean(c.cik),
    });
  }

  // Curated order IS the prominence order, so keep the first N that resolved.
  const kept = resolved.slice(0, KEEP);
  writeFileSync(
    "data/13f-superinvestors.raw.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "SEC EDGAR full-index (Q3 2026 + Q4 2026) + cik-lookup-data.txt",
        method:
          "Curated set of the 13F filers analysts most often read, in prominence order " +
          "(tier 1 = quoted weekly, 2 = widely tracked, 3 = value-blog canon). Every CIK " +
          "verified against a real 13F-HR in a recent filing quarter; pins used where EDGAR " +
          "name matching picks a same-named shell, RIA or foreign affiliate.",
        managers: kept,
        unresolved: missing,
      },
      null,
      1
    )
  );
  console.error(`resolved ${resolved.length}/${CANDIDATES.length}, kept ${kept.length}`);
  if (missing.length) console.error(`unresolved (${missing.length}): ${missing.join(" | ")}`);
}

main();