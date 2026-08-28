"""Protect public tables with row-level security.

Revision ID: m5b1_rls
Revises: m5a_payment_foundation
"""
from typing import Sequence, Union

from alembic import op


revision: str = "m5b1_rls"
down_revision: Union[str, Sequence[str], None] = "m5a_payment_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table_name in ("users", "products", "orders", "order_items", "settings"):
        op.execute(f"ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table_name in ("users", "products", "orders", "order_items", "settings"):
        op.execute(f"ALTER TABLE public.{table_name} DISABLE ROW LEVEL SECURITY")
