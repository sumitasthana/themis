"""investigations

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-09

Per-investigation audit trail tables. Distinct from `journal_steps`,
which holds pre-seeded journal data per alert.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "investigations",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id")),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.Text()),
        sa.Column("recommendation", sa.Text()),
        sa.Column("confidence", sa.Numeric()),
        sa.Column("risk_score", postgresql.JSONB()),
        sa.Column("narrative", sa.Text()),
    )

    op.create_table(
        "investigation_journal",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("investigation_id", sa.Text(), sa.ForeignKey("investigations.id", ondelete="CASCADE")),
        sa.Column("step", sa.Integer()),
        sa.Column("step_name", sa.Text()),
        sa.Column("ts", sa.DateTime(timezone=True)),
        sa.Column("tool", sa.Text()),
        sa.Column("tool_input", postgresql.JSONB()),
        sa.Column("tool_output", postgresql.JSONB()),
        sa.Column("analysis", sa.Text()),
        sa.Column("findings", postgresql.JSONB()),
        sa.Column("status", sa.Text()),
    )

    op.create_table(
        "investigation_risk_factors",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("investigation_id", sa.Text(), sa.ForeignKey("investigations.id", ondelete="CASCADE")),
        sa.Column("factor", sa.Text()),
        sa.Column("weight", sa.Numeric()),
    )


def downgrade() -> None:
    op.drop_table("investigation_risk_factors")
    op.drop_table("investigation_journal")
    op.drop_table("investigations")
