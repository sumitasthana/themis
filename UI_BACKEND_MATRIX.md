# Themis · UI ↔ Backend Validation Matrix

**Date:** 2026-05-04
**Source files:** [themis-platform.jsx](themis-platform.jsx), [server.js](server.js), [agent/api.py](agent/api.py), [agent/orchestrator.py](agent/orchestrator.py), [agent/tools.py](agent/tools.py), [skills/aml/](skills/aml/), [agents/agents.json](agents/agents.json), [prompts/](prompts/)

---

## TL;DR

| Layer | What's real | What's mocked | What's missing |
|---|---|---|---|
| **Frontend views** | All 14 AML views render with bundled mock data; 3 Workbench views read real centralized libraries; chat hits real Bedrock | — | Observability (4) and Audit Trail (4) — placeholder only |
| **Express server** | `/api/chat` (Bedrock) | Proxy to mocked Python endpoints | Auth, persistence, write APIs |
| **Python FastAPI** | `/api/skills` (reads real .md), `/health` | `/api/investigate` (10-step orchestrator with 100% random outputs) | Persistent investigations, alerts, cases, SARs, customers, transactions, screening |
| **Tools (9)** | Pull real skill markdown via `SkillsLoader` | All 9 investigation tools — random data, no DB, no real bank feed | Real tool execution against persisted data |
| **Auth / users** | — | — | No user identity, sessions, RBAC, persona enforcement (persona is frontend-only) |
| **Persistence** | — | — | No DB, no ORM, no migrations, no audit log |

**Bottom line:** The frontend looks complete; the backend is a working agent harness over **synthetic random data**. Closing the gap requires a database layer + replacing mock tools with real adapters. The agent skeleton itself (orchestrator, journal, tool registry, skills) does not need to change.

---

## 1. UI ↔ Backend matrix (per view)

Legend: ● real backend · ◐ partially real (chat / library) · ○ frontend-bundled mock · ✗ not yet implemented

| Sidebar group | UI view | Source data today | Real backend hook? | Agent coverage | Gap |
|---|---|---|---|---|---|
| **Daily briefing** | Chat terminal | `BriefingView` derives a summary from frontend `ALERTS/CASES/SARS` consts; chat goes to `POST /api/chat` (Bedrock) | ◐ chat real, summary computed client-side | None — direct Bedrock call, no orchestrator, no tools | Wire briefing summary to backend; orchestrator-aware chat with tool use |
| **AML Operations** | Dashboard | Bundled `ALERTS`, `CASES`, `ANOMALIES`, `CUSTOMERS` | ✗ | None | Replace with `GET /api/dashboard/summary` |
| | Alerts | Bundled `ALERTS` (6 records) | ✗ | `alert-investigator` agent exists but UI doesn't trigger it | Add `GET /api/alerts`, `POST /api/alerts/{id}/investigate` |
| | Alert Detail | Bundled `ALERTS`, `JOURNAL_STEPS`, `TIMELINE_Data`, `NETWORK_Data`, `TRANSACTIONS` | ✗ | Orchestrator's 10-step journal produces this exact shape — never wired | Stream `GET /api/investigate/{id}/stream` into the journal tab |
| | Cases | Bundled `CASES` (3 records) | ✗ | None | Add `GET /api/cases` |
| | Case Detail | Bundled — including documents, AML analysis tab, SAR sub-tab | ✗ | None for cases; SAR drafter agent exists but unused | `GET /api/cases/{id}`, `POST /api/cases/{id}/sar` |
| | Transactions | Bundled `TRANSACTIONS` keyed by alert | ✗ | None directly; tool `search_transactions` could back it | `GET /api/transactions?customerId=…&minAmount=…` |
| | Network Detection | Bundled `NETWORK_Data` (graph nodes + edges) | ✗ | `network-analyst` agent exists, never invoked from UI | `GET /api/network/{customerId}?depth=2` (back with `analyze_network` tool) |
| | SARs | Bundled `SARS` (2 records, narrative pre-generated) | ✗ | `sar-drafter` agent exists, never invoked | `GET /api/sars`, `POST /api/sars` (calls sar-drafter) |
| | SAR Detail | Bundled, default narrative computed client-side from customer + alert + txns | ✗ | None | `GET /api/sars/{id}`, `PUT /api/sars/{id}/narrative` |
| | Screening | Bundled `SCREENING_RESULTS` (8 records); "Run new screening" appends to client state | ✗ | Tool `check_sanctions` exists, never invoked from UI | `POST /api/screening`, `GET /api/screening` |
| | Model Governance | Inline static data (4 model rows) | ✗ | None | `GET /api/models`, `GET /api/models/{id}/metrics` |
| | Data Sources | Inline static data (8 connectors) | ✗ | None | `GET /api/connectors`, `POST /api/connectors/{id}/sync` |
| | Customer Detail | Bundled `CUSTOMERS` map + per-customer alerts/cases filter | ✗ | None | `GET /api/customers/{id}` |
| | Anomaly Detail | Bundled `ANOMALIES` (4 records) | ✗ | None | `GET /api/anomalies/{id}` |
| **Observability** | Metrics & KPIs | Coming Soon | ✗ | — | Build endpoint + view |
| | System Logs | Coming Soon | ✗ | — | Build endpoint + view |
| | Distributed Traces | Coming Soon | ✗ | — | OpenTelemetry capture per investigation |
| | Service Uptime | Coming Soon | ✗ | — | Health rollup |
| **Audit Trail** | Event Log | Coming Soon | ✗ | — | Persist every state change with actor + timestamp |
| | User Activity | Coming Soon | ✗ | — | Per-user activity timeline (requires auth) |
| | Change History | Coming Soon | ✗ | — | Diff log for prompts, models, policies |
| | Access Reviews | Coming Soon | ✗ | — | Quarterly cert workflow |
| **Platform Workbench** | Agent Studio | `agents/agents.json` (5 agents, real metrics field is **mocked**) | ◐ registry real, metrics mocked | All 5 agents defined here | Replace mock metrics with real telemetry; add deploy/version actions |
| | Skills Library | `skills/aml/*.md` via Vite glob — real markdown reads | ● | 6 skills, parsed live | Add CRUD on skills (write); skill execution dry-run |
| | Prompt Studio | `prompts/*.yaml` via Vite glob — real YAML reads | ● | 5 prompts, raw display | Add edit + version diff + A/B test runner |
| | Data Pipelines | Coming Soon | ✗ | — | Hook into Settings/Data Sources backend once it exists |

---

## 2. Agent coverage matrix

For each defined agent in [agents/agents.json](agents/agents.json), what UI surface would call it and is that wired today?

| Agent | Defined? | Tools available? | UI trigger today | UI trigger needed |
|---|---|---|---|---|
| `supervisor` | ✓ ([prompts/supervisor.yaml](prompts/supervisor.yaml)) | None directly — routes | Never invoked | "Investigate this alert" button on Alert Detail; Daily Briefing follow-up questions |
| `alert-investigator` | ✓ | `get_alert_details`, `get_customer_profile`, `search_transactions`, `calculate_baseline`, `search_keywords` (5/9) | Never invoked | Alert Detail → journal tab streams from `/api/investigate/{id}/stream` |
| `network-analyst` | ✓ | `analyze_network`, `check_sanctions`, `get_customer_profile` (3/9) | Never invoked | Network Detection view; Customer Detail → "View network" |
| `risk-scorer` | ✓ | `calculate_risk_score` (1/9) | Never invoked | Alert Detail risk panel; Anomaly Detail rationale |
| `sar-drafter` | ✓ | None (consumes other agents' outputs) | Never invoked | Case Detail → "Generate SAR with Themis AI" button (button exists, click is a no-op nav) |

**All 5 agents are configured but zero are reachable from the UI today.** The orchestrator exposes them via `POST /api/investigate` but no view calls that endpoint.

---

## 3. Tool coverage matrix

The 9 tools in [agent/tools.py](agent/tools.py) all return mocked random data. Mapping each to the UI feature that *would* consume it once real:

| Tool | Returns | Consumed by (intended UI) | Currently used in UI? |
|---|---|---|---|
| `get_alert_details` | Alert metadata, rules, flagged txns | Alert Detail header + summary | ✗ (uses bundled `ALERTS`) |
| `get_customer_profile` | KYC profile, PEP, risk rating | Customer Detail; Alert Detail subject card | ✗ |
| `search_transactions` | Filterable txn list | Transactions view; Alert Detail txn tab; Case Detail txn tab | ✗ |
| `calculate_baseline` | 90-day baseline + deviation | Alert Detail "Behavioral Baseline" risk factor | ✗ |
| `verify_income` | Stated vs observed income | Alert Detail risk factor; Customer Detail | ✗ |
| `search_keywords` | Suspicious keyword matches | Alert Detail journal step | ✗ |
| `analyze_network` | Graph + circular flows + layering | Network Detection view; Anomaly Detail; Network tab on Alert Detail | ✗ (uses bundled `NETWORK_Data`) |
| `check_sanctions` | Sanctions/PEP/adverse hits | Screening view; Customer Detail screening card | ✗ (uses bundled `SCREENING_RESULTS`) |
| `calculate_risk_score` | Score 0-100, level, confidence, recommendation | Alert Detail risk panel; risk explainability modal | ✗ |

**0 / 9 tools are reachable from any UI button today.**

---

## 4. Recommended data model

Backend has zero persistence. The natural ER model implied by the frontend + orchestrator state:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   customers  │◀───────▶│    alerts    │────────▶│  investigations
└──────┬───────┘    1..* └──────┬───────┘    1..1 └──────┬───────┘
       │                        │                        │
       │ 1..*                   │ 1..*                   │ 1..*
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ transactions │         │    cases     │         │journal_entries
└──────────────┘         └──────┬───────┘         └──────────────┘
                                │ 1..1
                                ▼
                         ┌──────────────┐
                         │     sars     │
                         └──────────────┘
```

### Tables to create (Postgres-style, names in `snake_case`)

| Table | Key columns | Why | Maps to today's frontend const |
|---|---|---|---|
| `customers` | `id` PK, name, dob, ssn_last4, phone, email, address, occupation, account_type, opened, stated_income, customer_risk, customer_risk_level, alert_risk, alert_risk_level, aml_status, prior_alerts, nationality | KYC + risk scores | `CUSTOMERS` |
| `customer_risk_factors` | `id` PK, customer_id FK, factor, weight, direction, detail | Per-customer explainability | `CUSTOMERS[*].riskFactors` |
| `alerts` | `id` PK, date, customer_id FK, status, confidence, alert_risk, alert_risk_level, agent_decision, inflow, outflow, txn_count, flagged_count | One row per ML alert | `ALERTS` |
| `alert_typologies` | alert_id FK, typology (m:n) | Denormalized for filtering | `ALERTS[*].typologies` |
| `transactions` | `id` PK, alert_id FK, customer_id FK, date, time, description, category, counterparty, counterparty_type, amount, balance, flagged, country, city, notes | Full txn ledger | `TRANSACTIONS` |
| `transaction_risk_indicators` | transaction_id FK, indicator (m:n) | Per-txn risk signals | `TRANSACTIONS[*].riskIndicators` |
| `cases` | `id` PK, alert_id FK, customer_id FK, title, status, priority, assignee, created, due_date, stage, sar_required, findings | Investigation cases | `CASES` |
| `case_documents` | `id` PK, case_id FK, type, name, size, uploaded, by, status | Evidence attachments | `CASES[*].documents` |
| `sars` | `id` PK, case_id FK, customer_id FK, status, filing_deadline, prepared_by, reviewed_by, qc_score, narrative | Suspicious activity reports | `SARS` |
| `sar_audit_trail` | `id` PK, sar_id FK, ts, user, action, detail | SAR history | `SARS[*].auditTrail` |
| `sar_missing_fields` | sar_id FK, field | QC gating | `SARS[*].missingFields` |
| `anomalies` | `id` PK, alert_id FK, type, title, description, accounts (jsonb), detected, amount, details, recommendations (jsonb) | ML-detected anomalies | `ANOMALIES` |
| `screening_results` | `id` PK, type, entity, entity_id, entity_type, match, score, source, details, action, payload (jsonb) | Sanctions / PEP / adverse / enforcement | `SCREENING_RESULTS` |
| `network_nodes` | `id` PK, customer_id FK, label, type, x, y, risk | Graph storage | `NETWORK_Data[*].nodes` |
| `network_edges` | `id` PK, customer_id FK, source FK→nodes, target FK→nodes, amount, direction | Graph edges | `NETWORK_Data[*].edges` |
| `investigations` | `id` PK, alert_id FK, started_at, completed_at, status, recommendation, confidence, risk_score, narrative | One per orchestrator run | Orchestrator state output |
| `journal_entries` | `id` PK, investigation_id FK, step, step_name, ts, tool, tool_input (jsonb), tool_output (jsonb), analysis, findings (jsonb), status | Full agent journal | `JOURNAL_STEPS` per alert + orchestrator output |
| `risk_factors` | `id` PK, investigation_id FK, factor, weight | Score breakdown | Orchestrator `state["risk_factors"]` |
| `data_sources` | `id` PK, name, vendor, type, status, volume, latency, last_sync_at | Operational connectors | `SettingsView` inline list |
| `models` | `id` PK, name, type, accuracy, precision, recall, fpr, status, drift, retrained | Model registry | `ModelGovernanceView` inline list |
| `users` *(future)* | `id` PK, email, role, created_at | When auth lands | persona is currently frontend-only |
| `audit_log` *(future)* | `id` PK, user_id FK, ts, action, target_type, target_id, before (jsonb), after (jsonb) | Backs Audit Trail category | placeholder views in sidebar |
| `agents` *(future, replaces JSON)* | `id` PK, name, role, model, prompt_file, status, version, last_deployed | Replace `agents/agents.json` | Agent Studio |
| `agent_metrics` *(future)* | agent_id FK, ts, p50_ms, p95_ms, success_rate, calls | Real telemetry | currently mocked field on agents.json |

### Library files to keep on disk (do **not** put in DB)

- `prompts/*.yaml` — version-controlled, deploy via PR review, mounted read-only by both Python orchestrator and Vite glob import
- `skills/aml/*.md` — same rationale; the [`SkillsLoader`](agent/skills_loader.py) already reads them at runtime

The DB stores instances and history; the filesystem stores the canonical code-like artifacts.

---

## 5. Decisions & priority

### Phase 1 — turn the lights on (foundation, ~1 sprint)

1. **Pick a DB.** Recommend Postgres + SQLAlchemy + Alembic. JSONB for flexible payload columns (anomaly details, screening payloads, journal `tool_input/tool_output`, network graphs).
2. **Seed from current frontend mocks.** Take every const in [themis-platform.jsx](themis-platform.jsx) and write a one-time seed script — that gives a working dev fixture without any frontend changes.
3. **Replace bundled JSX consts with `GET /api/…` fetches.** Smallest first: `GET /api/customers`, `GET /api/alerts`, `GET /api/cases`. The data shape already matches because the seed comes from those consts.
4. **Persist investigations.** Insert rows into `investigations` + `journal_entries` + `risk_factors` at the end of each orchestrator run. This unlocks Audit Trail later for free.

### Phase 2 — wire the agents (visible win)

5. **Alert Detail "Investigate" button** → `POST /api/investigate/{alertId}` → SSE stream into the journal tab. Already half-built: orchestrator + tools + skills exist; this just connects the UI button.
6. **Case Detail "Generate SAR"** → `POST /api/cases/{caseId}/sar` → calls `sar-drafter` agent → persists row in `sars`.
7. **Network Detection** → `GET /api/network/{customerId}` → real `analyze_network` tool against `transactions` + `network_edges`.
8. **Screening "Run new"** → `POST /api/screening` → real `check_sanctions` tool, persists in `screening_results`.

### Phase 3 — operational surfaces (Observability + Audit + auth)

9. **Auth + users.** OAuth (Google/Okta) → `users` table → enforce `personas` server-side instead of frontend-only.
10. **Audit Trail views** → straight `SELECT` on `audit_log` + `journal_entries` + `sar_audit_trail`. Most of this data will already exist if Phase 1 step 4 is done.
11. **Observability views** → Otel collector → either Grafana embed or a thin internal endpoint.

### Phase 4 — close the workbench loop

12. **Prompt Studio edit mode** → write back to `prompts/*.yaml` via a PR-creating endpoint (no direct disk write to keep the YAML library version-controlled).
13. **Agent Studio metrics** → swap mocked `metrics` field on `agents.json` for `agent_metrics` table aggregations.
14. **Skills Library CRUD** → same PR-based write flow as Prompt Studio.

---

## 6. What NOT to build (yet)

- Custom DSL for skills — markdown is fine.
- A model serving layer — Bedrock already serves Claude; the agent doesn't yet need its own model server.
- A bespoke graph DB — `network_nodes` + `network_edges` in Postgres + a simple recursive CTE handle 2-hop graphs at this scale.
- Real-time websockets for the journal — SSE (already proven on `/api/investigate/{id}/stream`) is sufficient.

---

## 7. Quick stats

- **UI views:** 14 AML + 4 Workbench + 8 Coming-Soon = **26 sidebar destinations**
- **UI views with real backend:** **3** (Daily Briefing chat, Skills Library, Prompt Studio)
- **UI views backed only by bundled mocks:** **15** (every AML view + Agent Studio metrics)
- **UI views not implemented at all:** **8** (Observability + Audit Trail placeholders)
- **Defined agents:** 5 (all unreachable from UI)
- **Defined tools:** 9 (all unreachable from UI, all return mocks)
- **Defined skills:** 6 (real markdown, surfaced read-only)
- **Persistent storage:** 0 tables, 0 rows
- **Recommended Phase-1 tables:** 19
