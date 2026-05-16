"""Classify a candidate typology against the live registry.

Returns one of NEW | UPDATE | DUPLICATE based on name similarity
(trigram Jaccard) and the symmetric difference of risk indicator sets.

Pure compute, no I/O. The harvester passes in a snapshot of registry
rows (id, name, risk_indicators); this module never touches the DB.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional


# Threshold above which two typology names are considered "the same
# concept" for the purpose of UPDATE vs NEW. Tuned so "Structured
# Deposits" vs "Structuring" lands on the NEW side (similarity ~0.27),
# and "Structuring / Smurfing" vs "Structuring" lands on the UPDATE
# side (similarity ~0.58).
NAME_SIM_THRESHOLD: float = 0.55


@dataclass(frozen=True)
class RegistryEntry:
    typology_id: str
    name: str
    risk_indicators: tuple[str, ...]


@dataclass(frozen=True)
class DiffResult:
    diff_class: str                     # NEW | UPDATE | DUPLICATE
    target_typology_id: Optional[str]   # set for UPDATE / DUPLICATE
    similarity: float                   # best name similarity considered


def _trigrams(s: str) -> set[str]:
    s = (s or "").lower().strip()
    if len(s) < 3:
        # Pad short strings so we still get a couple of tokens to compare.
        s = f"  {s}  "
    return {s[i : i + 3] for i in range(len(s) - 2)}


_NAME_SEPARATORS = ("/", ",", "—", " - ", " and ")


def _trigram_jaccard(a: str, b: str) -> float:
    ta, tb = _trigrams(a), _trigrams(b)
    if not ta and not tb:
        return 1.0
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    return inter / union if union else 0.0


def _split_aliases(name: str) -> list[str]:
    """Split a typology name on common separators (`/`, `,`, `—`,
    ` and `) so aliases like 'Structuring / Smurfing' can be matched
    component-wise. Always includes the original string."""
    parts = [name]
    s = name or ""
    for sep in _NAME_SEPARATORS:
        if sep in s:
            for p in s.split(sep):
                p = p.strip()
                if p:
                    parts.append(p)
    # dedupe but keep order
    seen: set[str] = set()
    out: list[str] = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def name_similarity(a: str, b: str) -> float:
    """Symmetric similarity, 0-1. Computed as the max trigram-Jaccard
    over every alias pair (split on `/`, `,`, etc.), so a slash-separated
    candidate name still matches a single-token registry entry."""
    aliases_a = _split_aliases(a or "")
    aliases_b = _split_aliases(b or "")
    best = 0.0
    for x in aliases_a:
        for y in aliases_b:
            sim = _trigram_jaccard(x, y)
            if sim > best:
                best = sim
    return best


def classify(
    candidate_name: str,
    candidate_indicators: Iterable[str],
    registry: Iterable[RegistryEntry],
) -> DiffResult:
    """Decide whether the candidate is NEW, an UPDATE to an existing
    registry entry, or a DUPLICATE.

    Rules:
      - Pick the registry entry with the highest name similarity.
      - If best similarity < NAME_SIM_THRESHOLD: NEW.
      - Else if candidate has any indicator not in the matched entry's
        registered indicators: UPDATE.
      - Else: DUPLICATE.
    """
    cand_name = candidate_name or ""
    cand_inds = {i for i in (candidate_indicators or []) if i}

    best: Optional[RegistryEntry] = None
    best_sim = 0.0
    for entry in registry:
        sim = name_similarity(cand_name, entry.name)
        if sim > best_sim:
            best_sim = sim
            best = entry

    if best is None or best_sim < NAME_SIM_THRESHOLD:
        return DiffResult(diff_class="NEW", target_typology_id=None, similarity=best_sim)

    registered_inds = {i for i in best.risk_indicators if i}
    new_inds = cand_inds - registered_inds
    if new_inds:
        return DiffResult(diff_class="UPDATE", target_typology_id=best.typology_id, similarity=best_sim)
    return DiffResult(diff_class="DUPLICATE", target_typology_id=best.typology_id, similarity=best_sim)
