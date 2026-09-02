// GET /r — serve the MoneyAcademyKE rate card PDF as an automatic download.
// Static assets can't set Content-Disposition, so this Pages Function proxies
// the vendored file and adds the attachment header.
const FILE = "/downloads/moneyacademyke-rate-card-2026.pdf";
const NAME = "MoneyAcademyKE-Rate-Card-2026.pdf";

export async function onRequest(context) {
	const asset = await context.env.ASSETS.fetch(new URL(FILE, context.request.url));
	if (!asset.ok) return new Response("Rate card not found", { status: 404 });
	const headers = new Headers(asset.headers);
	headers.set("Content-Disposition", `attachment; filename="${NAME}"`);
	return new Response(asset.body, { status: 200, headers });
}
