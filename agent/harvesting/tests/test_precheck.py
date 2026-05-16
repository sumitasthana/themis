"""Unit tests for agent.harvesting.precheck.run_precheck."""
from __future__ import annotations

from agent.harvesting.precheck import is_blocked, run_precheck


_CLEAN_MD = """---
name: typology-foo
typology_id: TEC-100
category: emerging_tech
status: candidate
---

# Definition
A clean candidate with no PII.
"""


def test_clean_md_passes():
    issues = run_precheck(_CLEAN_MD)
    assert issues == []
    assert not is_blocked(issues)


def test_ssn_pattern_blocks():
    md = _CLEAN_MD + "\nReference subject SSN 123-45-6789 in case file."
    issues = run_precheck(md)
    codes = {i.code for i in issues}
    assert "SSN_PATTERN" in codes
    assert is_blocked(issues)


def test_card_number_pattern_blocks():
    md = _CLEAN_MD + "\nFraud charge on card 4111 1111 1111 1111 from 2026-01-12."
    issues = run_precheck(md)
    codes = {i.code for i in issues}
    assert "CARD_NUMBER_PATTERN" in codes
    assert is_blocked(issues)


def test_missing_frontmatter_blocks():
    md = "# Just a body, no frontmatter.\nSome content."
    issues = run_precheck(md)
    codes = {i.code for i in issues}
    assert "MISSING_FRONTMATTER" in codes
    assert is_blocked(issues)


def test_missing_typology_id_blocks():
    md = """---
name: typology-foo
category: emerging_tech
status: candidate
---

# Definition
Body.
"""
    issues = run_precheck(md)
    codes = {i.code for i in issues}
    assert "MISSING_TYPOLOGY_ID" in codes
    assert is_blocked(issues)
