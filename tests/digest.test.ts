import { describe, test, expect } from "bun:test";

// digest.ts runs main() on import; we test the pure mover math by extracting it.
const src = await Bun.file(import.meta.dir + "/../scripts/digest.ts").text();
const js = new Bun.Transpiler({ loader: "ts" }).transformSync(src);
const extractFunction = (name: string, args: string[], invoke: string) => {
    const match = js.match(new RegExp(`function ${name}[\\s\\S]*?\\n}`));
    if (!match) throw new Error(`${name} not found in digest.ts (post-transpile)`);
    return new Function(...args, `${match[0]}\nreturn ${invoke};`);
};

const computeMovers = extractFunction(
    "computeMovers",
    ["history", "prices"],
    "computeMovers(history, prices)",
) as (h: any, p: any) => { up: any[]; down: any[] };

describe("digest movers math", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i); // steady climb 100..129
    const history = { entries: { AAA: { closes }, BBB: { closes: closes.slice().reverse() }, THIN: { closes: [1, 2, 3] } } };
    const prices = { entries: { AAA: { raw: 131.5 }, BBB: { raw: 95 } } };

    test("ranks gainers and losers, prefers live price", () => {
        const { up, down } = computeMovers(history, prices);
        expect(up[0].t).toBe("AAA");
        expect(down[0].t).toBe("BBB");
        // falls back to last close when live price missing → still ranked
        expect(down[0].last).toBeGreaterThan(0);
    });

    test("live price diffs against the LAST close (one session, not two)", () => {
        // AAA live 131.5 vs last close 129 → +1.938%. The old code diffed
        // against 128 (second-to-last) and double-counted a session.
        const { up } = computeMovers(history, prices);
        expect(up[0].day).toBeCloseTo(1.938, 2);
        // BBB live 95 vs last close 100 → −5.0% exactly.
        const { down } = computeMovers(history, prices);
        expect(down[0].day).toBeCloseTo(-5.0, 2);
    });

    test("52w positioning: live above all closes = new high", () => {
        const { up } = computeMovers(history, prices);
        expect(up[0].hiGap).toBe(0); // 131.5 > max(closes)
        expect(up[0].loGap).toBeCloseTo(31.5, 1); // vs 52w low 100
    });

    test("skips thin series (<25 points)", () => {
        const { up, down } = computeMovers(history, prices);
        const all = [...up, ...down].map((m) => m.t);
        expect(all).not.toContain("THIN");
    });

    test("empty history yields empty lists", () => {
        const r = computeMovers({ entries: {} }, null);
        expect(r.up.length).toBe(0);
        expect(r.down.length).toBe(0);
    });
});


describe("digest current-condition labeling", () => {
    test("uses America/New_York daylight-saving boundaries", () => {
        const sessionOf = extractFunction(
            "sessionOf",
            ["asOfIso"],
            "sessionOf(asOfIso)",
        ) as (iso: string) => string;

        expect(sessionOf("2026-01-15T14:29:00Z")).toBe("premarket:");
        expect(sessionOf("2026-01-15T14:30:00Z")).toBe("intraday:");
        expect(sessionOf("2026-08-18T13:29:00Z")).toBe("premarket:");
        expect(sessionOf("2026-08-18T13:30:00Z")).toBe("intraday:");
        expect(sessionOf("2026-08-18T20:00:00Z")).toBe("post-close:");
    });

    test("classifies unaudited filings as interims, never audited", () => {
        const classify = extractFunction(
            "classify",
            ["announcement"],
            "classify(announcement)",
        ) as (announcement: { title: string }) => string;

        expect(classify({ title: "Unaudited results for the half year" })).toBe("interim");
        expect(classify({ title: "Audited results for the year" })).toBe("audited");
        expect(classify({ title: "Interim dividend notice" })).toBe("dividend");
    });
});

describe("digest 13F holdings & shareholding change", () => {
    test("aggregates $ held, QoQ share delta, and new fund stakes per ticker", () => {
        const aggregate13f = extractFunction(
            "aggregate13f",
            ["entries"],
            "aggregate13f(entries)",
        ) as (e: any) => Map<string, any>;
        const agg = aggregate13f({
            NVDA: [
                { fund: "A", valueUsd: 8e9, shares: 100, prevShares: 100, prevStatus: "held" },
                { fund: "B", valueUsd: 4e9, shares: 100, prevShares: 50, prevStatus: "held" },
            ],
            PANW: [
                { fund: "C", valueUsd: 2e8, shares: 40, prevStatus: "new" },
                { fund: "D", valueUsd: 1e8 }, // unknown-prev fund: $ counted, delta not
            ],
        });
        const n = agg.get("NVDA");
        expect(n.totalUsd).toBe(12e9);
        expect(n.now).toBe(200);
        expect(n.prev).toBe(150);
        expect(n.deltaPct).toBeCloseTo(33.3, 1);
        expect(n.newFunds.length).toBe(0);
        const p = agg.get("PANW");
        expect(p.totalUsd).toBe(3e8);
        expect(p.newFunds).toEqual([{ fund: "C", valueUsd: 2e8 }]);
        expect(p.deltaPct).toBe(null); // no fund has both quarters
    });

    test("formats deltas: plain % for normal moves, ×N once a stake tripled", () => {
        const fmtShareDelta = extractFunction(
            "fmtShareDelta",
            ["now", "prev", "pct"],
            "fmtShareDelta(now, prev, pct)",
        ) as (n: number, p: number, pct: number | null) => string;
        expect(fmtShareDelta(118, 100, 18)).toBe("shares +18% QoQ");
        expect(fmtShareDelta(93, 100, -7)).toBe("shares -7% QoQ");
        expect(fmtShareDelta(68400, 100, 68300)).toBe("shares ×684.0 QoQ");
        expect(fmtShareDelta(0, 0, null)).toBe("");
    });

    test("formats $ amounts at B/M/K scale", () => {
        const fmtUsd = extractFunction("fmtUsd", ["n"], "fmtUsd(n)") as (n: number) => string;
        expect(fmtUsd(12.4e9)).toBe("$12.4B");
        expect(fmtUsd(890e6)).toBe("$890M");
        expect(fmtUsd(45200)).toBe("$45K");
    });
});

describe("digest Telegram safety bound", () => {
    test("drops detail lines without splitting HTML when over the limit", () => {
        const fitTelegramHtml = extractFunction(
            "fitTelegramHtml",
            ["lines", "limit"],
            "fitTelegramHtml(lines, limit)",
        ) as (lines: string[], limit: number) => string;
        const lines = [
            "📊 <b>Digest</b>",
            "",
            ...Array.from({ length: 12 }, (_, i) => `• <a href=\"https://example.com/${i}\"><b>ROW${i}</b></a> ${"x".repeat(40)}`),
            "",
            "🔗 <a href=\"https://example.com\">site</a>",
            "<i>Not investment advice.</i>",
        ];

        const html = fitTelegramHtml(lines, 300);
        expect(html.length).toBeLessThanOrEqual(300);
        expect(html).toContain("📊 <b>Digest</b>");
        expect(html).toContain("<i>Not investment advice.</i>");
        expect(html).toContain("lower-priority rows omitted");
        expect((html.match(/<a /g) || []).length).toBe((html.match(/<\/a>/g) || []).length);
    });
});
