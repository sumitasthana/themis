"""Unit tests for agent.harvesting.diff.classify."""
from __future__ import annotations

import pytest

from agent.harvesting.diff import (
    NAME_SIM_THRESHOLD,
    RegistryEntry,
    classify,
    name_similarity,
)


def _registry():
    return [
        RegistryEntry(
            typology_id="STR-001",
            name="Structuring",
            risk_indicators=("multiple_subthreshold_cash_deposits", "same_day_multi_branch_deposits"),
        ),
        RegistryEntry(
            typology_id="RT-001",
            name="Round Tripping",
            risk_indicators=("circular_fund_flow", "intermediary_offshore"),
        ),
    ]


def test_identical_name_identical_indicators_is_duplicate():
    r = classify(
        candidate_name="Structuring",
        candidate_indicators=["multiple_subthreshold_cash_deposits", "same_day_multi_branch_deposits"],
        registry=_registry(),
    )
    assert r.diff_class == "DUPLICATE"
    assert r.target_typology_id == "STR-001"
    assert r.similarity >= NAME_SIM_THRESHOLD


def test_identical_name_with_new_indicator_is_update():
    r = classify(
        candidate_name="Structuring",
        candidate_indicators=[
            "multiple_subthreshold_cash_deposits",
            "same_day_multi_branch_deposits",
            "prepaid_reload_aggregation_above_ctr_threshold",  # new indicator
        ],
        registry=_registry(),
    )
    assert r.diff_class == "UPDATE"
    assert r.target_typology_id == "STR-001"


def test_completely_different_name_is_new():
    r = classify(
        candidate_name="Cross-Chain Laundering",
        candidate_indicators=["rapid_bridge_use", "sanctioned_mixer_destination"],
        registry=_registry(),
    )
    assert r.diff_class == "NEW"
    assert r.target_typology_id is None
    assert r.similarity < NAME_SIM_THRESHOLD


def test_similar_but_distinct_name_lands_on_new():
    """'Structured Deposits' vs 'Structuring' should NOT be the same
    typology; trigram similarity is well below the threshold (~0.16)."""
    sim = name_similarity("Structured Deposits", "Structuring")
    assert sim < NAME_SIM_THRESHOLD, f"similarity {sim} unexpectedly high"

    r = classify(
        candidate_name="Structured Deposits",
        candidate_indicators=["high_frequency_deposits"],
        registry=_registry(),
    )
    assert r.diff_class == "NEW"


def test_empty_registry_yields_new():
    r = classify(
        candidate_name="Anything Here",
        candidate_indicators=["x", "y"],
        registry=[],
    )
    assert r.diff_class == "NEW"
    assert r.target_typology_id is None
    assert r.similarity == 0.0


def test_empty_candidate_does_not_crash():
    r = classify(candidate_name="", candidate_indicators=[], registry=_registry())
    assert r.diff_class == "NEW"   # empty name has no match against real names
    assert r.target_typology_id is None


def test_slash_separated_alias_matches_component():
    """'Structuring / Smurfing' should match 'Structuring' via the
    alias splitter."""
    r = classify(
        candidate_name="Structuring / Smurfing",
        candidate_indicators=[
            "multiple_subthreshold_cash_deposits",
            "same_day_multi_branch_deposits",
            "multiple_same_day_prepaid_card_purchases",  # new -> UPDATE
        ],
        registry=_registry(),
    )
    assert r.diff_class == "UPDATE"
    assert r.target_typology_id == "STR-001"
    assert r.similarity == pytest.approx(1.0, abs=0.001)
