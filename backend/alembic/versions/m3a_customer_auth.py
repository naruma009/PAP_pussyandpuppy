"""Add password hashes for real customer accounts.

Revision ID: m3a_customer_auth
Revises: m2c1_initial
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m3a_customer_auth"
down_revision: Union[str, Sequence[str], None] = "m2c1_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=False))


def downgrade() -> None:
    op.drop_column("users", "password_hash")
