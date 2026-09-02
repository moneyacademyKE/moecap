// Promote TransCentury (TCL) FY2024 audited results from the NSE-hosted PDF.
// Evidence: https://www.nse.co.ke/wp-content/uploads/TransCentury-Plc-Audited-Financial-Results-for-the-Year-Ended-31-Dec-2024.pdf
// Summary FS derived from audited FS, unqualified opinion (RSM Eastern Africa LLP, 27 May 2025).
// Units: KShs'000 as reported -> unitHint "K". FY2023 comparatives cross-checked
// against TransCentury-2023-Full-Year-Results.pdf (exact match on every line).
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "data/nse-data.json";
const PDF = "/nse/announcements/TransCentury-FY2024-Audited-Results.pdf";

const data = JSON.parse(readFileSync(FILE, "utf8"));
const tcl = data.financials.TCL;

tcl.metrics["FY2024"] = {
  Revenue: 6697264,
  "Profit Before Tax": 608393,
  "Net Income": 579959,
  "Total Assets": 10767076,
  "Total Equity": -12919945,
  EPS: 0.53,
};
tcl.metrics["FY2023"] = {
  Revenue: 6571307,
  "Profit Before Tax": -3203465,
  "Net Income": -3231212,
  "Total Assets": 13367378,
  "Total Equity": -15102450,
  EPS: -2.73,
};
tcl.ratios["FY2024"] = {};
tcl.ratios["FY2023"] = {};

tcl.announcements = [
  {
    date: "2025-05-28",
    title:
      "TransCentury Plc – Audited Financial Results for the Year Ended 31-Dec-2024",
    file: PDF,
  },
  ...tcl.announcements,
];

tcl.canonicalYear = "FY2024";
tcl.source = "primary";
tcl.sourceKind = "audited";
tcl.primaryFile = PDF;
tcl.unitHint = "K";

writeFileSync(FILE, JSON.stringify(data));
console.log(
  "TCL promoted:",
  tcl.canonicalYear,
  tcl.source,
  tcl.sourceKind,
  Object.keys(tcl.metrics["FY2024"]).join(",")
);
