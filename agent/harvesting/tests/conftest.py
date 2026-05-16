"""Test wiring — runs once before any test module imports `agent.*`.

Forces `DATABASE_URL` to a per-process SQLite file so the harvester
pipeline can be exercised end-to-end without a Postgres server. The
SQLite URL must be set BEFORE `agent.db.database` is first imported,
since it captures the env var at module load.
"""
from __future__ import annotations

import asyncio
import os
import tempfile

# Per-process SQLite file. Module-level so pytest_configure / collection
# doesn't end up with a stale path between collection and execution.
_TMP_DB = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
_TMP_DB.close()
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMP_DB.name}"

# Now safe to import — db.database picks up the SQLite URL.
from agent.db.database import engine, Base  # noqa: E402
from agent.db import models as M             # noqa: E402


async def _init_schema() -> None:
    """Create only the subset of tables the harvester pipeline uses.
    We deliberately skip Postgres-specific columns (Transaction.risk_indicators
    ARRAY, Anomaly.recommendations ARRAY) by listing tables explicitly."""
    tables = [
        M.Customer.__table__,
        M.Alert.__table__,
        M.AlertTypology.__table__,
        M.Typology.__table__,
        M.TypologyCandidate.__table__,
    ]
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sc: Base.metadata.create_all(sc, tables=tables)
        )


asyncio.run(_init_schema())
