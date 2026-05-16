"""Unit tests for agent.harvesting.extractor.FixtureExtractor.

BedrockExtractor is covered separately in test_bedrock_extractor.py.
"""
from __future__ import annotations

from agent.harvesting.extractor import FixtureExtractor


def test_returns_the_one_extracted_typology_verbatim():
    src = {
        "extracted_typologies": [
            {
                "name": "Smurfing",
                "category": "cash_based",
                "ml_stage": ["placement"],
                "definition": "Splitting cash into sub-CTR deposits.",
                "example": "Five deposits of $9,500.",
                "red_flags": ["sub_ctr_amount", "multi_branch"],
            }
        ]
    }
    out = FixtureExtractor().extract(src)
    assert len(out) == 1
    assert out[0]["name"] == "Smurfing"
    assert out[0]["category"] == "cash_based"
    assert out[0]["red_flags"] == ["sub_ctr_amount", "multi_branch"]


def test_empty_extracted_typologies_returns_empty_list():
    src = {"extracted_typologies": []}
    assert FixtureExtractor().extract(src) == []


def test_missing_key_returns_empty_list_no_crash():
    src = {"title": "Press release with no typology"}
    assert FixtureExtractor().extract(src) == []


def test_extractor_identity():
    e = FixtureExtractor()
    assert e.name == "fixture_extractor"
    assert e.version == "0.1.0"
