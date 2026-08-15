#!/usr/bin/env bash
# One-time setup for the moecap-prices hydration Worker.
# Requires: bun, wrangler (bunx), and a logged-in Cloudflare account
# (`bunx wrangler login`) or CLOUDFLARE_API_TOKEN in the environment.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORKER="$REPO/worker"

echo "== 1/5: creating KV namespace =="
NS_JSON="$(cd "$WORKER" && bunx wrangler kv namespace create PRICES --json)"
NS_ID="$(printf '%s' "$NS_JSON" | sed -n 's/.*"id": *"\([0-9a-f]*\)".*/\1/p')"
if [ -z "$NS_ID" ]; then echo "could not parse namespace id:"; printf '%s\n' "$NS_JSON"; exit 1; fi
echo "namespace id: $NS_ID"
sed -i.bak -E "s/^id = \"[0-9a-f]+\"$/id = \"$NS_ID\"/" "$WORKER/wrangler.toml" 2>/dev/null \
  || sed -i '' -E "s/^id = \"[0-9a-f]+\"$/id = \"$NS_ID\"/" "$WORKER/wrangler.toml"
rm -f "$WORKER/wrangler.toml.bak"

echo "== 2/5: seeding manifest (live venue prices) =="
cd "$REPO" && bun scripts/seed-prices.ts

echo "== 3/5: uploading manifest + first price snapshot to KV =="
cd "$WORKER" && bunx wrangler kv key put --binding PRICES manifest --path "$REPO/basis.json"
bunx wrangler dev --test-scheduled --port 8799 >/tmp/moecap-setup-dev.log 2>&1 &
DEVPID=$!
trap 'kill $DEVPID 2>/dev/null || true' EXIT
for _ in $(seq 1 45); do sleep 1; curl -s -m 2 http://localhost:8799/prices >/dev/null 2>&1 && break; done
curl -s -m 90 "http://localhost:8799/__scheduled?cron=0+*+*+*+*" || true
sleep 2; kill $DEVPID 2>/dev/null || true

echo "== 4/5: deploying worker =="
bunx wrangler deploy
WORKER_URL="$(printf 'https://moecap-prices.%s.workers.dev' \
  "$(cd "$WORKER" && bunx wrangler whoami 2>/dev/null | sed -n 's/.*@\([a-z0-9-]*\)\..*/\1/p' | head -1)")"
echo "worker url: $WORKER_URL"

echo "== 5/5: wiring hydrate.js to the worker URL =="
sed -i.bak -E "s#https://moecap-prices\.[A-Za-z0-9.-]+\.workers\.dev/prices#$WORKER_URL/prices#" \
  "$REPO/src/hydrate.js" 2>/dev/null \
  || sed -i '' -E "s#https://moecap-prices\.[A-Za-z0-9.-]+\.workers\.dev/prices#$WORKER_URL/prices#" \
  "$REPO/src/hydrate.js"
rm -f "$REPO/src/hydrate.js.bak"
grep -n "workers.dev" "$REPO/src/hydrate.js"

echo
echo "Done. Deploy the site to publish hydrated pages:"
echo "  cd $REPO && bun run deploy"
echo "Re-seed after editing authored numbers in us-stocks.json:"
echo "  bun scripts/seed-prices.ts && (cd worker && bunx wrangler kv key put --binding PRICES manifest --path ../basis.json)"
