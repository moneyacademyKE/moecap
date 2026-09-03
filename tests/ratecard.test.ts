import { expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";

const PDF = "data/ratecard/moneyacademyke-rate-card-2026.pdf";

test("rate card PDF is vendored at source and non-trivial", () => {
    expect(existsSync(PDF)).toBe(true);
    expect(statSync(PDF).size).toBeGreaterThan(100_000);
});

test("campaign button points at /r, never the stale GitHub raw", () => {
    const content = readFileSync("src/content.ts", "utf8");
    expect(content).toContain("url: '/r'");
    expect(content).not.toContain("raw/master/%40MoneyAcademyKE.pdf");
});

test("build mirrors the rate card into public/downloads", () => {
    const build = readFileSync("scripts/build-site.ts", "utf8");
    expect(build).toContain('"ratecard"');
    expect(build).toContain('"downloads"');
});

test("/r Pages Function forces an attachment download of the rate card", () => {
    const fn = readFileSync("functions/r.js", "utf8");
    expect(fn).toContain("attachment");
    expect(fn).toContain("downloads/moneyacademyke-rate-card-2026.pdf");
});
