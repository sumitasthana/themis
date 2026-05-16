"""End-to-end test: bootstrap_registry -> harvest -> approve -> promote.

Runs against the SQLite test DB wired in conftest.py. Uses the two
committed fixtures under harvested/sources/ and a tmp typology tree
seeded with copies of the four real seed MD files. No Bedrock; no
Postgres; no network.
"""
from __future__ import annotations

import asyncio
import hashlib
import shutil
from pathlib import Path

import pytest
from sqlalchemy import select

from agent.db.database import SessionLocal
from agent.db import models as M
from agent.harvesting import bootstrap_registry, harvest as harvest_mod, promote as promote_mod
from agent.harvesting import review as review_mod


REPO_ROOT = Path(__file__).resolve().parents[3]
SEED_TREE = REPO_ROOT / "skills" / "aml" / "typologies"
SOURCES   = REPO_ROOT / "harvested" / "sources"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


@pytest.fixture
def workspace(tmp_path: Path) -> dict:
    """Build a tmp typology tree (mirroring the real one) plus a tmp
    harvested/ tree the test writes into. Returns the relevant paths."""
    typ_dir = tmp_path / "typologies"
    typ_dir.mkdir()
    # Copy the four real seed MDs into the tmp tree so promotion can
    # overwrite STR-001 without touching the committed file.
    for src in SEED_TREE.rglob("*.md"):
        rel = src.relative_to(SEED_TREE)
        dst = typ_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
    candidates_dir = tmp_path / "harvested" / "candidates"
    candidates_dir.mkdir(parents=True)
    # Reuse the real source fixtures verbatim.
    return {
        "typ_dir": typ_dir,
        "candidates_dir": candidates_dir,
        "sources_dir": SOURCES,
    }


def _truncate_db():
    """Wipe typology + candidate rows between test invocations so the
    test suite is order-independent."""
    async def _go():
        async with SessionLocal() as s:
            from sqlalchemy import delete
            await s.execute(delete(M.TypologyCandidate))
            await s.execute(delete(M.AlertTypology))
            await s.execute(delete(M.Typology))
            await s.commit()
    asyncio.run(_go())


def test_end_to_end_pipeline(workspace, monkeypatch):
    _truncate_db()

    # The promote module reads existing.md_path relative to the *repo
    # root* it was installed under. Force it (and bootstrap) to use the
    # tmp typology tree by passing the override path everywhere.
    typ_dir       = workspace["typ_dir"]
    candidates_dir = workspace["candidates_dir"]
    sources_dir   = workspace["sources_dir"]

    # We also need promote.py to resolve `existing.md_path` against the
    # tmp dir. Monkey-patch the `parents[2]` lookup by chdir-ing — the
    # module computes its "repo root" once via Path(__file__).parents[2].
    # That works fine because the test points existing.md_path at the
    # bootstrap-stored relative path which we control via `--skills-dir`.

    # ── 1. bootstrap ────────────────────────────────────────────────
    summary = asyncio.run(bootstrap_registry.bootstrap(skills_dir=typ_dir))
    assert summary["inserted"] == 4, f"expected 4 typologies, got {summary}"

    async def _count_active():
        async with SessionLocal() as s:
            rows = (await s.execute(
                select(M.Typology).where(M.Typology.status == "active")
            )).scalars().all()
            return rows

    active = asyncio.run(_count_active())
    assert len(active) == 4

    # Capture STR-001 SHA after bootstrap so we can prove it changes.
    str_row = next(t for t in active if t.typology_id == "STR-001")
    str_sha_before = str_row.md_sha256
    # The MD file SHA on disk should equal what's stored in the DB.
    str_file = typ_dir / "cash_based" / "structuring.md"
    assert _sha256(str_file) == str_sha_before

    # ── 2. harvest ──────────────────────────────────────────────────
    # We need _load_registry to find each MD via its stored md_path.
    # bootstrap stores md_path relative to the *bootstrap*'s
    # parents[2] (repo root) which we don't control via --skills-dir
    # alone. Patch the registry loader to look under typ_dir.
    monkeypatch.setattr(
        harvest_mod, "_load_registry",
        _make_test_load_registry(typ_dir),
    )

    h_summary = asyncio.run(harvest_mod.harvest(
        extractor_name="fixture",
        sources_dir=sources_dir,
        candidates_dir=candidates_dir,
    ))
    assert h_summary["inserted"] == 2, f"expected 2 candidates, got {h_summary}"
    assert h_summary["duplicates"] == 0

    async def _candidates():
        async with SessionLocal() as s:
            rows = (await s.execute(select(M.TypologyCandidate))).scalars().all()
            return rows

    cands = asyncio.run(_candidates())
    assert len(cands) == 2
    diff_classes = {c.diff_class for c in cands}
    assert diff_classes == {"NEW", "UPDATE"}

    new_cand = next(c for c in cands if c.diff_class == "NEW")
    upd_cand = next(c for c in cands if c.diff_class == "UPDATE")
    assert new_cand.candidate_category == "emerging_tech"
    assert upd_cand.diff_target_id == "STR-001"

    # ── 3. approve both with 2 distinct reviewers ───────────────────
    for cand in (new_cand, upd_cand):
        prefix = cand.id[:8]
        asyncio.run(review_mod.cmd_approve(prefix, "J. Smith", "AML Analyst", None))
        asyncio.run(review_mod.cmd_approve(prefix, "A. Patel", "MLRO", None))

    # ── 4. promote ──────────────────────────────────────────────────
    # promote reads existing.md_path relative to skills_dir.parents[2]
    # by default — but the bootstrap stored a repo-relative path. Pass
    # the tmp dir; the module resolves via its own parents[2] fallback.
    # We force the lookup to succeed by also putting copies of the seed
    # MDs at the resolved location via the typ_dir already.
    monkeypatch.setattr(
        promote_mod.Path, "__new__",
        promote_mod.Path.__new__,
    )

    # We expose the typ_dir as the "repo root" promote thinks it lives
    # in by patching the repo-root probe inside promote.py.
    monkeypatch.setattr(
        promote_mod, "_default_skills_dir",
        lambda: typ_dir,
    )
    # promote.py uses Path(__file__).resolve().parents[2] internally to
    # find existing MD paths. The test uses bootstrap-stored md_path
    # values that are relative to the *original* repo root, so for the
    # UPDATE case the file already exists at the right location under
    # typ_dir if we rewrite md_path to use the tmp dir layout. We do
    # that by rebasing rows after bootstrap.
    asyncio.run(_rebase_md_paths_to(typ_dir))

    p_summary = asyncio.run(promote_mod.promote(skills_dir=typ_dir))
    assert p_summary["promoted"] == 2, f"expected 2 promotions, got {p_summary}"
    assert p_summary["failed"] == 0

    # ── 5. final invariants ─────────────────────────────────────────
    active_after = asyncio.run(_count_active())
    assert len(active_after) == 5, f"expected 5 active typologies, got {len(active_after)}"

    str_after = next(t for t in active_after if t.typology_id == "STR-001")
    assert str_after.current_version == "1.1.0", f"STR-001 version is {str_after.current_version}"
    assert str_after.md_sha256 != str_sha_before, "STR-001 SHA-256 should change after promotion"

    tec = next(t for t in active_after if t.typology_id == "TEC-100")
    assert tec.name == "Cross-Chain Laundering"

    # File on disk reflects the new prepaid red flags.
    str_text = str_file.read_text(encoding="utf-8")
    assert "prepaid_reload_aggregation_above_ctr_threshold" in str_text
    assert "multiple_same_day_prepaid_card_purchases" in str_text


# ---------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------

def _make_test_load_registry(typ_dir: Path):
    """Build a replacement _load_registry that finds MD files under typ_dir."""
    from agent.harvesting.diff import RegistryEntry
    import re
    import yaml

    def _frontmatter_indicators(md_text: str):
        m = re.match(r"^---\s*\n(.*?)\n---\s*\n", md_text or "", re.DOTALL)
        if not m:
            return ()
        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except yaml.YAMLError:
            return ()
        return tuple(str(i) for i in (fm.get("risk_indicators") or []))

    async def _load(session):
        from sqlalchemy import select
        rows = (await session.execute(
            select(M.Typology).where(M.Typology.status == "active")
        )).scalars().all()
        entries = []
        for r in rows:
            # First try the bootstrap-stored path verbatim.
            p = Path(r.md_path)
            if not p.exists():
                # Strip the leading "skills/aml/typologies/" if present
                # and resolve under typ_dir.
                rel = r.md_path.replace("\\", "/")
                marker = "skills/aml/typologies/"
                if marker in rel:
                    rel = rel.split(marker, 1)[1]
                p = typ_dir / rel
            md_text = p.read_text(encoding="utf-8") if p.exists() else ""
            entries.append(RegistryEntry(
                typology_id=r.typology_id,
                name=r.name,
                risk_indicators=_frontmatter_indicators(md_text),
            ))
        return entries

    return _load


async def _rebase_md_paths_to(typ_dir: Path):
    """Rewrite Typology.md_path so they resolve under the tmp typology
    tree. promote.py joins them with its own parents[2], so we set them
    absolute (the join harmlessly ignores absolute paths)."""
    from sqlalchemy import select
    async with SessionLocal() as s:
        rows = (await s.execute(select(M.Typology))).scalars().all()
        for r in rows:
            rel = r.md_path.replace("\\", "/")
            marker = "skills/aml/typologies/"
            if marker in rel:
                rel = rel.split(marker, 1)[1]
            p = typ_dir / rel
            if p.exists():
                r.md_path = str(p)
        await s.commit()
