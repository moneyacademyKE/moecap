import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// 2026-08-25 research run. Tier 1 primary: NSE-listed announcement PDF
// "Centum Investment Company Plc – Audited Financial Results for the Year
// Ended 31 March 2026" (image-only sheet, vendored locally, OCR-extracted).
// Figures cross-checked against the PDF's own narrative (PAT "Kes 744
// million", total proposed dividend "Kes 521 million (Kes 0.78 per share)")
// and prior-year arithmetic (2,135,482 − 1,322,665 = 812,817 PAT FY2025).
// PBT is NOT promoted: OCR column attribution for that line is ambiguous.
// Values follow the record's existing billions scale (CIC precedent, v6).
type Metric = Record<string, number>;
type FinancialRecord = {
  metrics?: Record<string, Metric>;
  ratios?: Record<string, Metric>;
  announcements?: Array<{ date: string; title: string; file?: string }>;
  canonicalYear?: string;
  source?: "primary" | "archived";
  sourceKind?: "audited" | "unaudited";
  primaryFile?: string;
  unitHint?: string;
};

const dataPath = join(process.cwd(), "data", "nse-data.json");
const pdfDir = join(process.cwd(), "data", "nse-announcements");
const sourceFile = "Centum-FY2026-Audited-Results.pdf";
const sourcePdf = "/tmp/centum-fy2026.pdf";

const fy2026: Metric = {
  "Net Income": 0.743914,
  "Total Assets": 79.393,
  "Total Equity": 43.553,
  "NAV Per Share": 45.03,
  EPS: 2.02,
  DPS: 0.78,
};
// Comparatives stated in the same primary PDF (Group, year ended 31 Mar 2025).
const fy2025Comparative: Metric = {
  "Net Income": 0.812817,
  "Total Assets": 82.35,
  "Total Equity": 43.244,
  EPS: 2.05,
};

const data = JSON.parse(readFileSync(dataPath, "utf8")) as { financials: Record<string, FinancialRecord> };
const record = data.financials.CTUM;
if (!record) throw new Error("No financials record for CTUM");
if (record.source === "primary" && record.canonicalYear === "FY2026") {
  throw new Error("CTUM already promoted to FY2026; refusing to overwrite concurrent work");
}
if (record.unitHint !== "B") throw new Error(`CTUM unitHint drifted from B: ${record.unitHint}`);

const dest = join(pdfDir, sourceFile);
if (!existsSync(dest)) copyFileSync(sourcePdf, dest);
if (!existsSync(dest)) throw new Error(`Primary PDF not vendored: ${sourceFile}`);

record.metrics ??= {};
record.metrics.FY2026 = fy2026;
record.metrics["2025"] = fy2025Comparative;
record.ratios ??= {};
record.ratios.FY2026 ??= {};
record.canonicalYear = "FY2026";
record.source = "primary";
record.sourceKind = "audited";
record.primaryFile = `/nse/announcements/${sourceFile}`;
record.unitHint = "B";
const title = "Centum Investment Company Plc – Audited Financial Results for the Year Ended 31 March 2026";
record.announcements = [
  { date: "2026-07-30", title, file: `/nse/announcements/${sourceFile}` },
  ...(record.announcements ?? []).filter((item) => item.title !== title),
];

writeFileSync(dataPath, JSON.stringify(data));
console.log("CTUM promoted to FY2026 (audited, primary). Metrics:", JSON.stringify(fy2026));
