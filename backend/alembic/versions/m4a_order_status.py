"""Add the production order status lifecycle.

Revision ID: m4a_order_status
Revises: m3c1_admin_roles
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m4a_order_status"
down_revision: Union[str, Sequence[str], None] = "m3c1_admin_roles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE orders SET status = 'pending' WHERE status = 'New'")
    op.alter_column("orders", "status", server_default="pending")
    op.create_check_constraint(
        "ck_orders_status",
        "orders",
        "status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_orders_status", "orders", type_="check")
    op.alter_column("orders", "status", server_default="New")
    op.execute("UPDATE orders SET status = 'New' WHERE status = 'pending'")
