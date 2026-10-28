// Static SEO + trust artifacts written on every build. One module so
// build-site.ts stays a wiring file (rich-hickey: data over duplication).
import { writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://moecapital.com";
const ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: "/", priority: "1.0", changefreq: "hourly" },
    { path: "/nse", priority: "0.9", changefreq: "daily" },
    { path: "/about", priority: "0.7", changefreq: "monthly" },
    { path: "/contact", priority: "0.7", changefreq: "monthly" },
    { path: "/privacy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

export function renderRobots(): string {
    return ["User-agent: *", "Allow: /", "Disallow: /r", "", `Sitemap: ${SITE}/sitemap.xml`, ""].join("\n");
}

export function renderSitemap(lastmod: string): string {
    const urls = ROUTES.map(
        (r) =>
            `  <url>\n    <loc>${SITE}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
            `    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderFavicon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Moe Capital">
  <rect width="64" height="64" rx="14" fill="#0b1216"/>
  <path d="M14 46V18h6l12 17 12-17h6v28h-6V29L32 44 20 29v17z" fill="#ffc93c"/>
</svg>
`;
}

export function render404(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Moe Capital</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#0b1216; color:#e8eef2; font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
  main { text-align:center; padding:2rem; max-width:32rem; }
  h1 { font-size:1.6rem; margin:0 0 .5rem; color:#ffc93c; }
  p { color:#9fb0bd; margin:0 0 1.5rem; }
  a { color:#7ee0b8; }
</style>
</head>
<body>
<main>
  <h1>Page not found</h1>
  <p>That page isn't here. The research library, the NSE ROIC Terminal and the campaign rate card all still are.</p>
  <p><a href="/">Return to Moe Capital</a> · <a href="/nse">NSE ROIC Terminal</a></p>
</main>
</body>
</html>
`;
}

export function writeSeoFiles(publicDir: string, baseDir = process.cwd()): string[] {
    mkdirSync(publicDir, { recursive: true });
    const written: string[] = [];
    const put = (name: string, body: string) => {
        writeFileSync(join(publicDir, name), body, "utf8");
        written.push(name);
    };
    put("robots.txt", renderRobots());
    put("sitemap.xml", renderSitemap(new Date().toISOString().slice(0, 10)));
    put("favicon.svg", renderFavicon());
    put("404.html", render404());

    // Social card: committed as a binary asset, mirrored like the rate card.
    const og = join(baseDir, "data", "og.png");
    if (existsSync(og)) {
        copyFileSync(og, join(publicDir, "og.png"));
        written.push("og.png");
    }
    return written;
}