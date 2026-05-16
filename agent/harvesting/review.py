"""Review CLI for typology candidates.

Subcommands:
    list                     — show all pending candidates
    show <prefix>            — print full candidate detail + MD body
    approve <prefix>         — record an approval; flips to 'approved'
                               only when 2 distinct reviewers have signed
    reject <prefix>          — flip to 'rejected'

Approval runs `precheck.run_precheck` first; any BLOCK-severity issue
prevents the approval and is shown to the reviewer.

The CLI accepts either the full candidate id (uuid4) or a unique prefix
(>=4 chars). Ambiguous prefixes error out.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import select

try:
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
    from harvesting.precheck import run_precheck, is_blocked  # type: ignore
except ImportError:
    sys.modules.pop("db", None)
    sys.modules.pop("db.database", None)
    sys.modules.pop("db.models", None)
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from db.database import SessionLocal  # type: ignore
    from db import models as M             # type: ignore
    from harvesting.precheck import run_precheck, is_blocked  # type: ignore


log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


async def _resolve_candidate(session, prefix: str) -> M.TypologyCandidate:
    if not prefix or len(prefix) < 4:
        raise SystemExit("ERROR: candidate id prefix must be at least 4 characters")
    rows = (await session.execute(
        select(M.TypologyCandidate).where(M.TypologyCandidate.id.like(f"{prefix}%"))
    )).scalars().all()
    if not rows:
        raise SystemExit(f"ERROR: no candidate matches prefix {prefix!r}")
    if len(rows) > 1:
        ids = ", ".join(r.id[:8] for r in rows)
        raise SystemExit(f"ERROR: prefix {prefix!r} is ambiguous, matches: {ids}")
    return rows[0]


async def cmd_list() -> None:
    async with SessionLocal() as s:
        rows = (await s.execute(
            select(M.TypologyCandidate)
            .where(M.TypologyCandidate.review_status == "pending")
            .order_by(M.TypologyCandidate.created_at.desc())
        )).scalars().all()

    if not rows:
        print("No pending candidates.")
        return

    print(f"{'id':<10}  {'diff':<10}  {'cat':<18}  {'sim':>5}  {'target':<9}  name")
    print("-" * 100)
    for r in rows:
        print(
            f"{r.id[:8]:<10}  {r.diff_class:<10}  {r.candidate_category:<18}  "
            f"{r.similarity or 0:>5.2f}  {r.diff_target_id or '-':<9}  {r.candidate_name}"
        )


async def cmd_show(prefix: str) -> None:
    async with SessionLocal() as s:
        cand = await _resolve_candidate(s, prefix)

    print(f"id:           {cand.id}")
    print(f"name:         {cand.candidate_name}")
    print(f"category:     {cand.candidate_category}")
    print(f"diff_class:   {cand.diff_class} (target={cand.diff_target_id}, sim={cand.similarity:.2f})")
    print(f"source:       {cand.source_org} <{cand.source_url}>")
    print(f"extractor:    {cand.extractor_name} v{cand.extractor_version}")
    if cand.prompt_version:
        print(f"prompt:       v{cand.prompt_version} sha256={cand.prompt_sha256[:12]}")
    print(f"review:       {cand.review_status}")
    if cand.reviewed_by:
        for rb in cand.reviewed_by:
            print(f"  - {rb.get('name')} ({rb.get('role')}) @ {rb.get('date')}")
    print()
    print("=== candidate_md ===")
    print(cand.candidate_md)


class ReviewError(Exception):
    """Raised for user-facing review errors (precheck block, duplicate
    reviewer, unknown candidate). Carries the message + optional list
    of precheck issues for UI rendering."""

    def __init__(self, message: str, *, issues: Optional[list] = None):
        super().__init__(message)
        self.message = message
        self.issues = issues or []


async def record_review(
    prefix: str,
    action: str,
    name: str,
    role: str,
    notes: Optional[str] = None,
) -> dict:
    """Append a review entry; flip review_status when policy is met.

    Returns a dict the UI / CLI can render:
        {
          "candidate_id": str,
          "candidate_name": str,
          "action": "approve" | "reject",
          "review_status": "pending" | "approved" | "rejected",
          "approvers": [names...],
          "needs_more": int   # remaining reviewers for promotion eligibility
        }

    Raises ReviewError for any user-recoverable problem.
    """
    async with SessionLocal() as s:
        cand = await _resolve_candidate(s, prefix)

        if action == "approve":
            issues = run_precheck(cand.candidate_md)
            if is_blocked(issues):
                raise ReviewError(
                    "Pre-approval check blocked this candidate. Fix the issues and re-harvest.",
                    issues=[{"code": i.code, "severity": i.severity, "message": i.message} for i in issues],
                )

        existing = list(cand.reviewed_by or [])
        if any(r.get("name") == name and r.get("action") == action for r in existing):
            raise ReviewError(f"{name} has already {action}d this candidate.")

        existing.append({
            "name": name,
            "role": role,
            "action": action,
            "date": date.today().isoformat(),
            "notes": notes,
        })
        cand.reviewed_by = existing

        if action == "reject":
            cand.review_status = "rejected"
            cand.review_notes = (notes or "") if notes else (cand.review_notes or "rejected")
        else:
            approves = [r for r in existing if r.get("action") == "approve"]
            distinct_approvers = {r["name"] for r in approves}
            if len(distinct_approvers) >= 2:
                cand.review_status = "approved"

        await s.commit()

        approves = [r for r in (cand.reviewed_by or []) if r.get("action") == "approve"]
        distinct_approvers = sorted({r["name"] for r in approves})
        needs_more = max(0, 2 - len(distinct_approvers)) if cand.review_status == "pending" else 0

        return {
            "candidate_id": cand.id,
            "candidate_name": cand.candidate_name,
            "action": action,
            "review_status": cand.review_status,
            "approvers": distinct_approvers,
            "needs_more": needs_more,
        }


async def _record_review(prefix: str, action: str, name: str, role: str, notes: Optional[str]) -> None:
    """CLI-side wrapper: prints a human summary, exits non-zero on ReviewError."""
    try:
        result = await record_review(prefix, action, name, role, notes)
    except ReviewError as e:
        print(f"ERROR: {e.message}")
        for i in e.issues:
            print(f"  [{i['code']}] {i['message']}")
        raise SystemExit(1)

    short = result["candidate_id"][:8]
    if result["action"] == "reject":
        print(f"REJECTED candidate {short} ({result['candidate_name']}) by {name}")
    elif result["review_status"] == "approved":
        print(
            f"APPROVED candidate {short} ({result['candidate_name']}) "
            f"— {len(result['approvers'])} distinct reviewers signed."
        )
    else:
        print(
            f"approval recorded for {short} by {name}. "
            f"Need {result['needs_more']} more reviewer(s) for promotion."
        )


async def cmd_approve(prefix: str, by: str, role: str, notes: Optional[str]) -> None:
    await _record_review(prefix, "approve", by, role, notes)


async def cmd_reject(prefix: str, by: str, notes: str) -> None:
    await _record_review(prefix, "reject", by, role="reviewer", notes=notes)


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Review typology candidates.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="List pending candidates")

    p_show = sub.add_parser("show", help="Show one candidate in detail")
    p_show.add_argument("prefix", help="Candidate id (or unique prefix)")

    p_approve = sub.add_parser("approve", help="Record an approval (need 2 distinct reviewers)")
    p_approve.add_argument("prefix")
    p_approve.add_argument("--by", required=True, help="Reviewer display name")
    p_approve.add_argument("--role", required=True, help="Reviewer role (e.g. MLRO, AML Analyst)")
    p_approve.add_argument("--notes", default=None)

    p_reject = sub.add_parser("reject", help="Reject a candidate")
    p_reject.add_argument("prefix")
    p_reject.add_argument("--by", required=True)
    p_reject.add_argument("--notes", required=True)

    args = parser.parse_args(argv)

    if args.cmd == "list":
        asyncio.run(cmd_list())
    elif args.cmd == "show":
        asyncio.run(cmd_show(args.prefix))
    elif args.cmd == "approve":
        asyncio.run(cmd_approve(args.prefix, args.by, args.role, args.notes))
    elif args.cmd == "reject":
        asyncio.run(cmd_reject(args.prefix, args.by, args.notes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
