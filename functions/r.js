// GET /r — serve the MoneyAcademyKE rate card PDF as an automatic download.
// Static assets can't set Content-Disposition, so this Pages Function proxies
// the vendored file and adds the attachment header. The body is buffered so
// the response carries a true Content-Length (a streamed rewrap gets a bogus one).
const FILE = "/downloads/moneyacademyke-rate-card-2026.pdf";
const NAME = "MoneyAcademyKE-Rate-Card-2026.pdf";
const PDF_MAGIC = "%PDF-";

// Cloudflare's SPA fallback answers a missing asset with the homepage AND a 200,
// so `asset.ok` is not proof the file exists. A PDF must start with "%PDF-".
export function isPdf(buf) {
	const head = new Uint8Array(buf.slice(0, PDF_MAGIC.length));
	if (head.length !== PDF_MAGIC.length) return false;
	return String.fromCharCode(...head) === PDF_MAGIC;
}

export async function onRequest(context) {
	const asset = await context.env.ASSETS.fetch(new URL(FILE, context.request.url));
	if (!asset.ok) return new Response("Rate card not found", { status: 404 });
	const body = await asset.arrayBuffer();
	if (!isPdf(body)) return new Response("Rate card not found", { status: 404 });
	const headers = new Headers(asset.headers);
	headers.set("Content-Type", "application/pdf");
	headers.set("Content-Length", String(body.byteLength));
	headers.set("Content-Disposition", `attachment; filename="${NAME}"`);
	return new Response(body, { status: 200, headers });
}