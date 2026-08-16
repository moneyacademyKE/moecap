// NSE equity prices, scraped server-side from the AFX/Kwayisi table.
// Runs once per hour in the worker instead of per visitor through a CORS proxy.

export interface NsePayload {
  asOf: string;
  live: boolean;
  source: string;
  prices: Record<string, number>;
}

const KWAYISI_URL = "https://afx.kwayisi.org/nse/";

// Row shape: <tr><td><a href="...">TICKER</a></td><td><a ...>NAME</a></td><td>VOLUME</td><td>PRICE</td></tr>
// The Kwayisi table omits closing </td> tags; the regex matches that reality.
const ROW_RE =
  /<tr><td><a [^>]+>([A-Z0-9]+)<\/a><td><a [^>]+>[^<]+<\/a><td>(?:[0-9,]+)?<td>([0-9,]+(?:\.[0-9]+)?)/g;

export async function fetchNsePrices(): Promise<NsePayload> {
  const res = await fetch(KWAYISI_URL, {
    headers: { "user-agent": "moecap-prices/1.0 (NSE terminal hydration)" },
  });
  if (!res.ok) throw new Error(`kwayisi HTTP ${res.status}`);
  const html = await res.text();

  const prices: Record<string, number> = {};
  let m: RegExpExecArray | null;
  while ((m = ROW_RE.exec(html)) !== null) {
    prices[m[1]] = parseFloat(m[2].replace(/,/g, ""));
  }
  if (Object.keys(prices).length === 0) throw new Error("kwayisi parse: 0 rows");

  return {
    asOf: new Date().toISOString(),
    live: true,
    source: "afx.kwayisi.org",
    prices,
  };
}
