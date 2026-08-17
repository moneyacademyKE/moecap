import { describe, expect, test } from "bun:test";
import { collectNseResearchStatus } from "../scripts/nse-research-status";

describe("NSE research promotion gate", () => {
  test("reports canonical-period and local-PDF evidence gaps without accepting them silently", () => {
    const status = collectNseResearchStatus(process.cwd());

    expect(status.companies).toBeGreaterThan(50);
    expect(status.sourceCounts.audited).toBeGreaterThanOrEqual(17);
    expect(status.emptyFinancials).toEqual(["UCHM", "UMME", "XPRS"]);
    expect(status.missingLocalPdfs).toEqual([]);

    // These are broker-led FY2025/H1 2026 leads until a matching issuer/NSE PDF
    // is vendored. They must remain visible to the daily playbook rather than
    // silently being mistaken for primary-backed canonical facts.
    expect(status.needsPrimaryEvidence).toEqual(["COOP", "CRWN", "DTK", "IMH"]);
    expect(status.primaryBacked).toContain("SCOM");
    expect(status.primaryBacked).toContain("KCB");
  });
});
