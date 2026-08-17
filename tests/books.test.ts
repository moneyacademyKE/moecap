import { describe, test, expect } from "bun:test";
import { renderBooksAccordion } from "../src/books";
import { join } from "node:path";

const notesPath = join(import.meta.dir, "..", "data", "book-notes.json");

describe("book notes accordion", () => {
    test("renders both books with chapter accordions", () => {
        const html = renderBooksAccordion(notesPath);
        expect(html).toContain('class="book-note"');
        expect(html).toContain("Optimal Thinking");
        expect(html).toContain("Market Makers");
        // 9 OT chapters + 8 MM arcs = 17 chapter accordions
        const chapterCount = (html.match(/<details class="chapter-note">/g) || []).length;
        expect(chapterCount).toBe(17);
    });

    test("escapes HTML in authored note text", () => {
        const html = renderBooksAccordion(notesPath);
        expect(html).toContain("&amp;"); // ampersand in MM title escaped
        expect(html).not.toMatch(/<details class="chapter-note">\s*<summary>[^<]*<script/);
    });

    test("links each book to its source PDF in lib/", () => {
        const html = renderBooksAccordion(notesPath);
        expect(html).toContain('href="/lib/OptimalThinking.pdf"');
        expect(html).toContain('href="/lib/howthemarkerts.pdf.pdf"');
    });

    test("returns empty string for a file with no books", () => {
        const empty = { books: [] };
        const tmp = join(import.meta.dir, "fixtures-empty-books.json");
        require("node:fs").writeFileSync(tmp, JSON.stringify(empty));
        const html = renderBooksAccordion(tmp);
        require("node:fs").rmSync(tmp);
        expect(html).toBe("");
    });
});
