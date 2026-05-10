# Agent API Module (`agent/api.py`)

## Purpose
This FastAPI module hosts the investigation runtime and streaming APIs and mounts all data routes.

## Responsibilities
1. Initialize and hold singleton `ThemisAgent` on startup.
2. Expose health/readiness endpoints.
3. Expose blocking investigation endpoint.
4. Expose SSE streaming endpoint with per-step progress events.
5. Expose skills discovery endpoints.
6. Include `agent/routes.py` router for data and audit APIs.

## Primary Endpoints
- `GET /` — service status, loaded skills count.
- `GET /health` — health check.
- `POST /api/investigate` — full investigation response after completion.
- `GET /api/investigate/{alert_id}/stream` — start + step events + complete event.
- `GET /api/skills` and `GET /api/skills/{skill_name}` — skill metadata/content.

## Streaming Contract
- Emits SSE `data: {...}` events.
- Event lifecycle: `start` → multiple `step_start`/`step_complete` → `complete` (or `error`).
- Persists investigation before sending final completion event.

## Extension Guidelines
- Keep Pydantic request/response models aligned with frontend expectations.
- Preserve async behavior for tool-running steps.
- Ensure persistence errors are surfaced in response `errors` list without crashing server process.
