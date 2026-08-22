"""Add role-based authorization for user accounts.

Revision ID: m3c1_admin_roles
Revises: m3a_customer_auth
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m3c1_admin_roles"
down_revision: Union[str, Sequence[str], None] = "m3a_customer_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.Text(), nullable=False, server_default="customer"))
    op.create_check_constraint("ck_users_role", "users", "role IN ('customer', 'admin')")


def downgrade() -> None:
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_column("users", "role")
