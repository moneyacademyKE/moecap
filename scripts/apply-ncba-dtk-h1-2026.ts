// Apply NCBA H1 2026 promotion, DTB H1 2026 precision upgrade (results
// announcement supersedes rounded investor-deck figures), and the Stanbic
// FY2025 total-income column fix. All figures read from locally vendored
// primary PDFs; aborts if the file changed underneath us.
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dataPath = join(root, "data", "nse-data.json");
const data = await Bun.file(dataPath).json();

const NCBA_PDF = "/nse/announcements/NCBA-Group-H1-2026-Unaudited-Financials.pdf";
const DTK_PDF = "/nse/announcements/DTB-H1-2026-Unaudited-Results.pdf";

// --- NCBA Group Plc: H1 2026 unaudited (period ended 30 June 2026) ---
// Source: NCBA-Group-H1-2026-Unaudited-Financials.pdf (issuer, Group
// Consolidated columns). No EPS is stated in the filing; omitted.
{
  const f = data.financials.NCBA;
  if (f.canonicalYear !== "FY2025") {
    throw new Error(`NCBA canonicalYear is ${f.canonicalYear}, expected FY2025 — concurrent change?`);
  }
  if (f.metrics["H1 2026"]) throw new Error("NCBA H1 2026 already present");
  f.metrics["H1 2026"] = {
    "Net Interest Income": 25099416,
    "Non-Interest Income": 15583021,
    "Net Operating Income": 40682437,
    "Profit Before Tax": 15488312,
    "Profit after Tax": 12391249,
    "Total Assets": 739399257,
    "Total Shareholders Equity": 131507851,
    "DPS": 3.75,
  };
  f.canonicalYear = "H1 2026";
  f.sourceKind = "unaudited";
  f.primaryFile = NCBA_PDF;
  f.announcements ??= [];
  f.announcements.unshift({
    date: "2026-08-05",
    title: "NCBA Group Plc – Unaudited Financial Results for the Period Ended 30 June 2026",
    file: NCBA_PDF,
  });
}

// --- DTB Kenya: replace rounded investor-deck figures with exact values
// from the unaudited results announcement (Group columns, KShs '000).
// EPS de-annualised to the six-month period (annualised 45.72 / 2),
// matching the Q1 2026 convention (annualised 45.57 -> 11.39).
// NII/NFI omitted: cell-level reads could not be reconciled cleanly.
{
  const f = data.financials.DTK;
  const prior = f.metrics["H1 2026"];
  if (!prior || prior["Profit Before Tax"] !== 9800000) {
    throw new Error(`DTK H1 2026 unexpected prior state: ${JSON.stringify(prior)}`);
  }
  f.metrics["H1 2026"] = {
    "Total Operating Income": 26514897,
    "Profit Before Tax": 9836906,
    "Profit after Tax": 7294267,
    "Profit after tax less non-controlling interests": 6391880,
    "Total Assets": 675086105,
    "Shareholders Funds": 102384913,
    "Customer Deposits": 534153949,
    "EPS": 22.86,
    "DPS": 9.0,
  };
  f.primaryFile = DTK_PDF;
  const already = (f.announcements ?? []).some((a) => a.file === DTK_PDF);
  if (!already) {
    f.announcements ??= [];
    f.announcements.unshift({
      date: "2026-08-19",
      title: "DTB Kenya – Unaudited Group and Bank Results for the Period Ended 30 June 2026",
      file: DTK_PDF,
    });
  }
}

// --- Stanbic Holdings: FY2025 total income took the FY2024 column in a
// prior promotion. Both the FY2025 filing and the H1 2026 filing's
// audited comparative state 38,510,686 (with NII 24,084,341 and
// non-interest revenue 14,426,345).
{
  const f = data.financials.SBIC;
  const fy = f.metrics["FY2025"];
  if (fy["Total Income"] === 39743682) {
    fy["Total Income"] = 38510686;
    fy["Net Interest Income"] = 24084341;
    fy["Non-Interest Income"] = 14426345;
  } else if (fy["Total Income"] !== 38510686) {
    throw new Error(`SBIC FY2025 Total Income is ${fy["Total Income"]}, expected 39743682 or 38510686`);
  }
}

await Bun.write(dataPath, JSON.stringify(data, null, 2) + "\n");
console.log("applied: NCBA H1 2026 promotion, DTK H1 2026 precision, SBIC FY2025 fix");
