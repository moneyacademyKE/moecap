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
    expect(htmlContent).toContain("function nseRevenueFor(row)");
    // Client-side metric helper aliases are emitted from the source module.
    expect(htmlContent).toContain("Total Revenue");
    expect(htmlContent).toContain("Profit for the Year");
    expect(htmlContent).toContain("Total Shareholders Equity");
    expect(htmlContent).toContain("function nseCalculateNetMargin(row, ratios = {})");
    expect(htmlContent).toContain("function nseCalculateAssetTurnover(row, ratios = {})");
    expect(htmlContent).toContain('const rev = nseRevenueFor(latestMetrics);');

    // Real-Time Price Updater elements and functions
    expect(htmlContent).toContain('id="detail-price-live-badge"');
    expect(htmlContent).toContain('id="card-price-BAT"');
    expect(htmlContent).toContain('id="card-price-SCOM"');
    expect(htmlContent).toContain("async function syncPricesRealtime()");
    expect(htmlContent).toContain("function updateDirectoryPrices()");
    expect(htmlContent).toContain("setInterval(syncPricesRealtime, 60000)");
  });

  test("Tier 2: plain-English layer renders (chips, toggle, grouping, blurbs)", () => {
    const htmlContent = readFileSync(join(PUBLIC_DIR, "nse/index.html"), "utf-8");

    // Plain summary + verdict chips + ROE sentence
    expect(htmlContent).toContain('id="plain-summary"');
    expect(htmlContent).toContain('id="verdict-chips"');
    expect(htmlContent).toContain('id="plain-roe"');
    expect(htmlContent).toContain("function renderVerdictChips");
    expect(htmlContent).toContain("function renderPlainRoe");
    expect(htmlContent).toContain("function renderPlainPerformance");
    expect(htmlContent).toContain('id="plain-performance"');
    expect(htmlContent).toContain("function findNetIncome");

    // Simple/Expert toggle defaults Simple
    expect(htmlContent).toContain("function setMode(mode)");
    expect(htmlContent).toContain("setMode(localStorage.getItem('nse-mode') || 'simple')");
    expect(htmlContent).toContain("body.nse-simple .expert-only { display: none; }");

    // Sector-grouped directory + Start here row
    expect(htmlContent).toContain("★ Start here");
    expect(htmlContent).toContain('class="sector-label"');
    expect(htmlContent).toContain("data-sector-group=");

    // Sector-median ROE context
    expect(htmlContent).toContain("function computeSectorMedians()");
    expect(htmlContent).toContain('id="stat-roe-context"');

    // Blurbs + startHere in the data copy
    const copied = JSON.parse(readFileSync(join(PUBLIC_DIR, "nse/nse-data.json"), "utf-8")) as NSEData & { startHere?: string[] };
    expect(copied.startHere).toEqual(["SCOM", "KCB", "EABL", "EQTY"]);
    const scom = copied.companies.find((c) => c.ticker === "SCOM");
    expect(scom?.blurb).toBeTruthy();
  });

  test("Tier 3: prices come from the worker, not a per-visitor proxy scrape", () => {
    const htmlContent = readFileSync(join(PUBLIC_DIR, "nse/index.html"), "utf-8");

    // Worker-backed sync + honest as-of labelling
    expect(htmlContent).toContain("moecap-prices.iamkingori.workers.dev/nse");
    expect(htmlContent).toContain('id="prices-asof"');
    expect(htmlContent).toContain("function updatePricesAsOf()");

    // The CORS-proxy scrape is dead — these must never come back
    expect(htmlContent).not.toContain("allorigins");
    expect(htmlContent).not.toContain("kwayisi");
  });

  test("Announcements: live nse.co.ke PDF links, legacy rows stay local", () => {
    const htmlContent = readFileSync(join(PUBLIC_DIR, "nse/index.html"), "utf-8");
    expect(htmlContent).not.toContain("criticalinsight");
    // live-link renderer contract: self-hosted /nse/announcements/ paths become anchors
    expect(htmlContent).toContain('f.startsWith("http") || f.startsWith("/nse/announcements/")');
    expect(htmlContent).toContain("nse.co.ke listed-company announcements");
    // per-share metrics must never be KES-formatted
    expect(htmlContent).toMatch(/ratioFields = new Set\(\[[^\]]*"EPS", "DPS"/);
  });
});

// --- Data provenance tags (audited vs archived) ---
describe("NSE data provenance", () => {
    test("every financials entry carries a source tag", async () => {
        const data = JSON.parse(await Bun.file(join(import.meta.dir, "..", "data", "nse-data.json")).text());
        const entries = Object.entries<any>(data.financials);
        expect(entries.length).toBeGreaterThan(50);
        const audited: string[] = [];
        for (const [t, f] of entries) {
            expect(["audited", "archived"]).toContain(f.source);
            if (f.source === "audited") audited.push(t);
        }
        expect(audited).toContain("SCOM"); // fact-checked round
        expect(audited).toContain("KCB"); // AIB-AXYS FY2025 round
        expect(audited).toContain("CRWN"); // H1 2026 from NSE PLC announcement
        expect(audited.length).toBeGreaterThanOrEqual(6);
    });

    test("canonical audited records point to their vendored primary PDF", async () => {
        const data = JSON.parse(await Bun.file(join(import.meta.dir, "..", "data", "nse-data.json")).text());
        const required = ["ABSA", "BAT", "EQTY", "HAFR", "LIMT", "NCBA", "SCOM", "SKL"];

        for (const ticker of required) {
            const financials = data.financials[ticker];
            expect(financials.source).toBe("audited");
            expect(financials.sourceKind).toBe("audited");
            expect(financials.primaryFile).toStartWith("/nse/announcements/");
            expect(existsSync(join(
                BASE_PATH,
                "data",
                "nse-announcements",
                financials.primaryFile.replace("/nse/announcements/", ""),
            ))).toBe(true);
            expect(financials.metrics[financials.canonicalYear]).toBeDefined();
        }
    });

    test("renderer emits the provenance line", () => {
        const html = readFileSync(join(import.meta.dir, "..", "public", "nse", "index.html"), "utf8");
        expect(html).toContain('id="data-source-line"');
        expect(html).toContain("archived extract");
        expect(html).toContain("audited primary filing");
        expect(html).toContain("unaudited primary filing");
        expect(html).toContain("USD figures");
    });
});
