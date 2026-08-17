// Daily Telegram digest: US movers (from /history), NSE board + fresh
// announcements (repo data), 13F freshness. --dry-run prints; --post sends
// via Bot API using TELEGRAM_BOT_TOKEN + DIGEST_CHAT_ID (never in the repo).
//
// Usage: bun scripts/digest.ts --dry-run | --post

import { readFileSync } from "node:fs";
import { join } from "node:path";

const WORKER = "https://moecap-prices.iamkingori.workers.dev";
const SITE = "https://moecap.pages.dev";

async function fetchJson(url: string): Promise<any> {
    const res = await fetch(url, { headers: { "user-agent": "moecap-digest/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 60)}`);
    return res.json();
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pct = (p: number) => (p >= 0 ? "+" : "") + p.toFixed(1) + "%";

interface Move { t: string; day: number; week: number; month: number; last: number }

function computeMovers(history: any, prices: any): { up: Move[]; down: Move[] } {
    const rows: Move[] = [];
    const live = prices?.entries || {};
    for (const [t, e] of Object.entries<any>(history.entries || {})) {
        const c: number[] = e.closes || [];
        if (c.length < 25) continue;
        const last = typeof live[t]?.price === "number" ? live[t].price : c[c.length - 1];
        const prev = c[c.length - 2];
        const wk = c.length > 22 ? c[c.length - 6] : c[0];
        const mo = c[c.length - 22] ?? c[0];
        if (!prev || !wk || !mo) continue;
        rows.push({ t, last, day: (last / prev - 1) * 100, week: (last / wk - 1) * 100, month: (last / mo - 1) * 100 });
    }
    rows.sort((a, b) => b.day - a.day);
    return { up: rows.slice(0, 5), down: rows.slice(-5).reverse() };
}

function fmtMove(m: Move): string {
    return `${esc(m.t)} $${m.last.toFixed(2)} <b>${pct(m.day)}</b> (1w ${pct(m.week)} · 1m ${pct(m.month)})`;
}

function freshAnnouncements(): { ticker: string; title: string; date: string }[] {
    const data = JSON.parse(readFileSync(join(process.cwd(), "data", "nse-data.json"), "utf8"));
    const cutoff = new Date(Date.now() - 9 * 86400_000).toISOString().slice(0, 10);
    const out: { ticker: string; title: string; date: string }[] = [];
    for (const [ticker, f] of Object.entries<any>(data.financials || {})) {
        for (const a of f.announcements || []) {
            if (!a.date || a.date < cutoff) continue;
            if (/events calendar/i.test(a.title || "")) continue; // calendars ≠ news
            out.push({ ticker, title: a.title, date: a.date });
        }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
}

async function build(): Promise<string> {
    const [history, prices, nse, holders] = await Promise.all([
        fetchJson(`${WORKER}/history`).catch(() => null),
        fetchJson(`${WORKER}/prices`).catch(() => null),
        fetchJson(`${WORKER}/nse`).catch(() => null),
        fetchJson(`${WORKER}/holders`).catch(() => null),
    ]);

    const day = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push(`📊 <b>Moe Capital Daily</b> — ${day}`);
    lines.push("");

    if (history?.entries) {
        const { up, down } = computeMovers(history, prices);
        lines.push("🇺🇸 <b>US board — top movers</b>");
        lines.push("📈 Gainers:");
        for (const m of up) lines.push("• " + fmtMove(m));
        lines.push("📉 Losers:");
        for (const m of down) lines.push("• " + fmtMove(m));
        lines.push("");
    } else {
        lines.push("🇺🇸 US history unavailable today.");
        lines.push("");
    }

    if (nse?.prices) {
        const n = Object.keys(nse.prices).length;
        lines.push(`🇰🇪 <b>NSE board</b> — ${n} tickers priced (as of ${String(nse.asOf).slice(0, 16).replace("T", " ")} UTC)`);
        const ann = freshAnnouncements(process.cwd());
        if (ann.length > 0) {
            lines.push("📰 Fresh NSE filings (last 9 days):");
            for (const a of ann.slice(0, 6)) lines.push(`• <b>${esc(a.ticker)}</b> — ${esc(a.title)} (${a.date})`);
        } else {
            lines.push("📰 No new NSE filings in the last 9 days.");
        }
        lines.push("");
    }

    if (holders?.dataQuarter) {
        const asOf = String(holders.asOf || "").slice(0, 10);
        const ageDays = asOf ? Math.floor((Date.now() - Date.parse(asOf)) / 86400_000) : 999;
        const covered = Object.keys(holders.entries || {}).length;
        if (ageDays <= 14) {
            lines.push(`🏛 <b>13F holders updated</b> — ${esc(String(holders.dataQuarter))}: coverage on ${covered} tickers.`);
            lines.push("");
        }
    }

    lines.push(`🔗 ${SITE} · /search — press <code>/</code> anywhere on the site`);
    lines.push(`<i>Not investment advice. Numbers as fetched; verify before acting.</i>`);
    return lines.join("\n");
}

async function post(html: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.DIGEST_CHAT_ID;
    if (!token || !chat) throw new Error("TELEGRAM_BOT_TOKEN / DIGEST_CHAT_ID not set");
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const j: any = await res.json();
    if (!j.ok) throw new Error(`telegram: ${j.description}`);
    console.log(`posted: message_id ${j.result.message_id}`);
}

const mode = process.argv[2] || "--dry-run";
if (mode !== "--post" && mode !== "--dry-run") {
    console.error("usage: bun scripts/digest.ts --dry-run|--post");
    process.exit(1);
}
build()
    .then(async (html) => {
        if (mode === "--dry-run") {
            console.log(html);
            console.log(`\n[length: ${html.length} chars — Telegram limit 4096]`);
        } else {
            await post(html);
        }
    })
    .catch((e) => {
        console.error(e.message);
        process.exit(1);
    });
;
