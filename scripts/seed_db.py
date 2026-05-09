"""Read scripts/seed_data.json and insert into Postgres.

Run: python scripts/seed_db.py

One-time use. Delete this file after Phase 1 verification.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "agent"))
load_dotenv(ROOT / ".env")

from db import models as M  # noqa: E402

SEED_PATH = ROOT / "scripts" / "seed_data.json"
DB_URL = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql+psycopg2://postgres:mysecretpassword@localhost:5433/themis_app",
)

# Insertion order respects FK dependencies.
ORDER = [
    ("customers", M.Customer),
    ("customer_risk_factors", M.CustomerRiskFactor),
    ("alerts", M.Alert),
    ("alert_typologies", M.AlertTypology),
    ("transactions", M.Transaction),
    ("timeline_entries", M.TimelineEntry),
    ("network_nodes", M.NetworkNode),
    ("network_edges", M.NetworkEdge),
    ("journal_steps", M.JournalStep),
    ("cases", M.Case),
    ("case_documents", M.CaseDocument),
    ("sars", M.SAR),
    ("sar_missing_fields", M.SARMissingField),
    ("sar_audit_trail", M.SARAuditEntry),
    ("anomalies", M.Anomaly),
    ("screening_results", M.ScreeningResult),
    ("models", M.Model),
    ("connectors", M.Connector),
]

# Truncate order is the reverse so children go first.
TRUNCATE_ORDER = [t for t, _ in reversed(ORDER)]


def main() -> None:
    if not SEED_PATH.exists():
        sys.exit(f"seed_data.json not found at {SEED_PATH}. Run `node scripts/seed.js` first.")

    with SEED_PATH.open(encoding="utf-8") as f:
        data = json.load(f)

    engine = create_engine(DB_URL, future=True)
    Session = sessionmaker(bind=engine, future=True)

    with Session() as s:
        # Idempotent reseed.
        for table in TRUNCATE_ORDER:
            s.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))

        for key, Model in ORDER:
            rows = data.get(key, [])
            if not rows:
                continue
            s.bulk_insert_mappings(Model, rows)
            print(f"  inserted {len(rows):4d} into {key}")

        s.commit()

    print("seed complete.")


if __name__ == "__main__":
    main()
