import { readFileSync } from "node:fs";

interface ChapterNote {
    label: string;
    tldr: string;
    points: string[];
    quote?: string;
    action?: string;
}

interface BookNote {
    id: string;
    title: string;
    author: string;
    pages: number;
    source: string;
    tldr: string;
    takeaways: string[];
    chapters: ChapterNote[];
}

interface BookNotesFile {
    books: BookNote[];
}

const esc = (s: string): string =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderChapter(chapter: ChapterNote): string {
    return `
        <details class="chapter-note">
            <summary>${esc(chapter.label)}</summary>
            <div class="chapter-body">
                <p class="chapter-tldr">${esc(chapter.tldr)}</p>
                <ul>
                    ${chapter.points.map(p => `<li>${esc(p)}</li>`).join("\n                    ")}
                </ul>
                ${chapter.quote ? `<blockquote class="chapter-quote">&ldquo;${esc(chapter.quote)}&rdquo;</blockquote>` : ""}
                ${chapter.action ? `<p class="chapter-action"><strong>Action:</strong> ${esc(chapter.action)}</p>` : ""}
            </div>
        </details>`;
}

function renderBook(book: BookNote): string {
    return `
    <details class="book-note" id="book-${esc(book.id)}">
        <summary>📓 ${esc(book.title)} — ${esc(book.author)}</summary>
        <div class="book-body">
            <p class="book-tldr">${esc(book.tldr)}</p>
            <ul class="book-takeaways">
                ${book.takeaways.map(t => `<li>${esc(t)}</li>`).join("\n                ")}
            </ul>
            <p class="book-meta">${book.pages} pages · <a href="${esc(book.source)}" target="_blank">read the source PDF</a> · notes in Morgan Housel's voice</p>
            ${book.chapters.map(renderChapter).join("\n")}
        </div>
    </details>`;
}

export function renderBooksAccordion(jsonPath: string): string {
    const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as BookNotesFile;
    if (!data.books?.length) return "";
    return `
    <div class="book-notes-block">
        <h3 class="book-notes-header">📚 Book Notes — chapter-by-chapter, plain English</h3>
        ${data.books.map(renderBook).join("\n")}
    </div>`;
}
