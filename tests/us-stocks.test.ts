import { describe, test, expect, afterAll } from "bun:test";
import { getMessageText, formatStockBody, parseStockIdeas } from "../src/us-stocks";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_DIR = join(import.meta.dir, ".tmp_stocks");

describe("US Stocks Engine Tests", () => {
  mkdirSync(FIXTURE_DIR, { recursive: true });

  afterAll(() => {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  test("getMessageText handles string and array structures", () => {
    expect(getMessageText("test-string")).toBe("test-string");
    
    const arrayFormat = [
      "plain text ",
      { text: "bold text", type: "bold" },
      " normal text"
    ];
    expect(getMessageText(arrayFormat)).toBe("plain text bold text normal text");
  });

  test("formatStockBody parses section headers, bullet lists, and paragraphs", () => {
    const rawBody = `Executive Summary
The company is doing extremely well.

What They Sell and Who Buys
They sell premium software to enterprise companies.

Competitive Edge
- Brand reputation
- High switching costs
- Proprietary algorithms

This is a regular concluding paragraph.`;

    const html = formatStockBody(rawBody);

    // Section headers
    expect(html).toContain("Executive Summary");
    expect(html).toContain("What They Sell and Who Buys");
    expect(html).toContain("Competitive Edge");
    expect(html).toContain("h4");

    // Lists
    expect(html).toContain("ul");
    expect(html).toContain("li");
    expect(html).toContain("Brand reputation");
    expect(html).toContain("High switching costs");

    // Paragraphs
    expect(html).toContain("<p");
    expect(html).toContain("This is a regular concluding paragraph.");
  });

  test("parseStockIdeas correctly parses and deduplicates messages", () => {
    // Write a mock json database to test our parser
    const mockDb = {
      messages: [
        {
          id: 1,
          type: "message",
          date: "2026-04-20T10:00:00",
          text: `---\ntitle: AAPL - Apple Inc. Analysis\ncompany_name: Apple Inc.\nstock_price: $170.00\npe_ratio: 28.0\nauthor: Moe\nrating: 🟢\nmarket_cap: 2700\n---\n\nExecutive Summary\nApple is great.`
        },
        {
          id: 2,
          type: "message",
          date: "2026-04-21T10:00:00",
          text: `---\ntitle: AAPL - Apple Inc. Analysis\ncompany_name: Apple Inc.\nstock_price: $175.00\npe_ratio: 29.0\nauthor: Moe\nrating: 🟢\nmarket_cap: 2800\n---\n\nExecutive Summary\nApple is still great, updated.`
        },
        {
          id: 3,
          type: "message",
          date: "2026-04-20T10:00:00",
          text: `---\ntitle: MSFT - Microsoft Analysis\ncompany_name: Microsoft Corp.\nstock_price: $400.00\npe_ratio: 35.0\nauthor: Moe\nrating: 🟢\nmarket_cap: 3000\n---\n\nExecutive Summary\nMicrosoft description.`
        }
      ]
    };

    const tempFilePath = join(FIXTURE_DIR, "mock-us-stocks.json");
    writeFileSync(tempFilePath, JSON.stringify(mockDb), "utf-8");

    const parsed = parseStockIdeas(tempFilePath);

    // Deduplication check: should have 2 unique stocks (AAPL and MSFT)
    expect(parsed.length).toBe(2);

    // AAPL should be sorted first (alphabetical sorting by ticker)
    expect(parsed[0].ticker).toBe("AAPL");
    // Should have kept the latest record (id: 2, date: 2026-04-21)
    expect(parsed[0].id).toBe(2);
    expect(parsed[0].meta.stock_price).toBe("$175.00");
    expect(parsed[0].body).toContain("Apple is still great, updated.");

    // MSFT should be sorted second
    expect(parsed[1].ticker).toBe("MSFT");
    expect(parsed[1].meta.company_name).toBe("Microsoft Corp.");
  });

  test("parseStockIdeas sorts green rating first, then yellow, then red", () => {
    const ratingMockDb = {
      messages: [
        {
          id: 1,
          type: "message",
          date: "2026-04-20T10:00:00",
          text: `---\ntitle: RED - Red Ticker\nrating: 🔴\n---\n\nExecutive Summary\nRed pick.`
        },
        {
          id: 2,
          type: "message",
          date: "2026-04-20T10:00:00",
          text: `---\ntitle: GRN - Green Ticker\nrating: 🟢\n---\n\nExecutive Summary\nGreen pick.`
        },
        {
          id: 3,
          type: "message",
          date: "2026-04-20T10:00:00",
          text: `---\ntitle: YEL - Yellow Ticker\nrating: 🟡\n---\n\nExecutive Summary\nYellow pick.`
        },
        {
          id: 4,
          type: "message",
          date: "2026-04-20T10:00:00",
          text: `---\ntitle: AAA - Another Green Ticker\nrating: 🟢\n---\n\nExecutive Summary\nAnother green pick.`
        }
      ]
    };

    const tempFilePath = join(FIXTURE_DIR, "mock-rating-stocks.json");
    writeFileSync(tempFilePath, JSON.stringify(ratingMockDb), "utf-8");

    const parsed = parseStockIdeas(tempFilePath);
    
    expect(parsed.length).toBe(4);
    // Green picks first, sorted alphabetically within their group
    expect(parsed[0].ticker).toBe("AAA"); // Green AAA
    expect(parsed[1].ticker).toBe("GRN"); // Green GRN
    expect(parsed[2].ticker).toBe("YEL"); // Yellow YEL
    expect(parsed[3].ticker).toBe("RED"); // Red RED
  });

  test("formatStockBody splits single-spaced numbered descriptions into separate paragraphs", () => {
    const rawBody = `Executive Summary: This is summary.
1. What They Sell and Who Buys: They sell flash memory.
2. How They Make Money (Revenue streams); By high volume sales.
Some closing notes here.`;

    const html = formatStockBody(rawBody);

    // Section title matches
    expect(html).toContain("color: var(--accent)");
    expect(html).toContain("Executive Summary:");
    expect(html).toContain("1. What They Sell and Who Buys:");
    expect(html).toContain("2. How They Make Money (Revenue streams):");
    
    // Check that description text is NOT in h4 (colored), but in p (uncolored)
    expect(html).not.toContain("Executive Summary: This is summary.</h4>");
    expect(html).not.toContain("1. What They Sell and Who Buys: They sell flash memory.</h4>");
    expect(html).not.toContain("2. How They Make Money (Revenue streams): By high volume sales.</h4>");
    
    // Check for double line breaks (paragraphs with margin)
    expect(html).toContain('margin: 0.5rem 0 1.2rem 0');
    expect(html).toContain("<p");
    expect(html).toContain("This is summary.");
    expect(html).toContain("They sell flash memory.");
    expect(html).toContain("By high volume sales.");
    expect(html).toContain("Some closing notes here.");
  });
});
