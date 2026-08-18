import { writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  blurb?: string;
}

export interface CompanyFinancials {
  name: string;
  sector: string;
  metrics: Record<string, Record<string, number>>;
  ratios: Record<string, Record<string, number>>;
  announcements?: Array<{ date: string; title: string; file: string }>;
  insights?: Array<{ category: string; content: string; source: string; date: string }>;
  canonicalYear?: string;
  source?: "primary" | "archived";
  sourceKind?: "audited" | "unaudited";
  primaryFile?: string;
  unitHint?: "M" | "K";
  currency?: "USD";
}

export interface MarketData {
  prices: Record<string, number>;
  lastUpdated: string;
}

export interface NSEData {
  companies: Company[];
  financials: Record<string, CompanyFinancials>;
  market?: MarketData;
}

export function buildNsePage(publicDir: string) {
  console.log("📈 Compiling NSE ROIC Terminal page...");

  const baseDir = process.cwd();
  const nseDataPath = join(baseDir, "data/nse-data.json");
  
  if (!existsSync(nseDataPath)) {
    throw new Error(`Missing NSE database at: ${nseDataPath}`);
  }

  // Load and parse NSE database
  const rawData = require(nseDataPath) as NSEData;
  const companies = [...rawData.companies].sort((a, b) => a.ticker.localeCompare(b.ticker));
  const metricHelpers = readFileSync(join(baseDir, "src", "nse-metrics.client.js"), "utf8");
  
  // Ensure nse output dir exists
  const nseOutputDir = join(publicDir, "nse");
  if (!existsSync(nseOutputDir)) {
    mkdirSync(nseOutputDir, { recursive: true });
  }

  // Copy raw JSON to nse directory for client-side fetches
  copyFileSync(nseDataPath, join(nseOutputDir, "nse-data.json"));
  console.log(`📂 Copied database to: ${join(nseOutputDir, "nse-data.json")}`);

  // Generate Stock Items HTML — grouped by sector, "Start here" pinned on top
  const bySector = new Map<string, typeof companies>();
  for (const c of companies) {
    const list = bySector.get(c.sector) || [];
    list.push(c);
    bySector.set(c.sector, list);
  }
  const cardHtml = (c: (typeof companies)[number]) => {
    const price = rawData.market?.prices[c.ticker];
    const priceStr = price !== undefined ? `KES ${price.toFixed(2)}` : "—";
    const hasFin = rawData.financials[c.ticker] ? "true" : "false";

    return `
      <div 
        class="stock-item-card" 
        data-ticker="${c.ticker}" 
        data-name="${c.name.toLowerCase()}" 
        data-sector="${c.sector.toLowerCase()}"
        data-has-financials="${hasFin}"
        onclick="selectStock('${c.ticker}')"
      >
        <div class="stock-card-row">
          <span class="stock-card-ticker">${c.ticker}</span>
          <span class="stock-card-price" id="card-price-${c.ticker}">${priceStr}</span>
        </div>
        <div class="stock-card-name">${c.name}</div>
        <div class="stock-card-sector">${c.sector}</div>
      </div>
    `;
  };
  const startSet = new Set((rawData as NSEData & { startHere?: string[] }).startHere || []);
  const startHereCards = companies.filter(c => startSet.has(c.ticker)).map(cardHtml).join("\n");
  const sectorGroups = [...bySector.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([sector, list]) => `
      <div class="sector-group" data-sector-group="${sector.toLowerCase()}">
        <div class="sector-label">${sector}</div>
        ${list.map(cardHtml).join("\n")}
      </div>
    `)
    .join("\n");
  const stockItemsHtml = `
      <div class="sector-group start-here-group">
        <div class="sector-label start-here-label">★ Start here</div>
        ${startHereCards}
      </div>
      ${sectorGroups}
  `;

  // Construct complete single page HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Moe Capital | NSE ROIC Financial Terminal</title>
    <style>
        :root {
            --bg: hsl(205, 45%, 8%);
            --surface: hsl(205, 40%, 12%);
            --surface-hover: hsl(205, 38%, 15%);
            --accent: hsl(45, 100%, 55%);
            --link: hsl(150, 60%, 65%);
            --text: hsl(205, 10%, 88%);
            --text-secondary: hsl(205, 15%, 65%);
            --meta: hsl(205, 20%, 60%);
            --border: hsl(205, 30%, 20%);
            --bg-code: hsl(205, 35%, 15%);
            --shadow: rgba(0, 0, 0, 0.4);
            --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (prefers-color-scheme: light) {
            :root {
                --bg: hsl(205, 30%, 97%);
                --surface: hsl(0, 0%, 100%);
                --surface-hover: hsl(205, 20%, 94%);
                --accent: hsl(205, 80%, 35%);
                --link: hsl(355, 60%, 45%);
                --text: hsl(205, 40%, 15%);
                --text-secondary: hsl(205, 15%, 45%);
                --meta: hsl(205, 15%, 45%);
                --border: hsl(205, 20%, 85%);
                --bg-code: hsl(205, 25%, 92%);
                --shadow: rgba(0, 0, 0, 0.05);
            }
        }

        * { box-sizing: border-box; }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', ui-monospace, monospace;
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: background 0.3s ease;
        }

        main {
            width: 100%;
            max-width: 1200px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }

        header {
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 1.5rem;
        }

        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
        }

        h1 {
            color: var(--accent);
            margin: 0;
            font-size: 1.8rem;
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        h1::before { content: '# '; opacity: 0.5; }

        .tagline {
            color: var(--meta);
            margin: 0.25rem 0 0 0;
            font-size: 0.85rem;
        }

        .back-btn {
            text-decoration: none;
            color: var(--meta);
            font-size: 0.8rem;
            font-weight: bold;
            border: 1px solid var(--border);
            padding: 0.5rem 1rem;
            border-radius: 4px;
            background: var(--bg-code);
            transition: var(--transition);
        }

        .back-btn:hover {
            color: var(--bg);
            background: var(--accent);
            border-color: var(--accent);
            box-shadow: 0 4px 15px rgba(255, 220, 9, 0.15);
            transform: translateY(-1px);
        }

        /* Dual-pane terminal layout */
        .terminal-layout {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 2rem;
            flex-grow: 1;
            align-items: stretch;
        }

        /* Left directory column */
        .directory-pane {
            display: flex;
            flex-direction: column;
            max-height: calc(100vh - 200px);
        }

        .search-box {
            width: 100%;
            padding: 0.8rem 1rem;
            background: var(--bg-code);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--accent);
            font-family: inherit;
            font-size: 0.85rem;
            outline: none;
            transition: var(--transition);
            margin-bottom: 1rem;
        }

        .search-box:focus {
            border-color: var(--accent);
            box-shadow: 0 0 10px rgba(255, 220, 9, 0.15);
        }

        .stock-directory-list {
            flex-grow: 1;
            overflow-y: auto;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 0.5rem;
            background: var(--surface);
            box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Stock Cards */
        /* Tier 2: plain-english + grouping additions */
        .sector-group { margin-bottom: 0.4rem; }
        .sector-label {
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--meta);
            padding: 0.6rem 0.75rem 0.25rem;
            border-top: 1px solid var(--border);
        }
        .start-here-label {
            color: var(--accent);
            border-top: none;
            font-weight: bold;
        }
        .prices-asof-line {
            font-size: 0.68rem;
            color: var(--meta);
            padding: 0.35rem 0.1rem 0.5rem;
            border-bottom: 1px solid var(--border);
        }
        #prices-live-badge {
            color: #4ade80;
            border: 1px solid #4ade80;
            border-radius: 4px;
            padding: 0 4px;
            font-size: 0.58rem;
            font-weight: bold;
            margin-left: 0.4rem;
        }
        .stock-blurb {
            margin: 0.5rem 0 0 0;
            font-size: 0.85rem;
            color: var(--text-secondary);
            max-width: 46rem;
        }
        .mode-toggle { display: flex; gap: 0.35rem; justify-content: flex-end; margin-top: 0.5rem; }
        .mode-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--meta);
            font-family: inherit;
            font-size: 0.6rem;
            letter-spacing: 0.1em;
            padding: 3px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        .mode-btn.active { color: var(--accent); border-color: var(--accent); }
        .plain-summary {
            border: 1px dashed var(--border);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            margin: 0.75rem 0;
        }
        .verdict-chip {
            display: inline-block;
            font-size: 0.72rem;
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 2px 10px;
            margin: 0 0.35rem 0.35rem 0;
        }
        .chip-good { color: #4ade80; border-color: #4ade80; }
        .chip-bad { color: #f87171; border-color: #f87171; }
        .chip-neutral { color: var(--meta); }
        body.nse-simple .expert-only { display: none; }
        body.nse-expert .plain-only { display: none; }

        .stock-item-card {
            padding: 0.9rem 1rem;
            border-bottom: 1px solid var(--border);
            cursor: pointer;
            transition: var(--transition);
            border-radius: 4px;
            margin-bottom: 0.4rem;
        }

        .stock-item-card:last-child {
            border-bottom: none;
        }

        .stock-item-card:hover {
            background: var(--surface-hover);
            border-color: var(--accent);
        }

        .stock-item-card.active {
            background: var(--bg-code);
            border: 1px solid var(--accent);
            box-shadow: 0 2px 10px rgba(255, 220, 9, 0.05);
        }

        .stock-card-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .stock-card-ticker {
            font-weight: 700;
            color: var(--text);
            font-size: 0.95rem;
        }

        .stock-item-card.active .stock-card-ticker {
            color: var(--accent);
        }

        .stock-card-price {
            color: var(--link);
            font-weight: 500;
            font-size: 0.85rem;
        }

        .stock-card-name {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 0.2rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .stock-card-sector {
            font-size: 0.7rem;
            color: var(--meta);
            opacity: 0.8;
            margin-top: 0.1rem;
        }

        /* Right Workspace Column */
        .workspace-pane {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--surface);
            padding: 2rem;
            box-shadow: 0 4px 20px var(--shadow);
            overflow-y: auto;
            max-height: calc(100vh - 200px);
        }

        /* Workspace Empty State */
        .empty-workspace {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            height: 100%;
            min-height: 400px;
            color: var(--meta);
        }

        .terminal-artwork {
            font-size: 3.5rem;
            margin-bottom: 1.5rem;
            opacity: 0.4;
            animation: pulse 3s infinite ease-in-out;
        }

        @keyframes pulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { opacity: 0.3; }
        }

        .empty-title {
            font-size: 0.9rem;
            font-weight: bold;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 0.5rem;
        }

        .empty-desc {
            font-size: 0.75rem;
            max-width: 45ch;
            line-height: 1.6;
            opacity: 0.8;
        }

        /* Active Stock Workspace Header */
        .stock-workspace-header {
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 1.5rem;
        }

        .stock-header-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .stock-title-col h2 {
            margin: 0;
            font-size: 1.4rem;
            color: var(--accent);
            font-weight: 600;
        }

        .stock-workspace-meta {
            font-size: 0.8rem;
            color: var(--meta);
            margin-top: 0.4rem;
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .stock-price-col {
            text-align: right;
        }

        .live-price {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--link);
        }

        .live-price-label {
            font-size: 0.75rem;
            color: var(--meta);
            margin-top: 0.1rem;
        }

        /* Metric stats grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .stat-card {
            background: var(--bg-code);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 1rem;
            text-align: left;
            transition: var(--transition);
        }

        .stat-card:hover {
            border-color: var(--accent);
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--meta);
            margin-bottom: 0.3rem;
        }

        .stat-value {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--text);
        }

        .stat-value.highlight {
            color: var(--accent);
        }

        /* Tabs Menu */
        .workspace-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 1px solid var(--border);
            margin-bottom: 1.5rem;
            padding-bottom: 0.1rem;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--meta);
            font-family: inherit;
            font-size: 0.8rem;
            font-weight: bold;
            cursor: pointer;
            padding: 0.5rem 1rem;
            transition: var(--transition);
        }

        .tab-btn:hover {
            color: var(--accent);
        }

        .tab-btn.active {
            color: var(--accent);
            border-bottom: 2px solid var(--accent);
        }

        /* Tab Content Section */
        .tab-content-area {
            flex-grow: 1;
        }

        .tab-section {
            display: none;
        }

        .tab-section.active {
            display: block;
        }

        .section-title {
            font-size: 1rem;
            color: var(--accent);
            margin-top: 0;
            margin-bottom: 1.2rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Tables styling */
        .table-container {
            width: 100%;
            overflow-x: auto;
            margin-bottom: 1.5rem;
            border: 1px solid var(--border);
            border-radius: 4px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
            text-align: left;
        }

        th, td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border);
        }

        th {
            background: var(--bg-code);
            color: var(--accent);
            font-weight: bold;
            border-bottom: 2px solid var(--border);
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: var(--surface-hover);
        }

        .metric-name {
            font-weight: 500;
            color: var(--text);
            width: 250px;
            position: sticky;
            left: 0;
            background: var(--surface);
        }

        tr:hover .metric-name {
            background: var(--surface-hover);
        }

        .period-val {
            text-align: right;
            font-variant-numeric: tabular-nums;
        }

        /* Announcement List */
        .announcement-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border);
            font-size: 0.8rem;
        }

        .announcement-item:last-child {
            border-bottom: none;
        }

        .announcement-link {
            color: var(--link);
            text-decoration: none;
            transition: var(--transition);
        }

        .announcement-link:hover {
            text-decoration: underline;
            opacity: 0.8;
        }

        .announcement-date {
            color: var(--meta);
            font-size: 0.75rem;
            flex-shrink: 0;
            margin-left: 1rem;
        }

        /* Insights blocks */
        .insight-card {
            background: var(--bg-code);
            border-left: 3px solid var(--accent);
            border-radius: 0 4px 4px 0;
            padding: 1rem 1.2rem;
            margin-bottom: 1rem;
            font-size: 0.8rem;
        }

        .insight-header {
            display: flex;
            justify-content: space-between;
            color: var(--meta);
            font-size: 0.7rem;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            font-weight: bold;
        }

        .insight-content {
            margin: 0;
            color: var(--text);
            line-height: 1.5;
        }

        footer {
            margin-top: 4rem;
            padding-bottom: 2rem;
            text-align: center;
        }

        @media (max-width: 900px) {
            .terminal-layout {
                grid-template-columns: 1fr;
            }

            .directory-pane {
                max-height: 350px;
                margin-bottom: 1.5rem;
            }

            .workspace-pane {
                max-height: none;
            }
        }
    </style>
</head>
<body>
    <main>
        <header>
            <div class="header-container">
                <div>
                    <h1>KENYA-ROIC</h1>
                    <p class="tagline">Nairobi Securities Exchange // Dynamic Financial Intelligence Terminal</p>
                </div>
                <div>
                    <a href="/" class="back-btn">[ ← Back to MoeCapital ]</a>
                </div>
            </div>
        </header>

        <section class="terminal-layout">
            <!-- Left Pane: Stock Directory -->
            <article class="directory-pane">
                <input 
                    type="text" 
                    id="nse-search" 
                    class="search-box" 
                    placeholder="[ Type ticker, name, or sector... ]"
                    oninput="filterDirectory()"
                />
                <div class="prices-asof-line">
                    Prices as of <span id="prices-asof">…</span>
                    <span id="prices-live-badge" style="display: none;">LIVE</span>
                </div>
                <div class="stock-directory-list" id="directory-list">
                    ${stockItemsHtml}
                </div>
            </article>

            <!-- Right Pane: Active Workspace -->
            <article class="workspace-pane" id="active-workspace">
                <div class="empty-workspace" id="workspace-empty-state">
                    <div class="terminal-artwork">📡</div>
                    <div class="empty-title">MoeCapital // NSE Terminal Active</div>
                    <div class="empty-desc">
                        Select any listed company in the directory list to load real-time financial metrics, key valuation ratios, and income statement history.
                    </div>
                </div>
                
                <!-- Workspace detail container (hidden by default) -->
                <div id="workspace-detail-content" style="display: none;">
                    <div class="stock-workspace-header">
                        <div class="stock-header-main">
                            <div class="stock-title-col">
                                <h2 id="detail-name">Absa Bank Kenya PLC</h2>
                                <div class="stock-workspace-meta">
                                    <span id="detail-ticker">ABSA</span>
                                    <span>•</span>
                                    <span>NSE</span>
                                    <span>•</span>
                                    <span id="detail-sector">Banking</span>
                                </div>
                                <p class="stock-blurb" id="detail-blurb" style="display: none;"></p>
                            </div>
                            <div class="stock-price-col" id="detail-price-col">
                                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                                    <span class="live-price-badge" id="detail-price-live-badge" style="display: none; font-size: 0.6rem; color: #4ade80; border: 1px solid #4ade80; border-radius: 4px; padding: 1px 4px; font-weight: bold; letter-spacing: 0.05em; vertical-align: middle;">LIVE</span>
                                    <div class="live-price" id="detail-price">KES —</div>
                                </div>
                                <div class="live-price-label">Current Price</div>
                                <div class="mode-toggle" id="mode-toggle">
                                    <button id="mode-simple-btn" class="mode-btn" onclick="setMode('simple')">SIMPLE</button>
                                    <button id="mode-expert-btn" class="mode-btn" onclick="setMode('expert')">EXPERT</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Metric Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Revenue / income<span class="gl" data-glossary="revenue" role="button" tabindex="0" aria-label="What is Revenue?">?</span></div>
                            <div class="stat-value" id="stat-revenue">KES —</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Profit after tax</div>
                            <div class="stat-value" id="stat-netincome">KES —</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">ROIC<span class="gl" data-glossary="roic" role="button" tabindex="0" aria-label="What is ROIC?">?</span></div>
                            <div class="stat-value highlight" id="stat-roic">—</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">ROE<span class="gl" data-glossary="roe" role="button" tabindex="0" aria-label="What is ROE?">?</span></div>
                            <div class="stat-value highlight" id="stat-roe">—</div>
                            <div class="roe-context" id="stat-roe-context" style="font-size: 0.65rem; color: var(--meta);"></div>
                        </div>
                    </div>

                    <!-- Plain-English summary (Simple mode core; stays visible in Expert) -->
                    <div class="plain-summary plain-only" id="plain-summary">
                        <div class="verdict-chips" id="verdict-chips"></div>
                        <p class="plain-performance" id="plain-performance" style="margin: 0.6rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);"></p>
                        <p class="plain-roe" id="plain-roe" style="margin: 0.4rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);"></p>
                        <p class="plain-note" style="margin: 0.4rem 0 0 0; font-size: 0.72rem; color: var(--meta);">Switch to EXPERT (top right) for the full tables.</p>
                    </div>

                    <!-- Workspace Tabs -->
                    <nav class="workspace-tabs">
                        <button class="tab-btn active" onclick="switchTab('financials')">Financials</button>
                        <button class="tab-btn" onclick="switchTab('ratios')">Key Ratios</button>
                        <button class="tab-btn" onclick="switchTab('insights')">Insights</button>
                        <button class="tab-btn" onclick="switchTab('announcements')">Announcements</button>
                    </nav>

                    <!-- Tab Contents -->
                    <div class="tab-content-area">
                        <!-- Financials Tab -->
                        <div class="tab-section active" id="tab-financials">
                            <h3 class="section-title">Key Figures — FY (KES, as reported)</h3>
                            <div id="data-source-line" style="font-size:0.68rem;color:var(--meta);margin:-0.8rem 0 1rem;"></div>
                            <div class="table-container expert-only" id="financials-table-box">
                                <!-- Pre-rendered dynamically by JS -->
                            </div>
                        </div>

                        <!-- Key Ratios Tab -->
                        <div class="tab-section" id="tab-ratios">
                            <h3 class="section-title">Valuation & Efficiency Ratios</h3>
                            <div class="table-container expert-only" id="ratios-table-box">
                                <!-- Pre-rendered dynamically by JS -->
                            </div>
                        </div>

                        <!-- Insights Tab -->
                        <div class="tab-section" id="tab-insights">
                            <h3 class="section-title">Fundamental Insights & Quotes</h3>
                            <div id="insights-list-box">
                                <!-- Pre-rendered dynamically by JS -->
                            </div>
                        </div>

                        <!-- Announcements Tab -->
                        <div class="tab-section" id="tab-announcements">
                            <h3 class="section-title">Company Disclosures & Filings</h3>
                            <div id="announcements-list-box">
                                <!-- Pre-rendered dynamically by JS -->
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </section>

        <footer>
            <p style="font-size: 0.75rem; color: var(--meta); opacity: 0.6;">
                Built for financial clarity. Monospace. De-complexed. All data sourced locally.
            </p>
        </footer>
    </main>

    <script>
        let db = null;
        let activeTicker = null;
        let activeTab = 'financials';

        ${metricHelpers}

        // Worker-backed price sync: one KV-cached source (moecap-prices worker),
        // refreshed hourly server-side. No third-party CORS proxy, no per-visitor
        // external scraping. Falls back to the static snapshot on any failure.
        const NSE_PRICES_URL = "https://moecap-prices.iamkingori.workers.dev/nse";

        async function syncPricesRealtime() {
            console.log("📡 Syncing NSE prices from moecap-prices worker...");
            try {
                const response = await fetch(NSE_PRICES_URL);
                if (!response.ok) throw new Error("worker HTTP error: " + response.status);
                const payload = await response.json();
                if (!payload || !payload.prices || Object.keys(payload.prices).length === 0) {
                    throw new Error("empty payload");
                }

                if (!db) db = {};
                if (!db.market) db.market = {};
                db.market.prices = { ...db.market.prices, ...payload.prices };
                db.market.lastUpdated = payload.asOf || db.market.lastUpdated;
                db.market.isLive = !!payload.live;

                updatePricesAsOf();
                updateDirectoryPrices();

                if (activeTicker) {
                    const currentPrice = db.market.prices[activeTicker];
                    if (currentPrice !== undefined) {
                        document.getElementById('detail-price').innerText = \`KES \${currentPrice.toFixed(2)}\`;
                        const priceCol = document.getElementById('detail-price-col');
                        if (priceCol) {
                            priceCol.style.display = 'block';
                            const badge = document.getElementById('detail-price-live-badge');
                            if (badge) badge.style.display = db.market.isLive ? 'inline-block' : 'none';
                        }
                    }
                }
            } catch (err) {
                console.warn("⚠️ Worker price sync failed. Using snapshot prices:", err);
                if (db && db.market) db.market.isLive = false;
                updatePricesAsOf();
            }
        }

        // Honest "as of" labelling — snapshot dates are shown, never hidden
        function updatePricesAsOf() {
            const el = document.getElementById('prices-asof');
            const badge = document.getElementById('prices-live-badge');
            if (!el || !db || !db.market) return;
            if (db.market.lastUpdated) {
                const d = new Date(db.market.lastUpdated);
                el.innerText = isNaN(d.getTime()) ? db.market.lastUpdated : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
            } else {
                el.innerText = 'archive snapshot';
            }
            if (badge) badge.style.display = (db.market && db.market.isLive) ? 'inline' : 'none';
        }

        // Update all price badges in the sidebar dynamically
        function updateDirectoryPrices() {
            if (!db || !db.market || !db.market.prices) return;
            Object.entries(db.market.prices).forEach(([ticker, price]) => {
                const el = document.getElementById(\`card-price-\${ticker}\`);
                if (el && price !== undefined) {
                    el.innerText = \`KES \${price.toFixed(2)}\`;
                    el.style.color = 'var(--link)';
                }
            });
        }

        // Load database immediately in background
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                let response;
                try {
                    response = await fetch('/nse/nse-data.json');
                    if (!response.ok) throw new Error("Status: " + response.status);
                } catch (e) {
                    console.log('⚠️ Host-relative fetch failed, falling back to relative directory fetch...');
                    response = await fetch('nse-data.json');
                }
                db = await response.json();
                console.log('📡 Database fetched successfully!', db);

                // Simple/Expert mode: default Simple, persisted per visitor
                setMode(localStorage.getItem('nse-mode') || 'simple');
                updatePricesAsOf();
                computeSectorMedians();

                // Automatically open ticker if URL hash matches
                const hash = window.location.hash.substring(1).toUpperCase();
                if (hash && document.querySelector(\`[data-ticker="\${hash}"]\`)) {
                    selectStock(hash);
                }

                // Initial live sync
                await syncPricesRealtime();

                // Periodic refresh loop every 60 seconds
                setInterval(syncPricesRealtime, 60000);
            } catch (e) {
                console.error('❌ Failed to fetch database:', e);
            }
        });

        // Search directory filtering
        function filterDirectory() {
            const query = document.getElementById('nse-search').value.toLowerCase().trim();
            const cards = document.querySelectorAll('.stock-item-card');
            
            cards.forEach(card => {
                const ticker = card.getAttribute('data-ticker');
                const name = card.getAttribute('data-name');
                const sector = card.getAttribute('data-sector');
                
                if (ticker.includes(query) || name.includes(query) || sector.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            // Hide sector groups whose cards all got filtered out
            document.querySelectorAll('.sector-group').forEach(group => {
                const anyVisible = Array.from(group.querySelectorAll('.stock-item-card'))
                    .some(card => card.style.display === 'block');
                group.style.display = anyVisible ? 'block' : 'none';
            });
        }

        // Switch workspace tabs
        function switchTab(tabId) {
            activeTab = tabId;
            
            // Toggle active classes on tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.innerText.toLowerCase().includes(tabId === 'ratios' ? 'ratios' : tabId)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Toggle display on content sections
            document.querySelectorAll('.tab-section').forEach(section => {
                if (section.id === \`tab-\${tabId}\`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        }

        // Mode toggle: Simple (default) hides expert tables, keeps plain summary
        function setMode(mode) {
            const simple = mode !== 'expert';
            document.body.classList.toggle('nse-simple', simple);
            document.body.classList.toggle('nse-expert', !simple);
            localStorage.setItem('nse-mode', simple ? 'simple' : 'expert');
            const sBtn = document.getElementById('mode-simple-btn');
            const eBtn = document.getElementById('mode-expert-btn');
            if (sBtn) sBtn.classList.toggle('active', simple);
            if (eBtn) eBtn.classList.toggle('active', !simple);
        }

        // Sector-median ROE for honest context ("good for a bank?")
        let sectorMedians = {};
        function computeSectorMedians() {
            if (!db || !db.companies || !db.financials) return;
            const bySector = {};
            db.companies.forEach(c => {
                const fin = db.financials[c.ticker];
                if (!fin || !fin.metrics) return;
                const periods = Object.keys(fin.metrics).sort().reverse();
                const yr = fin.canonicalYear || periods[0];
                if (!yr) return;
                const roe = calculateROE(fin.metrics[yr] || {}, (fin.ratios || {})[yr] || {});
                if (roe === null || isNaN(roe)) return;
                (bySector[c.sector] = bySector[c.sector] || []).push(roe);
            });
            sectorMedians = {};
            Object.entries(bySector).forEach(([sector, vals]) => {
                const sorted = vals.slice().sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                sectorMedians[sector] = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            });
        }

        // Profit signal: Net Income from canonical year, else any year that has it
        function findNetIncome(fin) {
            if (!fin || !fin.metrics) return null;
            const periods = Object.keys(fin.metrics).sort().reverse();
            const yr = fin.canonicalYear || periods[0];
            const canonical = nseNetIncomeFor(fin.metrics[yr] || {});
            if (canonical) return { value: canonical.value, year: yr };
            for (const p of periods) {
                const income = nseNetIncomeFor(fin.metrics[p] || {});
                if (income) return { value: income.value, year: p };
            }
            return null;
        }

        // Verdict chips: data-derived, honest absence when profit isn't archived
        function renderVerdictChips(fin) {
            const box = document.getElementById('verdict-chips');
            if (!box) return;
            const chips = [];
            const ni = findNetIncome(fin);
            if (ni && ni.value > 0) {
                chips.push('<span class="verdict-chip chip-good">🟢 Profitable (' + ni.year + ')</span>');
            } else if (ni && ni.value < 0) {
                chips.push('<span class="verdict-chip chip-bad">🔴 Loss-making (' + ni.year + ')</span>');
            } else {
                chips.push('<span class="verdict-chip chip-neutral">📊 Profit not archived</span>');
            }
            if (fin && fin.canonicalYear) {
                chips.push('<span class="verdict-chip chip-neutral">📅 Figures FY ' + fin.canonicalYear + '</span>');
            }
            box.innerHTML = chips.join('');
        }

        // Plain-English performance sentence from one reported period only.
        function renderPlainPerformance(company, metrics, unitHint, period, currency) {
            const el = document.getElementById('plain-performance');
            if (!el) return;
            const income = nseNetIncomeFor(metrics || {});
            const revenue = nseRevenueFor(metrics || {});
            const dps = nseNamedNumber(metrics || {}, ['DPS', 'Dividend Per Share']);
            const symbol = currency === 'USD' ? 'USD' : 'KES';
            const formatMoney = (value) => {
                const billions = unitHint === 'K' ? value / 1e6 : value >= 1000 ? value / 1000 : value;
                return billions >= 1 ? symbol + ' ' + billions.toFixed(1) + 'B' : symbol + ' ' + Math.round(billions * 1000) + 'M';
            };
            const facts = [];
            if (income) facts.push((income.value >= 0 ? 'Made ' : 'Lost ') + formatMoney(Math.abs(income.value)) + ' after tax');
            if (revenue) facts.push('brought in ' + formatMoney(revenue.value) + ' in revenue / income');
            if (facts.length > 0) {
                el.innerText = company.name + ' ' + facts.join(' and ') + ' in ' + period + '.' + (dps ? ' The recorded dividend was ' + symbol + ' ' + dps.value.toFixed(2) + ' per share.' : '');
            } else if (dps) {
                el.innerText = company.name + ' recorded a dividend of ' + symbol + ' ' + dps.value.toFixed(2) + ' per share in ' + period + '; profit and income were not reported for that period.';
            } else {
                el.innerText = 'This record has no same-period profit, income, or dividend figure to summarise.';
            }
        }

        // Plain-English ROE sentence
        function renderPlainRoe(company, roe) {
            const el = document.getElementById('plain-roe');
            if (!el) return;
            if (roe === null || isNaN(roe)) {
                el.innerText = 'Returns could not be computed from the archived figures.';
                return;
            }
            const kes = Math.abs(roe).toFixed(0);
            el.innerText = roe >= 0
                ? \`For every KES 100 of owners' money, \${company.name} made KES \${kes} that year.\`
                : \`For every KES 100 of owners' money, \${company.name} LOST KES \${kes} that year.\`;
        }

        function calculateROIC(metrics) {
            return nseCalculateRoic(metrics);
        }

        function calculateROE(metrics, ratios) {
            return nseCalculateRoe(metrics, ratios);
        }

        // Select and render stock details in workspace
        function selectStock(ticker) {
            activeTicker = ticker;
            window.location.hash = ticker;

            // Highlight selected card in sidebar
            document.querySelectorAll('.stock-item-card').forEach(card => {
                if (card.getAttribute('data-ticker') === ticker) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });

            // If database not loaded yet, wait or fetch from DOM
            if (!db) {
                console.log('⌛ Database loading...');
                return;
            }

            try {
                const company = db.companies.find(c => c.ticker === ticker);
                const financials = db.financials[ticker];
                const price = db.market?.prices[ticker];

                if (!company) return;

                // Show workspace details, hide empty state
                document.getElementById('workspace-empty-state').style.display = 'none';
                document.getElementById('workspace-detail-content').style.display = 'block';

                // Populate header
                document.getElementById('detail-name').innerText = company.name;
                document.getElementById('detail-ticker').innerText = company.ticker;
                document.getElementById('detail-sector').innerText = company.sector;

                // Plain-English one-liner (authored where identity is confident)
                const blurbEl = document.getElementById('detail-blurb');
                if (blurbEl) {
                    if (company.blurb) {
                        blurbEl.innerText = company.blurb;
                        blurbEl.style.display = 'block';
                    } else {
                        blurbEl.innerText = '';
                        blurbEl.style.display = 'none';
                    }
                }
                
                const priceCol = document.getElementById('detail-price-col');
                if (price !== undefined && price !== null) {
                    const priceNum = typeof price === 'number' ? price : parseFloat(price);
                    if (!isNaN(priceNum)) {
                        document.getElementById('detail-price').innerText = \`KES \${priceNum.toFixed(2)}\`;
                        priceCol.style.display = 'block';
                        const badge = document.getElementById('detail-price-live-badge');
                        if (badge) {
                            badge.style.display = (db.market && db.market.isLive) ? 'inline-block' : 'none';
                        }
                    } else {
                        priceCol.style.display = 'none';
                    }
                } else {
                    priceCol.style.display = 'none';
                }

                // Populate stats card & Dynamic ratios
                if (financials && financials.metrics) {
                    const periods = Object.keys(financials.metrics).sort().reverse();
                    // canonical year: the fullest, coherence-cleaned year chosen at data-build time
                    const latestPeriod = financials.canonicalYear || periods[0];
                    const latestMetrics = latestPeriod ? financials.metrics[latestPeriod] : {};
                    const latestRatios = (financials.ratios && latestPeriod) ? financials.ratios[latestPeriod] : {};
                    const unitHint = financials.unitHint || 'M';
                    const currency = financials.currency === 'USD' ? 'USD' : 'KES';

                    // Source figures are KES millions or thousands. USD REIT figures stay USD.
                    const toBillions = (v) => {
                        if (unitHint === 'K') return v / 1e6;
                        return v >= 1000 ? v / 1000 : v;
                    };
                    const displayMoney = (v) => {
                        const b = toBillions(v);
                        return b >= 1 ? \`\${currency} \${b.toFixed(1)}B\` : \`\${currency} \${Math.round(b * 1000)}M\`;
                    };

                    // Headline values use verified aliases; bank revenue is derived only from the same-period income lines.
                    const rev = nseRevenueFor(latestMetrics);
                    document.getElementById('stat-revenue').innerText = rev ? displayMoney(rev.value) : '—';

                    const net = nseNetIncomeFor(latestMetrics);
                    document.getElementById('stat-netincome').innerText = net ? displayMoney(net.value) : '—';

                    const roic = calculateROIC(latestMetrics);
                    document.getElementById('stat-roic').innerText = roic !== null ? \`\${roic.toFixed(1)}%\` : '—';

                    const roe = calculateROE(latestMetrics, latestRatios);
                    document.getElementById('stat-roe').innerText = roe !== null ? \`\${roe.toFixed(1)}%\` : '—';

                    const roeNum = roe;

                    // ROE in sector context (median of the sector's computable ROEs)
                    const roeCtx = document.getElementById('stat-roe-context');
                    if (roeCtx) {
                        const med = sectorMedians[company.sector];
                        roeCtx.innerText = (!isNaN(roeNum) && roe !== null && typeof med === 'number')
                            ? \`sector median \${med.toFixed(1)}%\` : '';
                    }

                    // Plain-English layer: same-period performance, chips, and ROE sentence
                    renderPlainPerformance(company, latestMetrics, unitHint, latestPeriod, financials.currency);
                    renderVerdictChips(financials);
                    renderPlainRoe(company, (!isNaN(roeNum) && roe !== null) ? roeNum : null);

                    // Data provenance tag: primary filing with explicit audit status, or archived extract
                    const srcLine = document.getElementById('data-source-line');
                    if (srcLine) {
                        const periodLabel = String(latestPeriod || '').replace(/[^0-9A-Za-z \/:-]/g, '');
                        const reported = financials.sourceKind === 'unaudited' ? 'unaudited primary filing' : 'audited primary filing';
                        const currency = financials.currency === 'USD' ? ' · USD figures' : '';
                        const primaryFile = financials.primaryFile ? ' · <a href="' + financials.primaryFile + '" target="_blank" rel="noopener">source PDF</a>' : '';
                        if (financials.source === 'primary') {
                            srcLine.innerHTML = '📋 <b>Data:</b> ' + reported + ' (' + periodLabel + ')' + currency + primaryFile;
                        } else {
                            srcLine.innerHTML = '📦 <b>Data:</b> archived extract — year labels may be off; fundamentals pending re-sourcing';
                        }
                    }

                    // 1. Render Financial Table (canonical year only — other years
                    //    carry unreconciled native units by design)
                    renderFinancialsTable(financials.metrics, [latestPeriod], financials.unitHint, financials.currency);

                    // 2. Render Key Ratios Table
                    renderRatiosTable(financials.ratios || {}, periods, financials.metrics);

                    // 3. Render Insights List
                    renderInsights(financials.insights || []);

                    // 4. Render Announcements List
                    renderAnnouncements(financials.announcements || []);
                } else {
                    // No financials available
                    document.getElementById('stat-revenue').innerText = '—';
                    document.getElementById('stat-netincome').innerText = '—';
                    document.getElementById('stat-roic').innerText = '—';
                    document.getElementById('stat-roe').innerText = '—';
                    const roeCtx0 = document.getElementById('stat-roe-context');
                    if (roeCtx0) roeCtx0.innerText = '';
                    renderPlainPerformance(company, null, 'M', 'the archived period');
                    renderVerdictChips(undefined);
                    renderPlainRoe(company, null);
                    
                    document.getElementById('financials-table-box').innerHTML = \`<p style="color: var(--meta); font-size: 0.8rem; margin: 1rem 0;">No financial metrics database found for \${ticker}</p>\`;
                    document.getElementById('ratios-table-box').innerHTML = \`<p style="color: var(--meta); font-size: 0.8rem; margin: 1rem 0;">No key efficiency ratios found for \${ticker}</p>\`;
                    document.getElementById('insights-list-box').innerHTML = \`<p style="color: var(--meta); font-size: 0.8rem; margin: 1rem 0;">No fundamental analysis quotes found for \${ticker}</p>\`;
                    document.getElementById('announcements-list-box').innerHTML = \`<p style="color: var(--meta); font-size: 0.8rem; margin: 1rem 0;">No regulatory announcements registered for \${ticker}</p>\`;
                }

                // Keep current tab active
                switchTab(activeTab);
            } catch (err) {
                console.error("❌ Error rendering stock details:", err);
            }
        }

        // Glossary badges shared by tables
        const glMap = {"EPS":"eps","DPS":"dps","EBITDA":"ebitda","Revenue":"revenue","ROE (%)":"roe","ROIC (%)":"roic","Net Margin (%)":"margin"};
        const glBadge = (n) => glMap[n] ? \` <span class="gl" data-glossary="\${glMap[n]}" role="button" tabindex="0" aria-label="What is \${n}?">?</span>\` : '';

        // Render high-performance financial metrics table
        function renderFinancialsTable(metrics, periods, unitHint, currency) {
            if (!periods || periods.length === 0) return;

            // Collect all unique metrics keys across periods
            const allKeys = new Set();
            periods.forEach(p => {
                Object.keys(metrics[p] || {}).forEach(k => allKeys.add(k));
            });
            const sortedMetricKeys = Array.from(allKeys).sort();
            const hint = unitHint || 'M';
            const symbol = currency === 'USD' ? 'USD ' : '';
            const toBillions = (v) => {
                if (hint === 'K') return v / 1e6;
                return v >= 1000 ? v / 1000 : v;
            };
            const displayMoney = (v) => {
                const b = toBillions(v);
                return b >= 1 ? \`\${symbol}\${b.toFixed(1)}B\` : \`\${symbol}\${Math.round(b * 1000)}M\`;
            };

            let headerCols = '<th>Financial Metric</th>';
            periods.forEach(p => {
                headerCols += \`<th class="period-val">\${p}</th>\`;
            });

            let rowHtml = '';
            const ratioFields = new Set(["Core Capital", "Total Risk Weighted Assets", "Liquidity Ratio %", "EPS", "DPS", "NAV Per Unit"]);
            sortedMetricKeys.forEach(m => {
                rowHtml += \`<tr><td class="metric-name">\${m}\${glBadge(m)}</td>\`;
                periods.forEach(p => {
                    const val = metrics[p]?.[m];
                    const valNum = typeof val === 'number' ? val : parseFloat(val);
                    let valStr = '—';
                    if (!isNaN(valNum) && val !== null && val !== undefined) {
                        valStr = ratioFields.has(m) ? \`\${valNum.toFixed(1)}\` : displayMoney(valNum);
                    }
                    rowHtml += \`<td class="period-val">\${valStr}</td>\`;
                });
                rowHtml += '</tr>';
            });

            const tableHtml = \`
                <table>
                    <thead>
                        <tr>\${headerCols}</tr>
                    </thead>
                    <tbody>
                        \${rowHtml}
                    </tbody>
                </table>
            \`;
            document.getElementById('financials-table-box').innerHTML = tableHtml;
        }

        // Render ratios table incorporating static and dynamically computed fields
        function renderRatiosTable(staticRatios, periods, metrics) {
            if (!periods || periods.length === 0) return;

            // Define ratios we want to check/render
            const ratioLabels = [
                "ROE (%)",
                "ROA (%)",
                "ROIC (%)",
                "Net Margin (%)",
                "Asset Turnover (x)"
            ];

            let headerCols = '<th>Ratio Metric</th>';
            periods.forEach(p => {
                headerCols += \`<th class="period-val">\${p}</th>\`;
            });

            let rowHtml = '';
            ratioLabels.forEach(label => {
                rowHtml += \`<tr><td class="metric-name">\${label}\${glBadge(label)}</td>\`;
                periods.forEach(p => {
                    let val = null;
                    const pRatios = staticRatios[p] || {};
                    const pMetrics = metrics[p] || {};

                    if (label === "ROIC (%)") {
                        val = nseCalculateRoic(pMetrics);
                    } else if (label === "ROE (%)") {
                        val = nseCalculateRoe(pMetrics, pRatios);
                    } else if (label === "ROA (%)") {
                        val = nseCalculateRoa(pMetrics, pRatios);
                    } else if (label === "Net Margin (%)") {
                        val = nseCalculateNetMargin(pMetrics, pRatios);
                    } else if (label === "Asset Turnover (x)") {
                        val = nseCalculateAssetTurnover(pMetrics, pRatios);
                    }

                    const valNum = typeof val === 'number' ? val : parseFloat(val);
                    const valStr = (!isNaN(valNum) && val !== null && val !== undefined) ? valNum.toFixed(2) : '—';
                    rowHtml += \`<td class="period-val">\${valStr}\${!isNaN(valNum) && val !== null && label.includes("%") ? '%' : ''}</td>\`;
                });
                rowHtml += '</tr>';
            });

            const tableHtml = \`
                <table>
                    <thead>
                        <tr>\${headerCols}</tr>
                    </thead>
                    <tbody>
                        \${rowHtml}
                    </tbody>
                </table>
            \`;
            document.getElementById('ratios-table-box').innerHTML = tableHtml;
        }

        // Render dynamic insights
        function renderInsights(insights) {
            const listContainer = document.getElementById('insights-list-box');
            if (!insights || insights.length === 0) {
                listContainer.innerHTML = \`<p style="color: var(--meta); font-size: 0.8rem; margin: 1rem 0;">No fundamental analysis quotes found for this ticker.</p>\`;
                return;
            }

            let cardsHtml = '';
            insights.forEach(ins => {
                const dateStr = ins.date ? ins.date : '';
                cardsHtml += \`
                    <div class="insight-card">
                        <div class="insight-header">
                            <span>[\${ins.category}]</span>
                            <span>\${dateStr}</span>
                        </div>
                        <p class="insight-content">\${ins.content}</p>
                    </div>
                \`;
            });
            listContainer.innerHTML = cardsHtml;
        }

        // Render dynamic announcements list
        function renderAnnouncements(announcements) {
            const listContainer = document.getElementById('announcements-list-box');
            if (!announcements || announcements.length === 0) {
                listContainer.innerHTML = \`<p style="color: var(--meta); font-size: 0.8rem; margin: 1rem 0;">No regulatory announcements registered.</p>\`;
                return;
            }

            let listHtml = '<p style="color: var(--meta); font-size: 0.7rem; margin: 0.4rem 0 0.8rem;">Official PDFs link to nse.co.ke listed-company announcements.</p>';
            announcements.forEach(ann => {
                // Anchors open the self-hosted PDF copy (or an external one);
                // entries without a file stay as plain local rows.
                const esc = (s) => String(s || '').replace(/[<>&]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] || ch));
                const f = String(ann.file || "");
                const isLive = f.startsWith("http") || f.startsWith("/nse/announcements/");
                const label = isLive
                    ? \`<a class="announcement-link" href="\${esc(ann.file)}" target="_blank" rel="noopener">📄 \${esc(ann.title)}</a>\`
                    : \`<span class="announcement-link" style="cursor: default;">📄 \${esc(ann.title)}</span>\`;
                listHtml += \`
                    <div class="announcement-item">
                        \${label}
                        <span class="announcement-date">\${esc(ann.date)}</span>
                    </div>
                \`;
            });
            listContainer.innerHTML = listHtml;
        }
    </script>
    <script src="/glossary.js" defer></script>
    <script src="/search.js" defer></script>
    <script src="/watchlist.js" defer></script>
</body>
</html>`;

  // Write finalized html to output
  writeFileSync(join(nseOutputDir, "index.html"), html);
  console.log(`✅ Compiled Nairobi Securities Exchange (NSE) Terminal successfully at: ${join(nseOutputDir, "index.html")}`);
}
