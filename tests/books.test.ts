import { describe, test, expect } from "bun:test";
import { renderBooksAccordion } from "../src/books";
import { join } from "node:path";

const notesPath = join(import.meta.dir, "..", "data", "book-notes.json");

describe("book notes accordion", () => {
    test("renders all books with chapter accordions", async () => {
        const html = renderBooksAccordion(notesPath);
        expect(html).toContain('class="book-note"');
        expect(html).toContain("Optimal Thinking");
        expect(html).toContain("Market Makers");
        expect(html).toContain("The Psychology of Money"); // Housel
        expect(html).toContain("The Snowball"); // Schroeder
        // every book in the data renders all of its chapter accordions
        const books = JSON.parse(await Bun.file(notesPath).text()).books as { chapters: unknown[] }[];
        const expected = books.reduce((n, b) => n + b.chapters.length, 0);
        const chapterCount = (html.match(/<details class="chapter-note">/g) || []).length;
        expect(chapterCount).toBe(expected);
        expect(books.length).toBe(13);
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
