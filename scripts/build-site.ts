import { renderPage } from "../src/view";
import { getManifest } from "../src/assets";
import { CONTENT, METADATA } from "../src/content";
import { getUsStocksNode } from "../src/us-stocks";
import { buildNsePage } from "../src/nse";
import { renderBooksAccordion } from "../src/books";
import { writeFileSync, existsSync, mkdirSync, rmSync, cpSync, copyFileSync } from "node:fs";
import * as fs from "node:fs";
import { join } from "node:path";
import type { ContentNode } from "../src/assets";

const BASE_PATH = process.cwd();
const ASSET_DIRECTORIES = ["lib", "fx"];

const PUBLIC_DIR = join(BASE_PATH, "public");

try {
    console.log("🚀 Starting unified site build...");

    // 0. Prepare public directory
    if (existsSync(PUBLIC_DIR)) {
        console.log("🧹 Cleaning public directory...");
        rmSync(PUBLIC_DIR, { recursive: true, force: true });
    }
    mkdirSync(PUBLIC_DIR, { recursive: true });

    // 1. Get Assets from filesystem
    const assets = getManifest(BASE_PATH, ASSET_DIRECTORIES);
    const categories = Array.from(new Set(assets.map(a => a.category)));

    const assetNodes: ContentNode[] = categories.map(cat => ({
        id: cat.toLowerCase(),
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        type: 'ASSET_LIST',
        category: 'ASSETS',
        assets: assets.filter(a => a.category === cat)
    }));

    // 2. Merge with Static Content (integrating dynamic US stock ideas split by rating)
    const stocksJsonPath = join(BASE_PATH, "us-stocks.json");
    console.log(`📈 Dynamically parsing and integrating US stock ideas from: ${stocksJsonPath}`);
    const resolvedContent = CONTENT.flatMap(node => {
        if (node.id === "us-stocks") {
            return [
                getUsStocksNode(stocksJsonPath, "green"),
                getUsStocksNode(stocksJsonPath, "yellow"),
                getUsStocksNode(stocksJsonPath, "red")
            ];
        }
        return [node];
    });

    const allNodes = [...resolvedContent, ...assetNodes];

    // 2b. Attach book-notes accordion to the lib node
    const libNode = allNodes.find(n => n.id === "lib");
    if (libNode) {
        const bookNotesPath = join(BASE_PATH, "data", "book-notes.json");
        libNode.extraHtml = renderBooksAccordion(bookNotesPath);
        console.log(`📚 Book notes accordion attached to lib node`);
    }

    // 3. Render and Write
    const html = renderPage(allNodes, METADATA);
    const withHydration = html.replace(
        "</body>",
        '    <script src="/hydrate.js" defer></script>\n    <script src="/glossary.js" defer></script>\n    <script src="/search.js" defer></script>\n    <script src="/watchlist.js" defer></script>\n    <script src="/charts.js" defer></script>\n</body>'
    );

    const outputPath = join(PUBLIC_DIR, "index.html");
    writeFileSync(outputPath, withHydration);
    copyFileSync(join(BASE_PATH, "src", "hydrate.js"), join(PUBLIC_DIR, "hydrate.js"));
    copyFileSync(join(BASE_PATH, "src", "glossary.js"), join(PUBLIC_DIR, "glossary.js"));
    copyFileSync(join(BASE_PATH, "data", "glossary.json"), join(PUBLIC_DIR, "glossary.json"));
    copyFileSync(join(BASE_PATH, "src", "search.js"), join(PUBLIC_DIR, "search.js"));
    copyFileSync(join(BASE_PATH, "src", "watchlist.js"), join(PUBLIC_DIR, "watchlist.js"));
    copyFileSync(join(BASE_PATH, "src", "charts.js"), join(PUBLIC_DIR, "charts.js"));
    const { writeIndex } = await import("../src/search-index");
    const nRows = writeIndex(BASE_PATH, PUBLIC_DIR);
    console.log(`🔎 Search index: ${nRows} rows`);

    // 4. Compile NSE terminal
    buildNsePage(PUBLIC_DIR);
    const annSrc = join(BASE_PATH, "data", "nse-announcements");
    if (existsSync(annSrc)) cpSync(annSrc, join(PUBLIC_DIR, "nse", "announcements"), { recursive: true });

    // 5. Mirror assets to public
    for (const dir of ASSET_DIRECTORIES) {
        const src = join(BASE_PATH, dir);
        const dest = join(PUBLIC_DIR, dir);
        console.log(`📂 Mirroring ${src} -> ${dest}`);
        cpSync(src, dest, { recursive: true });
    }

    console.log(`✅ Unified site built successfully in: ${PUBLIC_DIR}`);
    console.log(`📊 Nodes: ${allNodes.length} (Static: ${CONTENT.length}, AssetsGroups: ${assetNodes.length})`);
} catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
}
