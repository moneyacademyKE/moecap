import { writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

export interface Company {
  ticker: string;
  name: string;
  sector: string;
}

export interface CompanyFinancials {
  name: string;
  sector: string;
  metrics: Record<string, Record<string, number>>;
  ratios: Record<string, Record<string, number>>;
  announcements?: Array<{ date: string; title: string; file: string }>;
  insights?: Array<{ category: string; content: string; source: string; date: string }>;
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
  
  // Ensure nse output dir exists
  const nseOutputDir = join(publicDir, "nse");
  if (!existsSync(nseOutputDir)) {
    mkdirSync(nseOutputDir, { recursive: true });
  }

  // Copy raw JSON to nse directory for client-side fetches
  copyFileSync(nseDataPath, join(nseOutputDir, "nse-data.json"));
  console.log(`📂 Copied database to: ${join(nseOutputDir, "nse-data.json")}`);

  // Generate Stock Items HTML for Left Pane Pre-rendering
  const stockItemsHtml = companies.map(c => {
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
  }).join("\n");

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
                            </div>
                            <div class="stock-price-col" id="detail-price-col">
                                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                                    <span class="live-price-badge" id="detail-price-live-badge" style="display: none; font-size: 0.6rem; color: #4ade80; border: 1px solid #4ade80; border-radius: 4px; padding: 1px 4px; font-weight: bold; letter-spacing: 0.05em; vertical-align: middle;">LIVE</span>
                                    <div class="live-price" id="detail-price">KES —</div>
                                </div>
                                <div class="live-price-label">Current Price</div>
                            </div>
                        </div>
                    </div>

                    <!-- Metric Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Revenue (LTM)</div>
                            <div class="stat-value" id="stat-revenue">KES —</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Net Income (LTM)</div>
                            <div class="stat-value" id="stat-netincome">KES —</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">ROIC</div>
                            <div class="stat-value highlight" id="stat-roic">—</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">ROE</div>
                            <div class="stat-value highlight" id="stat-roe">—</div>
                        </div>
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
                            <div class="table-container" id="financials-table-box">
                                <!-- Pre-rendered dynamically by JS -->
                            </div>
                        </div>

                        <!-- Key Ratios Tab -->
                        <div class="tab-section" id="tab-ratios">
                            <h3 class="section-title">Valuation & Efficiency Ratios</h3>
                            <div class="table-container" id="ratios-table-box">
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

        // Ticker mapping normalization (from AFX/Kwayisi symbols to Master symbols)
        const PRICE_TICKER_MAP = {
            "BKG": "BK",
            "IMH": "IM",
            "PORT": "BAMB",
            "ILAM": "FAHR",
            "FAHR": "FAHR",
            "SCAN": "SCAN",
            "SCOM": "SCOM",
            "EQTY": "EQTY",
            "KCB": "KCB",
            "COOP": "COOP",
            "ABSA": "ABSA"
        };

        // Real-time price synchronizer using CORS proxy
        async function syncPricesRealtime() {
            console.log("📡 Starting live NSE prices synchronization via CORS proxy...");
            const kwayisiUrl = "https://afx.kwayisi.org/nse/";
            const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(kwayisiUrl);
            
            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error("CORS Proxy HTTP error: " + response.status);
                const html = await response.text();
                
                // Regex matches: <tr><td><a href="...">TICKER</a></td><td><a href="...">NAME</a></td><td>VOLUME</td><td>PRICE</td></tr>
                const rowRegex = /<tr><td><a [^>]+>([A-Z0-9]+)<\\/a><td><a [^>]+>[^<]+<\\/a><td>(?:[0-9,]+)?<td>([0-9,]+\\.[0-9]+)/g;
                let match;
                let count = 0;
                const prices = {};
                
                while ((match = rowRegex.exec(html)) !== null) {
                    const rawTicker = match[1];
                    const price = parseFloat(match[2].replace(/,/g, ""));
                    const ticker = PRICE_TICKER_MAP[rawTicker] || rawTicker;
                    prices[ticker] = price;
                    count++;
                }
                
                if (count > 0 && db) {
                    console.log(\`✅ Live prices successfully fetched: \${count} tickers updated.\`);
                    if (!db.market) db.market = {};
                    db.market.prices = { ...db.market.prices, ...prices };
                    db.market.lastUpdated = new Date().toISOString();
                    db.market.isLive = true;
                    
                    // 1. Update prices in the directory sidebar
                    updateDirectoryPrices();
                    
                    // 2. If an active company is selected, refresh its header price display
                    if (activeTicker) {
                        const currentPrice = db.market.prices[activeTicker];
                        if (currentPrice !== undefined) {
                            document.getElementById('detail-price').innerText = \`KES \${currentPrice.toFixed(2)}\`;
                            const priceCol = document.getElementById('detail-price-col');
                            if (priceCol) {
                                priceCol.style.display = 'block';
                                const badge = document.getElementById('detail-price-live-badge');
                                if (badge) badge.style.display = 'inline-block';
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("⚠️ Live price sync failed. Gracefully falling back to static database:", err);
            }
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

        // Robust dynamic ROIC computation
        function calculateROIC(metrics) {
            const ebit = metrics["Operating Income"] !== undefined ? metrics["Operating Income"] : (metrics["EBITDA"] !== undefined ? metrics["EBITDA"] : null);
            const netIncome = metrics["Net Income"] !== undefined ? metrics["Net Income"] : null;
            
            const equity = metrics["Total Equity"] !== undefined ? metrics["Total Equity"] : 
                         (metrics["Share Capital"] !== undefined && metrics["Retained Earnings"] !== undefined ? metrics["Share Capital"] + metrics["Retained Earnings"] : null);
            
            const debt = metrics["Total Debt"] !== undefined ? metrics["Total Debt"] : 0;
            const cash = metrics["Cash & Bank"] !== undefined ? metrics["Cash & Bank"] : 0;

            if (ebit === null && netIncome === null) return null;
            
            const eqVal = equity !== null ? equity : (metrics["Total Assets"] !== undefined ? metrics["Total Assets"] - (metrics["Total Liabilities"] || 0) : null);
            if (eqVal === null || eqVal <= 0) return null;

            const investedCapital = eqVal + debt - cash;
            if (investedCapital <= 0) return null;

            const taxExpense = metrics["Income Tax Expense"] !== undefined ? metrics["Income Tax Expense"] : 0;
            let taxRate = 0.30; // standard corporate tax rate in Kenya is 30%
            if (ebit && taxExpense < 0) {
                taxRate = Math.min(0.5, Math.max(0, -taxExpense / ebit));
            }

            const nopat = ebit !== null ? ebit * (1 - taxRate) : netIncome;
            return (nopat / investedCapital) * 100;
        }

        // Robust dynamic ROE computation
        function calculateROE(metrics, ratios) {
            if (ratios && ratios["ROE (%)"] !== undefined) {
                const val = ratios["ROE (%)"];
                return Math.abs(val) < 1.0 ? val * 100 : val;
            }
            const netIncome = metrics["Net Income"];
            const equity = metrics["Total Equity"] !== undefined ? metrics["Total Equity"] : 
                         (metrics["Share Capital"] !== undefined && metrics["Retained Earnings"] !== undefined ? metrics["Share Capital"] + metrics["Retained Earnings"] : null);
            if (netIncome !== undefined && equity && equity > 0) {
                return (netIncome / equity) * 100;
            }
            return null;
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

                    // KES display: hint K = thousands-native; >=1000 = millions-native; else billions-native
                    const toBillions = (v) => {
                        if (unitHint === 'K') return v / 1e6;
                        return v >= 1000 ? v / 1000 : v;
                    };
                    const displayKES = (v) => {
                        const b = toBillions(v);
                        return b >= 1 ? \`KES \${b.toFixed(1)}B\` : \`KES \${Math.round(b * 1000)}M\`;
                    };

                    // Revenue LTM
                    const rev = latestMetrics["Revenue"];
                    const revNum = typeof rev === 'number' ? rev : parseFloat(rev);
                    document.getElementById('stat-revenue').innerText = (!isNaN(revNum) && rev !== null && rev !== undefined) ? displayKES(revNum) : '—';

                    // Net Income LTM
                    const net = latestMetrics["Net Income"];
                    const netNum = typeof net === 'number' ? net : parseFloat(net);
                    document.getElementById('stat-netincome').innerText = (!isNaN(netNum) && net !== null && net !== undefined) ? displayKES(netNum) : '—';

                    // Compute dynamic ROIC
                    const roic = calculateROIC(latestMetrics);
                    const roicNum = typeof roic === 'number' ? roic : parseFloat(roic);
                    document.getElementById('stat-roic').innerText = (!isNaN(roicNum) && roic !== null) ? \`\${roicNum.toFixed(1)}%\` : '—';

                    // Compute dynamic ROE
                    const roe = calculateROE(latestMetrics, latestRatios);
                    const roeNum = typeof roe === 'number' ? roe : parseFloat(roe);
                    document.getElementById('stat-roe').innerText = (!isNaN(roeNum) && roe !== null) ? \`\${roeNum.toFixed(1)}%\` : '—';

                    // 1. Render Financial Table (canonical year only — other years
                    //    carry unreconciled native units by design)
                    renderFinancialsTable(financials.metrics, [latestPeriod], financials.unitHint);

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

        // Render high-performance financial metrics table
        function renderFinancialsTable(metrics, periods, unitHint) {
            if (!periods || periods.length === 0) return;

            // Collect all unique metrics keys across periods
            const allKeys = new Set();
            periods.forEach(p => {
                Object.keys(metrics[p] || {}).forEach(k => allKeys.add(k));
            });
            const sortedMetricKeys = Array.from(allKeys).sort();
            const hint = unitHint || 'M';
            const toBillions = (v) => {
                if (hint === 'K') return v / 1e6;
                return v >= 1000 ? v / 1000 : v;
            };
            const displayKES = (v) => {
                const b = toBillions(v);
                return b >= 1 ? \`\${b.toFixed(1)}B\` : \`\${Math.round(b * 1000)}M\`;
            };

            let headerCols = '<th>Financial Metric</th>';
            periods.forEach(p => {
                headerCols += \`<th class="period-val">\${p}</th>\`;
            });

            let rowHtml = '';
            const ratioFields = new Set(["Core Capital", "Total Risk Weighted Assets", "Liquidity Ratio %"]);
            sortedMetricKeys.forEach(m => {
                rowHtml += \`<tr><td class="metric-name">\${m}</td>\`;
                periods.forEach(p => {
                    const val = metrics[p]?.[m];
                    const valNum = typeof val === 'number' ? val : parseFloat(val);
                    let valStr = '—';
                    if (!isNaN(valNum) && val !== null && val !== undefined) {
                        valStr = ratioFields.has(m) ? \`\${valNum.toFixed(1)}\` : displayKES(valNum);
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
                rowHtml += \`<tr><td class="metric-name">\${label}</td>\`;
                periods.forEach(p => {
                    let val = null;
                    const pRatios = staticRatios[p] || {};
                    const pMetrics = metrics[p] || {};

                    if (label === "ROIC (%)") {
                        val = calculateROIC(pMetrics);
                    } else if (label === "ROE (%)") {
                        val = calculateROE(pMetrics, pRatios);
                    } else if (pRatios[label] !== undefined) {
                        val = pRatios[label];
                        if (label.includes("%") && Math.abs(val) < 1.0) {
                            val = val * 100;
                        }
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

            let listHtml = '';
            announcements.forEach(ann => {
                // If files are MD summaries, we point to their files. If URL scheme doesn't exist, we can use a direct local reference or treat as static lists.
                const url = \`https://github.com/criticalinsight/kenya-roic/blob/main/data/extractions/\${ann.file}\`;
                listHtml += \`
                    <div class="announcement-item">
                        <a href="\${url}" target="_blank" class="announcement-link">→ \${ann.title}</a>
                        <span class="announcement-date">\${ann.date}</span>
                    </div>
                \`;
            });
            listContainer.innerHTML = listHtml;
        }
    </script>
</body>
</html>`;

  // Write finalized html to output
  writeFileSync(join(nseOutputDir, "index.html"), html);
  console.log(`✅ Compiled Nairobi Securities Exchange (NSE) Terminal successfully at: ${join(nseOutputDir, "index.html")}`);
}
