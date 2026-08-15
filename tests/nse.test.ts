import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildNsePage, type NSEData } from "../src/nse";

const BASE_PATH = process.cwd();
const PUBLIC_DIR = join(BASE_PATH, "public");

describe("Nairobi Securities Exchange (NSE) ROIC Terminal Tests", () => {
  test("Database exists and conforms to NSEData schema", () => {
    const dbPath = join(BASE_PATH, "data/nse-data.json");
    expect(existsSync(dbPath)).toBe(true);

    const rawData = JSON.parse(readFileSync(dbPath, "utf-8")) as NSEData;
    expect(rawData.companies).toBeDefined();
    expect(Array.isArray(rawData.companies)).toBe(true);
    expect(rawData.companies.length).toBeGreaterThan(0);

    // Verify company format
    const sampleCompany = rawData.companies[0];
    expect(sampleCompany.ticker).toBeDefined();
    expect(sampleCompany.name).toBeDefined();
    expect(sampleCompany.sector).toBeDefined();

    // Verify financials mapping
    expect(rawData.financials).toBeDefined();
    expect(typeof rawData.financials).toBe("object");

    // BAT should have metrics and ratios
    const batFin = rawData.financials["BAT"];
    expect(batFin).toBeDefined();
    expect(batFin.metrics).toBeDefined();
    expect(typeof batFin.metrics).toBe("object");
  });

  test("buildNsePage compiles and outputs static terminal files", () => {
    // Execute build
    buildNsePage(PUBLIC_DIR);

    const indexPath = join(PUBLIC_DIR, "nse/index.html");
    const jsonPath = join(PUBLIC_DIR, "nse/nse-data.json");

    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(jsonPath)).toBe(true);

    // Check raw JSON copy validity
    const copiedData = JSON.parse(readFileSync(jsonPath, "utf-8")) as NSEData;
    expect(copiedData.companies.length).toBeGreaterThan(0);

    // Check compiled HTML contents
    const htmlContent = readFileSync(indexPath, "utf-8");
    
    // Core Layout Elements
    expect(htmlContent).toContain("<h1>KENYA-ROIC</h1>");
    expect(htmlContent).toContain('id="nse-search"');
    expect(htmlContent).toContain('id="directory-list"');
    expect(htmlContent).toContain('id="active-workspace"');
    expect(htmlContent).toContain('id="workspace-empty-state"');
    expect(htmlContent).toContain('id="workspace-detail-content"');

    // Pre-rendered Stock Directory Cards
    expect(htmlContent).toContain('data-ticker="BAT"');
    expect(htmlContent).toContain('data-ticker="SCOM"');
    expect(htmlContent).toContain('data-ticker="EQTY"');
    expect(htmlContent).toContain('data-ticker="KCB"');
    expect(htmlContent).toContain('data-ticker="ABSA"');

    // Tab buttons
    expect(htmlContent).toContain("switchTab('financials')");
    expect(htmlContent).toContain("switchTab('ratios')");
    expect(htmlContent).toContain("switchTab('insights')");
    expect(htmlContent).toContain("switchTab('announcements')");

    // Client-side Interactive Functions
    expect(htmlContent).toContain("function selectStock(ticker)");
    expect(htmlContent).toContain("function switchTab(tabId)");
    expect(htmlContent).toContain("function filterDirectory()");
    expect(htmlContent).toContain("function calculateROIC(metrics)");
    expect(htmlContent).toContain("function calculateROE(metrics, ratios)");

    // Real-Time Price Updater elements and functions
    expect(htmlContent).toContain('id="detail-price-live-badge"');
    expect(htmlContent).toContain('id="card-price-BAT"');
    expect(htmlContent).toContain('id="card-price-SCOM"');
    expect(htmlContent).toContain("async function syncPricesRealtime()");
    expect(htmlContent).toContain("function updateDirectoryPrices()");
    expect(htmlContent).toContain("setInterval(syncPricesRealtime, 60000)");
  });
});
