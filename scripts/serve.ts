import { join } from "node:path";
import { existsSync, statSync } from "node:fs";

const PORT = parseInt(process.env.PORT || "3000", 10);
const PUBLIC_DIR = join(process.cwd(), "public");

if (!existsSync(PUBLIC_DIR)) {
  console.error("❌ Error: 'public/' directory does not exist. Run 'bb build' first.");
  process.exit(1);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);

    // Normalize path
    if (pathname.endsWith("/")) {
      pathname += "index.html";
    }

    let filePath = join(PUBLIC_DIR, pathname);

    // If directory requested without trailing slash, check for index.html inside it
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    // Direct file resolution
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      return new Response(Bun.file(filePath));
    }

    // Fallback attempt for clean routing e.g. /nse -> /nse/index.html
    const nseFallback = join(filePath, "index.html");
    if (existsSync(nseFallback)) {
      return new Response(Bun.file(nseFallback));
    }

    return new Response("404 Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }
});

console.log(`\n⚡ Moe Capital Local Dev Server running at:`);
console.log(`   🌐 http://localhost:${server.port}`);
console.log(`   📊 Terminal: http://localhost:${server.port}/nse`);
console.log(`   Press Ctrl+C to stop.\n`);
