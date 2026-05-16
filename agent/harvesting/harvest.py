"""Harvest typology candidates from local fixture / regulator-doc JSON.

Pipeline:
  1. Read every *.json in harvested/sources/.
  2. For each source, compute SHA-256 + run the configured extractor.
  3. Classify each candidate against the live registry (NEW/UPDATE/DUPLICATE).
  4. For NEW: allocate next typology_id using category prefix + zero-padded
     number starting at 100 (so seed IDs like STR-001 don't collide).
  5. For UPDATE: reuse target id, bump version minor.
  6. For DUPLICATE: log and skip (no candidate row written).
  7. Render candidate MD via render.render_candidate_md and persist to
     `typology_candidates` + harvested/candidates/<filename>.md.
  8. Print a summary table.

Usage:
  python -m agent.harvesting.harvest [--extractor {fixture,bedrock}]
                                     [--sources-dir PATH]
                                     [--candidates-dir PATH]
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

from sqlalchemy import select

try:
    # Works when agent/ is on sys.path (uvicorn from agent/).
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
    from harvesting.diff import RegistryEntry, classify  # type: ignore
    from harvesting.render import render_candidate_md, bump_minor_version, slugify  # type: ignore
    from harvesting.extractor import FixtureExtractor, BedrockExtractor, TypologyExtractor  # type: ignore
except ImportError:
    # Evict the repo-root `db/` namespace package that may shadow `agent/db/`.
    sys.modules.pop("db", None)
    sys.modules.pop("db.database", None)
    sys.modules.pop("db.models", None)
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
    from harvesting.diff import RegistryEntry, classify  # type: ignore
    from harvesting.render import render_candidate_md, bump_minor_version, slugify  # type: ignore
    from harvesting.extractor import FixtureExtractor, BedrockExtractor, TypologyExtractor  # type: ignore


log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


_CATEGORY_PREFIX = {
    "cash_based": "CSH",
    "wire_layering": "WIR",
    "account_behavior": "ACC",
    "trade_commercial": "TRD",
    "fraud_linked": "FRD",
    "terrorism_financing": "TF",
    "emerging_tech": "TEC",
}


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _frontmatter_indicators(md_text: str) -> List[str]:
    """Read `risk_indicators` from the MD's YAML frontmatter without
    a full YAML parse (we just need a quick list)."""
    import yaml
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", md_text or "", re.DOTALL)
    if not m:
        return []
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        return []
    inds = fm.get("risk_indicators") or []
    return [str(i) for i in inds]


async def _load_registry(session) -> List[RegistryEntry]:
    """Snapshot the active registry rows + their on-disk risk indicators."""
    rows = (await session.execute(
        select(M.Typology).where(M.Typology.status == "active")
    )).scalars().all()

    entries: List[RegistryEntry] = []
    for r in rows:
        # Resolve the MD path relative to the repo root (Typology.md_path is stored
        # relative-to-repo by bootstrap_registry).
        candidate_paths = [
            Path(__file__).resolve().parents[2] / r.md_path,   # repo root
            Path(__file__).resolve().parents[1] / r.md_path,   # legacy fallback
            Path(r.md_path),                                   # absolute fallback
        ]
        md_text = ""
        for p in candidate_paths:
            if p.exists():
                md_text = p.read_text(encoding="utf-8")
                break
        entries.append(RegistryEntry(
            typology_id=r.typology_id,
            name=r.name,
            risk_indicators=tuple(_frontmatter_indicators(md_text)),
        ))
    return entries


async def _next_typology_id(session, category: str) -> str:
    """Allocate the next harvester-owned id for a category. Starts at 100
    so seed IDs (STR-001, RT-001, BEC-001, FUN-001 — all in the 001-099
    range) cannot collide."""
    prefix = _CATEGORY_PREFIX.get(category, "MISC")
    rows = (await session.execute(
        select(M.Typology.typology_id).where(M.Typology.typology_id.like(f"{prefix}-%"))
    )).scalars().all()
    max_n = 99
    for tid in rows:
        try:
            n = int(tid.split("-", 1)[1])
        except (ValueError, IndexError):
            continue
        if n >= 100 and n > max_n:
            max_n = n
    return f"{prefix}-{max_n + 1:03d}"


def _resolve_extractor(name: str) -> TypologyExtractor:
    if name == "fixture":
        return FixtureExtractor()
    if name == "bedrock":
        if not os.getenv("AWS_ACCESS_KEY_ID"):
            print(
                "ERROR: --extractor bedrock requires AWS_ACCESS_KEY_ID in the environment. "
                "Refusing to run; no silent fallback to fixture data.",
                file=sys.stderr,
            )
            sys.exit(2)
        return BedrockExtractor()
    raise ValueError(f"unknown extractor: {name}")


async def harvest(
    *,
    extractor_name: str = "fixture",
    sources_dir: Optional[Path] = None,
    candidates_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    sources_dir = Path(sources_dir or _default_sources_dir())
    candidates_dir = Path(candidates_dir or _default_candidates_dir())
    candidates_dir.mkdir(parents=True, exist_ok=True)

    extractor = _resolve_extractor(extractor_name)

    summary_rows: List[Dict[str, Any]] = []
    inserted = 0
    duplicates = 0
    skipped_invalid = 0

    async with SessionLocal() as s:
        registry = await _load_registry(s)
        now = datetime.now(timezone.utc)

        for src_path in sorted(sources_dir.glob("*.json")):
            raw_bytes = src_path.read_bytes()
            src_sha = _sha256_bytes(raw_bytes)
            try:
                source = json.loads(raw_bytes.decode("utf-8"))
            except json.JSONDecodeError as e:
                log.error("source %s: invalid JSON: %s", src_path.name, e)
                skipped_invalid += 1
                continue

            candidates = extractor.extract(source)
            log.info("source=%s extracted=%d", src_path.name, len(candidates))

            classified_count = 0
            for cand in candidates:
                if not cand.get("name") or not cand.get("category"):
                    log.warning("source=%s skipped candidate without name/category", src_path.name)
                    skipped_invalid += 1
                    continue

                cat = cand["category"]
                if cat not in _CATEGORY_PREFIX:
                    log.warning("source=%s candidate category not allowed: %s", src_path.name, cat)
                    skipped_invalid += 1
                    continue

                result = classify(cand["name"], cand.get("red_flags") or [], registry)
                classified_count += 1

                if result.diff_class == "DUPLICATE":
                    duplicates += 1
                    log.info(
                        "DUPLICATE candidate '%s' matches %s sim=%.2f — skipping",
                        cand["name"], result.target_typology_id, result.similarity,
                    )
                    continue

                if result.diff_class == "NEW":
                    typology_id = await _next_typology_id(s, cat)
                    version = "1.0.0"
                else:  # UPDATE
                    assert result.target_typology_id is not None
                    typology_id = result.target_typology_id
                    existing = (await s.execute(
                        select(M.Typology).where(M.Typology.typology_id == typology_id)
                    )).scalar_one_or_none()
                    base_version = existing.current_version if existing else "1.0.0"
                    version = bump_minor_version(base_version)

                md_text = render_candidate_md(
                    typology_id=typology_id,
                    name=cand["name"],
                    category=cat,
                    ml_stage=cand.get("ml_stage") or [],
                    definition=cand.get("definition", ""),
                    example=cand.get("example", ""),
                    red_flags=cand.get("red_flags") or [],
                    version=version,
                    status="candidate",
                    source_org=source.get("source_org"),
                    source_citation=source.get("title") or source.get("source_url"),
                    source_url=source.get("source_url"),
                )

                cand_id = str(uuid.uuid4())
                # Filename uses the short id prefix + typology id + version for grep-ability.
                slug = f"{cand_id[:8]}_{typology_id}_v{version}.md"
                md_path = candidates_dir / slug
                md_path.write_text(md_text, encoding="utf-8")

                # Parse fetched_at out of source if present, else use now.
                try:
                    fetched_at = datetime.fromisoformat(
                        (source.get("fetched_at") or "").replace("Z", "+00:00")
                    )
                except (TypeError, ValueError):
                    fetched_at = now

                row = M.TypologyCandidate(
                    id=cand_id,
                    source_tier=source.get("source_tier", "tier1"),
                    source_org=source.get("source_org", "unknown"),
                    source_url=source.get("source_url", ""),
                    source_sha256=src_sha,
                    fetched_at=fetched_at,
                    extractor_name=extractor.name,
                    extractor_version=extractor.version,
                    prompt_version=getattr(extractor, "prompt_version", None),
                    prompt_sha256=getattr(extractor, "prompt_sha256", None),
                    candidate_md=md_text,
                    candidate_name=cand["name"],
                    candidate_category=cat,
                    diff_class=result.diff_class,
                    diff_target_id=result.target_typology_id,
                    similarity=float(result.similarity),
                    review_status="pending",
                    created_at=now,
                )
                s.add(row)
                inserted += 1

                log.info(
                    "%-7s %s sim=%.2f id=%s -> %s",
                    result.diff_class, cand["name"], result.similarity, cand_id[:8], typology_id,
                )

            summary_rows.append({
                "source": src_path.name,
                "extracted": len(candidates),
                "classified": classified_count,
            })

        await s.commit()

    print("\n=== HARVEST SUMMARY ===")
    print(f"{'source':<50}  {'extracted':>9}  {'classified':>10}")
    for r in summary_rows:
        print(f"{r['source']:<50}  {r['extracted']:>9}  {r['classified']:>10}")
    print(f"\ncandidates inserted: {inserted}  duplicates: {duplicates}  skipped: {skipped_invalid}")

    return {
        "inserted": inserted,
        "duplicates": duplicates,
        "skipped": skipped_invalid,
        "sources": summary_rows,
    }


def _default_sources_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "harvested" / "sources"


def _default_candidates_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "harvested" / "candidates"


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest typology candidates from source documents.",
        epilog="Bedrock mode requires AWS_ACCESS_KEY_ID. Exits with an error if unset; "
               "no silent fallback to fixture data.",
    )
    parser.add_argument(
        "--extractor",
        choices=("fixture", "bedrock"),
        default="fixture",
        help="Extraction backend (default: fixture).",
    )
    parser.add_argument("--sources-dir", type=Path, default=None)
    parser.add_argument("--candidates-dir", type=Path, default=None)
    args = parser.parse_args(argv)

    asyncio.run(harvest(
        extractor_name=args.extractor,
        sources_dir=args.sources_dir,
        candidates_dir=args.candidates_dir,
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
