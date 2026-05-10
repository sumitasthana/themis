# CLI Module (`themis.mjs`)

## Purpose
`themis` CLI orchestrates local development lifecycle for all services and provides operational helper commands.

## Supported Commands
- `themis up` — starts Postgres check/bring-up, FastAPI, Express, and Vite.
- `themis down` — terminates processes listening on app ports.
- `themis status` — prints occupancy for agent/API/web/postgres ports.
- `themis warm` — runs investigations for alerts that do not yet have runs.
- `themis investigate <alertId>` — runs one investigation and prints recommendation.

## Responsibilities
1. Process lifecycle management across Windows/POSIX.
2. Port probing and readiness checks (`/health` for FastAPI).
3. Docker-assisted Postgres bootstrap (`local-postgres` container).
4. Developer-facing telemetry logging and graceful shutdown.

## Key Design Notes
- Foreground run model: `up` blocks and manages child process teardown on signal.
- Cross-platform process kill and port detection logic.
- Warm mode avoids duplicate investigations by checking `/api/investigations/alert/:id` first.

## Extension Guidelines
- Add new CLI commands via `dispatch` map.
- Keep command handlers small and composable.
- Reuse existing `callExpress` helper for BFF API interactions.
