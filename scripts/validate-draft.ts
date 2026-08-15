// Validate us-stocks-draft.json through the repo's real parser (src/us-stocks.ts).
// Usage: bun run scripts/validate-draft.ts <path-to-draft.json>
import { parseStockIdeas } from "../src/us-stocks";

const path = process.argv[2];
if (!path) { console.error("usage: bun run scripts/validate-draft.ts <draft.json>"); process.exit(2); }

const stocks = parseStockIdeas(path);
console.log("parsed:", stocks.length);

const knownHeaders = [
  "Executive Summary","What They Sell and Who Buys","How They Make Money","Revenue Quality",
  "Cost Structure","Capital Intensity","Growth Drivers","Competitive Edge",
  "Industry Structure and Position","Unit Economics and Key KPIs",
  "Capital Allocation and Balance Sheet","Risks and Failure Modes",
  "Valuation and Expected Return Profile","Catalysts and Time Horizon"
];

let fail = 0;
const headerLike = (block: string) => {
  const line = block.split("\n")[0].trim();
  return /^\d+\.\s+[^:\n;]+:$/.test(line) ||
         knownHeaders.some(kh => line.replace(/:$/, "").toLowerCase().includes(kh.toLowerCase()));
};

for (const s of stocks) {
  const problems: string[] = [];
  if (/^UNKNOWN_/.test(s.ticker)) problems.push("ticker-extraction-failed");
  const blocks = s.body.split(/\n\s*\n/).map((b: string) => b.trim()).filter(Boolean);
  const headers = blocks.filter(headerLike).length;
  if (headers < 14) problems.push(`sections ${headers}/14`);
  if (!s.body.includes("Trade This Idea:")) problems.push("missing:trade-links");
  if (!/- <a href=/.test(s.body)) problems.push("no-anchor-links");
  if (problems.length) { console.log("FAIL", s.ticker, problems.join(",")); fail++; }
}

const dupes = stocks.length - new Set(stocks.map(s => s.ticker)).size;
if (dupes > 0) { console.log("FAIL duplicate tickers:", dupes); fail++; }

const g = stocks.filter(s => s.meta.rating?.includes("🟢")).length;
const y = stocks.filter(s => s.meta.rating?.includes("🟡")).length;
const r = stocks.filter(s => s.meta.rating?.includes("🔴")).length;
console.log(`ratings: green ${g} / yellow ${y} / red ${r}`);
console.log(fail === 0 ? "ALL PASS" : `${fail} entries failed`);
process.exit(fail === 0 ? 0 : 1);
