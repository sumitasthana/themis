"""typology_registry

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-15

Typology library + harvester pipeline.

Two new tables:
  - typologies            — the live registry (one row per active MD)
  - typology_candidates   — the review queue (one row per harvested
                            candidate, tracked from extraction
                            through review to promotion)

Plus a nullable `typology_id` FK on `alert_typologies` so existing
string typology names can be linked to registry rows over time
without breaking the string M:N path.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── typologies ───────────────────────────────────────────────────
    op.create_table(
        "typologies",
        sa.Column("typology_id", sa.Text(), primary_key=True),  # e.g. "STR-001"
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("current_version", sa.Text(), nullable=False),
        sa.Column("md_path", sa.Text(), nullable=False),
        sa.Column("md_sha256", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("approved_by", postgresql.JSONB()),
        sa.Column("deployed_at", sa.DateTime(timezone=True)),
        sa.Column("retired_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_typologies_status", "typologies", ["status"])
    op.create_index("ix_typologies_category", "typologies", ["category"])

    # ── typology_candidates ──────────────────────────────────────────
    op.create_table(
        "typology_candidates",
        sa.Column("id", sa.Text(), primary_key=True),  # uuid4
        sa.Column("source_tier", sa.Text(), nullable=False),
        sa.Column("source_org", sa.Text(), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("source_sha256", sa.Text(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("extractor_name", sa.Text(), nullable=False),
        sa.Column("extractor_version", sa.Text(), nullable=False),
        sa.Column("prompt_version", sa.Text()),
        sa.Column("prompt_sha256", sa.Text()),
        sa.Column("candidate_md", sa.Text(), nullable=False),
        sa.Column("candidate_name", sa.Text(), nullable=False),
        sa.Column("candidate_category", sa.Text(), nullable=False),
        sa.Column("diff_class", sa.Text(), nullable=False),
        sa.Column("diff_target_id", sa.Text(), sa.ForeignKey("typologies.typology_id")),
        sa.Column("similarity", sa.Float()),
        sa.Column("review_status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", postgresql.JSONB()),
        sa.Column("review_notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_typology_candidates_review_status", "typology_candidates", ["review_status"])

    # ── alert_typologies.typology_id ─────────────────────────────────
    op.add_column(
        "alert_typologies",
        sa.Column("typology_id", sa.Text(), sa.ForeignKey("typologies.typology_id"), nullable=True),
    )
    op.create_index("ix_alert_typologies_typology_id", "alert_typologies", ["typology_id"])


def downgrade() -> None:
    op.drop_index("ix_alert_typologies_typology_id", table_name="alert_typologies")
    op.drop_column("alert_typologies", "typology_id")

    op.drop_index("ix_typology_candidates_review_status", table_name="typology_candidates")
    op.drop_table("typology_candidates")

    op.drop_index("ix_typologies_category", table_name="typologies")
    op.drop_index("ix_typologies_status", table_name="typologies")
    op.drop_table("typologies")
