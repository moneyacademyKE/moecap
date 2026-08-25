import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// 2026-08-25 unit-validation fix. The SKL FY2025 promotion stored the PDF's
// raw KES values (Revenue 351,093,966 — PDF prose: "KES 351 million in 2025")
// under unitHint "K" (KES thousands), so the terminal rendered KES 351.1B —
// 1000x off. Normalise money fields to KES thousands (÷1000); EPS stays
// absolute. Also drops the stray rounded "2025" duplicate of the same period.
type Metric = Record<string, number>;
type FinancialRecord = {
  metrics?: Record<string, Metric>;
  unitHint?: string;
  canonicalYear?: string;
};

const PER_SHARE = new Set(["EPS", "DPS", "NAV Per Share", "NAV Per Unit"]);
const dataPath = join(process.cwd(), "data", "nse-data.json");
const data = JSON.parse(readFileSync(dataPath, "utf8")) as { financials: Record<string, FinancialRecord> };
const record = data.financials.SKL;
if (!record) throw new Error("No financials record for SKL");
if (record.unitHint !== "K") throw new Error(`SKL unitHint drifted from K: ${record.unitHint}`);
if (record.metrics?.FY2025?.Revenue !== 351093966) {
  throw new Error(`SKL FY2025 Revenue drifted from expected raw value: ${record.metrics?.FY2025?.Revenue}`);
}

for (const [period, metrics] of Object.entries(record.metrics ?? {})) {
  if (period === "2025") continue; // dropped below
  for (const [key, value] of Object.entries(metrics)) {
    if (typeof value === "number" && !PER_SHARE.has(key)) metrics[key] = value / 1000;
  }
}
delete record.metrics["2025"];

writeFileSync(dataPath, JSON.stringify(data));
console.log("SKL normalised to KES thousands. FY2025:", JSON.stringify(record.metrics.FY2025));
