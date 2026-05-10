# Themis — Backend Migration: Phase 2 Complete · Phase 3 Instructions

## Document scope

Phase 1 (DB schema, seed, GET routes) and Phase 2 (real tools, SSE investigation, SAR write, network view) are complete and verified. This document now serves as Phase 3 instructions for Claude Code. Earlier phase sections are retained as reference.

---

## Database credentials

| Parameter | Value |
|---|---|
| Host | localhost |
| Port | read from `.env` `DATABASE_URL` / `DATABASE_URL_SYNC` |
| Database | themis_app |
| Username | postgres |
| Password | mysecretpassword |

> Do not hardcode the port. Always read from environment. The default fallback in `db/database.py` uses 5433 but the actual environment may differ.

---

## Tech stack

**Frontend** — React 18, Vite 5, files under `frontend/`. Entry: `frontend/main.jsx` → `frontend/themis-platform.jsx`. Dev server :5173. `frontend/vite.config.js` proxies `/api/*` → :3001.

**Node BFF** — Express 4 (`server.js`) on :3001. Proxies to FastAPI at `AGENT_API_URL` (default :8000). Bedrock via AWS SDK v3.

**Python agent** — FastAPI + Uvicorn on :8000 (`agent/api.py`). Orchestrator at `agent/orchestrator.py`. Tools at `agent/tools.py`. DB at `agent/db/`.

**Request chain:** React (5173) → Express (3001) → FastAPI (8000)

---

## Schema (Phase 1 — authoritative)

Derived from `frontend/themis-platform.jsx`. Authoritative source: `agent/alembic/versions/0001_phase1_initial_schema.py` and `agent/db/models.py`. Do not re-run this migration.

```
customers, customer_risk_factors
alerts, alert_typologies
transactions (PK: alert_id + id)
timeline_entries, network_nodes, network_edges
journal_steps
cases, case_documents
sars, sar_missing_fields, sar_audit_trail
anomalies, screening_results
models, connectors
```

Seed: 6 alerts, 18 typology rows, ~46 transactions, 3 cases, 2 SARs, 4 anomalies, 6 customers.

**Phase 2 migration** — `agent/alembic/versions/0002_investigations.py` adds:

```
investigations        — id TEXT PK (uuid4), alert_id FK→alerts,
                        started_at/completed_at TIMESTAMPTZ, status TEXT,
                        recommendation TEXT, confidence NUMERIC,
                        risk_score JSONB, narrative TEXT

investigation_journal — id SERIAL PK, investigation_id FK→investigations,
                        step INT, step_name TEXT, ts TIMESTAMPTZ,
                        tool TEXT, tool_input JSONB, tool_output JSONB,
                        analysis TEXT, findings JSONB, status TEXT

investigation_risk_factors — id SERIAL PK, investigation_id FK,
                             factor TEXT, weight NUMERIC
```

---

## Phase 1 verification — COMPLETE ✅

| Check | Result |
|---|---|
| `alembic upgrade head` clean | ✅ |
| Seed inserts without FK errors | ✅ (composite PK fix on transactions) |
| `count(alerts) = 6` | ✅ |
| `GET /api/alerts` shape matches JSX constants | ✅ |
| `GET /api/network/{id}` returns nodes + edges | ✅ |
| `GET /api/dashboard/summary` non-zero counts | ✅ |
| Express:3001 → FastAPI:8000 round-trip | ✅ |

---

## Phase 2 verification — COMPLETE ✅

| Check | Result |
|---|---|
| `import random` removed from `agent/tools.py` | ✅ (no `random.*` calls anywhere) |
| 8 data-reading tools query Postgres + return correct shapes | ✅ (verified against ALERT-0109) |
| `calculate_risk_score` unchanged in spirit | ✅ (deterministic confidence values replaced `random.uniform`) |
| `POST /api/agent/investigate` returns real data | ✅ (Neal Hall, real typologies, real flagged volume) |
| `GET /api/agent/investigate/:id/stream` streams 10 steps | ✅ (12 events: start + 10 step_complete + complete) |
| Each run creates rows in investigations + investigation_journal + investigation_risk_factors | ✅ (1 / 10 / 8 rows after first run) |
| Alert Detail Investigate button renders SSE journal | ✅ (EventSource, live panel above existing journal tab) |
| `POST /api/cases/:caseId/sar` returns new SAR id, row exists | ✅ (SAR-A82EC5C5, full Bedrock narrative) |
| Network Detection view renders from API | ✅ (useEffect fetch + edge shape adapter) |

### Phase 2 judgement calls — permanent decisions

These were ambiguities in the spec resolved during implementation. Do not relitigate them.

**`calculate_risk_score` confidence values** — Original used `random.uniform(85, 95)`. Replaced with deterministic fixed values: 90 for ESCALATE, 75 for REVIEW, 65 for CLEAR. Same logic, same intent, reproducible. This is the correct final state.

**Missing DB fields mapped in `get_customer_profile`** — Fields the orchestrator expects that have no direct DB column (all approximations documented in `tools.py` comments):

| Orchestrator field | DB source | Approximation |
|---|---|---|
| `pep_status` | `screening_results WHERE screen_type='PEP' AND entity_id=customer_id` | Exact if screening row exists |
| `kyc_last_updated` | `customers.opened` | Account open date — best available |
| `beneficial_owners` | — | Returns `[]` (no ownership data in schema) |
| `customer_type` | `customers.account_type` | Exact mapping |
| `business_type` | `customers.occupation` | Exact mapping |
| `kyc_status` | `customers.aml_status` | Exact mapping |

**`circular_flows` and `layering_detected` in `analyze_network`** — Returned as `[]` / `False`. Edge data exists in `network_edges` but cycle detection was not implemented in Phase 2. The orchestrator handles empty `circular_flows` gracefully. Implement proper cycle detection in Phase 3 if needed — not a blocker.

---

## Phase 2 cleanup — PENDING (own PR)

Per the spec, JS constant removal is a separate PR after all 15 views render from the API.

Remove from `frontend/themis-platform.jsx`:
- Constants: `CUSTOMERS`, `ALERTS`, `TRANSACTIONS`, `TIMELINE_Data`, `NETWORK_Data`, `JOURNAL_STEPS`, `CASES`, `SARS`, `ANOMALIES`, `SCREENING_RESULTS`
- Inline static data in `ModelGovernanceView` (`models` array) and `SettingsView` (`DS` array)

Before merging: `grep -r 'CUSTOMERS\|ALERTS\|TRANSACTIONS\|TIMELINE_Data\|NETWORK_Data\|JOURNAL_STEPS\|CASES\|SARS\|ANOMALIES\|SCREENING_RESULTS' frontend/` must return zero hits.

Also delete (Phase 1 cleanup, still pending):
- `scripts/seed.js`
- `scripts/seed_db.py`

---

## Phase 3 — Harden, extend, and wire remaining views

### Objective

Three parallel tracks: (A) execute the JS constant removal PR, (B) wire the views that still read from bundled data, (C) add the Audit Trail surface that Phase 2 investigations now make possible.

---

### Track A — JS constant removal

Do this first so subsequent work has a clean baseline.

1. For each constant block, confirm the corresponding `GET /api/*` route exists and returns the correct shape — all Phase 1 routes are live.
2. Replace each JSX constant reference with a `useEffect` + `fetch` call, using the Network Detection view pattern as the template.
3. `JOURNAL_STEPS` is superseded by `investigations` + `investigation_journal`. The journal tab in Alert Detail should already prefer live SSE data. Remove the static fallback only after confirming the live path works for all 6 alert IDs.
4. `ModelGovernanceView` inline `models` → `GET /api/models`. `SettingsView` inline `DS` → `GET /api/connectors`.
5. Verify with grep before merging.

---

### Track B — Wire remaining read-only views

These views still render from bundled constants. All have existing Phase 1 GET routes — no new backend work needed.

| View | Current state | Target route |
|---|---|---|
| Alert list | `ALERTS` const | `GET /api/alerts` |
| Customer detail | `CUSTOMERS[id]` const | `GET /api/customers/:id` |
| Cases list | `CASES` const | `GET /api/cases` |
| SAR list | `SARS` const | `GET /api/sars` |
| SAR detail | `SARS` const | `GET /api/sars/:id` |
| Screening | `SCREENING_RESULTS` const | `GET /api/screening` |
| Anomaly detail | `ANOMALIES` const | `GET /api/anomalies/:id` |
| Dashboard | Mix of consts + summary endpoint | Migrate remaining const reads |
| Transactions view | `TRANSACTIONS` const | `GET /api/alerts/:id` (returns transactions in detail response) |

`GET /api/alerts/:alertId` already returns `transactions`, `timeline`, `network`, and `journal` in the detail response — no new routes needed for most of these.

---

### Track C — Audit Trail view

Phase 2 created `investigations`, `investigation_journal`, and `investigation_risk_factors`. These power the Audit Trail sidebar category.

Add to `agent/routes.py`:

```
GET /api/investigations                     — list all runs, newest first
GET /api/investigations/:id                 — single run with full journal
GET /api/investigations/alert/:alertId      — all runs for a given alert
```

Wire the `audit-events` sidebar item (currently `ComingSoonView`) to a new `AuditTrailView`. Each row: alert ID, customer name, recommendation, confidence, timestamp, link to full journal. The full journal view reuses the existing journal step rendering component from `AlertDetailView`.

Do not implement `audit-users`, `audit-changes`, or `audit-access` in Phase 3 — those require auth.

---

### Phase 3 verification checklist

- [ ] `grep -r 'CUSTOMERS\|ALERTS\|TRANSACTIONS\|TIMELINE_Data\|NETWORK_Data\|JOURNAL_STEPS\|CASES\|SARS\|ANOMALIES\|SCREENING_RESULTS' frontend/` → zero hits
- [ ] All 15 previously-mocked views render from API (no const fallbacks)
- [ ] `ModelGovernanceView` data from `GET /api/models`
- [ ] `SettingsView` data from `GET /api/connectors`
- [ ] `audit-events` sidebar item opens `AuditTrailView` with real investigation rows
- [ ] `GET /api/investigations/alert/ALERT-0109` returns at least 1 row (from Phase 2 testing)
- [ ] Customer detail renders from `GET /api/customers/:id`
- [ ] Dashboard renders entirely from live endpoints
- [ ] No regression: Investigate button still streams, SAR generation still works, Network view still renders

---

## Key files reference

| File | Purpose | Phase |
|---|---|---|
| `frontend/themis-platform.jsx` | React UI — all views and (pending removal) JSX constants | All |
| `frontend/main.jsx` | React entry point | — |
| `frontend/vite.config.js` | Proxies `/api/*` → :3001 | — |
| `agent/api.py` | FastAPI, SSE streaming, agent init | 2 |
| `agent/orchestrator.py` | ThemisAgent, 10-step async workflow | 2 |
| `agent/tools.py` | 9 tools — real DB reads, no random | 2 ✅ |
| `agent/routes.py` | GET routes (Phase 1) + SAR write (Phase 2) + audit routes (Phase 3) | 1–3 |
| `agent/db/database.py` | Async engine + SessionLocal | 1 |
| `agent/db/models.py` | ORM models for all tables | 1–2 |
| `agent/alembic/versions/0001_phase1_initial_schema.py` | Phase 1 migration | 1 ✅ |
| `agent/alembic/versions/0002_investigations.py` | Phase 2 migration | 2 ✅ |
| `agents/agents.json` | 5-agent registry | — |
| `prompts/*.yaml` | Agent prompt YAML files | — |
| `skills/aml/*.md` | 6 AML skills | — |
| `server.js` | Express BFF | — |
| `scripts/seed.js` | **PENDING DELETION** | — |
| `scripts/seed_db.py` | **PENDING DELETION** | — |

---

## Permanent constraints (all phases)

- Do not add auth, sessions, or RBAC
- Do not hardcode DB port — always read from environment
- Do not change orchestrator field access patterns — validated against real data in Phase 2
- Do not reintroduce `import random` into `tools.py`
- Do not change `calculate_risk_score` logic — deterministic confidence values are the correct final state
- Do not create `agent/scoring.py` — no prototype scoring engine to port
- Do not introduce TypeScript, a new runtime, or a graph database
