import { readFileSync } from "node:fs";

/**
 * Renders the 13F directory block that sits on the homepage.
 *
 * The rest of the site composes static HTML strings in src/content.ts; this
 * block is generated from data/13f-superinvestors.json at build time instead,
 * because 100 managers x top holdings is data, not prose. Keeping it in one
 * module means the page's markup and its CSS ship together and view.ts stays
 * a pure dispatcher.
 */

export interface SiHolding {
  issuer: string;
  ticker: string;
  valueUsd: number;
  weightPct: number;
  shares: number;
}

export interface SiManager {
  name: string;
  role: string;
  tier: number;
  cik: string;
  period: string;
  periodEnd: string;
  filed: string;
  portfolioUsd: number;
  positions: number;
  holdings: SiHolding[];
  url: string;
}

const TIERS: Record<number, string> = {
  1: "Most quoted by analysts",
  2: "Widely followed",
  3: "Notable specialists",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  return `$${Math.round(usd).toLocaleString("en-US")}`;
}

function holdingsTable(holdings: SiHolding[]): string {
  if (!holdings.length) return "";
  const rows = holdings
    .map((h) => {
      const label = h.ticker
        ? `<a href="/?q=${encodeURIComponent(h.ticker)}">${esc(h.ticker)}</a>`
        : `<span class="si-dim">—</span>`;
      return `<tr><td>${esc(h.issuer)}</td><td class="si-tk">${label}</td><td class="si-num">${h.weightPct.toFixed(1)}%</td><td class="si-num">${money(h.valueUsd)}</td></tr>`;
    })
    .join("");
  return `<table class="si-holdings"><thead><tr><th>Holding</th><th>Ticker</th><th>Weight</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function managerRow(m: SiManager): string {
  const link = `<a class="si-edgar" href="${esc(m.url)}" target="_blank" rel="noopener">SEC filing ↗</a>`;
  return `<details class="si-item">
  <summary>
    <span class="si-name">${esc(m.name)}</span>
    <span class="si-facts">${money(m.portfolioUsd)} · ${m.positions} positions · ${esc(m.period)}</span>
  </summary>
  <p class="si-role">${esc(m.role)} — reportable long positions as of ${esc(m.periodEnd)}, filed ${esc(m.filed)}. ${link}</p>
  ${holdingsTable(m.holdings)}
</details>`;
}

const CSS = `<style>
  .si-wrap { margin-top: 1rem; }
  .si-lede { color: var(--meta); max-width: 62ch; }
  .si-stats { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.25rem 0 0.5rem; }
  .si-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem 0.9rem; min-width: 8rem; }
  .si-stat b { display: block; font-size: 1.15rem; color: var(--accent); line-height: 1.2; }
  .si-stat span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--meta); }
  .si-tier { margin-top: 1.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--meta); border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
  .si-item { border-bottom: 1px solid var(--border); }
  .si-item summary { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: baseline; justify-content: space-between; padding: 0.6rem 0.25rem; cursor: pointer; }
  .si-item summary::marker { color: var(--accent); }
  .si-name { font-weight: 600; }
  .si-facts { color: var(--meta); font-size: 0.82rem; font-variant-numeric: tabular-nums; }
  .si-role { color: var(--meta); font-size: 0.82rem; margin: 0.25rem 0 0.6rem; }
  .si-edgar { color: var(--link); }
  .si-holdings { width: 100%; border-collapse: collapse; margin: 0 0 1rem; font-size: 0.84rem; }
  .si-holdings th { text-align: left; font-weight: 600; color: var(--meta); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); padding: 0.3rem 0.4rem; }
  .si-holdings td { padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--border); }
  .si-holdings tr:last-child td { border-bottom: none; }
  .si-holdings .si-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .si-tk a { color: var(--link); }
  .si-dim { color: var(--meta); opacity: 0.5; }
  .si-note { color: var(--meta); font-size: 0.78rem; margin-top: 1.5rem; }
</style>`;

export function renderSuperinvestorDirectory(dataPath: string): string {
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as { managers: SiManager[] };
  const managers = data.managers.slice().sort((a, b) => b.portfolioUsd - a.portfolioUsd);
  const tracked = managers.reduce((sum, m) => sum + m.portfolioUsd, 0);
  const periods = Array.from(new Set(managers.map((m) => m.period))).sort().reverse();

  const stats = `<div class="si-stats">
      <div class="si-stat"><b>${managers.length}</b><span>managers tracked</span></div>
      <div class="si-stat"><b>${money(tracked)}</b><span>reportable positions</span></div>
      <div class="si-stat"><b>${esc(periods[0] || "")}</b><span>latest quarter</span></div>
      <div class="si-stat"><b>quarterly</b><span>refreshed from EDGAR</span></div>
    </div>`;

  const tiers = [1, 2, 3]
    .map((tier) => {
      const group = managers.filter((m) => m.tier === tier);
      if (!group.length) return "";
      return `<h3 class="si-tier">${TIERS[tier]} (${group.length})</h3>\n${group.map(managerRow).join("\n")}`;
    })
    .join("\n");

  return `${CSS}
<div class="si-wrap">
  <p class="si-lede">Every manager below files a 13F-HR with the SEC each quarter, which means their long positions are public 45 days after quarter end. We track the ${managers.length} names analysts quote most often — Berkshire, Baupost, Pershing Square, Himalaya, Fundsmith and the rest — and show what each one actually holds, not what they say they hold.</p>
  ${stats}
  ${tiers}
  <p class="si-note">Source: SEC EDGAR 13F-HR filings, pulled directly from each manager's filing index. Figures are reportable long positions only — they exclude shorts, cash, bonds, private holdings and non-US listings, so they are not firm AUM. Periods differ by manager: the deadline runs 45 days past quarter end, so two managers tracked side by side can be a quarter apart. A filing with an all-zero information table falls back to the prior quarter.</p>
</div>`;
}