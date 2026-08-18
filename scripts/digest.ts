// Daily Telegram digest — designed to be ACTED ON, not scrolled past:
//   pulse (market conditions) → tracked 13F board (with 52w positioning)
//   → movers (cap/P/E context) → NSE filings classified by required action
//   → explicit action list. --dry-run prints; --post sends via Bot API
//   using TELEGRAM_BOT_TOKEN (never in the repo).
//
// Two editions, two destinations:
//   DIGEST_CHAT_ID  — full personal digest (US board + 13F + NSE)
//   NSE_CHANNEL_ID  — NSE-only edition for the public NSE channel:
//                     filings + NSE actions ONLY, no personal 13F/US data.
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

interface Move {
    t: string; last: number; day: number; week: number; month: number;
    hiGap: number; // % below 52w high (≤0)
    loGap: number; // % above 52w low (≥0)
}

function computeMovers(history: any, prices: any): { up: Move[]; down: Move[] } {
    const rows: Move[] = [];
    const live = prices?.entries || {};
    for (const [t, e] of Object.entries<any>(history.entries || {})) {
        const c: number[] = e.closes || [];
        if (c.length < 25) continue;
        // Live prices refresh hourly; closes lag one session (22:20 UTC fetch).
        // Against the LAST close a live price is today's move; only when no
        // live quote exists do we diff the two most recent closes.
        const usedLive = typeof live[t]?.raw === "number";
        const last = usedLive ? live[t].raw : c[c.length - 1];
        const prev = usedLive ? c[c.length - 1] : c[c.length - 2];
        const wk = c[c.length - 6];
        const mo = c[c.length - 22];
        if (!prev || !wk || !mo) continue;
        const hi = Math.max(...c, last), lo = Math.min(...c, last);
        rows.push({
            t, last,
            day: (last / prev - 1) * 100,
            week: (last / wk - 1) * 100,
            month: (last / mo - 1) * 100,
            hiGap: (last / hi - 1) * 100,
            loGap: (last / lo - 1) * 100,
        });
    }
    const sorted = rows.sort((a, b) => b.day - a.day);
    return { up: sorted, down: sorted.slice().reverse() };
}

// Positioning tag: what the price says about where you'd be buying.
function tag52(m: Move): string {
    if (m.hiGap === 0) return " ❗<b>new 52w high</b>";
    if (m.loGap === 0) return " ❗<b>new 52w low</b>";
    if (m.hiGap >= -1) return " ⛰ <b>at 52w-high</b>";
    if (m.hiGap >= -5) return ` ⛰ ${Math.abs(m.hiGap).toFixed(0)}% off 52w-high`;
    if (m.loGap <= 5) return ` 🕳 ${m.loGap.toFixed(0)}% above 52w-low`;
    return "";
}

function fmtMove(m: Move, extra: string = ""): string {
    return `${esc(m.t)} $${m.last.toFixed(2)} <b>${pct(m.day)}</b> (1w ${pct(m.week)} · 1m ${pct(m.month)})${tag52(m)}${extra}`;
}

// --- 13F: holdings amount + shareholding change, nothing else ----------------
function fmtUsd(n: number): string {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
    if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
    return `$${Math.round(n)}`;
}

interface FundEntry {
    fund: string; valueUsd: number; shares?: number; prevShares?: number;
    prevValueUsd?: number; sharesDeltaPct?: number; prevStatus?: string;
}

// Aggregate the (≤5) top-conviction funds per ticker into what the digest
// needs: total $ held, aggregate share change QoQ (funds with both quarters),
// and any fund stakes that are new this quarter.
function aggregate13f(entries: Record<string, FundEntry[]>): Map<string, {
    totalUsd: number; now: number; prev: number; deltaPct: number | null;
    newFunds: Array<{ fund: string; valueUsd: number }>;
}> {
    const out = new Map<string, any>();
    for (const [t, es] of Object.entries(entries || {})) {
        let totalUsd = 0, now = 0, prev = 0;
        const newFunds: Array<{ fund: string; valueUsd: number }> = [];
        for (const e of es) {
            totalUsd += e.valueUsd || 0;
            if (typeof e.shares === "number") now += e.shares;
            if (e.prevStatus === "held" && typeof e.prevShares === "number") prev += e.prevShares;
            if (e.prevStatus === "new") newFunds.push({ fund: e.fund, valueUsd: e.valueUsd || 0 });
        }
        const deltaPct = prev > 0 && now > 0 ? +(((now / prev) - 1) * 100).toFixed(1) : null;
        out.set(t, { totalUsd, now, prev, deltaPct, newFunds });
    }
    return out;
}

// +18% QoQ for normal moves; ×6.8 QoQ once a stake more than tripled —
// honest about magnitude without printing +68,324%.
function fmtShareDelta(now: number, prev: number, pct: number | null): string {
    if (pct === null) return "";
    if (pct >= 200) return `shares ×${(now / prev).toFixed(1)} QoQ`;
    return `shares ${pct >= 0 ? "+" : "-"}${Math.abs(pct).toFixed(0)}% QoQ`;
}

interface Ann { ticker: string; title: string; date: string; file?: string }

function freshAnnouncements(): Ann[] {
    const data = JSON.parse(readFileSync(join(process.cwd(), "data", "nse-data.json"), "utf8"));
    const cutoff = new Date(Date.now() - 9 * 86400_000).toISOString().slice(0, 10);
    const out: Ann[] = [];
    for (const [ticker, f] of Object.entries<any>(data.financials || {})) {
        for (const a of f.announcements || []) {
            if (!a.date || a.date < cutoff) continue;
            if (/events calendar/i.test(a.title || "")) continue; // calendars ≠ news
            out.push({ ticker, title: a.title, date: a.date, file: a.file });
        }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
}

type AnnKind = "audited" | "interim" | "dividend" | "other";
function classify(a: Ann): AnnKind {
    if (/\bdividend\b/i.test(a.title)) return "dividend";
    if (/\bunaudited\b|\bhalf[- ]year\b|\binterim\b|\bsix[- ]months?\b/i.test(a.title)) return "interim";
    if (/\baudited\b/i.test(a.title)) return "audited";
    return "other";
}

// Pull a book-closure/payment date out of a dividend notice title, if stated.
function parseBookDate(title: string): string | null {
    const m = title.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i);
    return m ? `${m[1]} ${m[2]} ${m[3].length === 2 ? "20" + m[3] : m[3]}` : null;
}

const card = (t: string) => `${SITE}/nse/#${t}`;
const pdf = (a: Ann) => a.file ? ` <a href="${SITE}${esc(a.file)}">PDF</a>` : "";

function fmtBreadth(rows: Move[], session: string): string {
    if (rows.length === 0) return "no data";
    const days = rows.map((r) => r.day).sort((a, b) => a - b);
    const med = days[Math.floor(days.length / 2)];
    const up = rows.filter((r) => r.day > 0).length;
    const frac = up / rows.length;
    // Median decides "flat": one -22% outlier must not read as risk-off.
    const word = med >= 0.2 && frac >= 0.5 ? "risk-on 🟢" : med <= -0.2 && frac <= 0.5 ? "risk-off 🔴" : Math.abs(med) < 0.2 ? "flat ⚪" : "mixed 🟡";
    return `${session} ${word} — ${up}/${rows.length} up, median ${pct(med)}`;
}

// Label the quote session in the market's real timezone, including DST.
function sessionOf(asOfIso: string | undefined): string {
    if (!asOfIso) return "";
    const d = new Date(asOfIso);
    if (Number.isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(d);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const hour = value("hour") % 24;
    const hh = hour + value("minute") / 60;
    if (hh < 9.5) return "premarket:";
    if (hh < 16) return "intraday:";
    return "post-close:";
}

// Telegram rejects oversized messages. Drop complete, low-priority lines rather
// than slicing HTML mid-tag; keep the pulse, action heading, and footer intact.
function fitTelegramHtml(lines: string[], limit = 4096): string {
    const render = (items: Array<{ line: string; index: number }>, omitted = false) => {
        const output = items.map((item) => item.line);
        if (omitted) {
            const footerAt = Math.max(1, output.length - 2);
            output.splice(footerAt, 0, "… <i>lower-priority rows omitted</i>");
        }
        return output.join("\n");
    };
    let kept = lines.map((line, index) => ({ line, index }));
    if (render(kept).length <= limit) return render(kept);

    const footerStart = Math.max(1, lines.length - 2);
    const actionAt = lines.findIndex((line) => line.includes("<b>Action list</b>"));
    const removable = kept
        .filter(({ line, index }) => index !== 0
            && index < footerStart
            && !line.includes("<b>Pulse:</b>")
            && !line.includes("<b>Action list</b>"))
        .sort((a, b) => {
            const rank = ({ line, index }: { line: string; index: number }) => {
                const detail = /^(• |📈 |📉 |📊 Interims|📎 Other)/.test(line);
                if (detail && (actionAt < 0 || index < actionAt)) return 0;
                if (line === "") return 1;
                if (actionAt < 0 || index < actionAt) return 2;
                return 3;
            };
            return rank(a) - rank(b) || b.line.length - a.line.length;
        });

    for (const candidate of removable) {
        kept = kept.filter((item) => item.index !== candidate.index);
        const html = render(kept, true);
        if (html.length <= limit) return html;
    }
    throw new Error("digest essential lines exceed Telegram limit");
}

// --- NSE section, shared by both editions -----------------------------------
// Renders feed status + filings classified by required action. Pure given
// (nse, ann) so the DM digest and the channel edition can never drift.
function nseSectionLines(nse: any, ann: Ann[]): string[] {
    if (!nse?.prices) return ["🇰🇪 NSE feed unavailable today.", ""];
    const out: string[] = [];
    const n = Object.keys(nse.prices).length;
    const ageH = Math.floor((Date.now() - Date.parse(nse.asOf)) / 3600_000);
    const feed = !nse.live || ageH > 36 ? `⚠️ feed stale (${ageH}h old)` : `feed live`;
    out.push(`🇰🇪 <b>NSE</b> — ${n} priced · ${feed}`);
    const by = (k: AnnKind) => ann.filter((a) => classify(a) === k);
    const audited = by("audited"), interim = by("interim"), divs = by("dividend");
    if (divs.length > 0) {
        out.push("💰 <b>Dividend notices (act on dates):</b>");
        for (const a of divs.slice(0, 3)) {
            const bd = parseBookDate(a.title);
            out.push(`• <b>${a.ticker}</b> — ${esc(a.title)}${pdf(a)}${bd ? ` → book closure <b>${bd}</b> (own before to qualify)` : " → check notice for book-closure date"}`);
        }
    }
    if (audited.length > 0) {
        out.push("🧾 <b>Audited results in — review:</b>");
        for (const a of audited.slice(0, 4)) out.push(`• <a href="${card(a.ticker)}"><b>${a.ticker}</b></a> ${esc(a.title)}${pdf(a)}`);
    }
    if (interim.length > 0) {
        out.push(`📊 Interims in (skim): ${interim.slice(0, 6).map((a) => `<a href="${card(a.ticker)}">${a.ticker}</a>`).join(" · ")}`);
    }
    const other = by("other");
    if (other.length > 0) out.push(`📎 Other: ${other.slice(0, 4).map((a) => `<a href="${card(a.ticker)}">${a.ticker}</a>`).join(" · ")}`);
    if (ann.length === 0) out.push("📰 No new NSE filings in the last 9 days.");
    out.push("");
    return out;
}

// NSE-only action triggers (dividend deadlines, audited results to read).
function nseActionLines(ann: Ann[]): string[] {
    const actions: string[] = [];
    for (const a of ann.filter((x) => classify(x) === "dividend").slice(0, 1)) {
        const bd = parseBookDate(a.title);
        actions.push(`💰 <b>${a.ticker}</b> dividend — ${bd ? `own before ${bd} to qualify` : "check book-closure date"} · <a href="${card(a.ticker)}">open</a>`);
    }
    const firstAudited = ann.find((x) => classify(x) === "audited");
    if (firstAudited) actions.push(`🧾 Read <b>${firstAudited.ticker}</b> results — <a href="${card(firstAudited.ticker)}">review</a>`);
    return actions;
}

// The public NSE-channel edition: NSE feed + filings + NSE actions + footer.
// Deliberately excludes the 13F board and US sections — personal data stays
// in the DM edition.
function nseEditionLines(day: string, dow: string, nse: any, ann: Ann[]): string[] {
    const lines: string[] = [];
    lines.push(`📰 <b>NSE Daily</b> — ${day} ${dow}`);
    lines.push("");
    lines.push(...nseSectionLines(nse, ann));
    const actions = nseActionLines(ann);
    lines.push("👀 <b>Action list</b>");
    if (actions.length === 0) lines.push("• Quiet day — nothing triggered.");
    for (const a of actions) lines.push("• " + a);
    lines.push("");
    lines.push(`🔗 <a href="${SITE}/nse">Moe Capital — NSE board</a>`);
    lines.push(`<i>Not investment advice. Numbers as fetched; verify before acting.</i>`);
    return lines;
}

async function build(): Promise<string> {
    const [history, prices, nse, holders] = await Promise.all([
        fetchJson(`${WORKER}/history`).catch(() => null),
        fetchJson(`${WORKER}/prices`).catch(() => null),
        fetchJson(`${WORKER}/nse`).catch(() => null),
        fetchJson(`${WORKER}/holders`).catch(() => null),
    ]);

    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push(`📊 <b>Moe Capital Daily</b> — ${day} ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getUTCDay()]}`);
    lines.push("");

    let allRows: Move[] = [];
    if (history?.entries) {
        allRows = computeMovers(history, prices).up;
        const asOf = String(history.asOf || "").slice(0, 10);
        lines.push(`🫀 <b>Pulse:</b> ${fmtBreadth(allRows, sessionOf(prices?.asOf))} · closes through ${asOf}`);
        lines.push("");
    } else {
        lines.push("🫀 US history unavailable today.");
        lines.push("");
    }

    // Tracked board: the names with 13F coverage — the ones you actually follow.
    // 13F contributes exactly two things: how much is held, and (below) where
    // the shareholding increased. Price context stays from the market feed.
    const agg = aggregate13f(holders?.entries || {});
    const tracked = new Set(Object.keys(holders?.entries || {}));
    const board = allRows.filter((r) => tracked.has(r.t)).sort((a, b) => Math.abs(b.day) - Math.abs(a.day) || Math.abs(b.month) - Math.abs(a.month));
    const rest = allRows.filter((r) => !tracked.has(r.t));
    if (board.length > 0) {
        lines.push(`🇺🇸 <b>Your board</b> (${board.length} tracked, by |move|)`);
        for (const m of board.slice(0, 8)) {
            const held = agg.get(m.t)?.totalUsd;
            lines.push("• " + fmtMove(m, held ? ` · ${fmtUsd(held)} held` : ""));
        }
        lines.push("");
    }
    if (rest.length > 0) {
        const movers = rest.filter((m) => Math.abs(m.day) >= 0.5).sort((a, b) => b.day - a.day);
        lines.push("🚀 <b>Rest of universe</b>");
        if (movers.length === 0) {
            lines.push("⚪ nothing moving ≥0.5% today");
        } else {
            const gainers = movers.filter((m) => m.day > 0).slice(0, 2);
            if (gainers.length > 0) lines.push("📈 " + gainers.map((m) => fmtMove(m)).join("\n📈 "));
            const losers = movers.filter((m) => m.day < 0).slice(-2).reverse();
            if (losers.length > 0) lines.push("📉 " + losers.map((m) => fmtMove(m)).join("\n📉 "));
        }
        lines.push("");
    }

    lines.push(...nseSectionLines(nse, nse?.prices ? freshAnnouncements() : []));

    if (holders?.dataQuarter) {
        const asOf = String(holders.generatedAt || holders.asOf || "").slice(0, 10);
        const ageDays = asOf ? Math.floor((Date.now() - Date.parse(asOf)) / 86400_000) : 999;
        lines.push(`🏛 <b>13F ${esc(String(holders.dataQuarter))}</b> — holdings & share increases${ageDays > 100 ? ` · ⚠️ ${ageDays}d old` : ""}`);
        const newUsd = (r: { newFunds: Array<{ valueUsd: number }> }) => r.newFunds.reduce((s, f) => s + f.valueUsd, 0);
        const ranked = [...agg.entries()]
            .map(([t, a]) => ({ t, ...a }))
            .sort((x, y) =>
                newUsd(y) - newUsd(x) ||
                (y.deltaPct ?? -Infinity) - (x.deltaPct ?? -Infinity) ||
                y.totalUsd - x.totalUsd);
        const withDeltas = ranked.some((r) => r.deltaPct !== null || r.newFunds.length > 0);
        if (!withDeltas) {
            const grand = ranked.reduce((s, r) => s + r.totalUsd, 0);
            lines.push(`• top funds hold ${fmtUsd(grand)} across ${ranked.length} names · QoQ deltas pending next build`);
        } else {
            for (const r of ranked.slice(0, 5)) {
                const delta = fmtShareDelta(r.now, r.prev, r.deltaPct);
                const fresh = r.newFunds[0];
                const fund = fresh ? ` · 🆕 ${esc(fresh.fund.split(/[,;]/)[0].trim().slice(0, 22).trimEnd())} in (${fmtUsd(fresh.valueUsd)})` : "";
                lines.push(`• <b>${esc(r.t)}</b> — ${fmtUsd(r.totalUsd)} held${delta ? ` · ${delta}` : ""}${fund}`);
            }
        }
        lines.push("");
    }

    // Action list: only cross-cutting triggers, never filler.
    const actions: string[] = [...nseActionLines(nse?.prices ? freshAnnouncements() : [])];
    for (const m of board.filter((r) => r.loGap <= 5).slice(0, 1))
        actions.push(`🕳 <b>${m.t}</b> near 52w low (${m.loGap.toFixed(0)}% above) — review thesis before catching knife`);
    for (const m of [...board].sort((a, b) => b.hiGap - a.hiGap).slice(0, 1))
        if (m.hiGap >= -3) actions.push(`⛰ <b>${m.t}</b> ${m.hiGap >= -1 ? "at 52w high" : Math.abs(m.hiGap).toFixed(0) + "% off 52w high"} — momentum intact, watch for extension`);
    lines.push("👀 <b>Action list</b>");
    if (actions.length === 0) lines.push("• Quiet day — nothing triggered.");
    for (const a of actions.slice(0, 4)) lines.push("• " + a);
    lines.push("");

    lines.push(`🔗 <a href="${SITE}">Moe Capital</a> · search: press <code>/</code> anywhere on the site`);
    lines.push(`<i>Not investment advice. Numbers as fetched; verify before acting.</i>`);
    return fitTelegramHtml(lines);
}

async function buildNseEdition(): Promise<string> {
    const nse = await fetchJson(`${WORKER}/nse`).catch(() => null);
    const now = new Date();
    return fitTelegramHtml(nseEditionLines(
        now.toISOString().slice(0, 10),
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getUTCDay()],
        nse,
        nse?.prices ? freshAnnouncements() : [],
    ));
}

async function post(html: string, chatId: string, label: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const j: any = await res.json();
    if (!j.ok) throw new Error(`telegram: ${j.description}`);
    console.log(`posted ${label}: message_id ${j.result.message_id}`);
}

const mode = process.argv[2] || "--dry-run";
if (mode !== "--post" && mode !== "--dry-run") {
    console.error("usage: bun scripts/digest.ts --dry-run|--post");
    process.exit(1);
}
(async () => {
    if (mode === "--dry-run") {
        const full = await build();
        console.log(full);
        console.log(`\n[full edition: ${full.length} chars — Telegram limit 4096]`);
        console.log("\n=== NSE channel edition ===");
        const nseEd = await buildNseEdition();
        console.log(nseEd);
        console.log(`\n[channel edition: ${nseEd.length} chars]`);
        return;
    }
    // --post: every configured destination gets its edition; one failing
    // must not silence the others — collect failures, throw at the end.
    const dests: Array<{ label: string; chat: string | undefined; make: () => Promise<string> }> = [
        { label: "DM digest", chat: process.env.DIGEST_CHAT_ID, make: build },
        { label: "NSE channel", chat: process.env.NSE_CHANNEL_ID, make: buildNseEdition },
    ].filter((d) => d.chat);
    if (dests.length === 0) throw new Error("no destinations set (DIGEST_CHAT_ID / NSE_CHANNEL_ID)");
    const failures: string[] = [];
    for (const d of dests) {
        try {
            await post(await d.make(), d.chat!, d.label);
        } catch (e: any) {
            failures.push(`${d.label}: ${e.message}`);
        }
    }
    if (failures.length > 0) throw new Error(failures.join(" | "));
})().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
