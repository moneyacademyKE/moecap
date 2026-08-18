import { describe, expect, test } from "bun:test";
import { collectNseResearchStatus } from "../scripts/nse-research-status";

describe("NSE research promotion gate", () => {
  test("reports canonical-period and local-PDF evidence gaps without accepting them silently", () => {
    const status = collectNseResearchStatus(process.cwd());

    expect(status.companies).toBeGreaterThan(50);
    expect(status.sourceCounts.audited).toBeGreaterThanOrEqual(17);
    expect(status.emptyFinancials).toEqual(["UCHM", "UMME", "XPRS"]);
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
