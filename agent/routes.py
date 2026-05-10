"""GET routes for Phase 1.

Response payloads use camelCase keys so they match the existing JSX
constants (`themis-platform.jsx`) field-for-field. The frontend can
later swap its hardcoded data for these endpoints with no code changes
beyond the data source.
"""

from __future__ import annotations

from typing import Any

from datetime import date, timedelta
import os
import json
import uuid
from typing import Any  # noqa: F401  (used by Phase 3 helpers below)

import boto3
from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select, desc
from sqlalchemy.orm import selectinload

from db.database import SessionLocal
from db import models as M

router = APIRouter()


# ---------------------------------------------------------------------
# Serializers — output keys match the JSX constants in themis-platform.jsx
# ---------------------------------------------------------------------

def _customer_dict(c: M.Customer) -> dict[str, Any]:
    return {
        "id": c.id,
        "name": c.name,
        "dob": c.dob,
        "ssn": c.ssn_last4,
        "phone": c.phone,
        "email": c.email,
        "address": c.address,
        "occupation": c.occupation,
        "statedIncome": c.stated_income,
        "customerRisk": c.customer_risk,
        "customerRiskLevel": c.customer_risk_level,
        "alertRisk": c.alert_risk,
        "alertRiskLevel": c.alert_risk_level,
        "accountType": c.account_type,
        "opened": c.opened.isoformat() if c.opened else None,
        "country": c.country,
        "amlStatus": c.aml_status,
        "priorAlerts": c.prior_alerts,
        "nationality": c.nationality,
        "riskFactors": [
            {
                "factor": rf.factor,
                "weight": float(rf.weight) if rf.weight is not None else None,
                "direction": rf.direction,
                "detail": rf.detail,
            }
            for rf in (c.risk_factors or [])
        ],
    }


def _alert_dict(a: M.Alert, *, include_detail: bool = False) -> dict[str, Any]:
    base = {
        "id": a.id,
        "date": a.date.isoformat() if a.date else None,
        "customerId": a.customer_id,
        "typologies": [t.typology_name for t in (a.typologies or [])],
        "txns": a.txns,
        "flagged": a.flagged,
        "status": a.status,
        "confidence": a.confidence,
        "alertRisk": a.alert_risk,
        "alertRiskLevel": a.alert_risk_level,
        "agentDecision": a.agent_decision,
        "inflow": float(a.inflow) if a.inflow is not None else None,
        "outflow": float(a.outflow) if a.outflow is not None else None,
    }
    if include_detail:
        base["transactions"] = [_transaction_dict(t) for t in (a.transactions or [])]
        base["timeline"] = [_timeline_dict(e) for e in (a.timeline or [])]
        base["network"] = _network_for(a)
        base["journal"] = [_journal_dict(j) for j in sorted(a.journal_steps or [], key=lambda x: x.n or 0)]
    return base


def _transaction_dict(t: M.Transaction) -> dict[str, Any]:
    return {
        "id": t.id,
        "date": t.date.isoformat() if t.date else None,
        "time": t.time,
        "desc": t.descr,
        "category": t.category,
        "counterparty": t.counterparty,
        "cpType": t.cp_type,
        "amount": float(t.amount) if t.amount is not None else None,
        "balance": float(t.balance) if t.balance is not None else None,
        "flagged": bool(t.flagged),
        "country": t.country,
        "city": t.city,
        "notes": t.notes,
        "riskIndicators": list(t.risk_indicators or []),
    }


def _timeline_dict(e: M.TimelineEntry) -> dict[str, Any]:
    return {
        "date": e.date.isoformat() if e.date else None,
        "inflow": float(e.inflow) if e.inflow is not None else None,
        "outflow": float(e.outflow) if e.outflow is not None else None,
    }


def _journal_dict(j: M.JournalStep) -> dict[str, Any]:
    return {
        "n": j.n,
        "type": j.step_type,
        "title": j.title,
        "tool": j.tool,
        "status": j.status,
        "summary": j.summary,
        "details": j.details,
    }


def _network_for(a: M.Alert) -> dict[str, Any]:
    return {
        "nodes": [
            {
                "id": n.node_key,
                "label": n.label,
                "type": n.node_type,
                "x": float(n.x) if n.x is not None else None,
                "y": float(n.y) if n.y is not None else None,
                "risk": n.risk,
            }
            for n in (a.network_nodes or [])
        ],
        "edges": [
            {
                "id": e.id,
                "source": e.src_key,
                "target": e.dst_key,
                "amount": e.amount,
                "direction": e.direction,
            }
            for e in (a.network_edges or [])
        ],
    }


def _case_dict(c: M.Case) -> dict[str, Any]:
    return {
        "id": c.id,
        "alertId": c.alert_id,
        "customerId": c.customer_id,
        "title": c.title,
        "status": c.status,
        "priority": c.priority,
        "assignee": c.assignee,
        "created": c.created.isoformat() if c.created else None,
        "dueDate": c.due_date.isoformat() if c.due_date else None,
        "stage": c.stage,
        "sarRequired": bool(c.sar_required),
        "findings": c.findings,
        "documents": [
            {
                "id": d.id,
                "type": d.doc_type,
                "name": d.name,
                "size": d.size,
                "uploaded": d.uploaded.isoformat() if d.uploaded else None,
                "by": d.uploaded_by,
                "status": d.status,
            }
            for d in (c.documents or [])
        ],
    }


def _sar_dict(s: M.SAR) -> dict[str, Any]:
    return {
        "id": s.id,
        "caseId": s.case_id,
        "customerId": s.customer_id,
        "status": s.status,
        "filingDeadline": s.filing_deadline.isoformat() if s.filing_deadline else None,
        "preparedBy": s.prepared_by,
        "reviewedBy": s.reviewed_by,
        "qcScore": s.qc_score,
        "missingFields": [m.field for m in (s.missing_fields or [])],
        "narrative": s.narrative,
        "auditTrail": [
            {
                "ts": a.ts,
                "user": a.user_name,
                "action": a.action,
                "detail": a.detail,
            }
            for a in (s.audit_trail or [])
        ],
    }


def _anomaly_dict(a: M.Anomaly) -> dict[str, Any]:
    return {
        "id": a.id,
        "alertId": a.alert_id,
        "type": a.anomaly_type,
        "title": a.title,
        "desc": a.descr,
        "accounts": list(a.accounts or []),
        "detected": a.detected.isoformat() if a.detected else None,
        "amount": a.amount,
        "details": a.details,
        "recommendations": list(a.recommendations or []),
    }


def _screening_dict(r: M.ScreeningResult) -> dict[str, Any]:
    payload = r.payload or {}
    out = {
        "id": r.id,
        "type": r.screen_type,
        "entity": r.entity,
        "entityId": r.entity_id,
        "entityType": r.entity_type,
        "match": r.match,
        "score": r.score,
        "source": r.source,
        "details": r.details,
        "action": r.action,
    }
    # Re-attach the per-type sub-payload using the original JSX key.
    if r.screen_type == "PEP":
        out["pepDetails"] = payload
    elif r.screen_type == "Sanctions":
        out["sanctionDetails"] = payload
    elif r.screen_type == "Adverse Media":
        out["mediaDetails"] = payload
    elif r.screen_type == "Enforcement":
        out["enforcementDetails"] = payload
    return out


def _model_dict(m: M.Model) -> dict[str, Any]:
    return {
        "name": m.name,
        "type": m.model_type,
        "accuracy": float(m.accuracy) if m.accuracy is not None else None,
        "precision": float(m.precision) if m.precision is not None else None,
        "recall": float(m.recall) if m.recall is not None else None,
        "fpr": float(m.fpr) if m.fpr is not None else None,
        "status": m.status,
        "drift": m.drift,
        "retrained": m.retrained.isoformat() if m.retrained else None,
    }


def _connector_dict(c: M.Connector) -> dict[str, Any]:
    return {
        "id": c.id,
        "n": c.name,
        "v": c.vendor,
        "t": c.conn_type,
        "s": c.status,
        "vol": c.volume,
        "lat": c.latency,
        "sync": c.last_sync,
    }


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------

@router.get("/api/alerts")
async def list_alerts():
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Alert).options(selectinload(M.Alert.typologies)).order_by(M.Alert.id)
        )
        return [_alert_dict(a) for a in result.scalars().all()]


@router.get("/api/alerts/{alert_id}")
async def get_alert(alert_id: str):
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Alert)
            .options(
                selectinload(M.Alert.typologies),
                selectinload(M.Alert.transactions),
                selectinload(M.Alert.timeline),
                selectinload(M.Alert.network_nodes),
                selectinload(M.Alert.network_edges),
                selectinload(M.Alert.journal_steps),
            )
            .where(M.Alert.id == alert_id)
        )
        a = result.scalar_one_or_none()
        if not a:
            raise HTTPException(404, f"Alert {alert_id} not found")
        return _alert_dict(a, include_detail=True)


@router.get("/api/cases")
async def list_cases():
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Case).options(selectinload(M.Case.documents)).order_by(M.Case.id)
        )
        return [_case_dict(c) for c in result.scalars().all()]


@router.get("/api/cases/{case_id}")
async def get_case(case_id: str):
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Case).options(selectinload(M.Case.documents)).where(M.Case.id == case_id)
        )
        c = result.scalar_one_or_none()
        if not c:
            raise HTTPException(404, f"Case {case_id} not found")
        return _case_dict(c)


@router.get("/api/customers")
async def list_customers():
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Customer).options(selectinload(M.Customer.risk_factors)).order_by(M.Customer.id)
        )
        return [_customer_dict(c) for c in result.scalars().all()]


@router.get("/api/customers/{customer_id}")
async def get_customer(customer_id: str):
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Customer)
            .options(selectinload(M.Customer.risk_factors))
            .where(M.Customer.id == customer_id)
        )
        c = result.scalar_one_or_none()
        if not c:
            raise HTTPException(404, f"Customer {customer_id} not found")

        alerts_result = await s.execute(
            select(M.Alert)
            .options(selectinload(M.Alert.typologies))
            .where(M.Alert.customer_id == customer_id)
        )
        cases_result = await s.execute(
            select(M.Case)
            .options(selectinload(M.Case.documents))
            .where(M.Case.customer_id == customer_id)
        )

        out = _customer_dict(c)
        out["alerts"] = [_alert_dict(a) for a in alerts_result.scalars().all()]
        out["cases"] = [_case_dict(cs) for cs in cases_result.scalars().all()]
        return out


@router.get("/api/sars")
async def list_sars():
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.SAR)
            .options(
                selectinload(M.SAR.missing_fields),
                selectinload(M.SAR.audit_trail),
            )
            .order_by(M.SAR.id)
        )
        return [_sar_dict(x) for x in result.scalars().all()]


@router.get("/api/sars/{sar_id}")
async def get_sar(sar_id: str):
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.SAR)
            .options(
                selectinload(M.SAR.missing_fields),
                selectinload(M.SAR.audit_trail),
            )
            .where(M.SAR.id == sar_id)
        )
        x = result.scalar_one_or_none()
        if not x:
            raise HTTPException(404, f"SAR {sar_id} not found")
        return _sar_dict(x)


@router.get("/api/anomalies")
async def list_anomalies():
    async with SessionLocal() as s:
        result = await s.execute(select(M.Anomaly).order_by(M.Anomaly.id))
        return [_anomaly_dict(a) for a in result.scalars().all()]


@router.get("/api/anomalies/{anomaly_id}")
async def get_anomaly(anomaly_id: str):
    async with SessionLocal() as s:
        result = await s.execute(select(M.Anomaly).where(M.Anomaly.id == anomaly_id))
        a = result.scalar_one_or_none()
        if not a:
            raise HTTPException(404, f"Anomaly {anomaly_id} not found")
        return _anomaly_dict(a)


@router.get("/api/screening")
async def list_screening():
    async with SessionLocal() as s:
        result = await s.execute(select(M.ScreeningResult).order_by(M.ScreeningResult.id))
        return [_screening_dict(r) for r in result.scalars().all()]


@router.get("/api/network/{entity_id}")
async def get_network(entity_id: str):
    """Resolve entity_id to an alert (id matches alert.id) or pick the
    first alert for a customer."""
    async with SessionLocal() as s:
        # Try alert id first
        result = await s.execute(
            select(M.Alert)
            .options(
                selectinload(M.Alert.network_nodes),
                selectinload(M.Alert.network_edges),
            )
            .where(M.Alert.id == entity_id)
        )
        a = result.scalar_one_or_none()
        if a is None:
            result = await s.execute(
                select(M.Alert)
                .options(
                    selectinload(M.Alert.network_nodes),
                    selectinload(M.Alert.network_edges),
                )
                .where(M.Alert.customer_id == entity_id)
                .order_by(M.Alert.id)
                .limit(1)
            )
            a = result.scalar_one_or_none()
        if a is None:
            raise HTTPException(404, f"No network found for {entity_id}")
        return _network_for(a)


@router.get("/api/dashboard/summary")
async def dashboard_summary():
    async with SessionLocal() as s:
        alert_status = await s.execute(
            select(M.Alert.status, func.count()).group_by(M.Alert.status)
        )
        case_status = await s.execute(
            select(M.Case.status, func.count()).group_by(M.Case.status)
        )
        sar_count = await s.scalar(select(func.count()).select_from(M.SAR))
        anomaly_count = await s.scalar(select(func.count()).select_from(M.Anomaly))
        alert_total = await s.scalar(select(func.count()).select_from(M.Alert))
        case_total = await s.scalar(select(func.count()).select_from(M.Case))
        customer_total = await s.scalar(select(func.count()).select_from(M.Customer))

        return {
            "alerts": {
                "total": alert_total or 0,
                "byStatus": {k: v for k, v in alert_status.all()},
            },
            "cases": {
                "total": case_total or 0,
                "byStatus": {k: v for k, v in case_status.all()},
            },
            "sars": {"total": sar_count or 0},
            "anomalies": {"total": anomaly_count or 0},
            "customers": {"total": customer_total or 0},
        }


@router.get("/api/models")
async def list_models():
    async with SessionLocal() as s:
        result = await s.execute(select(M.Model).order_by(M.Model.id))
        return [_model_dict(m) for m in result.scalars().all()]


@router.get("/api/connectors")
async def list_connectors():
    async with SessionLocal() as s:
        result = await s.execute(select(M.Connector).order_by(M.Connector.id))
        return [_connector_dict(c) for c in result.scalars().all()]


# ---------------------------------------------------------------------
# Phase 3 — Transactions (flat) + Investigations (audit trail)
# ---------------------------------------------------------------------


@router.get("/api/transactions")
async def list_transactions(flagged: bool | None = None):
    """Flat list of transactions across all alerts. Optional ?flagged=true
    filter. Each row carries `alertId` so callers can navigate back."""
    async with SessionLocal() as s:
        stmt = select(M.Transaction)
        if flagged is True:
            stmt = stmt.where(M.Transaction.flagged.is_(True))
        elif flagged is False:
            stmt = stmt.where(M.Transaction.flagged.is_(False))
        stmt = stmt.order_by(M.Transaction.date.desc(), M.Transaction.id)
        rows = (await s.execute(stmt)).scalars().all()

    out = []
    for t in rows:
        d = _transaction_dict(t)
        d["alertId"] = t.alert_id
        out.append(d)
    return out


def _investigation_summary(inv: M.Investigation) -> dict[str, Any]:
    return {
        "id": inv.id,
        "alertId": inv.alert_id,
        "startedAt": inv.started_at.isoformat() if inv.started_at else None,
        "completedAt": inv.completed_at.isoformat() if inv.completed_at else None,
        "status": inv.status,
        "recommendation": inv.recommendation,
        "confidence": float(inv.confidence) if inv.confidence is not None else None,
    }


def _investigation_full(inv: M.Investigation) -> dict[str, Any]:
    return {
        **_investigation_summary(inv),
        "riskScore": inv.risk_score,
        "narrative": inv.narrative,
        "journal": [
            {
                "step": j.step,
                "stepName": j.step_name,
                "ts": j.ts.isoformat() if j.ts else None,
                "tool": j.tool,
                "toolInput": j.tool_input,
                "toolOutput": j.tool_output,
                "analysis": j.analysis,
                "findings": j.findings or [],
                "status": j.status,
            }
            for j in sorted(inv.journal or [], key=lambda x: x.step or 0)
        ],
        "riskFactors": [
            {"factor": f.factor, "weight": float(f.weight) if f.weight is not None else None}
            for f in (inv.factors or [])
        ],
    }


@router.get("/api/investigations")
async def list_investigations():
    async with SessionLocal() as s:
        rows = (await s.execute(
            select(M.Investigation).order_by(desc(M.Investigation.started_at)).limit(100)
        )).scalars().all()
    return [_investigation_summary(i) for i in rows]


@router.get("/api/investigations/alert/{alert_id}")
async def list_investigations_for_alert(alert_id: str):
    async with SessionLocal() as s:
        rows = (await s.execute(
            select(M.Investigation)
            .where(M.Investigation.alert_id == alert_id)
            .order_by(desc(M.Investigation.started_at))
        )).scalars().all()
    return [_investigation_summary(i) for i in rows]


@router.get("/api/investigations/{inv_id}")
async def get_investigation(inv_id: str):
    async with SessionLocal() as s:
        result = await s.execute(
            select(M.Investigation)
            .options(
                selectinload(M.Investigation.journal),
                selectinload(M.Investigation.factors),
            )
            .where(M.Investigation.id == inv_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(404, f"Investigation {inv_id} not found")
        return _investigation_full(inv)


# ---------------------------------------------------------------------
# Phase 2 — SAR generation (write endpoint)
# ---------------------------------------------------------------------

@router.post("/api/cases/{case_id}/sar")
async def generate_sar(case_id: str):
    """Generate a draft SAR narrative via Bedrock for a given case and
    persist it as a new row in `sars`. Picks the most recent
    investigation for the case's alert as additional context.
    """
    async with SessionLocal() as s:
        case_obj = (await s.execute(
            select(M.Case).where(M.Case.id == case_id)
        )).scalar_one_or_none()
        if not case_obj:
            raise HTTPException(404, f"Case {case_id} not found")

        customer = (await s.execute(
            select(M.Customer).where(M.Customer.id == case_obj.customer_id)
        )).scalar_one_or_none()
        alert = (await s.execute(
            select(M.Alert).where(M.Alert.id == case_obj.alert_id)
        )).scalar_one_or_none()

        latest_inv = (await s.execute(
            select(M.Investigation)
            .options(selectinload(M.Investigation.journal))
            .where(M.Investigation.alert_id == case_obj.alert_id)
            .order_by(desc(M.Investigation.started_at))
            .limit(1)
        )).scalar_one_or_none()

        narrative = _draft_sar_narrative(case_obj, customer, alert, latest_inv)

        sar_id = f"SAR-{uuid.uuid4().hex[:8].upper()}"
        new_sar = M.SAR(
            id=sar_id,
            case_id=case_obj.id,
            customer_id=case_obj.customer_id,
            status="DRAFT",
            filing_deadline=(date.today() + timedelta(days=30)),
            prepared_by="Themis AI",
            reviewed_by=None,
            qc_score=None,
            narrative=narrative,
        )
        s.add(new_sar)
        await s.commit()

    return {"id": sar_id, "caseId": case_id, "status": "DRAFT", "narrative": narrative}


def _draft_sar_narrative(case_obj, customer, alert, investigation) -> str:
    """Use Bedrock to draft a SAR narrative from case + investigation
    context. Falls back to a deterministic stub if Bedrock isn't
    configured."""
    customer_name = (customer.name if customer else case_obj.customer_id)
    alert_id = alert.id if alert else case_obj.alert_id
    findings = case_obj.findings or "No findings recorded."

    journal_lines = []
    if investigation and investigation.journal:
        for j in sorted(investigation.journal, key=lambda x: x.step or 0):
            journal_lines.append(f"- Step {j.step} ({j.step_name}): {j.analysis or ''}")
    journal_block = "\n".join(journal_lines) if journal_lines else "No prior investigation journal available."

    region = os.getenv("AWS_BEDROCK_REGION", "us-east-1")
    model_id = os.getenv("AWS_BEDROCK_MODEL", "anthropic.claude-3-sonnet-20240229-v1:0")
    aws_key = os.getenv("AWS_ACCESS_KEY_ID")
    if not aws_key:
        return _stub_sar_narrative(customer_name, alert_id, findings, journal_lines)

    try:
        client = boto3.client("bedrock-runtime", region_name=region)
        prompt = (
            f"You are drafting a Suspicious Activity Report (SAR) narrative for case {case_obj.id} "
            f"on alert {alert_id} for subject {customer_name}.\n\n"
            f"Case findings:\n{findings}\n\n"
            f"Investigation journal:\n{journal_block}\n\n"
            f"Write a concise SAR narrative (4-6 paragraphs) covering: subject, suspicious activity, "
            f"red flags, and recommendation. Use FinCEN-compliant language."
        )
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1500,
            "temperature": 0.3,
            "messages": [{"role": "user", "content": prompt}],
        }
        resp = client.invoke_model(
            modelId=model_id, body=json.dumps(body),
            contentType="application/json", accept="application/json",
        )
        payload = json.loads(resp["body"].read())
        if isinstance(payload.get("content"), list):
            return "".join(c.get("text", "") for c in payload["content"] if c.get("type") == "text")
        return payload.get("completion") or _stub_sar_narrative(customer_name, alert_id, findings, journal_lines)
    except Exception as e:
        return _stub_sar_narrative(customer_name, alert_id, findings, journal_lines, error=str(e))


def _stub_sar_narrative(customer_name, alert_id, findings, journal_lines, error=None) -> str:
    header = f"SAR DRAFT — Subject: {customer_name} | Source Alert: {alert_id}\n\n"
    body = (
        f"Subject Information: {customer_name}.\n\n"
        f"Suspicious Activity Findings: {findings}\n\n"
        f"Investigation Journal:\n" + ("\n".join(journal_lines) if journal_lines else "Not available.") + "\n\n"
        f"Recommendation: File this SAR with FinCEN within the regulatory deadline."
    )
    if error:
        body += f"\n\n[Note: AI narrative generation unavailable — {error}. This is a deterministic draft.]"
    return header + body
