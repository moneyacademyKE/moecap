// Promote DTB Kenya (DTK) H1 2026 unaudited results.
// Primary source (Tier 2, issuer-hosted IR document, vendored locally):
//   https://dtbk.dtbafrica.com/storage/uploads/57708716-7a7e-4fb3-aa8d-82bd3155b151/DTB-H1-2026-Investor-Presentation.pdf
// Figures as stated in the deck's "H1 2026 Performance (KES billion)" tables
// (six months ended 30 June 2026 vs H1 2025), converted to the record's
// KES '000 unitHint. Labels kept exactly as the source states them — the deck
// reports "Gross Operating Income" (not "Total Operating Income") and an
// explicitly "Annualised" EPS; Shareholders Funds is not stated and is not
// inferred. Cross-checked against the issuer press release of 19 Aug 2026
// (PBT KShs 9.8bn, total assets ~KShs 675bn, customer deposits ~KShs 534bn).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dataPath = join(import.meta.dir, "..", "data", "nse-data.json");
const pdfDir = join(import.meta.dir, "..", "data", "nse-announcements");

const sourceFile = "DTB-H1-2026-Investor-Presentation.pdf";
const period = "H1 2026";

const metrics = {
  "Net Interest Income": 20_000_000,
  "Total Non-Interest Income": 6_500_000,
  "Gross Operating Income": 26_500_000,
  "Profit Before Tax": 9_800_000,
  "Profit after Tax": 7_300_000,
  "Profit after tax less non-controlling interests": 6_400_000,
  "Annualised EPS": 45.72,
  "Total Assets": 675_100_000,
  "Customer Deposits": 534_200_000,
};

const ratios = {
  "ROA (%)": 2.2,
  "ROE (%)": 12.6,
};

type NseData = { financials: Record<string, any> };
const data = JSON.parse(readFileSync(dataPath, "utf8")) as NseData;

if (!existsSync(join(pdfDir, sourceFile))) throw new Error(`Primary PDF not vendored: ${sourceFile}`);
const record = data.financials["DTK"];
if (!record) throw new Error("No financials record for DTK");

record.metrics ??= {};
record.metrics[period] = metrics;
record.ratios ??= {};
record.ratios[period] = ratios;
record.canonicalYear = period;
record.source = "primary";
record.sourceKind = "unaudited";
record.primaryFile = `/nse/announcements/${sourceFile}`;
record.unitHint = "K";
const title = "DTB Kenya – H1 2026 Investor Presentation (Unaudited Half-Year Results)";
record.announcements = [
  { date: "2026-08-19", title, file: `/nse/announcements/${sourceFile}` },
  ...(record.announcements ?? []).filter((item) => item.title !== title),
];

writeFileSync(dataPath, JSON.stringify(data));
console.log(JSON.stringify({ promoted: `DTK:${period}`, metrics: Object.keys(metrics).length }));
