/**
 * NSE research gate.
 *
 * Prints the evidence coverage that a daily research run must inspect before it
 * promotes data from an NSE/issuer PDF or a broker-research lead.
 *
 * Usage: bun scripts/nse-research-status.ts [--json]
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

export type ResearchSource = "audited" | "archived" | "broker-research";

interface Announcement {
  date?: string;
  title?: string;
  file?: string;
}

interface Financials {
  canonicalYear?: string;
  metrics?: Record<string, Record<string, unknown>>;
  source?: ResearchSource;
  announcements?: Announcement[];
}

interface NseData {
  financials: Record<string, Financials>;
}

export interface NseResearchStatus {
  companies: number;
  sourceCounts: Record<string, number>;
  primaryBacked: string[];
  needsPrimaryEvidence: string[];
  emptyFinancials: string[];
  missingLocalPdfs: string[];
}

const LOCAL_PDF_PREFIX = "/nse/announcements/";

function hasLocalPrimaryPdf(financials: Financials, pdfDirectory: string): boolean {
  return (financials.announcements ?? []).some((announcement) => {
    const file = announcement.file ?? "";
    return file.startsWith(LOCAL_PDF_PREFIX) && existsSync(join(pdfDirectory, basename(file)));
  });
}

export function collectNseResearchStatus(root: string): NseResearchStatus {
  const dataPath = join(root, "data", "nse-data.json");
  const pdfDirectory = join(root, "data", "nse-announcements");
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as NseData;
  const sourceCounts: Record<string, number> = {};
  const primaryBacked: string[] = [];
  const needsPrimaryEvidence: string[] = [];
  const emptyFinancials: string[] = [];
  const missingLocalPdfs: string[] = [];

  for (const [ticker, financials] of Object.entries(data.financials)) {
    const source = financials.source ?? "missing";
    sourceCounts[source] = (sourceCounts[source] ?? 0) + 1;

    const canonicalYear = financials.canonicalYear;
    const hasMetrics = Object.keys(financials.metrics ?? {}).length > 0;
    if (hasMetrics && (!canonicalYear || !financials.metrics?.[canonicalYear])) {
      throw new Error(`invalid canonical period for ${ticker}`);
    }
    if (!hasMetrics) emptyFinancials.push(ticker);

    for (const announcement of financials.announcements ?? []) {
      const file = announcement.file ?? "";
      if (file.startsWith(LOCAL_PDF_PREFIX) && !existsSync(join(pdfDirectory, basename(file)))) {
        missingLocalPdfs.push(`${ticker}:${file}`);
      }
    }

    if (source === "audited") {
      if (hasLocalPrimaryPdf(financials, pdfDirectory)) primaryBacked.push(ticker);
      else needsPrimaryEvidence.push(ticker);
    }
  }

  return {
    companies: Object.keys(data.financials).length,
    sourceCounts,
    primaryBacked: primaryBacked.sort(),
    needsPrimaryEvidence: needsPrimaryEvidence.sort(),
    emptyFinancials: emptyFinancials.sort(),
    missingLocalPdfs: missingLocalPdfs.sort(),
  };
}

if (import.meta.main) {
  const status = collectNseResearchStatus(process.cwd());
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(`companies: ${status.companies}`);
    console.log(`sources: ${JSON.stringify(status.sourceCounts)}`);
    console.log(`primary-backed: ${status.primaryBacked.length}`);
    console.log(`needs-primary-evidence: ${status.needsPrimaryEvidence.join(", ") || "none"}`);
    console.log(`empty-financials: ${status.emptyFinancials.join(", ") || "none"}`);
    console.log(`missing-local-pdfs: ${status.missingLocalPdfs.join(", ") || "none"}`);
  }

  if (status.missingLocalPdfs.length) {
    process.exitCode = 1;
  }
}
