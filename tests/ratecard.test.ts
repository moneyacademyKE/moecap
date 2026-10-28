import { expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { isPdf, onRequest } from "../functions/r.js";

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

test("isPdf accepts a PDF header and rejects HTML", () => {
    expect(isPdf(new TextEncoder().encode("%PDF-1.4\n...").buffer)).toBe(true);
    expect(isPdf(new TextEncoder().encode("<!DOCTYPE html><html>").buffer)).toBe(false);
    expect(isPdf(new Uint8Array([0x25, 0x50]).buffer)).toBe(false);
});

// The regression that shipped: Cloudflare's SPA fallback returned the homepage
// with a 200 for a missing asset, and /r renamed 2.3 MB of HTML as a PDF.
const ctx = (body, ok = true) => ({
    request: { url: "https://moecapital.com/r" },
    env: { ASSETS: { fetch: async () => new Response(body, { status: ok ? 200 : 404 }) } },
});

test("/r returns the PDF with an attachment header", async () => {
    const res = await onRequest(ctx(new TextEncoder().encode("%PDF-1.4\nreal").buffer));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-length")).toBe("13");
});

test("/r 404s when the asset lookup falls back to HTML", async () => {
    const res = await onRequest(ctx("<html><body>homepage</body></html>"));
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain("<html>");
});

test("/r 404s when the asset lookup misses outright", async () => {
    const res = await onRequest(ctx("missing", false));
    expect(res.status).toBe(404);
});