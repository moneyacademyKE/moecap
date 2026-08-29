import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// NSE Plc H1 2026 promotion — sole primary-backed change of the 2026-08-29 research run.
// Source (Tier 1, NSE-hosted, vendored): data/nse-announcements/NSE-PLC-H1-2026-Unaudited-Results.pdf
//   "Nairobi Securities Exchange Plc - Unaudited Financial Statements for the 6 months ended 30 June 2026"
//   Board-approved 27 August 2026 (stated in the filing's publication note).
//   https://www.nse.co.ke/wp-content/uploads/Nairobi-Securities-Exchange-Plc-Unaudited-Financial-Statements-for-the-6-months-ended-30-June-2026.pdf
// Figures from the summary consolidated statements, KES '000 converted to KES millions (1dp):
//   Total income 1,210,292 -> 1210.3   (Revenue label mirrored from the FY2025 row)
//   Profit before tax 1,006,343 -> 1006.3
//   Profit after tax 736,872 -> 736.9
//   Total assets (30 Jun 2026) 3,622,160 -> 3622.2
//   Total equity 2,870,943 -> 2870.9
//   EPS basic & diluted 2.82 -> 2.82 (per-share, unscaled)
// Cross-checks that gate this promotion:
//   - PBT 1,006,343 - tax 269,471 = PAT 736,872 (H1 2026 column internally consistent)
//   - Total income 1,210,292 - expenses 309,748 + ECL/MtM (30,769) + associate 136,568 = PBT
//   - FY2025 audited columns in the same PDF match the existing canonical FY2025 row exactly
//     (income 1,089,153 / PBT 364,084 / PAT 272,298 / assets 2,762,060 / equity 2,459,145 / EPS 1.04)
//   - Narrative highlights: PAT "Kshs. 736.9 million", equity levy "770.5 million" — consistent
// No interim dividend declared for H1 2026, so no DPS field.
// Deliberately NOT promoted: segment levies (equity 770,517 / bond 187,293 / data 75,221) —
//   revenue-component lines, not canonical headline metrics.
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

const sourceFile = "NSE-PLC-H1-2026-Unaudited-Results.pdf";
const metrics: Metric = {
  Revenue: 1210.3,
  "Total Income": 1210.3,
  "Profit Before Tax": 1006.3,
  "Net Income": 736.9,
  "Total Assets": 3622.2,
  "Total Equity": 2870.9,
  EPS: 2.82,
};

const data = JSON.parse(readFileSync(dataPath, "utf8")) as { financials: Record<string, FinancialRecord> };
if (!existsSync(join(pdfDir, sourceFile))) throw new Error(`Primary PDF not vendored: ${sourceFile}`);
const record = data.financials.NSE;
if (!record) throw new Error("No financials record for NSE");
if (record.canonicalYear === "H1 2026") throw new Error("NSE already at H1 2026; refusing duplicate promotion");

// FY2025 audited row retained for history; H1 2026 becomes canonical (newest available period).
record.metrics ??= {};
record.metrics["H1 2026"] = metrics;
record.canonicalYear = "H1 2026";
record.source = "primary";
record.sourceKind = "unaudited";
record.primaryFile = `/nse/announcements/${sourceFile}`;
record.unitHint = "M";
const title = "Nairobi Securities Exchange Plc – Unaudited Financial Statements for the Six Months Ended 30 June 2026";
record.announcements = [
  { date: "2026-08-27", title, file: `/nse/announcements/${sourceFile}` },
  ...(record.announcements ?? []).filter((item) => item.title !== title),
];

writeFileSync(dataPath, JSON.stringify(data));
console.log(JSON.stringify({ promoted: ["NSE:H1 2026"], metrics }));
