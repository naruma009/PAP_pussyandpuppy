from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, BigInteger, MetaData, Numeric, String, Table, Text
from sqlalchemy.types import TypeDecorator

from app.postgres import Base


metadata: MetaData = Base.metadata
AppInteger = BigInteger().with_variant(Integer, "sqlite")


class AppTimestamp(TypeDecorator):
    """Use ISO text for SQLite compatibility and timestamptz for PostgreSQL."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "sqlite":
            return dialect.type_descriptor(String())
        return dialect.type_descriptor(DateTime(timezone=True))

    def process_bind_param(self, value, dialect):
        if value is None or dialect.name == "sqlite":
            return value.isoformat() if dialect.name == "sqlite" and isinstance(value, datetime) else value
        return datetime.fromisoformat(value) if isinstance(value, str) else value

users = Table(
    "users",
    metadata,
    Column("id", AppInteger, primary_key=True),
    Column("email", Text, nullable=False),
    Column("full_name", Text, nullable=False),
    Column("created_at", AppTimestamp(), nullable=False),
    Column("updated_at", AppTimestamp(), nullable=False),
    Column("status", Text, nullable=False, server_default="active"),
)

products = Table(
    "products",
    metadata,
    Column("id", AppInteger, primary_key=True),
    Column("name", Text, nullable=False),
    Column("description", Text, nullable=False),
    Column("price", Numeric(12, 2), nullable=False),
    Column("stock", Integer, nullable=False),
    Column("category", Text, nullable=False),
    Column("pet_type", Text, nullable=False),
    Column("age_group", Text, nullable=False, server_default="all"),
    Column("image_url", Text, nullable=False, server_default=""),
    Column("emoji", Text, nullable=False, server_default="🐾"),
    Column("featured", Boolean, nullable=False, server_default="0"),
    Column("created_at", AppTimestamp(), nullable=False),
    Column("updated_at", AppTimestamp(), nullable=False),
    CheckConstraint("price >= 0", name="ck_products_price_nonnegative"),
    CheckConstraint("stock >= 0", name="ck_products_stock_nonnegative"),
    CheckConstraint("pet_type IN ('cat', 'dog', 'both')", name="ck_products_pet_type"),
    CheckConstraint("age_group IN ('all', 'young', 'adult', 'senior')", name="ck_products_age_group"),
)

orders = Table(
    "orders",
    metadata,
    Column("id", String, primary_key=True),
    Column("user_id", AppInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    Column("customer_name", Text, nullable=False),
    Column("customer_email", Text, nullable=False),
    Column("phone", Text, nullable=False),
    Column("address", Text, nullable=False),
    Column("district", Text, nullable=False),
    Column("province", Text, nullable=False),
    Column("postal_code", Text, nullable=False),
    Column("total", Numeric(12, 2), nullable=False),
    Column("status", Text, nullable=False, server_default="New"),
    Column("created_at", AppTimestamp(), nullable=False),
    CheckConstraint("total >= 0", name="ck_orders_total_nonnegative"),
)

order_items = Table(
    "order_items",
    metadata,
    Column("id", AppInteger, primary_key=True),
    Column("order_id", String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
    Column("product_id", AppInteger, ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
    Column("product_name", Text, nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("unit_price", Numeric(12, 2), nullable=False),
    Column("subtotal", Numeric(12, 2), nullable=False),
    CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
    CheckConstraint("unit_price >= 0", name="ck_order_items_unit_price_nonnegative"),
    CheckConstraint("subtotal >= 0", name="ck_order_items_subtotal_nonnegative"),
)

settings = Table(
    "settings",
    metadata,
    Column("key", Text, primary_key=True),
    Column("value", Text, nullable=False),
)
