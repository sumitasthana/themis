"""phase1_initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-05-09

Initial schema for Themis Phase 1. Tables map directly to the JSX
constants in `themis-platform.jsx` so API responses can mirror the UI.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("dob", sa.Text()),
        sa.Column("ssn_last4", sa.Text()),
        sa.Column("phone", sa.Text()),
        sa.Column("email", sa.Text()),
        sa.Column("address", sa.Text()),
        sa.Column("occupation", sa.Text()),
        sa.Column("stated_income", sa.Integer()),
        sa.Column("customer_risk", sa.Integer()),
        sa.Column("customer_risk_level", sa.Text()),
        sa.Column("alert_risk", sa.Integer()),
        sa.Column("alert_risk_level", sa.Text()),
        sa.Column("account_type", sa.Text()),
        sa.Column("opened", sa.Date()),
        sa.Column("country", sa.Text()),
        sa.Column("aml_status", sa.Text()),
        sa.Column("prior_alerts", sa.Integer()),
        sa.Column("nationality", sa.Text()),
    )

    op.create_table(
        "customer_risk_factors",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("customer_id", sa.Text(), sa.ForeignKey("customers.id", ondelete="CASCADE")),
        sa.Column("factor", sa.Text()),
        sa.Column("weight", sa.Numeric()),
        sa.Column("direction", sa.Text()),
        sa.Column("detail", sa.Text()),
    )

    op.create_table(
        "alerts",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("date", sa.Date()),
        sa.Column("customer_id", sa.Text(), sa.ForeignKey("customers.id")),
        sa.Column("txns", sa.Integer()),
        sa.Column("flagged", sa.Integer()),
        sa.Column("status", sa.Text()),
        sa.Column("confidence", sa.Integer()),
        sa.Column("alert_risk", sa.Integer()),
        sa.Column("alert_risk_level", sa.Text()),
        sa.Column("agent_decision", sa.Text()),
        sa.Column("inflow", sa.Numeric()),
        sa.Column("outflow", sa.Numeric()),
    )

    op.create_table(
        "alert_typologies",
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE")),
        sa.Column("typology_name", sa.Text()),
        sa.PrimaryKeyConstraint("alert_id", "typology_name"),
    )

    op.create_table(
        "transactions",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date()),
        sa.Column("time", sa.Text()),
        sa.Column("descr", sa.Text()),
        sa.Column("category", sa.Text()),
        sa.Column("counterparty", sa.Text()),
        sa.Column("cp_type", sa.Text()),
        sa.Column("amount", sa.Numeric()),
        sa.Column("balance", sa.Numeric()),
        sa.Column("flagged", sa.Boolean()),
        sa.Column("country", sa.Text()),
        sa.Column("city", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.Column("risk_indicators", postgresql.ARRAY(sa.Text())),
        sa.PrimaryKeyConstraint("alert_id", "id"),
    )

    op.create_table(
        "timeline_entries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE")),
        sa.Column("date", sa.Date()),
        sa.Column("inflow", sa.Numeric()),
        sa.Column("outflow", sa.Numeric()),
    )

    op.create_table(
        "network_nodes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE")),
        sa.Column("node_key", sa.Text()),
        sa.Column("label", sa.Text()),
        sa.Column("node_type", sa.Text()),
        sa.Column("x", sa.Numeric()),
        sa.Column("y", sa.Numeric()),
        sa.Column("risk", sa.Text()),
    )

    op.create_table(
        "network_edges",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE")),
        sa.Column("src_key", sa.Text()),
        sa.Column("dst_key", sa.Text()),
        sa.Column("amount", sa.Text()),
        sa.Column("direction", sa.Text()),
    )

    op.create_table(
        "journal_steps",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE")),
        sa.Column("n", sa.Integer()),
        sa.Column("step_type", sa.Text()),
        sa.Column("title", sa.Text()),
        sa.Column("tool", sa.Text()),
        sa.Column("status", sa.Text()),
        sa.Column("summary", sa.Text()),
        sa.Column("details", sa.Text()),
    )

    op.create_table(
        "cases",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id")),
        sa.Column("customer_id", sa.Text(), sa.ForeignKey("customers.id")),
        sa.Column("title", sa.Text()),
        sa.Column("status", sa.Text()),
        sa.Column("priority", sa.Text()),
        sa.Column("assignee", sa.Text()),
        sa.Column("created", sa.Date()),
        sa.Column("due_date", sa.Date()),
        sa.Column("stage", sa.Text()),
        sa.Column("sar_required", sa.Boolean()),
        sa.Column("findings", sa.Text()),
    )

    op.create_table(
        "case_documents",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("cases.id", ondelete="CASCADE")),
        sa.Column("doc_type", sa.Text()),
        sa.Column("name", sa.Text()),
        sa.Column("size", sa.Text()),
        sa.Column("uploaded", sa.Date()),
        sa.Column("uploaded_by", sa.Text()),
        sa.Column("status", sa.Text()),
    )

    op.create_table(
        "sars",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("case_id", sa.Text(), sa.ForeignKey("cases.id")),
        sa.Column("customer_id", sa.Text(), sa.ForeignKey("customers.id")),
        sa.Column("status", sa.Text()),
        sa.Column("filing_deadline", sa.Date()),
        sa.Column("prepared_by", sa.Text()),
        sa.Column("reviewed_by", sa.Text()),
        sa.Column("qc_score", sa.Integer()),
        sa.Column("narrative", sa.Text()),
    )

    op.create_table(
        "sar_missing_fields",
        sa.Column("sar_id", sa.Text(), sa.ForeignKey("sars.id", ondelete="CASCADE")),
        sa.Column("field", sa.Text()),
        sa.PrimaryKeyConstraint("sar_id", "field"),
    )

    op.create_table(
        "sar_audit_trail",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("sar_id", sa.Text(), sa.ForeignKey("sars.id", ondelete="CASCADE")),
        sa.Column("ts", sa.Text()),
        sa.Column("user_name", sa.Text()),
        sa.Column("action", sa.Text()),
        sa.Column("detail", sa.Text()),
    )

    op.create_table(
        "anomalies",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id")),
        sa.Column("anomaly_type", sa.Text()),
        sa.Column("title", sa.Text()),
        sa.Column("descr", sa.Text()),
        sa.Column("accounts", postgresql.ARRAY(sa.Text())),
        sa.Column("detected", sa.Date()),
        sa.Column("amount", sa.Text()),
        sa.Column("details", sa.Text()),
        sa.Column("recommendations", postgresql.ARRAY(sa.Text())),
    )

    op.create_table(
        "screening_results",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("screen_type", sa.Text()),
        sa.Column("entity", sa.Text()),
        sa.Column("entity_id", sa.Text()),
        sa.Column("entity_type", sa.Text()),
        sa.Column("match", sa.Text()),
        sa.Column("score", sa.Integer()),
        sa.Column("source", sa.Text()),
        sa.Column("details", sa.Text()),
        sa.Column("action", sa.Text()),
        sa.Column("payload", postgresql.JSONB()),
    )

    op.create_table(
        "models",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.Text()),
        sa.Column("model_type", sa.Text()),
        sa.Column("accuracy", sa.Numeric()),
        sa.Column("precision", sa.Numeric()),
        sa.Column("recall", sa.Numeric()),
        sa.Column("fpr", sa.Numeric()),
        sa.Column("status", sa.Text()),
        sa.Column("drift", sa.Text()),
        sa.Column("retrained", sa.Date()),
    )

    op.create_table(
        "connectors",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.Text()),
        sa.Column("vendor", sa.Text()),
        sa.Column("conn_type", sa.Text()),
        sa.Column("status", sa.Text()),
        sa.Column("volume", sa.Text()),
        sa.Column("latency", sa.Text()),
        sa.Column("last_sync", sa.Text()),
    )


def downgrade() -> None:
    for tbl in [
        "connectors",
        "models",
        "screening_results",
        "anomalies",
        "sar_audit_trail",
        "sar_missing_fields",
        "sars",
        "case_documents",
        "cases",
        "journal_steps",
        "network_edges",
        "network_nodes",
        "timeline_entries",
        "transactions",
        "alert_typologies",
        "alerts",
        "customer_risk_factors",
        "customers",
    ]:
        op.drop_table(tbl)
