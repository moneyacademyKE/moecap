import { describe, test, expect } from "bun:test";
import { annKey, channelDelta, feedStatus } from "../scripts/digest-channel-state";

// The channel contract: every fact posts exactly once. Only new announcements
// or real feed-health transitions produce a message at all.

// Fixture dates must sit INSIDE the 30-day seen-state window no matter when
// this suite runs — hardcoded dates rot as the calendar advances (the Aug
// fixtures left the window on ~2026-09-13 and failed the whole file).
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);

const anns = [
    { ticker: "TOTL", date: daysAgo(5), title: "Audited results FY2025" },
    { ticker: "SCBK", date: daysAgo(4), title: "Unaudited half-year results" },
];

describe("channel seen-state delta", () => {
    test("bootstrap: missing state initializes silently — no re-blast of the window", () => {
        const d = channelDelta(null, anns, "live");
        expect(d.skip).toBe(true);
        expect(d.fresh).toEqual([]);
        expect(d.state.posted).toEqual(anns.map(annKey));
        expect(d.state.lastFeed).toBe("live");
    });

    test("second run with the same facts skips entirely", () => {
        const first = channelDelta(null, anns, "live");
        const d = channelDelta(first.state, anns, "live");
        expect(d.skip).toBe(true);
        expect(d.fresh).toEqual([]);
        expect(d.feedChanged).toBe(false);
    });

    test("a genuinely new announcement posts, seen ones do not repeat", () => {
        const base = channelDelta(null, anns, "live").state;
        const bat = { ticker: "BAT", date: daysAgo(1), title: "Unaudited half-year results" };
        const d = channelDelta(base, [...anns, bat], "live");
        expect(d.skip).toBe(false);
        expect(d.fresh).toEqual([bat]);
        // state now remembers BAT too
        expect(channelDelta(d.state, [...anns, bat], "live").skip).toBe(true);
    });

    test("feed transition live→stale posts even with no new filings", () => {
        const base = channelDelta(null, anns, "live").state;
        const d = channelDelta(base, anns, "stale");
        expect(d.skip).toBe(false);
        expect(d.fresh).toEqual([]);
        expect(d.feedChanged).toBe(true);
        // still stale next run → silent again
        expect(channelDelta(d.state, anns, "stale").skip).toBe(true);
        // recovery live posts once
        const rec = channelDelta(d.state, anns, "live");
        expect(rec.skip).toBe(false);
        expect(rec.feedChanged).toBe(true);
    });

    test("prunes seen keys older than 30 days", () => {
        const old = { ticker: "XPRS", date: "2026-01-01", title: "Audited results FY2025" };
        const base = channelDelta(null, [old, ...anns], "live").state;
        expect(base.posted).not.toContain(annKey(old));
        expect(base.posted).toEqual(anns.map(annKey));
    });
});

describe("feed status token", () => {
    test("live / stale / down with hour-drift stability", () => {
        const asOf = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
        expect(feedStatus({ prices: { SCOM: 1 }, live: true, asOf: asOf(10) })).toBe("live");
        // 37h and 38h must be the SAME token — display drift is not a change
        expect(feedStatus({ prices: { SCOM: 1 }, live: true, asOf: asOf(37) })).toBe("stale");
        expect(feedStatus({ prices: { SCOM: 1 }, live: true, asOf: asOf(38) })).toBe("stale");
        expect(feedStatus({ prices: { SCOM: 1 }, live: false, asOf: asOf(1) })).toBe("stale");
        expect(feedStatus(null)).toBe("down");
        expect(feedStatus({})).toBe("down");
    });
});
