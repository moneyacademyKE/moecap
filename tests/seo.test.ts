import { expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { renderRobots, renderSitemap, renderFavicon } from "../scripts/build-seo";
import { writeTrustPages } from "../scripts/build-trust-pages";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("robots.txt allows the site, blocks the download route, points at the sitemap", () => {
    const r = renderRobots();
    expect(r).toContain("User-agent: *");
    expect(r).toContain("Allow: /");
    expect(r).toContain("Disallow: /r");
    expect(r).toContain("Sitemap: https://moecapital.com/sitemap.xml");
});

test("sitemap lists every published route with absolute urls", () => {
    const s = renderSitemap("2026-10-28");
    for (const p of ["/", "/nse", "/about", "/contact", "/privacy", "/terms"]) {
        expect(s).toContain(`<loc>https://moecapital.com${p}</loc>`);
    }
    expect(s.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(s.trimEnd().endsWith("</urlset>")).toBe(true);
});

test("favicon is a self-contained svg", () => {
    const f = renderFavicon();
    expect(f.startsWith("<svg")).toBe(true);
    expect(f).toContain('viewBox="0 0 64 64"');
    expect(f).toContain("#ffc93c");
});

test("trust pages render with head tags, footer nav and no invented scale claims", () => {
    const dir = mkdtempSync(join(tmpdir(), "moecap-trust-"));
    const written = writeTrustPages(dir);
    expect(written).toEqual(["about.html", "contact.html", "privacy.html", "terms.html"]);

    const about = readFileSync(join(dir, "about.html"), "utf8");
    expect(about).toContain('<link rel="canonical" href="https://moecapital.com/about">');
    expect(about).toContain('name="description"');
    expect(about).toContain("69 companies listed on the Nairobi Securities Exchange");
    expect(about).toContain('href="/r"');
    expect(about).not.toContain("small number");
    expect(about).not.toContain("AUM");

    for (const name of written) {
        const html = readFileSync(join(dir, name), "utf8");
        expect(html).toContain('href="/contact"');
        expect(html).toContain('href="/terms"');
        expect(html).toContain('href="/privacy"');
    }
});

test("homepage footer links the trust pages and the rate card", () => {
    const index = readFileSync("public/index.html", "utf8");
    for (const href of ["/about", "/contact", "/privacy", "/terms", "/r", "/nse"]) {
        expect(index).toContain(`href="${href}"`);
    }
});

test("homepage head carries the SEO contract", () => {
    const index = readFileSync("public/index.html", "utf8");
    expect(index).toContain('<meta name="description"');
    expect(index).toContain('property="og:title"');
    expect(index).toContain('property="og:image" content="https://moecapital.com/og.png"');
    expect(index).toContain('<link rel="canonical" href="https://moecapital.com/">');
    expect(index).toContain('<link rel="icon" href="/favicon.svg"');
});

test("build artifacts exist: robots, sitemap, 404, og card, trust pages", () => {
    for (const f of ["public/robots.txt", "public/sitemap.xml", "public/404.html", "public/og.png", "public/about.html"]) {
        expect(existsSync(f)).toBe(true);
    }
});