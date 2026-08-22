import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Metric = Record<string, number>;
type SourceKind = "audited" | "unaudited";
type Update = {
  ticker: string;
  period: string;
  unitHint: "M" | "K" | "B";
  sourceKind: SourceKind;
  date: string;
  title: string;
  sourceFile: string;
  metrics: Metric;
};
type FinancialRecord = {
  metrics?: Record<string, Metric>;
  ratios?: Record<string, Metric>;
  announcements?: Array<{ date: string; title: string; file?: string }>;
  canonicalYear?: string;
  source?: "primary" | "archived";
  sourceKind?: SourceKind;
  primaryFile?: string;
  unitHint?: "M" | "K" | "B";
};

type NseData = { financials: Record<string, FinancialRecord> };

const dataPath = join(process.cwd(), "data", "nse-data.json");
const pdfDir = join(process.cwd(), "data", "nse-announcements");

// 2026-08-22 research run. KenGen and Longhorn promoted from locally vendored
// issuer-hosted PDFs (Tier 2), figures verified line-by-line:
// - KenGen-FY2025-Audited-Results.pdf (KShs Million; Integrated Annual Report & Audited
//   Financial Statements 2025: five-year summary p.13/14, consolidated statements,
//   EPS 1.59 and DPS 0.90 stated explicitly).
// - KenGen-H1-2026-Unaudited-Results.pdf (image announcement; Vision OCR cross-checked:
//   P&L chain 7,072 + 1,532 - 1,011 = 7,593 PBT; 7,593 - 3,369 = 4,224 PAT;
//   balance 433,711 + 17,311 + 54,274 = 505,296 exact; narrative restates every column).
// - Longhorn-FY2025-Audited-Results.pdf (Kshs'000; balances exactly:
//   18,108 + 573,400 + 1,639,324 = 2,230,832).
// - Longhorn-H1-2026-Unaudited-Results.pdf (Kshs'000; balances exactly:
//   3,015 + 518,157 + 1,822,560 = 2,343,732; narrative "net loss before tax Kshs 11 Million").
// Series units preserved: KEGN millions (M), LKL billions (B).
const updates: Update[] = [
  {
    ticker: "KEGN",
    period: "FY2025",
    unitHint: "M",
    sourceKind: "audited",
    date: "2025-11-28",
    title: "KenGen – Integrated Annual Report & Audited Financial Statements, Year Ended 30 June 2025",
    sourceFile: "KenGen-FY2025-Audited-Results.pdf",
    metrics: {
      Revenue: 56_098,
      "Profit Before Tax": 15_473,
      "Net Income": 10_481,
      "Total Assets": 505_573,
      "Total Equity": 284_544,
      EPS: 1.59,
      DPS: 0.9,
    },
  },
  {
    ticker: "KEGN",
    period: "H1 2026",
    unitHint: "M",
    sourceKind: "unaudited",
    date: "2026-02-10",
    title: "KenGen – Unaudited Results for the Six Months Ended 31 December 2025",
    sourceFile: "KenGen-H1-2026-Unaudited-Results.pdf",
    metrics: {
      Revenue: 30_085,
      "Profit Before Tax": 7_593,
      "Net Income": 4_224,
      "Total Assets": 505_296,
      "Total Equity": 282_848,
      EPS: 0.64,
    },
  },
  {
    ticker: "LKL",
    period: "FY2025",
    unitHint: "B",
    sourceKind: "audited",
    date: "2025-10-23",
    title: "Longhorn Publishers – Audited Financial Results for the Year Ended 30 June 2025",
    sourceFile: "Longhorn-FY2025-Audited-Results.pdf",
    metrics: {
      Revenue: 0.67989,
      "Loss Before Tax": -0.373149,
      "Net Income": -0.261444,
      "Total Assets": 2.230832,
      "Total Equity": 0.018108,
    },
  },
  {
    ticker: "LKL",
    period: "H1 2026",
    unitHint: "B",
    sourceKind: "unaudited",
    date: "2026-02-25",
    title: "Longhorn Publishers – Unaudited Condensed Group Results for the Six-Month Period Ended 31 December 2025",
    sourceFile: "Longhorn-H1-2026-Unaudited-Results.pdf",
    metrics: {
      Revenue: 0.524178,
      "Loss Before Tax": -0.010995,
      "Net Income": -0.010995,
      "Total Assets": 2.343732,
      "Total Equity": 0.003015,
      EPS: -0.04,
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

writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(
  JSON.stringify({
    promoted: updates.map((u) => `${u.ticker}:${u.period}:${u.sourceKind}`),
  }),
);
