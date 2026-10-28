import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// Load the shipped browser script in a sandbox so the guard is exercised as
// authored, not as re-implemented in the test.
function loadGuard() {
    const src = readFileSync("src/hydrate.js", "utf8");
    const doc = {
        readyState: "loading",
        addEventListener: () => {},
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, appendChild() {} }),
        body: { appendChild() {} },
    };
    const sandbox: { __moecapJsonOrSkip?: Function } = {};
    const run = new Function("document", "fetch", "globalThis", `${src}\nreturn globalThis.__moecapJsonOrSkip;`);
    const guard = run(doc, () => Promise.reject("offline"), sandbox);
    expect(typeof guard).toBe("function");
    return guard as (url: string, f: Function) => Promise<any>;
}

const guard = loadGuard();

function fakeResponse(opts: { status?: number; ct?: string; len?: string; body?: any }) {
    const seen = { jsonCalled: false, cancelled: false };
    const res = {
        ok: (opts.status ?? 200) < 400,
        status: opts.status ?? 200,
        headers: new Headers({
            ...(opts.ct ? { "content-type": opts.ct } : {}),
            ...(opts.len ? { "content-length": opts.len } : {}),
        }),
        body: { cancel: () => { seen.cancelled = true; } },
        json: async () => { seen.jsonCalled = true; return opts.body ?? {}; },
    };
    return { res, seen };
}

test("jsonOrSkip rejects an HTML soft-404 without reading the body", async () => {
    const { res, seen } = fakeResponse({ status: 200, ct: "text/html; charset=utf-8", len: "2320255" });
    await expect(guard("/prices.json", async () => res)).rejects.toContain("not json");
    expect(seen.jsonCalled).toBe(false);
    expect(seen.cancelled).toBe(true);
});

test("jsonOrSkip rejects an undeclared content-type", async () => {
    const { res, seen } = fakeResponse({ status: 200 });
    await expect(guard("/holders.json", async () => res)).rejects.toContain("not json");
    expect(seen.jsonCalled).toBe(false);
});

test("jsonOrSkip rejects oversized JSON bodies", async () => {
    const { res, seen } = fakeResponse({ status: 200, ct: "application/json", len: "999999999" });
    await expect(guard("/prices.json", async () => res)).rejects.toContain("too large");
    expect(seen.jsonCalled).toBe(false);
    expect(seen.cancelled).toBe(true);
});

test("jsonOrSkip rejects non-200", async () => {
    const { res } = fakeResponse({ status: 404, ct: "application/json" });
    await expect(guard("/prices.json", async () => res)).rejects.toContain("http 404");
});

test("jsonOrSkip resolves real JSON", async () => {
    const payload = { entries: { AAPL: { p: 1 } } };
    const { res, seen } = fakeResponse({ status: 200, ct: "application/json; charset=utf-8", body: payload });
    await expect(guard("/prices.json", async () => res)).resolves.toEqual(payload);
    expect(seen.jsonCalled).toBe(true);
});

test("both hydration loaders go through the guard", () => {
    const src = readFileSync("src/hydrate.js", "utf8");
    expect(src.split("jsonOrSkip(SOURCES[i])").length - 1).toBe(2);
    expect(src).not.toContain("r.ok ? r.json()");
    expect(readFileSync("public/hydrate.js", "utf8")).toContain("__moecapJsonOrSkip");
});