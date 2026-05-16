"""Pre-approval safety check on a candidate MD.

Scans the rendered markdown for obvious PII leakage and missing
required frontmatter. Returns a list of Issue records. Any issue with
`severity == "BLOCK"` prevents approval.

Intentionally simple regex-based rules; this is a backstop, not a
substitute for human review.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class Issue:
    code: str
    severity: str   # BLOCK | WARN
    message: str


_SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
# Long digit runs that look like credit card PANs (13-19 digits, optional
# spaces/dashes every 4). Exclude ranges of zeros to limit false positives
# from URL fragments etc.
_PAN_RE = re.compile(r"(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)")
_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_TYPOLOGY_ID_RE = re.compile(r"^typology_id:\s*\S+\s*$", re.MULTILINE)


def _looks_like_pan(s: str) -> bool:
    """Filter PAN regex hits: require 13-19 digits after stripping
    spaces/dashes, and reject all-zero / all-same-digit runs."""
    digits = re.sub(r"[ -]", "", s)
    if not (13 <= len(digits) <= 19):
        return False
    if len(set(digits)) == 1:
        return False
    return True


def run_precheck(md_text: str) -> List[Issue]:
    """Return issues found in `md_text`. Empty list = safe to approve."""
    issues: List[Issue] = []
    text = md_text or ""

    fm_match = _FRONTMATTER_RE.match(text)
    if not fm_match:
        issues.append(Issue(
            code="MISSING_FRONTMATTER",
            severity="BLOCK",
            message="MD has no YAML frontmatter; cannot be loaded as a skill.",
        ))
        # Without frontmatter we still check PII in body.
        frontmatter = ""
        body = text
    else:
        frontmatter = fm_match.group(1)
        body = text[fm_match.end():]

    if frontmatter and not _TYPOLOGY_ID_RE.search(frontmatter):
        issues.append(Issue(
            code="MISSING_TYPOLOGY_ID",
            severity="BLOCK",
            message="Frontmatter is missing `typology_id`.",
        ))

    if _SSN_RE.search(text):
        issues.append(Issue(
            code="SSN_PATTERN",
            severity="BLOCK",
            message="Text contains an SSN-shaped string (NNN-NN-NNNN). Redact before approval.",
        ))

    for m in _PAN_RE.finditer(text):
        if _looks_like_pan(m.group(0)):
            issues.append(Issue(
                code="CARD_NUMBER_PATTERN",
                severity="BLOCK",
                message=f"Text contains a credit-card-like digit run ({m.group(0).strip()}). Redact before approval.",
            ))
            break  # one is enough to block; don't spam

    return issues


def is_blocked(issues: List[Issue]) -> bool:
    return any(i.severity == "BLOCK" for i in issues)
