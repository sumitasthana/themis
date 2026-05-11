# Themis Wiki

This wiki documents each major module in the repository, how modules interact, and where to extend functionality safely.

## Module Index

- [Frontend Module (`frontend/`)](./frontend-module.md)
- [Express BFF Module (`server.js`)](./express-bff-module.md)
- [CLI Module (`themis.mjs`)](./cli-module.md)
- [Agent API Module (`agent/api.py`)](./agent-api-module.md)
- [Orchestrator Module (`agent/orchestrator.py`)](./orchestrator-module.md)
- [Tools Module (`agent/tools.py`)](./tools-module.md)
- [Data Layer Module (`agent/db`, `agent/routes.py`, migrations)](./data-layer-module.md)
- [Prompts & Skills Module (`prompts/`, `skills/`, `agent/skills_loader.py`, `agent/agents.json`)](./prompts-and-skills-module.md)
- [Project Docs Module (`docs/`)](./project-docs-module.md)

## Operational Guides

Hands-on guides for running and maintaining the stack — distinct from module walkthroughs above.

- [Database Setup](./database-setup.md) — Postgres via Docker Compose, schema/seed dumps, refresh workflow, troubleshooting.

## End-to-End Request Flows

### Product UI Flow

1. React UI (`frontend/`) renders user views and calls `/api/*`.
2. Vite proxy forwards `/api/*` to Express (`server.js`) during development.
3. Express handles `/api/chat` directly with AWS Bedrock and proxies all other data and agent endpoints to FastAPI.
4. FastAPI (`agent/api.py` + `agent/routes.py`) executes investigations and data retrieval.
5. SQLAlchemy async layer (`agent/db`) reads/writes Postgres.

### Investigation Flow

1. Client calls `POST /api/agent/investigate` (Express proxy) → FastAPI `POST /api/investigate`.
2. FastAPI invokes `ThemisAgent.investigate_alert`.
3. Orchestrator runs 10 sequential steps using DB-backed tools.
4. Results persist into `investigations`, `investigation_journal`, and `investigation_risk_factors`.
5. Client reads history via `/api/investigations*` endpoints.

## Runtime Ports and Services

- Frontend (Vite): `:5173`
- Express BFF: `:3001`
- FastAPI agent: `:8000`
- Postgres: from `DATABASE_URL` / `DATABASE_URL_SYNC` env vars

## Key Design Principles

- Keep frontend and backend payload shapes aligned to avoid adapter-heavy UI code.
- Keep tool outputs deterministic where possible (notably risk-score confidence mapping).
- Persist every investigation run with step-level journal data for auditability.
- Route all read/write data APIs through FastAPI while using Express as the external BFF boundary.
