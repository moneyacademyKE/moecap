import { describe, test, expect } from "bun:test";
// charts.js guards its DOM boot behind `typeof document` — importing in bun
// exposes only the pure math via window-less export. We eval the file to reach it.
const src = await Bun.file(import.meta.dir + "/../src/charts.js").text();
const sandbox: any = {};
new Function("window", "document", src)({ MoecapCharts: undefined }, undefined);
// The IIFE sets window.MoecapCharts then returns early (no document).
const ctx: any = { MoecapCharts: undefined };
new Function("window", "document", src)(ctx, undefined);
const C = ctx.MoecapCharts;

describe("chart math", () => {
    test("exports pure helpers without DOM", () => {
        expect(C).toBeDefined();
        expect(typeof C.sparkPath).toBe("function");
        expect(typeof C.pctOver).toBe("function");
    });

    test("sparkPath maps closes into the viewBox", () => {
        const d = C.sparkPath([10, 20, 15, 25], 110, 34);
        const first = d.split(" ")[0];
        expect(d.startsWith("M")).toBe(true);
        // 4 points → M + 3 L commands
        expect(d.split(" L").length).toBe(4);
        const xs = d.split(/[ML]/).map((s: string) => parseFloat(s.trim().split(" ")[0])).filter((n: number) => !isNaN(n));
        expect(xs[0]).toBeCloseTo(2, 0);
        expect(xs[xs.length - 1]).toBeCloseTo(108, 0);
    });

    test("flat series spans without division by zero", () => {
        expect(() => C.sparkPath([5, 5, 5, 5], 110, 34)).not.toThrow();
        const d = C.sparkPath([5, 5, 5, 5], 110, 34);
        expect(d).toContain("L");
    });

    test("pctOver computes period return", () => {
        expect(C.pctOver([100, 150])).toBeCloseTo(50, 5);
        expect(C.pctOver([200, 100])).toBeCloseTo(-50, 5);
        expect(C.pctOver([100])).toBeNull();
        expect(C.pctOver([])).toBeNull();
    });

    test("areaPath closes back to baseline", () => {
        const d = C.areaPath([1, 2, 3], 640, 240);
        expect(d.endsWith("Z")).toBe(true);
        expect(d).toContain("L638 238 L2 238");
    });
});

// silence unused-var lint in sandbox line
void sandbox;
