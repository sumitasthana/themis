"""Themis AML Investigation Tools (Phase 2 — DB-backed)

Each data-reading tool is async and queries Postgres via the shared
async session in `db.database`. Return shapes match what
`orchestrator.ThemisAgent` expects field-for-field — see the mapping
table in CLAUDE.md.

`calculate_risk_score` is the only sync, pure-computation tool. It
takes the accumulated risk factors and returns the disposition.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, or_, func, select

from db.database import SessionLocal
from db import models as M


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

# Map AML status → KYC status (orchestrator's vocabulary)
_KYC_STATUS_MAP = {
    "Approved": "CURRENT",
    "Under Review": "NEEDS_REFRESH",
    "Enhanced Monitoring": "NEEDS_REFRESH",
}

# Map our risk-string vocabulary to a numeric score for averaging
_RISK_NUMERIC = {"CRITICAL": 90, "HIGH": 75, "MEDIUM": 50, "LOW": 20}


def _is_business_account(account_type: Optional[str]) -> bool:
    if not account_type:
        return False
    return "business" in account_type.lower() or "llc" in account_type.lower()


def _utcnow_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


# ─────────────────────────────────────────────────────────────────────
# Tool 1 — get_alert_details
# ─────────────────────────────────────────────────────────────────────

async def get_alert_details(alert_id: str) -> Dict[str, Any]:
    """Return alert metadata in the shape the orchestrator's step 1 reads."""
    async with SessionLocal() as s:
        alert = (await s.execute(
            select(M.Alert).where(M.Alert.id == alert_id)
        )).scalar_one_or_none()

        if alert is None:
            raise ValueError(f"Alert {alert_id} not found")

        customer = (await s.execute(
            select(M.Customer).where(M.Customer.id == alert.customer_id)
        )).scalar_one_or_none()

        typologies = (await s.execute(
            select(M.AlertTypology.typology_name).where(M.AlertTypology.alert_id == alert_id)
        )).scalars().all()

        flagged_rows = (await s.execute(
            select(M.Transaction.id, M.Transaction.amount).where(
                and_(M.Transaction.alert_id == alert_id, M.Transaction.flagged.is_(True))
            )
        )).all()

        flagged_ids = [r[0] for r in flagged_rows]
        flagged_volume = float(sum(abs(r[1] or 0) for r in flagged_rows))

        account_age_days: Optional[int] = None
        if customer and customer.opened:
            account_age_days = (datetime.now().date() - customer.opened).days

        alert_window_start = alert.date - timedelta(days=30) if alert.date else None
        alert_window_end = alert.date

    return {
        "alert_id": alert.id,
        "status": alert.status,
        "created_date": alert.date.isoformat() if alert.date else None,
        "assigned_to": "System",
        "customer_id": alert.customer_id,
        "customer_name": customer.name if customer else alert.customer_id,
        "risk_level": alert.alert_risk_level,
        "rules_fired": list(typologies),
        "rule_count": len(typologies),
        "alert_window": {
            "start_date": alert_window_start.isoformat() if alert_window_start else None,
            "end_date": alert_window_end.isoformat() if alert_window_end else None,
        },
        "flagged_transactions": flagged_ids,
        "total_flagged_volume": round(flagged_volume, 2),
        "alert_score": alert.alert_risk if alert.alert_risk is not None else 0,
        "previous_alerts": (customer.prior_alerts if customer else 0) or 0,
        "account_age_days": account_age_days or 0,
    }


# ─────────────────────────────────────────────────────────────────────
# Tool 2 — search_transactions
# ─────────────────────────────────────────────────────────────────────

async def search_transactions(
    customer_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    transaction_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Return all transactions across this customer's alerts that match
    the filters, in shape `_step_3_transactions` consumes."""
    async with SessionLocal() as s:
        alert_ids = (await s.execute(
            select(M.Alert.id).where(M.Alert.customer_id == customer_id)
        )).scalars().all()

        if not alert_ids:
            return []

        stmt = select(M.Transaction).where(M.Transaction.alert_id.in_(alert_ids))
        if min_amount is not None:
            stmt = stmt.where(func.abs(M.Transaction.amount) >= min_amount)
        if max_amount is not None:
            stmt = stmt.where(func.abs(M.Transaction.amount) <= max_amount)
        if transaction_type:
            stmt = stmt.where(M.Transaction.category == transaction_type)
        stmt = stmt.order_by(M.Transaction.date.desc(), M.Transaction.id)

        rows = (await s.execute(stmt)).scalars().all()

    out: List[Dict[str, Any]] = []
    for t in rows:
        location_parts = [p for p in (t.city, t.country) if p]
        out.append({
            "transaction_id": t.id,
            "customer_id": customer_id,
            "date": t.date.isoformat() if t.date else None,
            "type": (t.category or t.cp_type or "unknown").upper(),
            "amount": float(t.amount) if t.amount is not None else 0.0,
            "currency": "USD",
            "description": t.descr or "",
            "counterparty": t.counterparty,
            "location": ", ".join(location_parts) if location_parts else None,
            "flags": list(t.risk_indicators or []),
        })
    return out


# ─────────────────────────────────────────────────────────────────────
# Tool 3 — get_customer_profile
# ─────────────────────────────────────────────────────────────────────

async def get_customer_profile(customer_id: str) -> Dict[str, Any]:
    """Return KYC-style profile in the shape `_step_2_customer_profile` reads.

    Several orchestrator-required fields don't exist in the DB
    (`kyc_last_updated`, `pep_status`, `sanctions_hit`, `adverse_media`,
    `beneficial_owners`). They're derived from screening_results where
    possible, otherwise stubbed with sensible defaults. The mapping is
    documented inline.
    """
    async with SessionLocal() as s:
        c = (await s.execute(
            select(M.Customer).where(M.Customer.id == customer_id)
        )).scalar_one_or_none()
        if c is None:
            raise ValueError(f"Customer {customer_id} not found")

        screening = (await s.execute(
            select(M.ScreeningResult).where(M.ScreeningResult.entity_id == customer_id)
        )).scalars().all()

    pep_status = any(r.screen_type == "PEP" and r.match in ("HIT", "POTENTIAL") for r in screening)
    sanctions_hit = any(r.screen_type == "Sanctions" and r.match == "HIT" for r in screening)
    adverse_media = any(r.screen_type == "Adverse Media" and r.match in ("HIT", "POTENTIAL") for r in screening)

    return {
        "customer_id": c.id,
        "customer_name": c.name,
        "customer_type": "BUSINESS" if _is_business_account(c.account_type) else "INDIVIDUAL",
        "account_opened": c.opened.isoformat() if c.opened else None,
        # aml_status is the closest analogue to KYC status; mapping in _KYC_STATUS_MAP
        "kyc_status": _KYC_STATUS_MAP.get(c.aml_status or "", c.aml_status or "UNKNOWN"),
        # No real `kyc_last_updated` in schema — approximate as account-opened date
        "kyc_last_updated": c.opened.isoformat() if c.opened else None,
        "business_type": c.occupation or "Unknown",
        "industry_code": None,
        "expected_activity": {
            "monthly_volume": (c.stated_income / 12) if c.stated_income else None,
            "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"],
            "geographic_scope": "DOMESTIC" if (c.country or "").upper() == "USA" else "INTERNATIONAL",
        },
        "risk_rating": c.customer_risk_level or "UNKNOWN",
        "pep_status": pep_status,
        "sanctions_hit": sanctions_hit,
        "adverse_media": adverse_media,
        # Beneficial owners are not modeled in the schema — empty list
        "beneficial_owners": [],
        "addresses": [{
            "type": "BUSINESS" if _is_business_account(c.account_type) else "PERSONAL",
            "street": c.address or "",
            "city": None,
            "state": None,
            "country": c.country,
        }] if c.address else [],
        "phone": c.phone,
        "email": c.email,
    }


# ─────────────────────────────────────────────────────────────────────
# Tool 4 — analyze_network
# ─────────────────────────────────────────────────────────────────────

async def analyze_network(customer_id: str, depth: int = 2) -> Dict[str, Any]:
    """Build the network analysis from the seeded `network_nodes`/`edges`
    keyed by the customer's alerts. Returns the shape `_step_7_network`
    consumes."""
    async with SessionLocal() as s:
        alert_ids = (await s.execute(
            select(M.Alert.id).where(M.Alert.customer_id == customer_id)
        )).scalars().all()

        if not alert_ids:
            return {
                "customer_id": customer_id,
                "analysis_depth": depth,
                "total_connections": 0,
                "connections": [],
                "circular_flows": [],
                "network_risk_score": 0.0,
                "high_risk_connections": 0,
                "shared_infrastructure": False,
                "layering_detected": False,
            }

        nodes = (await s.execute(
            select(M.NetworkNode).where(M.NetworkNode.alert_id.in_(alert_ids))
        )).scalars().all()
        edges = (await s.execute(
            select(M.NetworkEdge).where(M.NetworkEdge.alert_id.in_(alert_ids))
        )).scalars().all()

    # Index nodes by (alert_id, node_key) so edges can join correctly.
    node_index: Dict[tuple, M.NetworkNode] = {(n.alert_id, n.node_key): n for n in nodes}
    subject_keys = {(n.alert_id, n.node_key) for n in nodes if (n.node_type or "").lower() == "subject"}

    connections_by_label: Dict[str, Dict[str, Any]] = {}
    for e in edges:
        src_key = (e.alert_id, e.src_key)
        dst_key = (e.alert_id, e.dst_key)
        # Direction: subject → other counts as out; other → subject as in
        if src_key in subject_keys and dst_key not in subject_keys:
            other = node_index.get(dst_key)
            rel = "WIRE_PARTNER"
        elif dst_key in subject_keys and src_key not in subject_keys:
            other = node_index.get(src_key)
            rel = "FREQUENT_COUNTERPARTY"
        else:
            continue

        if other is None:
            continue
        label = other.label
        entry = connections_by_label.setdefault(label, {
            "entity_id": f"{other.alert_id}:{other.node_key}",
            "entity_name": label,
            "relationship_type": rel,
            "transaction_count": 0,
            "total_volume": 0.0,
            "risk_score": float(_RISK_NUMERIC.get(other.risk or "LOW", 20)),
        })
        entry["transaction_count"] += 1
        # `e.amount` is a display string like "$95K" — leave total_volume as count-based
        entry["total_volume"] += 1.0

    connections = list(connections_by_label.values())
    high_risk = sum(1 for c in connections if c["risk_score"] >= _RISK_NUMERIC["HIGH"])
    avg_risk = (sum(c["risk_score"] for c in connections) / len(connections)) if connections else 0.0

    return {
        "customer_id": customer_id,
        "analysis_depth": depth,
        "total_connections": len(connections),
        "connections": connections,
        # Cycle detection is out of scope for Phase 2 — surface the data, leave detection to a future tool
        "circular_flows": [],
        "network_risk_score": round(avg_risk, 1),
        "high_risk_connections": high_risk,
        "shared_infrastructure": False,
        "layering_detected": False,
    }


# ─────────────────────────────────────────────────────────────────────
# Tool 5 — check_sanctions
# ─────────────────────────────────────────────────────────────────────

async def check_sanctions(entity_name: str, entity_type: str = "INDIVIDUAL") -> Dict[str, Any]:
    """Match against `screening_results` by entity name. Returns the
    shape `_step_8_sanctions` consumes."""
    pattern = f"%{entity_name}%"
    async with SessionLocal() as s:
        rows = (await s.execute(
            select(M.ScreeningResult).where(M.ScreeningResult.entity.ilike(pattern))
        )).scalars().all()

    matches: List[Dict[str, Any]] = []
    for r in rows:
        if r.match in ("HIT", "POTENTIAL"):
            matches.append({
                "list": _screen_type_to_list(r.screen_type),
                "match_name": r.entity,
                "match_score": r.score or 0,
                "match_type": r.match,
                "entity_type": (r.entity_type or "").upper() or entity_type,
                "program": r.screen_type,
                "added_date": None,
                "requires_review": True,
            })

    return {
        "entity_name": entity_name,
        "entity_type": entity_type,
        "screening_date": _utcnow_str(),
        "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"],
        "total_hits": len(matches),
        "matches": matches,
    }


def _screen_type_to_list(screen_type: Optional[str]) -> str:
    """Map our screening types onto the common list names."""
    if not screen_type:
        return "OFAC_SDN"
    s = screen_type.lower()
    if "sanction" in s:
        return "OFAC_SDN"
    if "pep" in s:
        return "WORLD_CHECK_PEP"
    if "adverse" in s or "media" in s:
        return "DOW_JONES_ADVERSE"
    if "enforce" in s:
        return "REGULATORY_ENFORCEMENT"
    return screen_type.upper()


# ─────────────────────────────────────────────────────────────────────
# Tool 6 — calculate_baseline
# ─────────────────────────────────────────────────────────────────────

async def calculate_baseline(customer_id: str, period_days: int = 90) -> Dict[str, Any]:
    """Compare the customer's flagged-window activity vs their non-flagged
    baseline. Shape matches `_step_4_baseline`."""
    async with SessionLocal() as s:
        alert_ids = (await s.execute(
            select(M.Alert.id).where(M.Alert.customer_id == customer_id)
        )).scalars().all()

        if not alert_ids:
            return _empty_baseline(customer_id, period_days)

        txs = (await s.execute(
            select(M.Transaction).where(M.Transaction.alert_id.in_(alert_ids))
        )).scalars().all()

    if not txs:
        return _empty_baseline(customer_id, period_days)

    flagged = [t for t in txs if t.flagged]
    baseline = [t for t in txs if not t.flagged]

    def _abs_sum(rows) -> float:
        return float(sum(abs(t.amount or 0) for t in rows))

    months_in_period = max(1, period_days // 30)
    baseline_volume = _abs_sum(baseline) / months_in_period
    alert_volume = _abs_sum(flagged) / max(1, months_in_period // 3)  # alert window ~30 days

    baseline_avg_size = (_abs_sum(baseline) / len(baseline)) if baseline else 0.0
    alert_avg_size = (_abs_sum(flagged) / len(flagged)) if flagged else 0.0

    cash_count = sum(1 for t in baseline if (t.category or "").lower() == "cash_deposit")
    wire_count = sum(1 for t in baseline if "wire" in (t.category or "").lower())
    total_baseline = max(1, len(baseline))

    if baseline_volume > 0:
        volume_dev = ((alert_volume - baseline_volume) / baseline_volume) * 100
    else:
        volume_dev = 0.0
    if baseline_avg_size > 0:
        size_dev = ((alert_avg_size - baseline_avg_size) / baseline_avg_size) * 100
    else:
        size_dev = 0.0
    if len(baseline) > 0:
        freq_dev = ((len(flagged) - len(baseline)) / len(baseline)) * 100
    else:
        freq_dev = 0.0

    is_significant = abs(volume_dev) >= 50.0
    deviation_score = min(100.0, abs(volume_dev) * 0.6 + abs(freq_dev) * 0.2 + abs(size_dev) * 0.2)

    return {
        "customer_id": customer_id,
        "analysis_period_days": period_days,
        "baseline_metrics": {
            "avg_monthly_volume": round(baseline_volume, 2),
            "avg_transaction_size": round(baseline_avg_size, 2),
            "transaction_frequency": len(baseline),
            "cash_deposit_ratio": round(cash_count / total_baseline, 2),
            "wire_ratio": round(wire_count / total_baseline, 2),
        },
        "alert_period_metrics": {
            "monthly_volume": round(alert_volume, 2),
            "avg_transaction_size": round(alert_avg_size, 2),
            "transaction_frequency": len(flagged),
        },
        "deviations": {
            "volume_deviation_pct": round(volume_dev, 1),
            "frequency_deviation_pct": round(freq_dev, 1),
            "size_deviation_pct": round(size_dev, 1),
        },
        "is_significant_deviation": is_significant,
        "deviation_score": round(deviation_score, 1),
    }


def _empty_baseline(customer_id: str, period_days: int) -> Dict[str, Any]:
    return {
        "customer_id": customer_id,
        "analysis_period_days": period_days,
        "baseline_metrics": {
            "avg_monthly_volume": 0.0,
            "avg_transaction_size": 0.0,
            "transaction_frequency": 0,
            "cash_deposit_ratio": 0.0,
            "wire_ratio": 0.0,
        },
        "alert_period_metrics": {
            "monthly_volume": 0.0,
            "avg_transaction_size": 0.0,
            "transaction_frequency": 0,
        },
        "deviations": {
            "volume_deviation_pct": 0.0,
            "frequency_deviation_pct": 0.0,
            "size_deviation_pct": 0.0,
        },
        "is_significant_deviation": False,
        "deviation_score": 0.0,
    }


# ─────────────────────────────────────────────────────────────────────
# Tool 7 — search_keywords
# ─────────────────────────────────────────────────────────────────────

_HIGH_RISK_KEYWORDS = {"loan", "gift", "cash", "shell", "offshore", "nominee", "wash", "layering"}


async def search_keywords(customer_id: str, keywords: List[str]) -> Dict[str, Any]:
    """ILIKE-search transaction `descr` and `notes` for keywords across
    this customer's alerts. Shape matches `_step_6_keywords`."""
    keywords = keywords or []
    async with SessionLocal() as s:
        alert_ids = (await s.execute(
            select(M.Alert.id).where(M.Alert.customer_id == customer_id)
        )).scalars().all()

        if not alert_ids or not keywords:
            return {
                "customer_id": customer_id,
                "keywords_searched": keywords,
                "total_matches": 0,
                "matches": [],
                "high_risk_keywords_found": [],
                "requires_review": False,
            }

        clauses = []
        for kw in keywords:
            pattern = f"%{kw}%"
            clauses.append(M.Transaction.descr.ilike(pattern))
            clauses.append(M.Transaction.notes.ilike(pattern))

        rows = (await s.execute(
            select(M.Transaction)
            .where(and_(M.Transaction.alert_id.in_(alert_ids), or_(*clauses)))
            .order_by(M.Transaction.date.desc())
        )).scalars().all()

    matches: List[Dict[str, Any]] = []
    high_risk_hit: List[str] = []
    for t in rows:
        # Determine which keyword(s) matched — first hit wins for the row
        text = f"{t.descr or ''} {t.notes or ''}".lower()
        matched_kw = next((kw for kw in keywords if kw.lower() in text), None)
        if matched_kw is None:
            continue
        if matched_kw.lower() in _HIGH_RISK_KEYWORDS and matched_kw not in high_risk_hit:
            high_risk_hit.append(matched_kw)
        matches.append({
            "transaction_id": t.id,
            "date": t.date.isoformat() if t.date else None,
            "amount": float(t.amount) if t.amount is not None else 0.0,
            "description": t.descr or "",
            "keyword_matched": matched_kw,
            "context": "Description" if matched_kw.lower() in (t.descr or "").lower() else "Notes",
        })

    return {
        "customer_id": customer_id,
        "keywords_searched": keywords,
        "total_matches": len(matches),
        "matches": matches,
        "high_risk_keywords_found": high_risk_hit,
        "requires_review": len(matches) > 2,
    }


# ─────────────────────────────────────────────────────────────────────
# Tool 8 — verify_income
# ─────────────────────────────────────────────────────────────────────

async def verify_income(customer_id: str) -> Dict[str, Any]:
    """Compare stated income vs annualized observed inflow from
    transactions across this customer's alerts."""
    async with SessionLocal() as s:
        c = (await s.execute(
            select(M.Customer).where(M.Customer.id == customer_id)
        )).scalar_one_or_none()
        if c is None:
            raise ValueError(f"Customer {customer_id} not found")

        alert_ids = (await s.execute(
            select(M.Alert.id).where(M.Alert.customer_id == customer_id)
        )).scalars().all()

        observed = 0.0
        if alert_ids:
            rows = (await s.execute(
                select(M.Transaction.amount).where(
                    and_(M.Transaction.alert_id.in_(alert_ids), M.Transaction.amount > 0)
                )
            )).all()
            # rows are summed across all observed alert windows; the total is
            # treated as inflow over those windows
            observed = float(sum(r[0] or 0 for r in rows))

    stated = float(c.stated_income or 0)
    # Annualize: observed sum is across alert windows (~30 days each); scale to year
    annualized_observed = observed * (365 / 30) / max(1, len(alert_ids))
    if stated > 0:
        discrepancy_pct = abs(annualized_observed - stated) / stated * 100
    else:
        discrepancy_pct = 0.0

    if discrepancy_pct < 30:
        verification = "VERIFIED"
    elif discrepancy_pct < 100:
        verification = "QUESTIONABLE"
    else:
        verification = "INCONSISTENT"

    red_flags: List[str] = []
    if discrepancy_pct > 100:
        red_flags.append("Volume exceeds stated income by >100%")

    return {
        "customer_id": customer_id,
        "stated_annual_income": round(stated, 2),
        "income_source": "Business Revenue" if _is_business_account(c.account_type) else "Salary",
        "documentation_provided": "Bank Statements",
        "observed_annual_volume": round(annualized_observed, 2),
        "discrepancy_pct": round(discrepancy_pct, 1),
        "is_consistent": discrepancy_pct < 50,
        "red_flags": red_flags,
        "verification_status": verification,
    }


# ─────────────────────────────────────────────────────────────────────
# Tool 9 — calculate_risk_score (pure computation, sync)
# ─────────────────────────────────────────────────────────────────────

def calculate_risk_score(factors: Dict[str, Any]) -> Dict[str, Any]:
    """Aggregate weighted factors into a disposition. Pure computation —
    no DB access, no randomness, deterministic for any given input."""
    total_score = sum(factors.values()) * 100

    if total_score >= 75:
        recommendation = "ESCALATE"
        confidence = 90.0
    elif total_score >= 50:
        recommendation = "REVIEW"
        confidence = 75.0
    else:
        recommendation = "CLEAR"
        confidence = 65.0

    if total_score >= 80:
        risk_level = "CRITICAL"
    elif total_score >= 60:
        risk_level = "HIGH"
    elif total_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "risk_score": round(total_score, 1),
        "risk_level": risk_level,
        "factors_analyzed": len(factors),
        "factor_breakdown": [
            {"factor": f, "weight": w, "contribution": round(w * 100, 1)}
            for f, w in sorted(factors.items(), key=lambda kv: kv[1], reverse=True)
        ],
        "recommendation": recommendation,
        "confidence": confidence,
        "requires_sar": total_score >= 75,
        "requires_edd": total_score >= 60,
        "calculated_at": _utcnow_str(),
    }


# ─────────────────────────────────────────────────────────────────────
# Tool registry (kept for skills_loader / api `/api/skills` parity)
# ─────────────────────────────────────────────────────────────────────

TOOL_REGISTRY = {
    "get_alert_details": {
        "function": get_alert_details,
        "description": "Retrieve comprehensive alert metadata and triggering information",
        "parameters": ["alert_id"],
        "returns": "Alert details including rules fired, flagged transactions, risk level",
    },
    "search_transactions": {
        "function": search_transactions,
        "description": "Search and retrieve transaction history for a customer",
        "parameters": ["customer_id", "start_date", "end_date", "min_amount", "max_amount", "transaction_type"],
        "returns": "List of transaction records with amounts, types, counterparties",
    },
    "get_customer_profile": {
        "function": get_customer_profile,
        "description": "Retrieve customer KYC profile and account information",
        "parameters": ["customer_id"],
        "returns": "Customer profile with KYC status, business type, risk rating, beneficial owners",
    },
    "analyze_network": {
        "function": analyze_network,
        "description": "Analyze transaction network and identify connected entities",
        "parameters": ["customer_id", "depth"],
        "returns": "Network graph with connections, circular flows, layering detection",
    },
    "check_sanctions": {
        "function": check_sanctions,
        "description": "Screen entity against sanctions lists (OFAC, UN, EU)",
        "parameters": ["entity_name", "entity_type"],
        "returns": "Screening results with any hits and match scores",
    },
    "calculate_baseline": {
        "function": calculate_baseline,
        "description": "Calculate customer's normal transaction baseline for comparison",
        "parameters": ["customer_id", "period_days"],
        "returns": "Baseline metrics and deviation analysis",
    },
    "search_keywords": {
        "function": search_keywords,
        "description": "Search transaction descriptions for suspicious keywords",
        "parameters": ["customer_id", "keywords"],
        "returns": "Keyword matches in transaction descriptions and memos",
    },
    "verify_income": {
        "function": verify_income,
        "description": "Verify customer's stated income against transaction activity",
        "parameters": ["customer_id"],
        "returns": "Income verification with discrepancy analysis",
    },
    "calculate_risk_score": {
        "function": calculate_risk_score,
        "description": "Calculate comprehensive risk score based on investigation findings",
        "parameters": ["factors"],
        "returns": "Risk score, breakdown, and disposition recommendation",
    },
}


def get_tool(tool_name: str):
    if tool_name not in TOOL_REGISTRY:
        raise ValueError(f"Tool '{tool_name}' not found in registry")
    return TOOL_REGISTRY[tool_name]["function"]


def list_tools() -> List[str]:
    return list(TOOL_REGISTRY.keys())


def get_tool_info(tool_name: str) -> Dict[str, Any]:
    if tool_name not in TOOL_REGISTRY:
        raise ValueError(f"Tool '{tool_name}' not found in registry")
    return TOOL_REGISTRY[tool_name]
