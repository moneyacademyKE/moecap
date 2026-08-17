# NSE Research Update Playbook

## Purpose

Keep the NSE terminal current without turning broker commentary, stale web snippets, or model inference into financial fact. The terminal publishes **reported figures**, not recommendations. Every promoted figure must be traceable to an issuer or NSE document and to a clearly stated reporting period.

## Source hierarchy

| Tier | Source | Allowed use | Canonical-data rule |
|---|---|---|---|
| 1 | NSE Listed Company Announcements PDFs and issuer investor-relations filings | Authoritative results, dividends, corporate actions, reporting dates | May update canonical metrics after extraction and validation. Preserve a local copy in `data/nse-announcements/`. |
| 2 | Issuer annual reports / interim statements hosted by the company | Same as Tier 1 when the issuer and document are identifiable | May update canonical metrics after extraction and validation. |
| 3 | Kenyan broker research: Faida, Standard Investment Bank, Pergamon, AIB-AXYS, Cytonn, Sterling, OMS/Old Mutual | Discovery, cross-checks, estimates, ratings, price targets, document leads | **Never promote alone.** Match each proposed factual figure to Tier 1 or 2 before canonical use. Keep opinions separate and visibly labeled if later published. |
| 4 | NSE PLC social posts and reputable market news | Discovery only, especially for a new filing or image-based results notice | Never promote alone. Find the underlying filing first. |

## Data contract

The canonical terminal data is `data/nse-data.json`.

Each promoted company record must carry:

- A correct ticker and company identity.
- A reporting period that is stated by the source document, such as `FY2025`, `H1 2026`, or `Q1 2026`.
- Facts stored in **KES millions** except per-share values (`EPS`, `DPS`) and ratios (percent or ratio field as the renderer expects).
- `source: "audited"` only when backed by a Tier 1 or Tier 2 primary document. Archived legacy rows stay `source: "archived"`.
- An announcement row whose `file` points to the locally vendored PDF at `/nse/announcements/<filename>.pdf` whenever a source PDF is used.

## Promotion gates

A candidate may be promoted only if **all** checks pass:

1. **Identity** — ticker and issuer name match the NSE directory or issuer document.
2. **Period** — the accounting period is explicit; do not infer a period from publication date.
3. **Metric** — the label and units match the source table. Do not convert a service-revenue line into total revenue.
4. **Primary evidence** — each numerical fact is present in a Tier 1/2 PDF or is independently corroborated by it.
5. **No conflict** — contradictory primary figures stop promotion until resolved; keep the existing canonical period instead.
6. **Link durability** — copy the primary PDF into `data/nse-announcements/`; never point the terminal at a brittle third-party or staging URL.
7. **Scope** — do not copy broker prose, models, ratings, or targets into factual terminal fields.

If any gate fails, record the lead in the research report as **held**. Do not alter `nse-data.json`.

## Daily update procedure

Run once daily at 18:15 Africa/Nairobi, after the NSE trading day and normal issuer publication window.

1. **Inspect current state**
   - Read this playbook, `data/nse-data.json`, `src/nse.ts`, the source scripts, and `git status`.
   - Do not overwrite another session's dirty work. Abort and report if the data file has unrelated modifications.
2. **Discover documents**
   - Fetch `https://www.nse.co.ke/listed-company-announcements/` and its public data endpoint(s).
   - Check broker research indexes (Faida first; then SIB, Pergamon, AIB-AXYS, Cytonn, Sterling, OMS/Old Mutual) for new result notes.
   - Treat broker items and NSE PLC social posts as leads, not evidence.
3. **Acquire primary PDFs**
   - Download only newly discovered, valid PDFs from the NSE or issuer domain.
   - Store them under `data/nse-announcements/` using a stable filename; reject HTML/error pages masquerading as PDFs.
4. **Extract and cross-check**
   - Extract text using a local PDF reader.
   - Capture: issuer, ticker, reporting period, revenue/turnover, PBT/PAT, EPS, DPS/dividend, assets, equity and material corporate actions where explicitly reported.
   - Compare broker-led candidates against the primary PDF line by line. Prefer total revenue over a narrower service-revenue field when both are reported.
5. **Promote conservatively**
   - Update only the matching company period and `canonicalYear`; retain older periods for history.
   - Add/refresh the local announcement entry. Keep source attribution accurate.
   - If there are no primary-backed changes, make no repository change.
   - An audited record without a local primary PDF is a **remediation queue**, not proof: do not replace it from broker research; seek and vendor the filing first.
6. **Verify and publish**
   - Run `bun test` and `bun run build`.
   - Inspect the generated `public/nse/nse-data.json` and announcement PDF paths for each changed ticker.
   - Run `gitleaks` through the repository workflow or locally if available. Never commit credentials, downloaded broker research, or third-party report text.
   - Commit only changed source data/scripts/PDFs/build output with an atomic message, then push `master`. The existing GitHub Pages workflow deploys only after tests pass.
7. **Report**
   - Deliver a concise report: sources checked; promoted facts with source/period; held/rejected leads and why; test/build/deploy result; and any blocked source.

## Cadence

| Job | Frequency | Owner | Output |
|---|---|---|---|
| Price refresh | Hourly | Existing GitHub Action / Worker | Worker KV payloads |
| NSE research discovery and fact promotion | Daily, 18:15 Africa/Nairobi | OpenCrabs cron | Primary-backed terminal update or explicit no-change report |
| 13F holders | Quarterly | Existing GitHub Action | Worker KV holders index |
| Broker-source audit | First daily run of each month | Daily cron, report-only if no primary filings | Source availability and coverage gaps |

## Failure policy

- A failed fetch, unreadable PDF, unavailable broker site, ambiguous image, or source conflict is **not** permission to guess.
- Keep the last verified terminal data; do not delete existing results because a source is temporarily unavailable.
- Do not disable other cron jobs or modify Cloudflare/GitHub credentials.
- Do not expose secrets in logs, reports, commits, workflow files, or chat.
- After three failed attempts against the same source, stop and report the blocker with the URL and error class.

## Definition of current

The terminal is current when the newest available Tier 1/2 results for each covered company are represented with their real reporting periods, linked to a locally vendored source PDF, and the site has passed build, tests, secret scanning, and deployment. It is **not** current merely because a broker has published a newer estimate or an NSE social post mentions a result.
