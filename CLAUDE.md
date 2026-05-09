# Themis — Backend Migration: Phase 1 Complete · Phase 2 Instructions

## Document scope

Phase 1 (DB schema, seed, GET routes) is complete and verified. This document now serves as the Phase 2 instructions for Claude Code. The Phase 1 sections below are retained as reference — they describe the schema and data that Phase 2 tools must read from.

---

## Database credentials

| Parameter | Value |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | themis_app |
| Username | postgres |
| Password | mysecretpassword |

Connection string: `postgresql://postgres:mysecretpassword@localhost:5432/themis_app`

> **Note:** The actual host port may differ from 5432 depending on the environment — check `.env` for `DATABASE_URL` and `DATABASE_URL_SYNC` and use whatever is set there. Do not hardcode the port in new code; always read from environment.

---

## Actual tech stack

**Frontend** — React 18, Vite 5 (`@vitejs/plugin-react`), files under `frontend/`. Entry at `frontend/main.jsx` → `frontend/themis-platform.jsx`. Dev server on port 5173. `frontend/vite.config.js` proxies `/api/*` → `http://localhost:3001`.

**Node BFF** — Express 4 (`server.js`) on port 3001. Already proxies agent calls to `AGENT_API_URL` (default `http://localhost:8000`). Uses AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`) for Bedrock. The `/api/*` → FastAPI forwarding path already exists — do not add a new proxy; extend what is there.

**Python agent service** — FastAPI + Uvicorn on port 8000 (`agent/api.py`). LangChain + LangGraph orchestrator (`agent/orchestrator.py`). langchain-aws → Bedrock. Pydantic v2, PyYAML, python-dotenv.

**Request chain:** React (5173) → Express BFF (3001) → FastAPI (8000)

**Phase 1 status:** SQLAlchemy (async), asyncpg, alembic, psycopg2-binary are all installed and wired. Schema is migrated. DB is seeded. GET routes are live. Do not re-run migrations or seed.

Do not introduce TypeScript, a new runtime, or a graph database.

---

## Actual schema (as built in Phase 1)

The schema was derived from `frontend/themis-platform.jsx` (the live platform), not `themis_app.jsx` (the prototype). Those files are authoritative. Do not re-run the migration.

**Tables created (in FK dependency order):**

```
customers                 → core KYC entity
customer_risk_factors     → per-customer risk factor rows (FK → customers)
alerts                    → one row per alert (FK → customers)
alert_typologies          → many:many alert↔typology names (FK → alerts)
transactions              → PK is composite (alert_id, id) — TX IDs are not globally unique
timeline_entries          → inflow/outflow per date per alert (FK → alerts)
network_nodes             → graph nodes keyed by alert_id (FK → alerts)
network_edges             → graph edges keyed by alert_id (FK → alerts)
journal_steps             → investigation journal per alert (FK → alerts)
cases                     → investigation cases (FK → alerts, customers)
case_documents            → evidence attachments (FK → cases)
sars                      → suspicious activity reports (FK → cases, customers)
sar_missing_fields        → QC gating fields (FK → sars)
sar_audit_trail           → SAR history entries (FK → sars)
anomalies                 → ML-detected anomalies (FK → alerts)
screening_results         → sanctions/PEP/adverse/enforcement hits
models                    → model governance registry
connectors                → data source connectors
```

**What the prototype schema had that the platform schema does not:**

The CLAUDE.md originally described `directors`, `addresses`, `csps`, `originators`, `entities`, and `alert_evidence` tables. These belong to the Themis prototype (`themis_app.jsx`) which models UAE free-zone entity networks. The platform (`themis-platform.jsx`) models retail AML customers — a different domain entirely. Those tables were correctly not built.

**Seed outcome (verified):**

- 6 alerts (platform has 6, not 76 — the 76 estimate was prototype-only)
- 3 typologies per alert (18 alert_typology rows)
- ~46 transactions across 6 alerts
- 3 cases, 2 SARs, 4 anomalies, 6 customers
- Express:3001 → FastAPI:8000 round-trip verified

---

## Phase 1 — COMPLETE

Steps 1–4 are done and verified. The seed scripts (`scripts/seed.js`, `scripts/seed_db.py`) should now be deleted and `scripts/seed_data.json` added to `.gitignore` per the cleanup section below.

---

## Phase 2 — Wire the agents

### Objective

Replace the 9 tools in `agent/tools.py` that currently return random data with real implementations reading from the Postgres DB. Wire the existing UI buttons to the agent endpoints. At the end of Phase 2, an analyst clicking "Investigate" on an alert triggers a real 10-step orchestrated investigation and streams the journal into the UI.

### Read the code before starting — two structural problems to resolve first

Before writing any code, read `agent/orchestrator.py` and `agent/tools.py` together. There are two problems in the existing code that must be addressed before simple tool replacement will work.

**Problem 1 — Tool output shapes don't match the DB schema**

The orchestrator accesses specific keys from each tool's return dict. For example, `_step_1_alert_details` reads `alert_details['customer_name']`, `alert_details['created_date']`, `alert_details['rules_fired']`, `alert_details['rule_count']`, `alert_details['flagged_transactions']`, `alert_details['total_flagged_volume']`, `alert_details['alert_score']`.

The `alerts` table contains: `id`, `date`, `customer_id`, `txns`, `flagged`, `status`, `confidence`, `alert_risk`, `alert_risk_level`, `agent_decision`, `inflow`, `outflow`. It has no `rules_fired`, `rule_count`, `flagged_transactions`, or `alert_score` columns.

Similarly, `_step_2_customer_profile` reads `profile['customer_type']`, `profile['business_type']`, `profile['kyc_status']`, `profile['kyc_last_updated']`, `profile['pep_status']`, `profile['beneficial_owners']`. The `customers` table has `occupation`, `aml_status`, `nationality`, `stated_income`, etc. — different fields, different names.

**Resolution:** The tool replacement must produce the shape the orchestrator expects, derived from whatever DB fields are actually available. Where a field doesn't exist in the DB (e.g. `kyc_last_updated`, `pep_status`, `beneficial_owners`), either: derive it from what's available, or map a DB field to the expected key. Do not change the orchestrator's field access — change what the tool returns to match. Document every mapping that is an approximation.

**Problem 2 — Tools are sync, orchestrator/API is async**

`agent/tools.py` functions are synchronous. `agent/api.py`'s SSE endpoint is async and calls `agent._step_1_alert_details(state)` etc. synchronously inside `generate_progress()`. The current design works because the tools are in-memory random generators. Once tools need async DB calls, this breaks.

**Resolution:** Make all tools async (`async def`) and update the orchestrator steps to `await` them. Update `generate_progress()` in `api.py` to `await state = await step_func(state)`. The `SessionLocal` async session from `db/database.py` is already available.

---

### Step 1 — Replace mock tools with real DB reads

For each tool, the required output shape (what the orchestrator expects) is listed alongside the available DB source. Read `orchestrator.py` step functions to confirm field names before implementing.

| Tool | Orchestrator expects | DB source | Notes |
|---|---|---|---|
| `get_alert_details(alert_id)` | `alert_id`, `status`, `created_date`, `customer_id`, `customer_name`, `risk_level`, `rules_fired` (list), `rule_count`, `flagged_transactions` (list of IDs), `total_flagged_volume`, `alert_score`, `previous_alerts`, `account_age_days` | `alerts` JOIN `customers`, `alert_typologies`, `transactions WHERE flagged=true` | `rules_fired` → derive from `alert_typologies.typology_name`; `customer_name` → join `customers`; `flagged_transactions` → IDs of `transactions WHERE flagged=true`; `total_flagged_volume` → SUM of flagged transaction amounts; `alert_score` → map from `alerts.confidence`; `risk_level` → map from `alerts.alert_risk_level` |
| `get_customer_profile(customer_id)` | `customer_id`, `customer_name`, `customer_type`, `account_opened`, `kyc_status`, `kyc_last_updated`, `business_type`, `risk_rating`, `pep_status`, `sanctions_hit`, `adverse_media`, `beneficial_owners`, `addresses`, `phone`, `email` | `customers` + `customer_risk_factors` | Many fields absent from DB — map `aml_status` → `kyc_status`; `occupation` → `business_type`; `customer_risk_level` → `risk_rating`; fields with no DB equivalent (pep_status, kyc_last_updated, beneficial_owners) → return sensible defaults or derive from risk_factors |
| `search_transactions(customer_id, min_amount)` | list of dicts with `transaction_id`, `customer_id`, `date`, `type`, `amount`, `currency`, `description`, `counterparty`, `location`, `flags` | `transactions` WHERE `alert_id` IN (SELECT id FROM alerts WHERE customer_id=?) AND amount >= min_amount | Map `descr` → `description`; `cp_type` → `type`; `risk_indicators` → `flags`; `counterparty` as-is |
| `calculate_baseline(customer_id, period_days)` | `customer_id`, `analysis_period_days`, `baseline_metrics` (dict), `alert_period_metrics` (dict), `deviations` (dict), `is_significant_deviation`, `deviation_score` | `transactions` + `timeline_entries` for the customer | Aggregate inflow/outflow from `timeline_entries`; split into baseline window vs most recent 30 days; compute deviation |
| `verify_income(customer_id)` | `customer_id`, `stated_annual_income`, `income_source`, `documentation_provided`, `observed_annual_volume`, `discrepancy_pct`, `is_consistent`, `red_flags`, `verification_status` | `customers.stated_income` + SUM of `transactions.amount` WHERE inflow | `stated_income` is annual in DB; `observed_annual_volume` = annualized sum of inflow transactions |
| `search_keywords(customer_id, keywords)` | `customer_id`, `keywords_searched`, `total_matches`, `matches` (list), `high_risk_keywords_found`, `requires_review` | `transactions WHERE (descr ILIKE '%keyword%' OR notes ILIKE '%keyword%')` for customer's alerts | Each match: construct dict with `transaction_id`=`t.id`, `date`, `amount`, `description`=`t.descr`, `keyword_matched`, `context`="Description" |
| `analyze_network(customer_id, depth)` | `customer_id`, `analysis_depth`, `total_connections`, `connections` (list), `circular_flows`, `network_risk_score`, `high_risk_connections`, `shared_infrastructure`, `layering_detected` | `network_nodes` + `network_edges` for customer's alerts | Nodes/edges are pre-computed in DB; derive `connections` list from edges; `circular_flows` = [] (not computed yet); `layering_detected` = False unless edge graph has cycles |
| `check_sanctions(entity_name, entity_type)` | `entity_name`, `entity_type`, `screening_date`, `lists_checked`, `total_hits`, `matches` | `screening_results WHERE entity ILIKE '%entity_name%'` | Map `screen_type` → list name; `score` → `match_score`; reconstruct `matches` list from rows |
| `calculate_risk_score(factors)` | (unchanged) | None — pure computation | Keep existing logic exactly as-is. Do not touch this function. |

**Async pattern for each tool:**

```python
async def get_alert_details(alert_id: str) -> dict:
    async with SessionLocal() as session:
        # ... SQLAlchemy async queries ...
        return { ... }  # must match shape orchestrator expects
```

---

### Step 2 — Update orchestrator and API to await tools

In `agent/orchestrator.py`:
- Change `ThemisAgent._step_1_alert_details` through `_step_9_risk_score` to be `async def`
- Change each `tool_function(args)` call to `await tool_function(args)`
- Change `ThemisAgent.investigate_alert` to `async def`

In `agent/api.py`:
- Change `generate_progress()` inner calls `state = step_func(state)` → `state = await step_func(state)`
- Change `agent.investigate_alert(request.alert_id)` → `await agent.investigate_alert(request.alert_id)`
- The outer `async def investigate_alert_stream` and `async def investigate_alert` are already async — only the inner calls need updating

---

### Step 3 — Persist investigation results

Add a new Alembic migration (`0002_investigations.py`) with these tables:

```sql
investigations   -- id TEXT PK (uuid4), alert_id FK→alerts,
                 --   started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
                 --   status TEXT, recommendation TEXT,
                 --   confidence NUMERIC, risk_score JSONB, narrative TEXT

investigation_journal  -- id SERIAL PK, investigation_id FK→investigations,
                       --   step INT, step_name TEXT, ts TIMESTAMPTZ,
                       --   tool TEXT, tool_input JSONB, tool_output JSONB,
                       --   analysis TEXT, findings JSONB, status TEXT

investigation_risk_factors  -- id SERIAL PK, investigation_id FK→investigations,
                            --   factor TEXT, weight NUMERIC
```

Do not name the journal table `journal_entries` — that name conflicts with the existing `journal_steps` table which is per-alert pre-seeded data. These new tables are per-investigation run.

At the end of `investigate_alert()`, after all steps complete, insert:
1. One row into `investigations`
2. One row per journal entry into `investigation_journal`
3. One row per risk factor into `investigation_risk_factors`

Use a single async session and commit once.

---

### Step 4 — Wire the UI trigger points

**Alert Detail → "Investigate" button**

In `themis-platform.jsx`, find the Investigate button in `AlertDetailView`. It currently calls `POST /api/agent/investigate`. Wire it to use the SSE stream endpoint instead: `GET /api/agent/investigate/:alertId/stream`. Open an `EventSource`, parse each SSE event, and render the journal steps incrementally as they arrive. The journal tab in Alert Detail is the target render surface.

**Case Detail → "Generate SAR with Themis AI"**

The button exists and currently navigates somewhere on click. Add a new write route to `agent/routes.py`:

```
POST /api/cases/:caseId/sar
```

This route should: load the case + its linked alert + customer from DB, call the `sar-drafter` prompt with that context via Bedrock (using the existing Bedrock client pattern from `server.js`), and insert the result as a new row in `sars`. Return the new SAR id.

Note: `sar-drafter` has no tools — it receives the investigation journal as input and returns a narrative. The POST body should include the investigation journal from the most recent `investigations` row for the case's alert.

**Network Detection view**

`GET /api/network/:customerId` already exists in `agent/routes.py` from Phase 1. Find where `NetworkDetectionView` in `themis-platform.jsx` reads from `NETWORK_Data` and replace with a fetch to that endpoint.

---

### Verification checklist for Phase 2

- [ ] `import random` removed from `agent/tools.py` — confirmed by grep
- [ ] All 8 data-reading tools (`get_alert_details` through `check_sanctions`) query Postgres and return the exact dict shape the orchestrator expects — verified by calling `POST /api/agent/investigate` with a real alert ID and checking each journal step's `tool_output` field
- [ ] `calculate_risk_score` is unchanged
- [ ] `POST /api/agent/investigate` with alert ID `ALERT-0109` (or whichever ID exists in the DB) returns a completed investigation with real customer name, real transaction count, real typologies
- [ ] `GET /api/agent/investigate/:alertId/stream` streams all 10 journal steps
- [ ] Each investigation run creates rows in `investigations` + `investigation_journal` + `investigation_risk_factors` — confirmed by SELECT after a run
- [ ] Alert Detail "Investigate" button renders SSE journal steps in the UI
- [ ] `POST /api/cases/:caseId/sar` returns a new SAR id and the row exists in `sars`
- [ ] Network Detection view renders nodes/edges from the API, not from `NETWORK_Data` const

---

## Phase 1 verification — results

All checks passed. Notes on items that didn't apply:

| Check | Result |
|---|---|
| `requirements.txt` updated, pip install succeeds | ✅ |
| `alembic upgrade head` clean | ✅ |
| `node scripts/seed.js` → `seed_data.json` no missing fields | ✅ |
| `python scripts/seed_db.py` inserts without FK errors | ✅ (after composite PK fix on `transactions`) |
| `count(alerts) = 6` | ✅ (platform has 6 alerts, not 76 — 76 was prototype-only) |
| `count(alert_typologies) / count(alerts) = 3.0` | ✅ |
| `count(transactions)` non-zero | ✅ (46 across 6 alerts) |
| `GET /api/alerts` shape matches `ALERTS` const field-for-field | ✅ (0 extra/missing keys) |
| `GET /api/network/{id}` returns nodes + edges | ✅ |
| `GET /api/dashboard/summary` returns non-zero counts | ✅ (6 alerts, 3 cases, 2 SARs, 4 anomalies, 6 customers) |
| `server.js` forwards new prefixes to FastAPI | ✅ (Express:3001 → FastAPI:8000 round-trip verified) |
| `count(alert_evidence)` check | **N/A** — `alert_evidence` table not built; platform has no evidence ledger (prototype-only concept) |
| `GET /api/alerts/8821 → EV-001..EV-009` | **N/A** — same reason |
| `GET /api/network/E_NAHDA` | **N/A** — network is keyed by `alert_id` in platform schema, not entity ID |

---

## Cleanup

### Phase 1 cleanup — do this now

Delete immediately (Phase 1 is verified):
- `scripts/seed.js`
- `scripts/seed_db.py`

Confirm `scripts/seed_data.json` is in `.gitignore` — it should already be there from the Phase 1 implementation.

These were left in place deliberately so Phase 1 could be re-run if needed. That window is now closed.

### Phase 2 cleanup — after Phase 2 is verified

Remove from `themis-platform.jsx` in a single dedicated PR:
- All hardcoded data constants: `CUSTOMERS`, `ALERTS`, `TRANSACTIONS`, `TIMELINE_Data`, `NETWORK_Data`, `JOURNAL_STEPS`, `CASES`, `SARS`, `ANOMALIES`, `SCREENING_RESULTS`
- Inline static data blocks inside `ModelGovernanceView` and `SettingsView`

Note: `buildCase()`, `evidenceFor()`, and `computeTypologyScore()` are prototype-only functions that do not exist in `themis-platform.jsx`. No scoring engine needs to be ported from the platform file — the platform's alerts are pre-computed static records.

Before merging:
- Grep the codebase for any remaining reference to deleted constants
- Confirm all 15 previously-mocked views render from API data

---

## Key files reference

| File | Purpose |
|---|---|
| `frontend/themis-platform.jsx` | React UI — all JSX constants, all views |
| `frontend/main.jsx` | React entry point |
| `frontend/vite.config.js` | Vite config — proxies `/api/*` → :3001 |
| `agent/api.py` | FastAPI app, SSE streaming, agent initialization |
| `agent/orchestrator.py` | ThemisAgent, 10-step workflow, field access patterns |
| `agent/tools.py` | 9 tools, all mock/random — REPLACE IN PHASE 2 |
| `agent/routes.py` | Phase 1 GET routes, read-only (except new SAR write endpoint) |
| `agent/db/database.py` | Async engine + SessionLocal + Base |
| `agent/db/models.py` | ORM models |
| `agent/alembic/versions/0001_phase1_initial_schema.py` | Phase 1 migration — authoritative schema |
| `agent/requirements.txt` | Python deps — sqlalchemy[asyncio], asyncpg, psycopg2-binary, alembic |
| `agents/agents.json` | 5-agent registry, all defined, none UI-reachable yet |
| `prompts/*.yaml` | supervisor, alert-investigator, network-analyst, risk-scorer, sar-drafter |
| `skills/aml/*.md` | 6 AML skills, real markdown, parsed by SkillsLoader and by Vite glob |
| `server.js` | Express BFF — `DATA_PROXY_PREFIXES` forwards `/api/*` to FastAPI |
| `scripts/seed.js` | PENDING DELETION — reads from `frontend/themis-platform.jsx` |
| `scripts/seed_db.py` | PENDING DELETION |

**Frontend path note:** The frontend files moved to `frontend/` in Phase 6. The seed script was updated accordingly (`SRC = path.join(ROOT, 'frontend', 'themis-platform.jsx')`). Any Phase 2 frontend changes must target `frontend/themis-platform.jsx`, not a root-level file.

**Workbench view IDs:** Agent Studio = `wb-agents`, Skills Library = `wb-skills`, Prompt Studio = `wb-prompts`, Data Pipelines = `wb-pipelines` (Coming Soon). The first three are fully implemented. Network Detection view ID is `network`.

---

## What not to do in Phase 2

- Do not break the Phase 1 GET routes — `agent/routes.py` is read-only unless adding the new SAR write endpoint
- Do not add auth, sessions, or RBAC
- Do not change the orchestrator's field access patterns — change what the tools return to match what the orchestrator expects, not the other way around
- Do not introduce a graph database — `network_nodes` + `network_edges` in Postgres handles 2-hop graphs at this scale
- Do not remove JS constants from `frontend/themis-platform.jsx` until all views are confirmed to render from the API
- Do not invent data — tools must read from the seeded DB rows; if a field is missing from the DB, derive or approximate it from what is available and document the approximation
- Do not make `calculate_risk_score()` read from the DB — it is pure computation and must stay that way
- Do not create `agent/scoring.py` — `buildCase()` and `evidenceFor()` are prototype-only and do not exist in `frontend/themis-platform.jsx`; the platform's alerts are pre-computed records
