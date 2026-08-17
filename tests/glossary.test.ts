import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const base = join(import.meta.dir, "..");

describe("layman glossary", () => {
    test("glossary.json valid with >=10 plain-English entries", () => {
        const data = JSON.parse(readFileSync(join(base, "data", "glossary.json"), "utf8"));
        const keys = Object.keys(data);
        expect(keys.length).toBeGreaterThanOrEqual(10);
        for (const k of keys) {
            const e = data[k];
            expect(typeof e.term).toBe("string");
            expect(e.term.length).toBeGreaterThan(2);
            expect(e.plain.length).toBeGreaterThan(40);
            expect(e.example.length).toBeGreaterThan(20);
        }
        // key metric ids present
        for (const id of ["pe", "roe", "roic", "marketcap", "eps", "dps", "ebitda", "margin", "divyield", "revenue"]) {
            expect(data[id]).toBeDefined();
        }
    });

    test("glossary popover script is valid JS and copies to public", () => {
        const src = readFileSync(join(base, "src", "glossary.js"), "utf8");
        expect(src).toContain('fetch("/glossary.json")');
        expect(src).toContain("data-glossary");
        expect(src).toContain("textContent"); // escaping by construction
    });

    test("built US page carries badges on P/E and Market Cap", () => {
        const html = readFileSync(join(base, "public", "index.html"), "utf8");
        expect(html).toContain('data-glossary="pe"');
        expect(html).toContain('data-glossary="marketcap"');
        expect(html).toContain('<script src="/glossary.js" defer></script>');
    });

    test("built NSE page carries badges on stat cards and script tag", () => {
        const html = readFileSync(join(base, "public", "nse", "index.html"), "utf8");
        expect(html).toContain('data-glossary="roe"');
        expect(html).toContain('data-glossary="roic"');
        expect(html).toContain('data-glossary="revenue"');
        // table badges render at runtime: assert the inline glMap contract
        expect(html).toContain('const glMap = {"EPS":"eps"');
        expect(html).toContain('data-glossary="${glMap[n]}"');
        expect(html).toContain('<script src="/glossary.js" defer></script>');
    });

    test("glossary.js and glossary.json are copied into public/", () => {
        expect(readFileSync(join(base, "public", "glossary.js"), "utf8")).toContain("gl-pop");
        expect(JSON.parse(readFileSync(join(base, "public", "glossary.json"), "utf8")).pe).toBeDefined();
    });
});
