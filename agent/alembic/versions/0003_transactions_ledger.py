"""transactions_ledger

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-15

Phase 4 — split transactions into a true ledger.

Before: transactions PK was (alert_id, id); every txn had to belong to an
alert. That worked for the 46-row demo seed but cannot represent the
Themis-ML dataset where the vast majority of txns are non-laundering.

After:
  - transactions.id is the sole PK; transactions.customer_id is the
    natural owner (FK -> customers).
  - alert_transactions(alert_id, transaction_id) is the M:N join:
    one txn can be evidence for multiple alerts.

Backfill rule (chosen during planning):
  Every existing transactions row has its customer_id set to the
  owning alert's customer_id, and a row is inserted into
  alert_transactions for the (alert_id, id) pair.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the join table first so the backfill has somewhere to land.
    op.create_table(
        "alert_transactions",
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("transaction_id", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("alert_id", "transaction_id"),
    )
    op.create_index(
        "ix_alert_transactions_transaction_id",
        "alert_transactions",
        ["transaction_id"],
    )

    # 2. Add customer_id to transactions (nullable during backfill).
    op.add_column(
        "transactions",
        sa.Column("customer_id", sa.Text(), sa.ForeignKey("customers.id"), nullable=True),
    )

    # 3. Disambiguate colliding transaction ids before the PK swap. The
    #    old composite PK (alert_id, id) allowed the same opaque id to
    #    refer to different physical txns across alerts (e.g. TX-1082 is
    #    -$120K Wire in ALERT-0108 and +$50K ACH Credit in ALERT-0112).
    #    Under the new single-column PK these must be globally unique, so
    #    we suffix every row that participates in a collision with its
    #    alert_id.
    op.execute(
        """
        UPDATE transactions
           SET id = id || '-' || alert_id
         WHERE id IN (
             SELECT id FROM transactions GROUP BY id HAVING count(*) > 1
         )
        """
    )

    # 4. Backfill: copy alert->customer mapping onto transactions, and
    #    populate alert_transactions from the (now unique) (alert_id, id)
    #    pairs.
    op.execute(
        """
        UPDATE transactions t
           SET customer_id = a.customer_id
          FROM alerts a
         WHERE t.alert_id = a.id
        """
    )
    op.execute(
        """
        INSERT INTO alert_transactions (alert_id, transaction_id)
        SELECT alert_id, id
          FROM transactions
         WHERE alert_id IS NOT NULL
        """
    )

    # 5. Drop the composite PK and the alert_id column. Postgres named the
    #    PK constraint "transactions_pkey" automatically.
    op.drop_constraint("transactions_pkey", "transactions", type_="primary")
    op.drop_column("transactions", "alert_id")

    # 6. Promote transactions.id to the sole PK.
    op.create_primary_key("transactions_pkey", "transactions", ["id"])

    # 7. Helpful index for the new dominant access pattern.
    op.create_index("ix_transactions_customer_id", "transactions", ["customer_id"])


def downgrade() -> None:
    op.drop_index("ix_transactions_customer_id", table_name="transactions")
    op.drop_constraint("transactions_pkey", "transactions", type_="primary")

    op.add_column(
        "transactions",
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.id", ondelete="CASCADE"), nullable=True),
    )
    op.execute(
        """
        UPDATE transactions t
           SET alert_id = (
                SELECT at.alert_id FROM alert_transactions at
                 WHERE at.transaction_id = t.id
                 LIMIT 1
           )
        """
    )
    # Rows that no longer have any alert association cannot satisfy the
    # composite PK. Drop them — this is a lossy downgrade by design.
    op.execute("DELETE FROM transactions WHERE alert_id IS NULL")

    op.create_primary_key("transactions_pkey", "transactions", ["alert_id", "id"])
    op.drop_column("transactions", "customer_id")

    op.drop_index("ix_alert_transactions_transaction_id", table_name="alert_transactions")
    op.drop_table("alert_transactions")
