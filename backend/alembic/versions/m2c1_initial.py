"""Create the PostgreSQL foundation schema.

Revision ID: m2c1_initial
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m2c1_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("status", sa.Text(), server_default="active", nullable=False),
    )
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)

    op.create_table(
        "products",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("pet_type", sa.Text(), nullable=False),
        sa.Column("age_group", sa.Text(), server_default="all", nullable=False),
        sa.Column("image_url", sa.Text(), server_default="", nullable=False),
        sa.Column("emoji", sa.Text(), server_default="🐾", nullable=False),
        sa.Column("featured", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("price >= 0", name="ck_products_price_nonnegative"),
        sa.CheckConstraint("stock >= 0", name="ck_products_stock_nonnegative"),
        sa.CheckConstraint("pet_type IN ('cat', 'dog', 'both')", name="ck_products_pet_type"),
        sa.CheckConstraint("age_group IN ('all', 'young', 'adult', 'senior')", name="ck_products_age_group"),
    )
    op.create_index("ix_products_featured_id", "products", ["featured", "id"])
    op.create_index("ix_products_pet_type_age_group_id", "products", ["pet_type", "age_group", "id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("customer_name", sa.Text(), nullable=False),
        sa.Column("customer_email", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("district", sa.Text(), nullable=False),
        sa.Column("province", sa.Text(), nullable=False),
        sa.Column("postal_code", sa.Text(), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.Text(), server_default="New", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.CheckConstraint("total >= 0", name="ck_orders_total_nonnegative"),
    )
    op.create_index("ix_orders_user_created_at", "orders", ["user_id", "created_at"])
    op.create_index("ix_orders_customer_email_created_at", "orders", [sa.text("lower(customer_email)"), sa.text("created_at DESC")])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])

    op.create_table(
        "order_items",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("order_id", sa.Text(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=True),
        sa.Column("product_name", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="ck_order_items_unit_price_nonnegative"),
        sa.CheckConstraint("subtotal >= 0", name="ck_order_items_subtotal_nonnegative"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])

    op.create_table(
        "settings",
        sa.Column("key", sa.Text(), primary_key=True),
        sa.Column("value", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_created_at", table_name="orders")
    op.drop_index("ix_orders_customer_email_created_at", table_name="orders")
    op.drop_index("ix_orders_user_created_at", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_products_pet_type_age_group_id", table_name="products")
    op.drop_index("ix_products_featured_id", table_name="products")
    op.drop_table("products")
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_table("users")
