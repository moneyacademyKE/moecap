import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Metric = Record<string, number>;
type SourceKind = "audited" | "unaudited";
type Update = { ticker: string; period: string; unitHint: "M" | "B"; sourceKind: SourceKind; date: string; title: string; sourceFile: string; metrics: Metric };
type FinancialRecord = { metrics?: Record<string, Metric>; ratios?: Record<string, Metric>; announcements?: Array<{ date: string; title: string; file?: string }>; canonicalYear?: string; source?: "primary" | "archived"; sourceKind?: SourceKind; primaryFile?: string; unitHint?: string };

type NseData = { financials: Record<string, FinancialRecord> };

const dataPath = join(process.cwd(), "data", "nse-data.json");
const pdfDir = join(process.cwd(), "data", "nse-announcements");

// Remediation-queue promotions from 2026-08-21 research run. Both are Tier 2
// issuer-domain PDFs vendored locally; figures transcribed line-by-line from
// the PDF text layers (CIC abridged ad; UNGA full-year results announcement).
// Values are stored in each record's existing unitHint scale (CIC billions,
// UNGA millions); EPS/DPS absolute. Historical periods are retained untouched.
const updates: Update[] = [
  {
    ticker: "CIC",
    period: "FY2025",
    unitHint: "B",
    sourceKind: "audited",
    date: "2026-03-30",
    title: "CIC Insurance Group Plc – Audited Results for the Year Ended 31st December 2025",
    sourceFile: "CIC-Group-FY2025-Audited-Results.pdf",
    metrics: {
      Revenue: 29.45784,
      "Profit Before Tax": 1.250433,
      "Net Income": 0.513821,
      "Total Assets": 73.747539,
      "Total Equity": 11.845326,
      EPS: 0.21,
      DPS: 0.13,
    },
  },
  {
    ticker: "UNGA",
    period: "FY2025",
    unitHint: "M",
    sourceKind: "audited",
    date: "2025-09-25",
    title: "Unga Group Plc – Audited Financial Results for the Year Ended 30 June 2025",
    sourceFile: "Unga-Group-FY2025-Audited-Results.pdf",
    metrics: {
      Revenue: 26130.964,
      "Profit Before Tax": 340.815,
      "Net Income": 222.055,
      "Total Assets": 11082.659,
      "Total Equity": 5333.642,
      EPS: 1.73,
      DPS: 0,
    },
  },
];

const data = JSON.parse(readFileSync(dataPath, "utf8")) as NseData;

for (const update of updates) {
  const dest = join(pdfDir, update.sourceFile);
  if (!existsSync(dest)) throw new Error(`Primary PDF not vendored: ${update.sourceFile}`);
  const record = data.financials[update.ticker];
  if (!record) throw new Error(`No financials record for ${update.ticker}`);
  if (record.source === "primary" && record.canonicalYear === update.period) {
    throw new Error(`${update.ticker} already promoted to ${update.period}; refusing to overwrite concurrent work`);
  }
  record.metrics ??= {};
  record.metrics[update.period] = update.metrics;
  record.ratios ??= {};
  record.ratios[update.period] ??= {};
  record.canonicalYear = update.period;
  record.source = "primary";
  record.sourceKind = update.sourceKind;
  record.primaryFile = `/nse/announcements/${update.sourceFile}`;
  record.unitHint = update.unitHint;
  record.announcements = [
    { date: update.date, title: update.title, file: `/nse/announcements/${update.sourceFile}` },
    ...(record.announcements ?? []).filter((item) => item.title !== update.title),
  ];
  data.financials[update.ticker] = record;
}

writeFileSync(dataPath, JSON.stringify(data));
console.log(JSON.stringify({ promoted: updates.map((u) => `${u.ticker}:${u.period}`) }));
