# Frontend Module (`frontend/`)

## Purpose
The frontend module provides the AML analyst web application and visual workflows for alerts, customers, cases, SARs, screening, network detection, audit trail, model governance, and settings.

## Files
- `frontend/main.jsx` — React entry point.
- `frontend/themis-platform.jsx` — all UI views, routing state, shared UI components, API hooks.
- `frontend/vite.config.js` — dev proxy from `/api/*` to Express on `:3001`.
- `frontend/index.html` — Vite HTML shell.

## Core Responsibilities
1. Render all analyst-facing views.
2. Fetch data from `/api/*` endpoints.
3. Start live investigation streams using SSE.
4. Show persisted investigation journals and risk outcomes.
5. Provide utility consoles (Agent Studio, Skills Library, Prompt Studio) tied to repository assets.

## Data Access Pattern
- Uses fetch-based API calls and local component state.
- `/api/agent/investigate/:id/stream` is consumed with `EventSource` for step-by-step updates.
- Audit trail and detail views consume `/api/investigations*` endpoints.

## Key View Families
- **Operational:** Dashboard, Alerts, Alert Detail, Transactions, Network.
- **Investigation Casework:** Customers, Cases, SAR list/detail, Screening, Anomaly detail.
- **Platform Controls:** Model Governance, Settings.
- **AI Configuration:** Agent Studio, Skills Library, Prompt Studio.
- **Audit:** Audit Trail (investigation runs and journals).

## Extension Guidelines
- Reuse shared rendering helpers (badges, cards, journal rendering).
- Prefer API-driven state over local constants.
- Preserve existing payload keys expected by backend serializers.
- For new pages, add navigation wiring in `ThemisPlatform` and keep view props explicit (`onNav`, selected IDs).

## Failure Modes and Debug Tips
- Missing data in view: verify endpoint URL and response shape in browser network tab.
- SSE not updating: verify FastAPI stream endpoint and Express stream proxy path.
- CORS/proxy issues in local dev: confirm Vite proxy target is `http://localhost:3001`.
