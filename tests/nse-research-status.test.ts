import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { collectNseResearchStatus, isCanonicalPrimarySource } from "../scripts/nse-research-status";

describe("NSE research promotion gate", () => {
  test("accepts a local unaudited primary filing when no audited filing exists for the canonical period", () => {
    expect(isCanonicalPrimarySource({
      canonicalYear: "H1 2026",
      source: "primary",
      sourceKind: "unaudited",
      primaryFile: "/nse/announcements/COOP-H1-2026.pdf",
    }, "/fixtures", () => true)).toBe(true);
  });

  test("accepts an audited primary filing and rejects archived, non-primary, or missing-PDF records", () => {
    expect(isCanonicalPrimarySource({
      canonicalYear: "FY2025",
      source: "primary",
      sourceKind: "audited",
      primaryFile: "/nse/announcements/ABSA-FY2025.pdf",
    }, "/fixtures", () => true)).toBe(true);

    expect(isCanonicalPrimarySource({
      canonicalYear: "H1 2026",
      source: "archived",
      sourceKind: "unaudited",
      primaryFile: "/nse/announcements/COOP-H1-2026.pdf",
    }, "/fixtures", () => true)).toBe(false);

    expect(isCanonicalPrimarySource({
      canonicalYear: "H1 2026",
      source: "primary",
      sourceKind: "unaudited",
      primaryFile: "/nse/announcements/COOP-H1-2026.pdf",
    }, "/fixtures", () => false)).toBe(false);
  });

  test("rejects an unaudited primary filing that is not the canonical period", () => {
    expect(isCanonicalPrimarySource({
      source: "primary",
      sourceKind: "unaudited",
      primaryFile: "/nse/announcements/COOP-H1-2026.pdf",
    }, "/fixtures", () => true)).toBe(false);

    expect(isCanonicalPrimarySource({
      canonicalYear: "FY2025",
      source: "primary",
      sourceKind: "unaudited",
      primaryFile: "/nse/announcements/COOP-FY2025.pdf",
    }, "/fixtures", () => true)).toBe(true);
  });

  test("the unaudited fallback is scoped to its own period; audited history is retained", async () => {
    const data = JSON.parse(await Bun.file(join(import.meta.dir, "..", "data", "nse-data.json")).text());
    const kcb = data.financials.KCB;
    // canonical H1 2026 has no audited filing → unaudited primary is accepted for that period only
    expect(kcb.source).toBe("primary");
    expect(kcb.sourceKind).toBe("unaudited");
    expect(kcb.canonicalYear).toBe("H1 2026");
    // the audited FY2025 filing is still retained as history for its own period
    expect(kcb.metrics["FY2025"]).toBeDefined();
    // audited canonical periods keep the audited label (SCOM: an audited FY2026
    // filing exists, so the period stays audited — unlike KCB's H1 2026)
    // ABSA/EQTY/FMLY/SCBK joined KCB in H1 2026: unaudited primary is canonical
    // for that period while their audited FY2025 history is retained below.
    for (const ticker of ["ABSA", "EQTY", "FMLY", "SCBK"]) {
      expect(data.financials[ticker].source).toBe("primary");
      expect(data.financials[ticker].sourceKind).toBe("unaudited");
      expect(data.financials[ticker].canonicalYear).toBe("H1 2026");
      expect(data.financials[ticker].metrics["FY2025"] ?? data.financials[ticker].metrics["Q1 2026"]).toBeDefined();
    }
    expect(data.financials.SCOM.sourceKind).toBe("audited");
    expect(data.financials.SCOM.canonicalYear).toBe("FY2026");
  });

  test("reports canonical-period and local-PDF evidence gaps without accepting them silently", () => {
    const status = collectNseResearchStatus(process.cwd());

    expect(status.companies).toBeGreaterThan(50);
    expect(status.sourceCounts.primary).toBeGreaterThanOrEqual(36);
    expect(status.emptyFinancials).toEqual(["UCHM", "UMME"]);
    expect(status.missingLocalPdfs).toEqual([]);

    expect(status.needsPrimaryEvidence).toEqual([]);
    expect(status.primaryBacked).toContain("COOP");
    expect(status.primaryBacked).toContain("CRWN");
    expect(status.primaryBacked).toContain("DTK");
    expect(status.primaryBacked).toContain("IMH");
    expect(status.sourceKindCounts.audited).toBeGreaterThan(10);
    expect(status.sourceKindCounts.unaudited).toBeGreaterThan(10);
  });
});
