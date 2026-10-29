import { describe, expect, test } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderManagerLetters, letterKind, type LetterEntry } from "../src/manager-letters";

function entry(over: Partial<LetterEntry>): LetterEntry {
  return {
    manager: "Test Manager",
    url: "https://example.com/letters",
    kind: "page",
    bytes: 12000,
    title: "Letters",
    period: null,
    ...over,
  };
}

function fixture(managers: LetterEntry[], noPublicLetters: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), "ml-"));
  const p = join(dir, "letters.json");
  writeFileSync(p, JSON.stringify({ generatedAt: "2026-10-29", managers, noPublicLetters }));
  return p;
}

describe("letterKind", () => {
  test("classifies a PDF as a filed letter regardless of its URL", () => {
    expect(letterKind(entry({ kind: "pdf", url: "https://x.com/a/b.pdf" }))).toBe("pdf");
  });

  test("separates letter archives from research desks and firm news", () => {
    expect(letterKind(entry({ url: "https://x.com/shareholder-letters" }))).toBe("letters");
    expect(letterKind(entry({ url: "https://x.com/insights" }))).toBe("research");
    expect(letterKind(entry({ url: "https://x.com/presentations/" }))).toBe("firm");
  });

  test("treats a newsletter index as a letter archive, not research", () => {
    expect(letterKind(entry({ url: "https://www.akrecapital.com/news" }))).toBe("firm");
    expect(letterKind(entry({ url: "https://x.com/newsletter" }))).toBe("letters");
  });
});

describe("renderManagerLetters", () => {
  test("renders only managers with a link and counts coverage honestly", () => {
    const html = renderManagerLetters(
      fixture(
        [
          entry({ manager: "Maverick Capital", url: "https://www.maverickcapital.com/letters" }),
          entry({ manager: "Oaktree Capital", url: "https://www.oaktreecapital.com/insights/memos" }),
        ],
        ["Citadel", "Millennium", "Point72", "Duquesne"],
      ),
    );

    // 2 of 6, not 2 of 2 and not 6 of 6.
    expect(html).toContain("2 of the 6 managers in the 13F directory publish something");
    expect(html).toContain("Maverick Capital");
    expect(html).toContain("Oaktree Capital");
    // The non-publishers are counted, never listed.
    expect(html).not.toContain("Citadel");
    expect(html).not.toContain("Millennium");
  });

  test("uses the plain h3 + ul + li shape of the hand-written quarters", () => {
    const html = renderManagerLetters(
      fixture([
        entry({ kind: "pdf", title: "", period: "Q3 2026" }),
        entry({ url: "https://x.com/letters", title: "Shareholder Letters" }),
      ]),
    );

    expect(html).toContain("<h3>Quarterly Letters</h3>\n      <ul>");
    expect(html).toContain("<li><a href=");
    // No bespoke block: no styles, no cards, no chips.
    expect(html).not.toContain("<style");
    expect(html).not.toContain('class="ml-');
    expect(html).not.toContain("<div");
  });

  test("drops site-root entries even if they reach the renderer", () => {
    const html = renderManagerLetters(
      fixture([entry({ manager: "Rooty Partners", url: "https://rooty.com/", root: true })], ["Rooty Partners"]),
    );
    expect(html).not.toContain('<a href="https://rooty.com/"');
    expect(html).toContain("0 of the 1 managers");
  });

  test("describes each link the way the old section did: short and specific", () => {
    const html = renderManagerLetters(
      fixture([
        entry({ manager: "Fiduciary Management", kind: "pdf", title: "", period: "Q3 2026" }),
        entry({ manager: "Royce", url: "https://x.com/letters", title: "3Q26 Small-Cap Recap &#8212; Royce" }),
        entry({ manager: "Diamond Hill", url: "https://x.com/insights", title: "Insights | Diamond Hill" }),
      ]),
    );

    expect(html).toContain("Fiduciary Management</a> — quarterly letter, Q3 2026");
    expect(html).toContain("Royce</a> — 3Q26 Small-Cap Recap");
    expect(html).toContain("Diamond Hill</a> — Insights");
  });

  test("never repeats the firm name back as the description", () => {
    const html = renderManagerLetters(
      fixture([
        entry({ manager: "Giverny Capital", title: "Letters to our partners │Giverny Capital" }),
        entry({ manager: "Maverick Capital", title: "Maverick Capital" }),
      ]),
    );
    expect(html).toContain("Giverny Capital</a> — Letters to our partners");
    expect(html).toContain("Maverick Capital</a> — letter archive");
  });

  test("omits a group header when nothing landed in it", () => {
    const html = renderManagerLetters(fixture([entry({ url: "https://x.com/letters" })]));
    expect(html).toContain("Letter Archives");
    expect(html).not.toContain("Research &amp; Commentary");
    expect(html).not.toContain("Firm News");
  });

  test("escapes manager names and URLs", () => {
    const html = renderManagerLetters(
      fixture([entry({ manager: "Smith & Sons <Fund>", url: "https://x.com/letters?a=1&b=2" })]),
    );
    expect(html).toContain("Smith &amp; Sons &lt;Fund&gt;");
    expect(html).toContain("a=1&amp;b=2");
  });
});