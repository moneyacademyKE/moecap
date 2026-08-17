// Fetch 1Y daily closes for all manifest tickers → history payload for KV.
// Transport twin of refresh-prices.ts: same manifest, same network reality
// (Yahoo only reachable from GH runners / local). Run daily.
//
// Usage: bun scripts/fetch-history.ts [output.json]

const WORKER = "https://moecap-prices.iamkingori.workers.dev";
const CHUNK = 12;

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "user-agent": "moecap-history-fetch/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 60)}`);
  return res.json();
}

function ymd(tsSeconds: number): string {
  return new Date(tsSeconds * 1000).toISOString().slice(0, 10);
}

function extractCloses(chart: any): { closes: number[]; first: string; last: string } | null {
  const result = chart?.chart?.result?.[0];
  const ts: number[] = result?.timestamp || [];
  const closesRaw: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
  const closes: number[] = [];
  const dates: string[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closesRaw[i];
    if (typeof c === "number" && isFinite(c) && c > 0) {
      closes.push(Math.round(c * 100) / 100);
      dates.push(ymd(ts[i]));
    }
  }
  if (closes.length < 30) return null; // too thin to chart
  return { closes, first: dates[0], last: dates[dates.length - 1] };
}

async function main() {
  const manifest = await fetchJson(`${WORKER}/manifest`);
  const tickers: string[] = Object.values(manifest.tickers).map((r: any) => r.ticker);
  console.log(`manifest: ${tickers.length} tickers`);

  const entries: Record<string, { closes: number[]; first: string; last: string }> = {};
  let failures = 0;
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const chunk = tickers.slice(i, i + CHUNK);
    const settled = await Promise.allSettled(
      chunk.map(async (t) => ({ t, h: extractCloses(await fetchJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=1y&interval=1d`
      )) }))
    );
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value.h) entries[r.value.t] = r.value.h;
      else failures++;
    }
    process.stdout.write(`\rfetched ${Math.min(i + CHUNK, tickers.length)}/${tickers.length}`);
  }
  console.log(`\nhistory: ${Object.keys(entries).length} ok, ${failures} failed`);
  if (failures > tickers.length * 0.1) throw new Error(`too many failures (${failures}) — aborting`);
  if (Object.keys(entries).length === 0) throw new Error("empty history — refusing to write");

  const payload = { asOf: new Date().toISOString(), entries };
  const out = process.argv[2] ?? "/tmp/history.json";
  await Bun.write(out, JSON.stringify(payload));
  const bytes = (await Bun.file(out).arrayBuffer()).byteLength;
  console.log(`wrote ${out}: ${Object.keys(entries).length} tickers, ${(bytes / 1024).toFixed(0)}KB`);
}

main();
