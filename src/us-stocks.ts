import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ContentNode } from "./assets";

export interface StockMeta {
  title?: string;
  company_name?: string;
  stock_price?: string;
  pe_ratio?: string;
  author?: string;
  rating?: string;
  market_cap?: string;
  market_cap_formatted?: string;
}

export interface StockIdea {
  id: number;
  date: string;
  ticker: string;
  meta: StockMeta;
  body: string;
}

// Robust text extraction from various telegram formats (string, Array of entities)
export function getMessageText(text: any): string {
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) {
    return text.map(t => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object' && t.text) return t.text;
      return '';
    }).join('');
  }
  return '';
}

// Helper to format block description text into multiple paragraphs separated by double line breaks
export function formatRemainingText(text: string): string {
  if (text.startsWith("-") || text.startsWith("*")) {
    const items = text.split(/\n/).map(line => {
      const cleaned = line.replace(/^[-*]\s*/, '').trim();
      return `<li>${cleaned}</li>`;
    }).join('\n');
    return `<ul style="margin: 0.5rem 0 1.2rem 0; padding-left: 1.5rem;">${items}</ul>`;
  }
  
  return text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p style="margin: 0.5rem 0 1.2rem 0; line-height: 1.6;">${line}</p>`)
    .join('\n');
}

// Convert markdown-like text to premium semantic HTML with beautiful colored headers and paragraph double line breaks
export function formatStockBody(body: string): string {
  // Pre-process the body: if a line starts with a number and dot (e.g., "1. What they sell...") or is a known header, 
  // ensure there is a double newline before it so it splits into its own block!
  let processedBody = body;
  processedBody = processedBody.replace(/\n(\d+\.\s+)/g, '\n\n$1');

  const knownHeaders = new Set([
    "Executive Summary",
    "What They Sell and Who Buys",
    "How They Make Money",
    "Revenue Quality",
    "Cost Structure",
    "Capital Intensity",
    "Growth Drivers",
    "Competitive Edge",
    "Industry Structure and Position",
    "Unit Economics and Key KPIs",
    "Capital Allocation and Balance Sheet",
    "Risks and Failure Modes",
    "Valuation and Expected Return Profile",
    "Catalysts and Time Horizon"
  ]);

  for (const header of knownHeaders) {
    const regex = new RegExp(`\\n(${header})`, 'g');
    processedBody = processedBody.replace(regex, '\n\n$1');
  }

  const blocks = processedBody.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);

  return blocks.map(block => {
    const lines = block.split('\n');
    const firstLine = lines[0].trim();
    const cleanLine = firstLine.replace(/:$/, '').trim();
    
    // Check if the first line is a numbered header or a known header
    const numberedMatch = cleanLine.match(/^(\d+\.\s+[^:\n;]+)/);
    const isKnownHeader = Array.from(knownHeaders).some(kh => cleanLine.toLowerCase().includes(kh.toLowerCase()));

    if (numberedMatch || isKnownHeader || (cleanLine.length < 60 && !cleanLine.includes(".") && !cleanLine.startsWith("-") && !cleanLine.startsWith("*"))) {
      let titlePart = cleanLine;
      let descriptionPart = "";

      const colonIdx = cleanLine.indexOf(":");
      const semiIdx = cleanLine.indexOf(";");
      let splitIdx = -1;

      if (colonIdx !== -1 && semiIdx !== -1) {
        splitIdx = Math.min(colonIdx, semiIdx);
      } else if (colonIdx !== -1) {
        splitIdx = colonIdx;
      } else if (semiIdx !== -1) {
        splitIdx = semiIdx;
      }

      if (splitIdx !== -1 && splitIdx < 60) {
        titlePart = cleanLine.slice(0, splitIdx).trim();
        descriptionPart = cleanLine.slice(splitIdx + 1).trim();
      }

      const titleText = `${titlePart}:`;
      const headerHtml = `<h4 style="color: var(--accent); font-size: 1.05rem; font-weight: bold; margin-top: 2rem; margin-bottom: 0.8rem; border-bottom: 1px dashed var(--border); padding-bottom: 0.3rem;">${titleText}</h4>`;
      
      const subsequentText = lines.slice(1).join('\n').trim();
      let fullDescription = "";
      if (descriptionPart && subsequentText) {
        fullDescription = `${descriptionPart}\n${subsequentText}`;
      } else {
        fullDescription = descriptionPart || subsequentText;
      }

      if (fullDescription) {
        return `${headerHtml}\n${formatRemainingText(fullDescription)}`;
      }
      return headerHtml;
    }

    // List rendering (no header on first line)
    if (block.startsWith("-") || block.startsWith("*")) {
      const items = block.split(/\n/).map(line => {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        return `<li>${cleaned}</li>`;
      }).join('\n');
      return `<ul style="margin: 0.5rem 0 1.2rem 0; padding-left: 1.5rem;">${items}</ul>`;
    }

    // Regular paragraphs (no header on first line)
    return formatRemainingText(block);
  }).join('\n');
}

// Get sorting weight of rating: green gets highest priority, then yellow, then red
function getRatingWeight(rating: string | undefined): number {
  if (!rating) return 3;
  if (rating.includes("🟢")) return 0;
  if (rating.includes("🟡")) return 1;
  if (rating.includes("🔴")) return 2;
  return 3;
}

// Parse, deduplicate, and sort stock ideas from us-stocks.json (green ratings first)
export function parseStockIdeas(filePath: string): StockIdea[] {
  if (!existsSync(filePath)) {
    console.warn(`⚠️ Warning: US stocks JSON file not found at ${filePath}`);
    return [];
  }

  const fileContent = readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileContent);
  const stocksMap = new Map<string, StockIdea>();

  if (!data || !Array.isArray(data.messages)) {
    return [];
  }

  for (const m of data.messages) {
    if (m.type !== "message") continue;

    const text = getMessageText(m.text);
    if (!text.startsWith("---")) continue;

    const parts = text.split("---");
    if (parts.length < 3) continue;

    const yamlSection = parts[1];
    const bodySection = parts.slice(2).join("---").trim();

    // Simple YAML parser
    const meta: StockMeta = {};
    const lines = yamlSection.split("\n");
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim() as keyof StockMeta;
      const val = line.slice(idx + 1).trim();
      meta[key] = val;
    }

    // Extract ticker from title (e.g. "EST - Estée Lauder Companies Inc. Analysis" -> "EST")
    let ticker = "";
    if (meta.title) {
      const dashIdx = meta.title.indexOf("-");
      if (dashIdx !== -1) {
        ticker = meta.title.slice(0, dashIdx).trim();
      } else {
        ticker = meta.title.trim();
      }
    }

    if (!ticker) {
      ticker = `UNKNOWN_${m.id}`;
    }

    const stockObj: StockIdea = {
      id: m.id,
      date: m.date,
      ticker,
      meta,
      body: bodySection
    };

    // Keep the latest post per ticker
    const existing = stocksMap.get(ticker);
    if (!existing || new Date(m.date) > new Date(existing.date)) {
      stocksMap.set(ticker, stockObj);
    }
  }

  return Array.from(stocksMap.values()).sort((a, b) => {
    const weightA = getRatingWeight(a.meta.rating);
    const weightB = getRatingWeight(b.meta.rating);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.ticker.localeCompare(b.ticker);
  });
}

// Render stock ideas into dynamic details-based HTML accordions with independent search scripts
export function renderStockAccordions(stocks: StockIdea[], nodeId: string): string {
  if (stocks.length === 0) {
    return `<p style="color:var(--meta);">No stock ideas available at this time.</p>`;
  }

  const searchInputId = `stock-search-${nodeId}`;
  const wrapperId = `stocks-wrapper-${nodeId}`;
  const accordionClass = `stock-accordion-item-${nodeId}`;

  return `
    <div class="search-container" style="margin-bottom: 1.5rem;">
      <input type="text" id="${searchInputId}" placeholder="Search by ticker or company name..." 
             style="width:100%; padding:0.8rem; border:1px solid var(--border); border-radius:6px; background:var(--bg-code); color:var(--text); font-family:inherit; outline:none; transition:border-color 0.2s;" />
    </div>
    
    <div id="${wrapperId}">
      ${stocks.map(stock => {
        const rating = stock.meta.rating || "🟡";
        let ratingColor = "var(--meta)";
        if (rating.includes("🔴")) ratingColor = "hsl(0, 75%, 60%)";
        else if (rating.includes("🟡")) ratingColor = "var(--accent)";
        else if (rating.includes("🟢")) ratingColor = "hsl(140, 60%, 50%)";

        const companyName = stock.meta.company_name || stock.ticker;
        const stockPrice = stock.meta.stock_price || "N/A";
        const peRatio = stock.meta.pe_ratio || "N/A";
        const marketCap = stock.meta.market_cap_formatted || (stock.meta.market_cap ? `$${stock.meta.market_cap}B` : "N/A");

        return `
          <details class="stock-accordion-item ${accordionClass}" data-ticker="${stock.ticker.toLowerCase()}" data-company="${companyName.toLowerCase()}" style="margin-bottom:1rem; border-color:var(--border);">
            <summary style="display:flex; justify-content:space-between; align-items:center; padding: 1rem;">
              <span>[${stock.ticker}] ${companyName}</span>
              <span style="color:${ratingColor}; font-weight:bold; margin-left: auto;">${rating}</span>
            </summary>
            <div class="content-body" style="padding:1.5rem; background:var(--surface);">
              <div style="margin-bottom:1.5rem; border-left:3px solid ${ratingColor}; padding-left:10px;">
                <div style="font-size:1.1rem; font-weight:bold; color:var(--text);">${companyName} (${stock.ticker})</div>
                <div style="font-size:0.85rem; color:var(--meta); margin-top:0.2rem;">
                  Rating: <span style="color:${ratingColor};">${rating}</span> &middot; Author: ${stock.meta.author || "Moe"} &middot; Date: ${stock.date.split('T')[0]}
                </div>
              </div>
              
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:1rem;">
                <div>
                  <span style="display:block; font-size:0.75rem; color:var(--meta);">Stock Price</span>
                  <span data-field="price" style="font-weight:bold; color:var(--text);">${stockPrice}</span>
                </div>
                <div>
                  <span style="display:block; font-size:0.75rem; color:var(--meta);">P/E Ratio</span>
                  <span data-field="pe" style="font-weight:bold; color:var(--text);">${peRatio}</span>
                </div>
                <div>
                  <span style="display:block; font-size:0.75rem; color:var(--meta);">Market Cap</span>
                  <span data-field="cap" style="font-weight:bold; color:var(--text);">${marketCap}</span>
                </div>
              </div>
              
              <div class="stock-analysis-text">
                ${formatStockBody(stock.body)}
              </div>
            </div>
          </details>
        `;
      }).join('\n')}
    </div>
    
    <script>
      (function() {
        const searchInput = document.getElementById('${searchInputId}');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const items = document.querySelectorAll('.${accordionClass}');
            
            items.forEach(item => {
              const ticker = item.getAttribute('data-ticker') || '';
              const company = item.getAttribute('data-company') || '';
              
              if (ticker.includes(query) || company.includes(query)) {
                item.style.display = '';
              } else {
                item.style.display = 'none';
              }
            });
          });
        }
      })();
    </script>
  `;
}

// Returns the fully constructed US stocks ContentNode for a specific rating filter
export function getUsStocksNode(filePath: string, ratingFilter: "green" | "yellow" | "red" = "green"): ContentNode {
  const allStocks = parseStockIdeas(filePath);
  
  let filteredStocks = allStocks;
  let id = "us-stocks";
  let title = "US Stock Ideas";
  
  if (ratingFilter === "green") {
    filteredStocks = allStocks.filter(s => s.meta.rating?.includes("🟢"));
    id = "us-stocks-green";
    title = `US Stock Ideas - Green/Buy (${filteredStocks.length})`;
  } else if (ratingFilter === "yellow") {
    filteredStocks = allStocks.filter(s => s.meta.rating?.includes("🟡"));
    id = "us-stocks-yellow";
    title = `US Stock Ideas - Yellow/Neutral (${filteredStocks.length})`;
  } else if (ratingFilter === "red") {
    filteredStocks = allStocks.filter(s => s.meta.rating?.includes("🔴"));
    id = "us-stocks-red";
    title = `US Stock Ideas - Red/Sell (${filteredStocks.length})`;
  }
  
  return {
    id,
    title,
    type: "ARTICLE",
    category: "US",
    content: renderStockAccordions(filteredStocks, id)
  };
}
