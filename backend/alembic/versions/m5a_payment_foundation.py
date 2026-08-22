"""Add canonical payment state to orders.

Revision ID: m5a_payment_foundation
Revises: m4a_order_status
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m5a_payment_foundation"
down_revision: Union[str, Sequence[str], None] = "m4a_order_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("payment_status", sa.Text(), nullable=False, server_default="unpaid"))
    op.add_column("orders", sa.Column("payment_provider", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("provider_payment_id", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("checkout_session_id", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("currency", sa.String(length=3), nullable=False, server_default="THB"))
    op.create_check_constraint(
        "ck_orders_payment_status",
        "orders",
        "payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_orders_payment_status", "orders", type_="check")
    op.drop_column("orders", "currency")
    op.drop_column("orders", "paid_at")
    op.drop_column("orders", "checkout_session_id")
    op.drop_column("orders", "provider_payment_id")
    op.drop_column("orders", "payment_provider")
    op.drop_column("orders", "payment_status")
