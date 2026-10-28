// Trust pages (/about, /contact, /privacy, /terms) rendered at build time.
// Static HTML files: Cloudflare Pages serves about.html at /about, so no router.
// Every claim here is checkable against this repo or the live site — no
// invented licensing, team size, AUM or performance numbers.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://moecapital.com";

const CHANNELS = {
    whatsapp: "https://wa.me/25469000111",
    telegram: "https://t.me/MoneyAcademyKE",
    x: "https://twitter.com/MoneyAcademyKE",
    substack: "https://moneyacademy.substack.com/",
};

const NAV: Array<[string, string]> = [
    ["/", "Home"],
    ["/nse", "NSE Terminal"],
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
];

const CSS = `
:root{--bg:#0b1216;--surface:#111d24;--accent:#ffc93c;--link:#7ee0b8;--text:#e8eef2;--meta:#9fb0bd;--border:#22343e}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:17px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
a{color:var(--link);text-decoration:none}
a:hover{text-decoration:underline}
header{border-bottom:1px solid var(--border);padding:1rem 1.5rem}
header nav{max-width:46rem;margin:0 auto;display:flex;flex-wrap:wrap;gap:1rem;font-size:.85rem}
header nav a:first-child{color:var(--accent);font-weight:600}
main{max-width:46rem;margin:0 auto;padding:3rem 1.5rem 4rem}
h1{font-size:2rem;line-height:1.2;margin:0 0 .5rem}
h2{font-size:1.15rem;margin:2.4rem 0 .6rem;color:var(--accent)}
h3{font-size:1rem;margin:1.6rem 0 .4rem}
p,li{color:var(--text)}
.lede{color:var(--meta);font-size:1.05rem;margin:0 0 2rem}
ul{padding-left:1.2rem}
li{margin:.35rem 0}
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.1rem 1.25rem;margin:1.2rem 0}
.card p:last-child{margin-bottom:0}
small,.fine{color:var(--meta);font-size:.85rem}
footer{border-top:1px solid var(--border);padding:1.5rem;text-align:center;color:var(--meta);font-size:.8rem}
footer a{color:var(--meta)}
table{width:100%;border-collapse:collapse;font-size:.92rem;margin:1rem 0}
th,td{text-align:left;padding:.55rem .6rem;border-bottom:1px solid var(--border)}
th{color:var(--meta);font-weight:600}
`;

function shell(opts: { title: string; description: string; slug: string; body: string }): string {
    const nav = NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("\n      ");
    const footer = NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join(" · ");
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${opts.title} | Moe Capital</title>
<meta name="description" content="${opts.description}">
<link rel="canonical" href="${SITE}${opts.slug}">
<meta name="theme-color" content="#0b1216">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="${opts.title} | Moe Capital">
<meta property="og:description" content="${opts.description}">
<meta property="og:url" content="${SITE}${opts.slug}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@MoneyAcademyKE">
<style>${CSS}</style>
</head>
<body>
<header><nav>
      ${nav}
</nav></header>
<main>
${opts.body}
</main>
<footer>${footer}</footer>
</body>
</html>
`;
}

const ABOUT = `
<h1>About Moe Capital</h1>
<p class="lede">Independent financial research, published in the open. Based in Nairobi, Kenya.</p>

<p>Moe Capital publishes equity research and runs the <a href="/nse">NSE ROIC Terminal</a>, a live dashboard covering 69 companies listed on the Nairobi Securities Exchange. We also publish US equity ideas, book notes and a weekly idea feed.</p>

<h2>What is published here</h2>
<table>
  <tr><th>Surface</th><th>What it holds</th></tr>
  <tr><td><a href="/nse">NSE ROIC Terminal</a></td><td>Return on invested capital, multi-year statements and efficiency metrics for 69 Kenyan listed companies, priced from the exchange feed.</td></tr>
  <tr><td><a href="/#us-stocks">US equity ideas</a></td><td>Cornerstone compounders, watchlist names and names we have passed on, each with the reasoning attached.</td></tr>
  <tr><td><a href="/#lib">Book notes</a></td><td>Long-form notes from primary sources — including a full interview with Alice Schroeder on <em>The Snowball</em>.</td></tr>
  <tr><td><a href="${CHANNELS.substack}">Idea feed</a></td><td>Shorter working notes as they are written, on Substack.</td></tr>
</table>

<h2>How the numbers are made</h2>
<p>Primary documents, not summaries. Kenyan financials are read from the filings themselves — audited annual reports, half-year statements and issuer announcements from the NSE and CMA media libraries — then computed into ROIC and efficiency metrics. Where a filing is unreadable or the period is ambiguous, the company stays out of the dataset rather than being filled in with a guess.</p>
<p>Prices come from the exchange feed and refresh hourly. Every figure in the terminal traces back to a document, and the research pipeline that maintains it is versioned, so an error can be traced and corrected rather than quietly overwritten.</p>

<h2>What we are not</h2>
<ul>
  <li>Not a hot-take account. Nothing here is a trade alert.</li>
  <li>Not paid placement. No issuer pays for coverage, and the exchange library carries no affiliate links.</li>
  <li>Not a promise. Research is analysis, not a forecast, and not personal advice — see <a href="/terms">Terms</a>.</li>
</ul>

<h2>Working with us</h2>
<div class="card">
  <p>We take on private accounts by arrangement, covering Kenyan and US equities. Scope, fees and terms are set out in writing before anything is agreed.</p>
  <p><a href="/contact">Start a conversation</a> · <a href="/r">Download the rate card (PDF)</a></p>
</div>
`;

const CONTACT = `
<h1>Contact</h1>
<p class="lede">One inbox, four doors. Use whichever you already have open.</p>

<table>
  <tr><th>Channel</th><th>Where</th><th>Best for</th></tr>
  <tr><td>WhatsApp</td><td><a href="${CHANNELS.whatsapp}">+254 690 00111</a></td><td>Account enquiries, anything time-sensitive</td></tr>
  <tr><td>Telegram</td><td><a href="${CHANNELS.telegram}">t.me/MoneyAcademyKE</a></td><td>Market questions, quick reads</td></tr>
  <tr><td>X</td><td><a href="${CHANNELS.x}">@MoneyAcademyKE</a></td><td>Public corrections and sourced discussion</td></tr>
  <tr><td>Substack</td><td><a href="${CHANNELS.substack}">moneyacademy.substack.com</a></td><td>Following the written work</td></tr>
</table>

<h2>Before you write</h2>
<ul>
  <li><strong>Found a data error?</strong> Send the company, the metric and the filing page. Corrections are welcome and get published, not buried.</li>
  <li><strong>Want to work together?</strong> Say what you are trying to do and the capital involved. The <a href="/r">rate card</a> covers scope and fees.</li>
  <li><strong>Asking for a tip?</strong> We don't give personalised recommendations outside an engagement. The research is public — read it and decide.</li>
</ul>

<p class="fine">We don't run a mailing list on this domain, and there is no sign-up form to fill in.</p>
`;

const PRIVACY = `
<h1>Privacy</h1>
<p class="lede">Short version: this site does not identify you, and we don't sell anything about you.</p>

<h2>What this site stores</h2>
<p>No accounts, no sign-up forms, no newsletter capture on moecapital.com. Two things are kept in your browser's local storage, and neither ever leaves your device:</p>
<ul>
  <li>which companies you have starred in the watchlist strip;</li>
  <li>whether the NSE terminal is in simple or expert mode.</li>
</ul>
<p>There are no advertising trackers, no third-party analytics scripts and no cookies set by this site.</p>

<h2>What our servers see</h2>
<p>Pages and price data are served through Cloudflare, which keeps standard request logs (IP address, user agent, requested path) for security and abuse prevention. Price and holdings updates are fetched from our own endpoint; those requests carry no personal data.</p>

<h2>When you contact us</h2>
<p>Messages you send over WhatsApp, Telegram, X or email are used to reply to you and to keep a record of any engagement. They are not added to a marketing list. Ask us to delete your messages and we will, unless we are required to keep them for a live engagement or by law.</p>

<h2>Outbound links</h2>
<p>The site links out to Substack, Google Drive, YouTube and other sites. Once you leave moecapital.com, their privacy terms apply, not ours.</p>

<h2>Changes</h2>
<p>If this policy changes, the change will be visible on this page. Questions about privacy: <a href="/contact">contact us</a>.</p>
`;

const TERMS = `
<h1>Terms of use</h1>
<p class="lede">The research is free to read. It is not advice, and it is not a promise.</p>

<h2>Information, not advice</h2>
<p>Everything published on moecapital.com is general information and analysis. It is not personal investment advice, not a recommendation to buy or sell any security, and not an offer or solicitation. We do not know your circumstances, tax position or risk tolerance, and nothing here is tailored to them.</p>
<p>Any arrangement to manage or advise on a portfolio exists only under a separate written agreement. Reading this site does not create one.</p>

<h2>Data and accuracy</h2>
<ul>
  <li>Financial figures are computed from primary filings. Filings can be restated, amended or withdrawn by the issuer after publication.</li>
  <li>Prices come from the exchange feed and may be delayed, stale or unavailable. The terminal flags staleness when it detects it; a quiet feed is not a guarantee of accuracy.</li>
  <li>Where a document is illegible or a period cannot be established, the company is excluded rather than estimated.</li>
  <li>Nothing here is audited. If a number looks wrong, tell us — see <a href="/contact">Contact</a>.</li>
</ul>

<h2>No liability</h2>
<p>You use this site at your own risk. To the extent permitted by law, Moe Capital accepts no liability for any loss arising from reliance on the content of this site, including loss from inaccurate, delayed or unavailable data.</p>

<h2>Past performance</h2>
<p>Past performance is not a reliable indicator of future results. Positions named on this site, including historical picks and current watchlist names, are published for illustration and record-keeping, not as a track record of managed returns.</p>

<h2>Intellectual property</h2>
<p>Original text, computed metrics and the presentation of this site belong to Moe Capital. Filings, statements and third-party research remain the property of their issuers and publishers. Quote us with attribution; don't republish the dataset wholesale.</p>

<h2>External links</h2>
<p>Links to other sites are provided for reference. We don't control them and don't endorse their content.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of Kenya.</p>
`;

export function writeTrustPages(publicDir: string): string[] {
    mkdirSync(publicDir, { recursive: true });
    const pages: Array<[string, { title: string; description: string; slug: string; body: string }]> = [
        ["about.html", { title: "About", description: "Moe Capital publishes independent equity research and runs the NSE ROIC Terminal covering 69 Kenyan listed companies.", slug: "/about", body: ABOUT }],
        ["contact.html", { title: "Contact", description: "WhatsApp, Telegram, X and Substack: how to reach Moe Capital, and what to include.", slug: "/contact", body: CONTACT }],
        ["privacy.html", { title: "Privacy", description: "What moecapital.com stores (almost nothing), what Cloudflare logs, and what happens to messages you send.", slug: "/privacy", body: PRIVACY }],
        ["terms.html", { title: "Terms of use", description: "Moe Capital publishes general research, not personal investment advice. Data accuracy, liability and IP terms.", slug: "/terms", body: TERMS }],
    ];
    for (const [name, opts] of pages) writeFileSync(join(publicDir, name), shell(opts), "utf8");
    return pages.map(([name]) => name);
}