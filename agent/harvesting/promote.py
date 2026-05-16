"""Promote approved typology candidates into the live registry.

For every `typology_candidates` row where:
    review_status = 'approved'  AND  review_notes != 'promoted'

  * Rewrite the candidate MD for promotion (status: active, approved_by
    populated from reviewed_by, last_reviewed refreshed, version
    confirmed).
  * For NEW: write to `skills/aml/typologies/<category>/<slug>.md`,
    INSERT a new `typologies` row.
  * For UPDATE: overwrite the existing target's md_path, UPDATE the
    `typologies` row (bump current_version, recompute md_sha256,
    refresh approved_by).
  * Mark the candidate as promoted (`review_notes = 'promoted'`).

All DB writes are committed per-candidate inside a single transaction.
If the MD file write succeeds but the DB commit fails, the file is
rolled back to its prior state (or removed if it didn't exist).

Usage:
    python -m agent.harvesting.promote [--skills-dir PATH]
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
from sqlalchemy import select

try:
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
    from harvesting.render import rewrite_for_promotion, slugify  # type: ignore
except ImportError:
    sys.modules.pop("db", None)
    sys.modules.pop("db.database", None)
    sys.modules.pop("db.models", None)
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
    from harvesting.render import rewrite_for_promotion, slugify  # type: ignore


log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def _default_skills_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "skills" / "aml" / "typologies"


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _frontmatter_version(md_text: str) -> str:
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", md_text or "", re.DOTALL)
    if not m:
        return "1.0.0"
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        return "1.0.0"
    return str(fm.get("version") or "1.0.0")


def _restore_file(target: Path, prior_bytes: Optional[bytes]) -> None:
    """Rollback helper: put the file back to its prior bytes, or remove
    it if it didn't exist before."""
    if prior_bytes is None:
        if target.exists():
            target.unlink()
    else:
        target.write_bytes(prior_bytes)


async def promote(skills_dir: Optional[Path] = None) -> dict:
    skills_dir = Path(skills_dir or _default_skills_dir())
    promoted = 0
    failed = 0
    now = datetime.now(timezone.utc)

    async with SessionLocal() as s:
        candidates = (await s.execute(
            select(M.TypologyCandidate)
            .where(M.TypologyCandidate.review_status == "approved")
            .where(
                (M.TypologyCandidate.review_notes.is_(None))
                | (M.TypologyCandidate.review_notes != "promoted")
            )
        )).scalars().all()

        for cand in candidates:
            # Build the approval roster from reviewed_by approves.
            approves = [r for r in (cand.reviewed_by or []) if r.get("action") == "approve"]
            approved_by = [
                {"name": a.get("name"), "role": a.get("role"), "date": a.get("date")}
                for a in approves
            ]
            promoted_md = rewrite_for_promotion(cand.candidate_md, approved_by=approved_by)

            # For UPDATEs, preserve the existing skill `name` slug so the
            # skills loader continues to resolve the entry by its prior name.
            # The candidate MD was generated from the harvested name (often
            # an alias like "Structuring / Smurfing") which slugified differently.
            if cand.diff_class == "UPDATE" and cand.diff_target_id:
                existing_for_name = (await s.execute(
                    select(M.Typology).where(M.Typology.typology_id == cand.diff_target_id)
                )).scalar_one_or_none()
                if existing_for_name is not None:
                    existing_md_path = Path(__file__).resolve().parents[2] / existing_for_name.md_path
                    if existing_md_path.exists():
                        existing_text = existing_md_path.read_text(encoding="utf-8")
                        m_name = re.search(r"^name:\s*(\S+)\s*$", existing_text, re.MULTILINE)
                        if m_name:
                            promoted_md = re.sub(
                                r"^name:\s*\S+\s*$",
                                f"name: {m_name.group(1)}",
                                promoted_md,
                                count=1,
                                flags=re.MULTILINE,
                            )

            # Determine destination path.
            if cand.diff_class == "NEW":
                slug = slugify(cand.candidate_name)
                target_dir = skills_dir / cand.candidate_category
                target_dir.mkdir(parents=True, exist_ok=True)
                target = target_dir / f"{slug}.md"
                typology_id = cand.diff_target_id  # for NEW we set this below
                # Determine the id from the rendered MD (the harvester stored it there).
                m = re.search(r"^typology_id:\s*(\S+)\s*$", cand.candidate_md, re.MULTILINE)
                if not m:
                    log.error("candidate %s missing typology_id in MD; skipping", cand.id[:8])
                    failed += 1
                    continue
                typology_id = m.group(1)
            elif cand.diff_class == "UPDATE":
                if not cand.diff_target_id:
                    log.error("UPDATE candidate %s has no diff_target_id; skipping", cand.id[:8])
                    failed += 1
                    continue
                typology_id = cand.diff_target_id
                existing = (await s.execute(
                    select(M.Typology).where(M.Typology.typology_id == typology_id)
                )).scalar_one_or_none()
                if existing is None:
                    log.error("UPDATE candidate %s targets missing typology %s", cand.id[:8], typology_id)
                    failed += 1
                    continue
                # Reuse the existing path so reviewers can diff later.
                target = (skills_dir.parents[2] / existing.md_path).resolve()
                if not target.exists():
                    # Fallback: resolve relative to skills_dir if md_path was repo-relative.
                    candidate_paths = [
                        Path(__file__).resolve().parents[2] / existing.md_path,
                        skills_dir / existing.md_path,
                    ]
                    for p in candidate_paths:
                        if p.exists():
                            target = p
                            break
            else:
                log.error("candidate %s has unexpected diff_class %s", cand.id[:8], cand.diff_class)
                failed += 1
                continue

            prior_bytes: Optional[bytes] = target.read_bytes() if target.exists() else None

            try:
                target.write_bytes(promoted_md.encode("utf-8"))
                new_sha = _sha256_bytes(target.read_bytes())
                new_version = _frontmatter_version(promoted_md)
                md_path_rel = str(target.relative_to(skills_dir.parents[2])).replace("\\", "/")

                if cand.diff_class == "NEW":
                    new_row = M.Typology(
                        typology_id=typology_id,
                        name=cand.candidate_name,
                        category=cand.candidate_category,
                        current_version=new_version,
                        md_path=md_path_rel,
                        md_sha256=new_sha,
                        status="active",
                        approved_by=approved_by,
                        deployed_at=now,
                        created_at=now,
                        updated_at=now,
                    )
                    s.add(new_row)
                else:  # UPDATE
                    existing.current_version = new_version
                    existing.md_path = md_path_rel
                    existing.md_sha256 = new_sha
                    existing.approved_by = approved_by
                    existing.updated_at = now

                cand.review_notes = "promoted"
                await s.commit()
                promoted += 1
                log.info(
                    "promoted %-7s %s (%s) -> %s",
                    cand.diff_class, typology_id, cand.candidate_name, md_path_rel,
                )
            except Exception as e:
                await s.rollback()
                _restore_file(target, prior_bytes)
                log.exception("promotion FAILED for candidate %s: %s — rolled back", cand.id[:8], e)
                failed += 1

    log.info("promote done — promoted=%d failed=%d", promoted, failed)
    return {"promoted": promoted, "failed": failed}


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Promote approved typology candidates.")
    parser.add_argument("--skills-dir", type=Path, default=None)
    args = parser.parse_args(argv)
    summary = asyncio.run(promote(args.skills_dir))
    print(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
