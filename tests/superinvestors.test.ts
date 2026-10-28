import { describe, expect, test } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderSuperinvestorDirectory } from "../src/superinvestors";

function fixture(managers: unknown[]): string {
  const dir = mkdtempSync(join(tmpdir(), "si-"));
  const p = join(dir, "13f.json");
  writeFileSync(p, JSON.stringify({ managers }));
  return p;
}

const base = {
  role: "Test Manager",
  cik: "1",
  period: "Q2 2026",
  periodEnd: "2026-06-30",
  filed: "2026-08-14",
  positions: 3,
  url: "https://www.sec.gov/Archives/edgar/data/1/000/idx.htm",
  unitsScaled: false,
};

describe("renderSuperinvestorDirectory", () => {
  test("sorts by portfolio size and groups by tier", () => {
    const p = fixture([
      { ...base, name: "Small Fund", tier: 2, portfolioUsd: 5e8, holdings: [] },
      { ...base, name: "Big Fund", tier: 1, portfolioUsd: 2e11, holdings: [] },
    ]);
    const html = renderSuperinvestorDirectory(p);
    expect(html.indexOf("Big Fund")).toBeLessThan(html.indexOf("Small Fund"));
    expect(html).toContain("Most quoted by analysts (1)");
    expect(html).toContain("Widely followed (1)");
    expect(html).toContain("$200.0B");
    expect(html).toContain("$500M");
  });

  test("escapes issuer names and links covered tickers", () => {
    const p = fixture([
      {
        ...base,
        name: "Escape Co",
        tier: 1,
        portfolioUsd: 1e9,
        holdings: [
          { issuer: "STATE STR SPDR S&P 500 ETF", ticker: "", valueUsd: 6e8, weightPct: 60, shares: 10 },
          { issuer: "NVIDIA CORPORATION", ticker: "NVDA", valueUsd: 4e8, weightPct: 40, shares: 5 },
        ],
      },
    ]);
    const html = renderSuperinvestorDirectory(p);
    expect(html).toContain("STATE STR SPDR S&amp;P 500 ETF");
    expect(html).not.toContain("S&P 500 ETF</td>");
    expect(html).toContain('href="/?q=NVDA"');
    expect(html).toContain("60.0%");
  });

  test("reports the latest quarter across managers", () => {
    const p = fixture([
      { ...base, name: "A", tier: 1, portfolioUsd: 1e9, holdings: [], period: "Q1 2026" },
      { ...base, name: "B", tier: 1, portfolioUsd: 1e9, holdings: [], period: "Q3 2026" },
    ]);
    const html = renderSuperinvestorDirectory(p);
    expect(html).toMatch(/<b>Q3 2026<\/b><span>latest quarter/);
  });

  test("states the 13F caveat so figures are not read as AUM", () => {
    const p = fixture([{ ...base, name: "A", tier: 1, portfolioUsd: 1e9, holdings: [] }]);
    const html = renderSuperinvestorDirectory(p);
    expect(html).toContain("not firm AUM");
    expect(html).toContain("exclude shorts");
  });
});