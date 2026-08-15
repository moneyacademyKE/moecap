import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Unified Build Output Verification", () => {
  test("public/index.html is created and contains the accordion elements", () => {
    const indexPath = join(process.cwd(), "public/index.html");
    expect(existsSync(indexPath)).toBe(true);

    const htmlContent = readFileSync(indexPath, "utf-8");
    
    // Check main section headers
    expect(htmlContent).toContain("US Stock Ideas");
    expect(htmlContent).toContain("Moe Capital");
    expect(htmlContent).toContain("Market Insights & Wise Investing");
    expect(htmlContent).toContain("Alice Schroeder Interview");

    // Check categories exist
    expect(htmlContent).toContain("category-section");
    expect(htmlContent).toContain("INVESTING");
    expect(htmlContent).toContain("RESEARCH");

    // Ensure the old static metrics are removed
    expect(htmlContent).not.toContain('Mastercard $MA');
    expect(htmlContent).not.toContain('Visa $V');
  });
});
