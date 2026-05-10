# Data Layer Module (`agent/db`, `agent/routes.py`, `agent/alembic`)

## Purpose
The data layer defines schema, ORM mappings, async DB access, migrations, and API serialization routes.

## Submodules

### 1) Database Session Module (`agent/db/database.py`)
- Loads `.env`.
- Creates async engine from `DATABASE_URL`.
- Exposes `SessionLocal` and `get_session`.

### 2) ORM Model Module (`agent/db/models.py`)
Defines entities for:
- Customers and customer risk factors
- Alerts, typologies, transactions, timeline, network, journal steps
- Cases and case documents
- SARs, missing fields, SAR audit trail
- Anomalies, screening results
- Models, connectors
- Investigations, investigation journal, investigation risk factors

### 3) Route/Serializer Module (`agent/routes.py`)
- Implements API endpoints under `/api/*`.
- Uses serializer helpers to output camelCase structures aligned with frontend.
- Supports both list/detail endpoints and operational writes (SAR generation).
- Exposes investigation audit endpoints (`/api/investigations*`).

### 4) Migration Module (`agent/alembic/versions`)
- `0001_phase1_initial_schema.py` — baseline schema + seed-compatible structures.
- `0002_investigations.py` — investigation audit trail tables.

## Route Families
- Entity routes: alerts, customers, cases, sars, anomalies, screening.
- Specialized routes: network, transactions, dashboard summary, models, connectors.
- Audit routes: investigations list/detail/by-alert.
- Write route: SAR generation from case context.

## Extension Guidelines
- Keep serializer output contract stable for UI consumers.
- Add migration scripts for schema changes before model/route usage.
- Prefer `selectinload` for related data where nested payloads are returned.
