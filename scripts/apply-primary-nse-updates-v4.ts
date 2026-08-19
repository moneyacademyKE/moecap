import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Metric = Record<string, number>;
type SourceKind = "audited" | "unaudited";
type Update = { ticker: string; period: string; unitHint: "M" | "K"; sourceKind: SourceKind; date: string; title: string; sourceFile: string; metrics: Metric };
type FinancialRecord = { metrics?: Record<string, Metric>; ratios?: Record<string, Metric>; announcements?: Array<{ date: string; title: string; file?: string }>; canonicalYear?: string; source?: "primary" | "archived"; sourceKind?: SourceKind; primaryFile?: string; unitHint?: "M" | "K" };

type NseData = { financials: Record<string, FinancialRecord> };

const dataPath = join(process.cwd(), "data", "nse-data.json");
const pdfDir = join(process.cwd(), "data", "nse-announcements");

// H1 2026 bank results (period ended 30 June 2026), discovered on the NSE
// financial-results page on 2026-08-19. Figures verified line-by-line against
// the locally vendored NSE PDFs; each issuer's existing unitHint and metric
// labels are preserved (ABSA in KES millions, others in KES thousands).
const updates: Update[] = [
  {
    ticker: "ABSA",
    period: "H1 2026",
    unitHint: "M",
    sourceKind: "unaudited",
    date: "2026-08-19",
    title: "Absa Bank Kenya Plc – Unaudited Group Results for the Period Ended 30 June 2026",
    sourceFile: "Absa-Bank-Kenya-H1-2026-Unaudited-Results.pdf",
    metrics: {
      "Net Interest Income": 21_139,
      "Total Income": 29_325,
      "Profit Before Tax": 14_151,
      "Profit after Tax": 10_532,
      "Total Assets": 558_119,
      "Total Equity": 100_686,
      EPS: 1.94,
      DPS: 0.5,
    },
  },
  {
    ticker: "EQTY",
    period: "H1 2026",
    unitHint: "K",
    sourceKind: "unaudited",
    date: "2026-08-19",
    title: "Equity Group Holdings Plc – Unaudited Financial Statements and Other Disclosures for the Period Ended 30 June 2026",
    sourceFile: "Equity-Group-H1-2026-Unaudited-Results.pdf",
    metrics: {
      "Net Interest Income": 69_276_992,
      "Non-Interest Income": 55_592_948,
      "Total Operating Income": 124_869_940,
      "Profit Before Tax": 57_752_285,
      "Profit after Tax": 45_517_825,
      "Total Assets": 2_155_547_629,
      "Total Equity": 332_014_975,
      EPS: 11.61,
    },
  },
  {
    ticker: "FMLY",
    period: "H1 2026",
    unitHint: "K",
    sourceKind: "unaudited",
    date: "2026-08-19",
    title: "Family Bank Limited – Unaudited Financial Statements and Other Disclosures for the Period Ended 30 June 2026",
    sourceFile: "Family-Bank-H1-2026-Unaudited-Results.pdf",
    metrics: {
      "Net Interest Income": 9_788_757,
      "Total Operating Income": 12_091_582,
      "Profit Before Tax": 4_667_008,
      "Profit after Tax": 3_703_767,
      "Total Assets": 238_938_872,
      "Shareholders Funds": 33_227_409,
      EPS: 2.23,
    },
  },
  {
    ticker: "SCBK",
    period: "H1 2026",
    unitHint: "K",
    sourceKind: "unaudited",
    date: "2026-08-19",
    title: "Standard Chartered Bank Kenya Ltd – Consolidated and Company Financial Statements and Disclosures for the Period Ended 30 June 2026",
    sourceFile: "Standard-Chartered-Kenya-H1-2026-Unaudited-Results.pdf",
    metrics: {
      "Net Interest Income": 12_268_042,
      "Total Operating Income": 19_348_411,
      "Profit Before Tax": 9_060_458,
      "Profit after Tax": 6_724_342,
      "Total Assets": 418_798_488,
      "Shareholders Funds": 63_713_153,
      EPS: 17.58,
      DPS: 8.5,
    },
  },
];

const data = JSON.parse(readFileSync(dataPath, "utf8")) as NseData;

for (const update of updates) {
  const dest = join(pdfDir, update.sourceFile);
  if (!existsSync(dest)) throw new Error(`Primary PDF not vendored: ${update.sourceFile}`);
  const record = data.financials[update.ticker];
  if (!record) throw new Error(`No financials record for ${update.ticker}`);
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
