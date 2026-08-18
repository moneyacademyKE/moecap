# Primary Filing Remediation — 2026-08-17

## Scope and evidence standard

This run used the official NSE Financial Results feed plus issuer investor-relations PDFs. Broker notes and market coverage were used to locate or cross-check disclosures only. Every promoted figure is backed by a locally vendored issuer/NSE PDF; no broker-only field entered `data/nse-data.json`.

## What was promoted

28 primary-backed canonical records were added or refreshed. The rendered terminal now distinguishes **audited primary filing** from **unaudited primary filing**, shows a direct `source PDF` link, and marks ALP’s figures as USD rather than falsely formatting them as KES.

| Class | Count | Examples |
|---|---:|---|
| Audited annual/financial statements | 13 | EGAD, BAMB, JUB, KAPC, KNRE, KPLC, KQ, NSE, PORT, SASN, SBIC, SCAN, WTK |
| Unaudited primary interims | 15 | ALP, CARB, CGEN, COOP, CRWN, DTK, FMLY, HFCB, IMH, KCB, LBTY, NBV, NMG, SCBK, SLAM |
| Fully primary-backed canonical records | 36 | Up from 13 before this remediation |

## Newly fixed examples

- **KCB H1 2026:** PAT KES 36.1B, assets KES 2.30T, EPS 22.45, interim DPS 3.00.
- **Co-op H1 2026:** PAT KES 15.7B, assets KES 796.5B, EPS 2.67.
- **Diamond Trust Q1 2026:** PAT KES 3.19B, assets KES 660.9B, EPS 11.39, declared DPS 9.00.
- **Kenya Power FY2025:** revenue KES 219.3B, PAT KES 24.5B, total DPS 1.00.
- **Kenya Airways FY2025:** revenue KES 161.5B and loss KES 17.2B — no cosmetic spin.
- **East African Portland FY2025:** revenue KES 7.08B, PAT KES 5.53B, equity KES 33.64B, EPS 61.39, DPS 1.25.
- **Williamson Tea FY2026:** revenue KES 3.40B, PAT KES 120.8M, EPS 3.31, DPS 15.
- **Kapchorua Tea FY2026:** revenue KES 1.66B, PAT KES 196.9M, EPS 12.58, DPS 30.
- **ALP REIT H1 2026:** USD reporting preserved: assets USD 45.18M, equity USD 41.67M, net income USD 233K.

## Held rather than invented

| State | Issuers |
|---|---|
| No current primary financial statement found | AMAC, EVRD, KURV |
| Suspended / in administration or receivership | ARM, CABL, DCON, TCL |
| Non-standard currency/instrument needs dedicated presentation | BKG (RWF cross-list), LAPR/TRFC (REIT), UMME (UGX cross-list) |
| No financial record in source dataset | UCHM, UMME, XPRS |
| More issuer-PDF collection remains, but no figures were promoted from summaries | BOC, BRIT, CIC, CTUM, EABL, KEGN, LKL, OCH, SMER, TPSE, UNGA, KUKZ |

## Follow-up primary-filing normalization

Eight additional locally vendored primary filings were normalized after the initial batch. All figures below retain issuer-reported period and units; broker figures remain excluded.

| Ticker | Period | Source | Key normalized facts |
|---|---|---|---|
| ABSA | FY2025 | Absa integrated report | PAT KES 22.905B; assets KES 537.648B; equity KES 100.520B; EPS 4.22; DPS 2.05 |
| BAT | FY2025 | BAT Kenya audited results | Net revenue KES 23.192B; PAT KES 5.246B; assets KES 17.387B; DPS 70.00 |
| EQTY | FY2025 | Equity audited financial statements | PAT KES 75.548B; assets KES 1.971T; equity KES 309.504B; EPS 19.07; DPS 5.75 |
| HAFR | FY2025 | Home Afrika audited consolidated report | Revenue KES 508.666M; PAT KES 117.889M; negative equity KES 1.031B retained as reported |
| LIMT | FY2025 | Limuru Tea audited results | Turnover KES 131.013M; loss KES 52.511M; assets KES 148.621M; EPS -21.88 |
| NCBA | FY2025 | NCBA audited annual report | PAT KES 23.394B; assets KES 716.047B; equity KES 127.426B; EPS 14.20; DPS 7.10 |
| SCOM | FY2026 | Safaricom audited results | Revenue KES 427.559B; PAT KES 73.676B; assets KES 518.045B; DPS 2.00 |
| SKL | FY2025 | Shri Krishana audited financial statements | Revenue KES 351.094M; PAT KES 4.137M; assets KES 196.665M; EPS 4.10 |

## Verification

- `bun test`: **81 passing, 0 failures**.
- `bun run build`: passed.
- Source audit: **36 primary-backed** canonical records — **21 audited** and **15 unaudited** — with **0** audited records missing a vendored source PDF.
