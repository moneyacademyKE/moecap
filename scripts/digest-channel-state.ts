// Seen-state for the public NSE Telegram channel — each fact posts ONCE.
//
// The channel is a broadcast surface, not a rolling snapshot: the old edition
// re-rendered the 9-day filing window every night, so every filing showed up
// nine nights in a row. State (announcement keys already posted + last feed
// status token) lives in the Worker KV namespace next to the data, read and
// written via the Cloudflare API from the digest workflow — runners are
// stateless, KV is not.
//
// Pure delta logic is kept separate from IO so tests can exercise it without
// credentials or network.

export interface ChannelState {
    posted: string[];  // announcement keys already delivered to the channel
    lastFeed: string;  // last feed status the channel saw: live | stale | down
    updatedAt: string; // ISO timestamp of the last state write
}

interface AnnLike {
    ticker: string;
    date: string;
    title: string;
}

const NS = "7eff4838aa6d49b9a82d1b175d4d0c06"; // same KV namespace as prices/nse
const KEY = "digest-channel-state";

export function annKey(a: AnnLike): string {
    return `${a.ticker}|${a.date}|${a.title}`;
}

// Feed health as a stable token. The display string drifts by the hour
// ("stale (37h old)" → "(38h old)"); comparing tokens means only real
// transitions live↔stale↔down count as change.
export function feedStatus(nse: any): "live" | "stale" | "down" {
    if (!nse?.prices) return "down";
    const ageH = Math.floor((Date.now() - Date.parse(nse.asOf)) / 3600_000);
    return !nse.live || ageH > 36 ? "stale" : "live";
}

function prune(keys: string[]): string[] {
    const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    return [...new Set(keys)].filter((k) => (k.split("|")[1] || "") >= cutoff);
}

export function channelDelta(
    state: ChannelState | null,
    ann: AnnLike[],
    feed: string,
): { skip: boolean; fresh: AnnLike[]; feedChanged: boolean; state: ChannelState } {
    // Bootstrap (no state yet): everything in the render window was already
    // posted by earlier editions — initialize state, stay silent once.
    if (state === null) {
        return {
            skip: true,
            fresh: [],
            feedChanged: false,
            state: {
                posted: prune(ann.map(annKey)),
                lastFeed: feed,
                updatedAt: new Date().toISOString(),
            },
        };
    }
    const seen = new Set(state.posted);
    const fresh = ann.filter((a) => !seen.has(annKey(a)));
    const feedChanged = state.lastFeed !== feed;
    return {
        skip: fresh.length === 0 && !feedChanged,
        fresh,
        feedChanged,
        state: {
            posted: prune([...state.posted, ...ann.map(annKey)]),
            lastFeed: feed,
            updatedAt: new Date().toISOString(),
        },
    };
}

// --- KV IO (workflow only; same secrets the price-refresh workflows use) ----
function cfCreds(): { acct: string; token: string } {
    const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!acct || !token) {
        throw new Error("CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID not set (channel seen-state needs KV access)");
    }
    return { acct, token };
}

const kvUrl = (acct: string) =>
    `https://api.cloudflare.com/client/v4/accounts/${acct}/storage/kv/namespaces/${NS}/values/${KEY}`;

export async function readChannelState(): Promise<ChannelState | null> {
    const { acct, token } = cfCreds();
    const res = await fetch(kvUrl(acct), { headers: { authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`KV read failed: HTTP ${res.status}`);
    return await res.json() as ChannelState;
}

export async function writeChannelState(s: ChannelState): Promise<void> {
    const { acct, token } = cfCreds();
    const res = await fetch(kvUrl(acct), {
        method: "PUT",
        headers: { authorization: `Bearer ${token}`, "content-type": "text/plain" },
        body: JSON.stringify(s),
    });
    if (!res.ok) throw new Error(`KV write failed: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
}
