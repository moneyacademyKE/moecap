import { describe, test, expect } from "bun:test";
import { buildRows } from "../src/search-index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const base = join(import.meta.dir, "..");

describe("search + watchlist", () => {
    test("index covers US, NSE, and books with valid rows", () => {
        const rows = buildRows(base);
        const us = rows.filter(r => r.k === "us");
        const nse = rows.filter(r => r.k === "nse");
        const books = rows.filter(r => r.k === "book");
        expect(us.length).toBe(212);
        expect(nse.length).toBeGreaterThanOrEqual(60);
        expect(books.length).toBeGreaterThanOrEqual(100); // 13 books + chapters
        for (const r of rows) {
            expect(r.t.length).toBeGreaterThan(0);
            expect(r.n.length).toBeGreaterThan(0);
            expect(["us", "nse", "book"]).toContain(r.k);
            expect(r.h.length).toBeGreaterThan(1);
        }
        const tickers = us.map(r => r.t);
        expect(new Set(tickers).size).toBe(212); // unique
        expect(tickers).toContain("AAPL");
        expect(tickers).toContain("SCOM" === "SCOM" ? "ADI" : "ADI");
        // NSE hrefs deep-link via the terminal's existing hash routing
        const scom = nse.find(r => r.t === "SCOM");
        expect(scom?.h).toBe("/nse/#SCOM");
    });

    test("built pages load the scripts and index", () => {
        const idx = readFileSync(join(base, "public", "search-index.json"), "utf8");
        const parsed = JSON.parse(idx);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBeGreaterThan(350);
        const home = readFileSync(join(base, "public", "index.html"), "utf8");
        expect(home).toContain('<script src="/search.js" defer></script>');
        expect(home).toContain('<script src="/watchlist.js" defer></script>');
        const nse = readFileSync(join(base, "public", "nse", "index.html"), "utf8");
        expect(nse).toContain('<script src="/search.js" defer></script>');
        expect(nse).toContain('<script src="/watchlist.js" defer></script>');
        for (const f of ["search.js", "watchlist.js"]) {
            expect(readFileSync(join(base, "public", f), "utf8").length).toBeGreaterThan(1000);
        }
    });

    test("search.js escapes rendered rows and opens entries by hash", () => {
        const src = readFileSync(join(base, "src", "search.js"), "utf8");
        expect(src).toContain("us-([A-Z0-9.\\-]+)");  // hash → open US details
        expect(src).toContain("details[data-ticker");     // opens the entry
        expect(src).toContain("book-");                   // opens book accordion
        expect(src).toContain("&lt;");                    // escaping in results
    });

    test("watchlist.js persists to localStorage and reads worker prices", () => {
        const src = readFileSync(join(base, "src", "watchlist.js"), "utf8");
        expect(src).toContain('localStorage.getItem');
        expect(src).toContain("moecap-watch");
        expect(src).toContain("/prices");
        expect(src).toContain("/nse");
        expect(src).toContain("&amp;"); // escaping by construction
    });
});
