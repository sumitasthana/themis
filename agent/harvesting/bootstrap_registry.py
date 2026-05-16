"""Scan the seed typology MD tree and insert/refresh rows in `typologies`.

Idempotent: re-running updates `md_sha256` / `md_path` / `current_version`
on existing rows, but never overwrites `approved_by` or `deployed_at`.
After insert, backfills `alert_typologies.typology_id` for rows whose
`typology_name` exactly matches a registry `name`.

Usage:
    python -m agent.harvesting.bootstrap_registry [--skills-dir PATH]
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import yaml
from sqlalchemy import select, update

# Two valid invocation paths: (a) uvicorn from agent/ has agent/ on
# sys.path so `db.database` resolves; (b) `python -m agent.harvesting.X`
# from repo root has only the repo root on sys.path. Try (a) first and
# fall back to inserting agent/ on sys.path.
try:
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
except ImportError:
    # Repo-root `db/` is a non-Python directory (holds schema.sql) but
    # Python's namespace-package machinery may cache it as `db`,
    # shadowing the real `agent/db/`. Evict it before retrying.
    sys.modules.pop("db", None)
    sys.modules.pop("db.database", None)
    sys.modules.pop("db.models", None)
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore


log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _default_skills_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "skills" / "aml" / "typologies"


def _display_name(slug: str) -> str:
    """Derive a human-readable name from the skill slug. `typology-structuring`
    -> `Structuring`. The registry uses this for diff classification so a
    harvested candidate name (e.g. "Structuring / Smurfing") can match an
    existing entry by trigram similarity."""
    s = (slug or "").strip()
    if s.startswith("typology-"):
        s = s[len("typology-"):]
    return s.replace("-", " ").replace("_", " ").strip().title()


def _parse_md(path: Path) -> Optional[dict]:
    text = path.read_text(encoding="utf-8")
    m = _FRONTMATTER_RE.match(text)
    if not m:
        log.warning("skipping %s — no YAML frontmatter", path)
        return None
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as e:
        log.error("yaml parse error in %s: %s", path, e)
        return None
    # _schema.md is a documentation file, not a typology — skip if no typology_id.
    if not fm.get("typology_id"):
        return None
    return fm


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def _json_safe(value):
    """Recursively coerce date/datetime to ISO strings so the JSONB
    column accepts the value."""
    from datetime import date as _date, datetime as _dt
    if isinstance(value, _dt):
        return value.isoformat()
    if isinstance(value, _date):
        return value.isoformat()
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    return value


async def bootstrap(skills_dir: Optional[Path] = None) -> dict:
    """Returns a summary dict for logging / tests."""
    skills_dir = Path(skills_dir or _default_skills_dir())
    if not skills_dir.exists():
        raise FileNotFoundError(f"Typology dir does not exist: {skills_dir}")

    inserted = 0
    updated = 0
    skipped = 0
    files_seen = 0

    now = datetime.now(timezone.utc)

    async with SessionLocal() as s:
        for path in sorted(skills_dir.rglob("*.md")):
            if path.name.startswith("_"):
                continue  # _schema.md and similar
            files_seen += 1
            fm = _parse_md(path)
            if fm is None:
                skipped += 1
                continue

            tid = fm["typology_id"]
            # Use frontmatter `display_name` if author set it; otherwise
            # derive from the skill slug. We deliberately do not store the
            # `typology-<slug>` skill name in `typologies.name` — the
            # registry should hold the human-readable name the diff stage
            # compares against.
            name = fm.get("display_name") or _display_name(fm.get("name") or tid)
            category = fm.get("category") or "uncategorized"
            version = fm.get("current_version") or fm.get("version") or "1.0.0"
            md_sha = _sha256(path)
            md_path_str = str(path.relative_to(skills_dir.parents[2])).replace("\\", "/")

            existing = (await s.execute(
                select(M.Typology).where(M.Typology.typology_id == tid)
            )).scalar_one_or_none()

            if existing is None:
                row = M.Typology(
                    typology_id=tid,
                    name=name,
                    category=category,
                    current_version=version,
                    md_path=md_path_str,
                    md_sha256=md_sha,
                    status=fm.get("status") or "active",
                    approved_by=_json_safe(fm.get("approved_by") or []),
                    deployed_at=now,
                    created_at=now,
                    updated_at=now,
                )
                s.add(row)
                inserted += 1
                log.info("inserted %s (%s)", tid, name)
            else:
                existing.name = name
                existing.category = category
                existing.current_version = version
                existing.md_path = md_path_str
                existing.md_sha256 = md_sha
                existing.updated_at = now
                # Do NOT overwrite approved_by or deployed_at — preserve history.
                updated += 1
                log.info("refreshed %s (sha=%s)", tid, md_sha[:12])

        await s.commit()

        # Backfill alert_typologies.typology_id where names match.
        backfilled = (await s.execute(
            update(M.AlertTypology)
            .where(
                M.AlertTypology.typology_id.is_(None),
                M.AlertTypology.typology_name.in_(
                    select(M.Typology.name)
                ),
            )
            .values(
                typology_id=select(M.Typology.typology_id)
                .where(M.Typology.name == M.AlertTypology.typology_name)
                .scalar_subquery()
            )
        )).rowcount or 0
        await s.commit()

        remaining_null = (await s.execute(
            select(M.AlertTypology).where(M.AlertTypology.typology_id.is_(None))
        )).all()
        remaining = len(remaining_null)

    log.info(
        "bootstrap done — files=%d inserted=%d updated=%d skipped=%d backfilled=%d unmatched=%d",
        files_seen, inserted, updated, skipped, backfilled, remaining,
    )
    return {
        "files_seen": files_seen,
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "backfilled": backfilled,
        "unmatched_alert_typologies": remaining,
    }


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Bootstrap typology registry from MD files.")
    parser.add_argument(
        "--skills-dir",
        type=Path,
        default=None,
        help="Override the typology MD root (default: skills/aml/typologies)",
    )
    args = parser.parse_args(argv)
    summary = asyncio.run(bootstrap(args.skills_dir))
    print(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
