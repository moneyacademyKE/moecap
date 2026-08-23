import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// BAT Kenya H1 2026 promotion — sole primary-backed change of the 2026-08-23 research run.
// Source (Tier 2, issuer-hosted, vendored): data/nse-announcements/BAT-Kenya-H1-2026-Unaudited-Results.pdf
//   "BAT Kenya Delivers Resilient Results (Unaudited) for the Six Months Ended 30 June 2026"
//   Issued Nairobi, 24 July 2026. https://www.batkenya.com (issuer newsroom).
// Figures verbatim from the press release, KES billions converted to KES millions:
//   Net revenue "KShs 12.3 billion" -> 12300
//   Operating profit "KShs 4.3 billion" -> 4300 (terminal label: Operating Income)
//   Profit before tax "KShs 4.4 billion" -> 4400
//   Interim dividend "KShs 10.00 per share" -> 10 (DPS)
// Deliberately NOT promoted (absent from the primary PDF; press-reported figures are Tier 4 leads):
//   Profit after Tax (~3.08bn), EPS (~30.8), gross revenue (18.9bn) — await the CMA/NSE-filed
//   results announcement with the financials table.
type Metric = Record<string, number>;
type FinancialRecord = {
  metrics?: Record<string, Metric>;
  announcements?: Array<{ date: string; title: string; file?: string }>;
  canonicalYear?: string;
  source?: "primary" | "archived";
  sourceKind?: "audited" | "unaudited";
  primaryFile?: string;
  unitHint?: "M" | "K";
};

const dataPath = join(process.cwd(), "data", "nse-data.json");
const pdfDir = join(process.cwd(), "data", "nse-announcements");

const sourceFile = "BAT-Kenya-H1-2026-Unaudited-Results.pdf";
const metrics: Metric = {
  "Net Revenue": 12_300,
  "Operating Income": 4_300,
  "Profit Before Tax": 4_400,
  DPS: 10,
};

const data = JSON.parse(readFileSync(dataPath, "utf8")) as { financials: Record<string, FinancialRecord> };
if (!existsSync(join(pdfDir, sourceFile))) throw new Error(`Primary PDF not vendored: ${sourceFile}`);
const record = data.financials.BAT;
if (!record) throw new Error("No financials record for BAT");
if (record.canonicalYear === "H1 2026") throw new Error("BAT already at H1 2026; refusing duplicate promotion");

record.metrics ??= {};
record.metrics["H1 2026"] = metrics; // FY2025 audited row retained for history
record.canonicalYear = "H1 2026";
record.source = "primary";
record.sourceKind = "unaudited";
record.primaryFile = `/nse/announcements/${sourceFile}`;
record.unitHint = "M";
const title = "BAT Kenya – Half Year (Unaudited) Results for the Six Months Ended 30 June 2026";
record.announcements = [
  { date: "2026-07-24", title, file: `/nse/announcements/${sourceFile}` },
  ...(record.announcements ?? []).filter((item) => item.title !== title),
];

writeFileSync(dataPath, JSON.stringify(data));
console.log(JSON.stringify({ promoted: ["BAT:H1 2026"], metrics }));
