import { describe, test, expect } from "bun:test";

// digest.ts runs main() on import; we test the pure mover math by extracting it.
const src = await Bun.file(import.meta.dir + "/../scripts/digest.ts").text();
const js = new Bun.Transpiler({ loader: "ts" }).transformSync(src);
const fnMatch = js.match(/function computeMovers[\s\S]*?\n}/);
if (!fnMatch) throw new Error("computeMovers not found in digest.ts (post-transpile)");
const computeMovers = new Function("history", "prices", `${fnMatch[0]}\nreturn computeMovers(history, prices);`) as (h: any, p: any) => { up: any[]; down: any[] };

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
