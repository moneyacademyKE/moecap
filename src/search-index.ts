// Build-time search index: US stocks + NSE companies + book notes.
// Emits search-index.json consumed by src/search.js at runtime.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface SearchRow {
    t: string;   // ticker / short label
    n: string;   // display name
    k: "us" | "nse" | "book";
    s?: string;  // sector / author
    h: string;   // href target (hash or path)
}

interface UsMessage { title?: string; text?: string; date?: string }
interface UsExport { messages: UsMessage[] }

export function buildRows(base: string): SearchRow[] {
    const rows: SearchRow[] = [];

    // US stocks — meta YAML in message text
    const us = JSON.parse(readFileSync(join(base, "us-stocks.json"), "utf8")) as UsExport;
    for (const m of us.messages || []) {
        const text = m.text || "";
        const titleLine = text.match(/^title:\s*(.+)$/m);
        if (!titleLine) continue;
        const ticker = titleLine[1].split(" - ")[0].trim().toUpperCase();
        if (!/^[A-Z0-9.\-]+$/.test(ticker)) continue;
        const nameMatch = text.match(/^company_name:\s*(.+)$/m);
        const name = nameMatch ? nameMatch[1].trim() : titleLine[1];
        rows.push({ t: ticker, n: name, k: "us", h: "#us-" + ticker });
    }

    // NSE companies
    const nse = JSON.parse(readFileSync(join(base, "data", "nse-data.json"), "utf8")) as {
        companies: { ticker: string; name: string; sector?: string }[];
    };
    for (const c of nse.companies || []) {
        rows.push({ t: c.ticker, n: c.name, k: "nse", s: c.sector, h: "/nse/#" + c.ticker });
    }

    // Books + chapters
    const books = JSON.parse(readFileSync(join(base, "data", "book-notes.json"), "utf8")) as {
        books: { id: string; title: string; author: string; chapters: { label: string }[] }[];
    };
    for (const b of books.books || []) {
        rows.push({ t: "Book", n: b.title, k: "book", s: b.author, h: "#book-" + b.id });
        for (const ch of b.chapters || []) {
            rows.push({ t: "Ch", n: b.title + " — " + ch.label, k: "book", s: b.author, h: "#book-" + b.id });
        }
    }
    return rows;
}

export function writeIndex(base: string, publicDir: string): number {
    const rows = buildRows(base);
    mkdirSync(publicDir, { recursive: true });
    writeFileSync(join(publicDir, "search-index.json"), JSON.stringify(rows));
    return rows.length;
}
