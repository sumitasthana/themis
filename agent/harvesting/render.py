"""Render a candidate typology MD from an extractor's output.

The rendered MD is the audit artifact captured on `typology_candidates.candidate_md`
and also written to `harvested/candidates/<id>.md` so reviewers can read
it on disk. After promotion the same MD shape is written into the
`skills/aml/typologies/<category>/<slug>.md` tree.

The rendered frontmatter is intentionally schema-compatible with
`skills_loader.SkillsLoader._parse_skill_file` so a promoted file loads
without further translation.
"""
from __future__ import annotations

import re
from datetime import date
from typing import Iterable, Mapping, Optional


def slugify(text: str) -> str:
    """Lowercase + hyphenate for safe filenames and frontmatter `name` slugs."""
    s = (text or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s or "untitled"


def _yaml_list(items: Iterable[str]) -> str:
    """Render a flow-style YAML list of plain strings."""
    items = list(items or [])
    if not items:
        return "[]"
    return "[" + ", ".join(items) + "]"


def _yaml_block_list(items: Iterable[str], *, indent: int = 2) -> str:
    pad = " " * indent
    items = list(items or [])
    if not items:
        return f"{pad}[]"
    return "\n".join(f"{pad}- {x}" for x in items)


def render_candidate_md(
    *,
    typology_id: str,
    name: str,
    category: str,
    ml_stage: Iterable[str],
    definition: str,
    example: str,
    red_flags: Iterable[str],
    version: str = "1.0.0",
    status: str = "candidate",
    source_org: Optional[str] = None,
    source_citation: Optional[str] = None,
    source_url: Optional[str] = None,
    detection_hint: Optional[str] = None,
    references: Optional[Iterable[str]] = None,
) -> str:
    """Render an MD blob ready to write to disk OR store in
    `typology_candidates.candidate_md`. The output passes
    `skills_loader._parse_skill_file` once promoted.

    For candidate state we leave `approved_by` empty — promotion fills
    it in from `reviewed_by`.
    """
    ml_stage = list(ml_stage or [])
    red_flags = list(red_flags or [])
    refs = list(references or [])
    slug = slugify(name)
    skill_name = f"typology-{slug}"

    tags = ["aml", "typology", category.replace("_", "-")]
    # Carry ml_stage tags too so search-by-tag works for stage filters.
    tags.extend(ml_stage)
    # Dedupe while preserving order.
    seen: set[str] = set()
    tags = [t for t in tags if not (t in seen or seen.add(t))]

    sources_block = ""
    if source_org or source_citation or source_url:
        sources_block = (
            "sources:\n"
            f"  - org: {source_org or 'unknown'}\n"
            f"    citation: \"{source_citation or source_url or ''}\"\n"
            f"    type: harvested\n"
        )
    else:
        sources_block = "sources: []\n"

    frontmatter = (
        "---\n"
        f"name: {skill_name}\n"
        f"description: {definition.splitlines()[0] if definition else name}\n"
        f"version: {version}\n"
        f"author: Themis Harvester\n"
        f"typology_id: {typology_id}\n"
        f"category: {category}\n"
        f"ml_stage: {_yaml_list(ml_stage)}\n"
        f"status: {status}\n"
        f"{sources_block}"
        "risk_indicators:\n"
        f"{_yaml_block_list(red_flags)}\n"
        f"last_reviewed: {date.today().isoformat()}\n"
        "approved_by: []\n"
        "metadata:\n"
        "  hermes:\n"
        f"    tags: {_yaml_list(tags)}\n"
        "    category: aml-typology\n"
        "---\n"
    )

    body = ["", f"# Definition", "", definition.strip() if definition else "_TBD_", ""]
    body += [f"# Example", "", example.strip() if example else "_TBD_", ""]
    body += ["# Red Flags", ""]
    body += [f"- {rf}" for rf in red_flags] if red_flags else ["- _TBD_"]
    body.append("")
    body += ["# Detection Hint", ""]
    body.append(detection_hint.strip() if detection_hint else "_To be authored at promotion time._")
    body.append("")
    body += ["# References", ""]
    if refs:
        body += [f"- {r}" for r in refs]
    elif source_url or source_citation:
        body.append(f"- {source_org or 'Source'}: {source_citation or source_url}")
    else:
        body.append("- _Pending citation review._")
    body.append("")

    return frontmatter + "\n".join(body)


def rewrite_for_promotion(
    md_text: str,
    *,
    approved_by: Iterable[Mapping[str, str]],
    new_version: Optional[str] = None,
) -> str:
    """Take a candidate MD and rewrite its frontmatter for promotion:
    flip `status` to `active`, populate `approved_by`, refresh
    `last_reviewed`, and optionally bump `version`.

    The body is preserved verbatim.
    """
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", md_text, re.DOTALL)
    if not m:
        raise ValueError("rewrite_for_promotion: input has no YAML frontmatter")

    fm = m.group(1)
    body = m.group(2)

    fm = re.sub(r"^status:\s*.*$", "status: active", fm, count=1, flags=re.MULTILINE)
    fm = re.sub(r"^last_reviewed:\s*.*$", f"last_reviewed: {date.today().isoformat()}", fm, count=1, flags=re.MULTILINE)
    if new_version:
        fm = re.sub(r"^version:\s*.*$", f"version: {new_version}", fm, count=1, flags=re.MULTILINE)

    approver_block = "approved_by:\n"
    for a in approved_by:
        n = a.get("name", "")
        r = a.get("role", "")
        d = a.get("date", date.today().isoformat())
        approver_block += f"  - {{name: {n}, role: {r}, date: {d}}}\n"
    approver_block = approver_block.rstrip("\n")
    fm = re.sub(r"^approved_by:\s*\[\]\s*$", approver_block, fm, count=1, flags=re.MULTILINE)
    if "approved_by:" not in fm:
        fm += "\n" + approver_block

    return f"---\n{fm}\n---\n{body}"


def bump_minor_version(current: str) -> str:
    """1.0.0 -> 1.1.0; 2.3.4 -> 2.4.0. Patch resets to 0."""
    parts = (current or "0.0.0").split(".")
    while len(parts) < 3:
        parts.append("0")
    try:
        major = int(parts[0]); minor = int(parts[1])
    except ValueError:
        return "1.1.0"
    return f"{major}.{minor + 1}.0"
