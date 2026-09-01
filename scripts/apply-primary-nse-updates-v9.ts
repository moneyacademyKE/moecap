import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// H1 2026 interim promotions — 2026-09-01 research run.
// 13 primary-backed canonical updates, all unaudited NSE/issuer PDFs vendored in
// data/nse-announcements/ (source URLs recorded in the run's discovery receipts):
//   BAMB  https://www.nse.co.ke/wp-content/uploads/Bamburi-Cement-Plc-Unaudited-Group-Financial-Results-for-the-Six-Months-Ended-30-June-2026.pdf
//   BRIT  https://www.nse.co.ke/wp-content/uploads/Britam-Holdings-Plc-Unaudited-Financial-Results-for-the-Six-Months-Ended-30-June-2026.pdf
//   CIC   https://www.nse.co.ke/wp-content/uploads/CIC-Insurance-Group-Plc-Unaudited-Results-for-the-Six-Months-Period-Ended-30-June-2026.pdf
//   FTGH  https://www.nse.co.ke/wp-content/uploads/Flame-Tree-Group-Holdings-Ltd-Financial-Statements-for-the-Period-Ended-30-June-2026.pdf
//   HAFR  https://www.nse.co.ke/wp-content/uploads/Home-Afrika-Limited-–-Unaudited-Financial-Results-for-the-Period-Ended-30-June-2026.pdf
//   HFCB  https://www.nse.co.ke/wp-content/uploads/HFCB-Group-Plc-Unaudited-Financial-Statements-and-other-Disclosures-for-the-Period-Ended-30-Jun-2026.pdf
//   IMH   https://www.nse.co.ke/wp-content/uploads/IM-Group-PLC-Unaudited-Financial-Results_30-June-2026.pdf
//   JUB   https://www.nse.co.ke/wp-content/uploads/Jubilee-Holdings-Limited-Unaudited-Consolidated-Results-for-the-Half-Year-Ended-30-June-2026.pdf
//   KUKZ  https://www.nse.co.ke/wp-content/uploads/Kakuzi-Plc-Interim-Financial-Statements-for-the-Period-of-Six-Months-to-30-June-2026.pdf
//   LIMT  https://www.nse.co.ke/wp-content/uploads/Limuru-Tea-Plc-Unaudited-Results-for-the-Six-Months-Ended-30-June-2026.pdf
//   SMER  https://www.nse.co.ke/wp-content/uploads/Sameer-Africa-Plc-Unaudited-financial-results-for-the-6-months-ended-30-June-2026.pdf
//   TOTL  https://www.nse.co.ke/wp-content/uploads/Totalenergies-Marketing-Kenya-Plc-Unaudited-Financial-Statements-for-the-period-ended-30th-June-2026.pdf
//   TPSE  https://www.nse.co.ke/wp-content/uploads/TPS-Eastern-Africa-Plc-Unaudited-Financial-Results-for-the-Six-Months-Period-Ended-30-06-2026.pdf
// K = KES thousands as reported; M = KES millions as reported (BAMB).
// Held, deliberately NOT promoted (playbook gate 5 conflict stop):
//   XPRS — primary PDF contradicts itself (prose "9.8M revenue / 46M loss" vs
//     table 9,884K revenue / 242,580K profit; "shareholders' funds 714,766" vs
//     equity walk ending 714,765; balance sheet carries net liabilities).
//   BKG  — RWF cross-list, foreign-currency contract outside current renderer.
// Not promoted from BRIT p.1 prose: interest/dividend income 12.0bn, net
// insurance service result 1.8bn — narrative rounding, not statement figures.
type Metric = Record<string, number>;
type SourceKind = "audited" | "unaudited";
type Update = { ticker: string; period: string; unitHint: "M" | "K"; sourceKind: SourceKind; date: string; title: string; sourceFile: string; metrics: Metric };
type FinancialRecord = { metrics?: Record<string, Metric>; ratios?: Record<string, Metric>; announcements?: Array<{ date: string; title: string; file?: string }>; canonicalYear?: string; source?: "primary" | "archived"; sourceKind?: SourceKind; primaryFile?: string; unitHint?: "M" | "K" };

const dataPath = join(process.cwd(), "data", "nse-data.json");
const pdfDir = join(process.cwd(), "data", "nse-announcements");

const updates: Update[] = [
  ["BRIT", "H1 2026", "K", "unaudited", "Britam Holdings – Unaudited Financial Results for the Six Months Ended 30 June 2026", "Britam-Holdings-H1-2026-Unaudited-Results.pdf",
    { "Insurance Revenue": 22394630, "Profit Before Tax": 3822898, "Net Income": 2664609, "Total Assets": 270844524, "Total Equity": 37568674, EPS: 1.05 }],
  ["CIC", "H1 2026", "K", "unaudited", "CIC Insurance Group – Unaudited Results for the Six Months Period Ended 30 June 2026", "CIC-Group-H1-2026-Unaudited-Results.pdf",
    { "Insurance Revenue": 16344753, "Profit Before Tax": 1563066, "Net Income": 1087159, "Total Assets": 81684684, "Total Equity": 12395260, EPS: 0.38 }],
  ["FTGH", "H1 2026", "K", "unaudited", "Flame Tree Group – Financial Statements for the Period Ended 30 June 2026", "Flame-Tree-Group-H1-2026-Unaudited-Results.pdf",
    { Revenue: 2314930113, "Operating Income": 181029816, "Profit Before Tax": 5405161, "Net Income": 5217828, "Total Assets": 4456848045, "Total Equity": 1423909659, EPS: 0.03 }],
  ["HAFR", "H1 2026", "K", "unaudited", "Home Afrika – Unaudited Financial Results for the Period Ended 30 June 2026", "Home-Afrika-H1-2026-Unaudited-Results.pdf",
    { Revenue: 328475980, "Operating Income": 185386992, "Profit Before Tax": 184983792, "Net Income": 184983792, "Total Assets": 3748552554, "Total Equity": -846203531, EPS: 0.26 }],
  ["HFCB", "H1 2026", "K", "unaudited", "HF Group – Unaudited Financial Statements for the Period Ended 30 June 2026", "HF-Group-H1-2026-Unaudited-Results.pdf",
    { "Net Interest Income": 2702749, "Total Operating Income": 3804584, "Profit Before Tax": 1224536, "Net Income": 998326, "Total Assets": 94043260, "Total Equity": 18236600, EPS: 0.53 }],
  ["IMH", "H1 2026", "K", "unaudited", "I&M Group – Unaudited Financial Results, 30 June 2026", "IM-Group-H1-2026-Unaudited-Results.pdf",
    { "Net Interest Income": 25036298, "Total Operating Income": 33691958, "Profit Before Tax": 13463314, "Net Income": 10169812, "Total Assets": 746307916, "Total Equity": 119412481, EPS: 5.35 }],
  ["JUB", "H1 2026", "K", "unaudited", "Jubilee Holdings – Unaudited Consolidated Results for the Half Year Ended 30 June 2026", "Jubilee-Holdings-H1-2026-Unaudited-Results.pdf",
    { "Insurance Revenue": 16881673, "Profit Before Tax": 4424689, "Net Income": 3448430, "Total Assets": 272686045, "Total Equity": 58303412, EPS: 47.58, DPS: 2 }],
  ["KUKZ", "H1 2026", "K", "unaudited", "Kakuzi – Interim Financial Statements for the Period of Six Months to 30 June 2026", "Kakuzi-H1-2026-Unaudited-Results.pdf",
    { Revenue: 1117721, "Operating Income": 10422, "Profit Before Tax": 10422, "Net Income": 7110, "Total Equity": 5261548, EPS: 0.36 }],
  ["LIMT", "H1 2026", "K", "unaudited", "Limuru Tea – Unaudited Results for the Six Months Ended 30 June 2026", "Limuru-Tea-H1-2026-Unaudited-Results.pdf",
    { Revenue: 69905, "Loss Before Tax": -21140, "Net Income": -21140, "Total Assets": 127418, "Total Equity": 109167, EPS: -8.81 }],
  ["SMER", "H1 2026", "K", "unaudited", "Sameer Africa – Unaudited Financial Results for the 6 Months Ended 30 June 2026", "Sameer-Africa-H1-2026-Unaudited-Results.pdf",
    { Revenue: 205750, "Operating Income": 130090, "Profit Before Tax": 142185, "Net Income": 103885, "Total Assets": 1826006, "Total Equity": 1120542, EPS: 0.37 }],
  ["TOTL", "H1 2026", "K", "unaudited", "TotalEnergies Marketing Kenya – Unaudited Financial Statements for the Period Ended 30 June 2026", "TotalEnergies-Marketing-Kenya-H1-2026-Unaudited-Results.pdf",
    { Revenue: 84423024, "Net Revenue": 63864333, "Operating Income": 2651053, "Profit Before Tax": 2165226, "Net Income": 1334988, "Total Assets": 73575465, "Total Equity": 32832592, EPS: 2.12 }],
  ["TPSE", "H1 2026", "K", "unaudited", "TPS Eastern Africa – Unaudited Financial Results for the Six Months Period Ended 30 June 2026", "TPS-Eastern-Africa-H1-2026-Unaudited-Results.pdf",
    { Revenue: 3998103, "Loss Before Tax": -75153, "Net Income": -66378, "Total Assets": 21584468, "Total Equity": 13044394, EPS: -0.12 }],
  ["BAMB", "H1 2026", "M", "unaudited", "Bamburi Cement – Unaudited Group Financial Results for the Six Months Ended 30 June 2026", "Bamburi-Cement-H1-2026-Unaudited-Results.pdf",
    { Turnover: 13722, "Operating Income": 2049, "Profit Before Tax": 2190, "Net Income": 1373, "Total Assets": 33757, "Total Equity": 30338, EPS: 3.78 }],
].map(([ticker, period, unitHint, sourceKind, title, sourceFile, metrics]) => ({ ticker, period, unitHint, sourceKind, date: "2026-08-31", title, sourceFile, metrics } as Update));

const data = JSON.parse(readFileSync(dataPath, "utf8")) as { financials: Record<string, FinancialRecord> };
const promoted: string[] = [];

for (const update of updates) {
  if (!existsSync(join(pdfDir, update.sourceFile))) throw new Error(`Primary PDF not vendored: ${update.sourceFile}`);
  const record = data.financials[update.ticker];
  if (record?.canonicalYear === update.period) throw new Error(`${update.ticker} already at ${update.period}; refusing duplicate promotion`);

  record.metrics ??= {};
  record.ratios ??= {};
  record.ratios[update.period] ??= {};
  record.metrics[update.period] = update.metrics; // prior canonical row retained for history
  record.canonicalYear = update.period;
  record.source = "primary"; // sourceKind preserves the unaudited assurance state
  record.sourceKind = update.sourceKind;
  record.primaryFile = `/nse/announcements/${update.sourceFile}`;
  record.unitHint = update.unitHint;
  record.announcements = [
    { date: update.date, title: update.title, file: `/nse/announcements/${update.sourceFile}` },
    ...(record.announcements ?? []).filter((item) => item.title !== update.title),
  ];
  promoted.push(`${update.ticker}:${update.period}`);
}

writeFileSync(dataPath, JSON.stringify(data));
console.log(JSON.stringify({ promoted }));
