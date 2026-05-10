# Themis — AML Intelligence Platform

AI-powered Anti-Money Laundering (AML) intelligence platform with a React UI, an Express BFF, and a Python (FastAPI + LangGraph) agent service.

## Architecture

```text
React (Vite, :5173)
   ↓  /api/* (proxied)
Express BFF (:3001)
   ↓  forwards data routes + agent calls
FastAPI agent (:8000)
   ↓
Postgres (:5433, Docker)
```

The Express BFF handles `/api/chat` directly against AWS Bedrock; everything else is forwarded to the Python service.

## Layout

```text
.
├── README.md
├── package.json / package-lock.json
├── server.js                                                       # Express BFF
├── themis.mjs                                                      # CLI entry (`themis` bin)
├── start-all.ps1                                                   # launcher (Win)
├── .env                                                            # AWS + DB credentials (gitignored)
├── frontend/                                                       # React + Vite UI
│   ├── index.html
│   ├── main.jsx
│   ├── themis-platform.jsx
│   └── vite.config.js
├── agent/                                                          # Python service
│   ├── api.py                  # FastAPI app
│   ├── orchestrator.py         # LangGraph multi-agent orchestrator
│   ├── routes.py               # GET data routes (Phase 1)
│   ├── tools.py                # investigation tool layer
│   ├── skills_loader.py        # YAML/markdown skill loader
│   ├── db/                     # SQLAlchemy async engine + ORM models
│   ├── alembic/ alembic.ini    # migrations
│   └── requirements.txt
├── prompts/                    # YAML prompts (supervisor, alert-investigator, ...)
├── skills/aml/                 # markdown skill bodies
└── docs/                       # CHANGELOG, DESIGN_SYSTEM, QUICK_REFERENCE, data doc
```

## Setup

### Prerequisites

- Node 18+
- Python 3.11+
- Docker (for Postgres)

### Install

```powershell
npm install
pip install -r agent/requirements.txt
```

### `.env`

```text
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL=us.anthropic.claude-sonnet-4-6

DATABASE_URL=postgresql+asyncpg://postgres:mysecretpassword@localhost:5433/themis_app
DATABASE_URL_SYNC=postgresql+psycopg2://postgres:mysecretpassword@localhost:5433/themis_app
```

### Postgres

```powershell
docker run -d --name local-postgres `
  -e POSTGRES_PASSWORD=mysecretpassword `
  -e POSTGRES_DB=themis_app `
  -p 5433:5432 `
  -v themis_pgdata:/var/lib/postgresql `
  postgres
```

### Schema (one-time)

```powershell
cd agent ; python -m alembic upgrade head ; cd ..
```

## Run

```powershell
# All three services
.\start-all.ps1

# …or individually
python agent/api.py          # FastAPI on :8000
npm run dev                  # Express + Vite (concurrently)
```

Then open <http://localhost:5173>.

## Endpoints

|Method|Path|Notes|
|---|---|---|
|`POST`|`/api/chat`|Bedrock chat (handled by Express directly)|
|`POST`|`/api/agent/investigate`|Run agent investigation (DB-backed, persists)|
|`GET`|`/api/agent/investigate/:id/stream`|SSE progress (10 steps)|
|`POST`|`/api/cases/:id/sar`|Generate SAR draft via Bedrock + persist|
|`GET`|`/api/alerts` `…/:id`|Alerts (returns transactions/timeline/network/journal in detail)|
|`GET`|`/api/cases` `…/:id`|Cases|
|`GET`|`/api/customers` `…/:id`|Customers + linked alerts/cases|
|`GET`|`/api/sars` `…/:id`|SARs with audit trail|
|`GET`|`/api/anomalies` `…/:id`|Anomalies|
|`GET`|`/api/screening`|Screening results|
|`GET`|`/api/network/:id`|Graph nodes + edges (alert id or customer id)|
|`GET`|`/api/transactions?flagged=true`|Flat list of transactions across all alerts|
|`GET`|`/api/investigations`|Past investigation runs (newest first, LIMIT 100)|
|`GET`|`/api/investigations/:id`|Single run + journal + risk factors|
|`GET`|`/api/investigations/alert/:alertId`|All runs for a given alert|
|`GET`|`/api/dashboard/summary`|Aggregated counts|
|`GET`|`/api/models`|Model governance|
|`GET`|`/api/connectors`|Data sources|

## Documentation

- [docs/CHANGELOG.md](docs/CHANGELOG.md) — phase log
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — colors, components, patterns
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) — copy-paste tokens
- [docs/themis_data_doc.docx](docs/themis_data_doc.docx) — data model reference
- [skills/aml/](skills/aml/) — AML investigation procedure skills
