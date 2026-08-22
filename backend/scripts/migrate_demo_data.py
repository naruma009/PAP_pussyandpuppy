"""Migrate the confirmed FastAPI SQLite demo data to PostgreSQL once."""

from __future__ import annotations

import argparse
import sqlite3
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import select, text

from app.config import Settings
from app.models import order_items, orders, products, settings
from app.postgres import create_database_engine


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = BACKEND_DIR / "data" / "admin-smoke.db"
TABLES = (products, orders, order_items, settings)
SOURCE_COLUMNS = {
    "products": {"id", "name", "description", "price", "stock", "category", "pet_type", "age_group", "image_url", "emoji", "featured", "created_at", "updated_at"},
    "orders": {"id", "customer_name", "customer_email", "phone", "address", "district", "province", "postal_code", "total", "status", "created_at"},
    "order_items": {"id", "order_id", "product_id", "product_name", "quantity", "unit_price", "subtotal"},
    "settings": {"key", "value"},
}


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def read_source(source: Path) -> dict[str, list[dict[str, Any]]]:
    uri = f"file:{source.resolve().as_posix()}?mode=ro"
    with sqlite3.connect(uri, uri=True) as connection:
        connection.row_factory = sqlite3.Row
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        }
        for table_name, expected_columns in SOURCE_COLUMNS.items():
            if table_name not in tables:
                raise RuntimeError(f"source table is missing: {table_name}")
            actual_columns = {
                row[1] for row in connection.execute(f'PRAGMA table_info("{table_name}")')
            }
            if actual_columns != expected_columns:
                raise RuntimeError(f"source schema mismatch: {table_name}")
        if "users" in tables:
            raise RuntimeError("source users table is not allowed for this migration")

        result: dict[str, list[dict[str, Any]]] = {}
        for table_name in SOURCE_COLUMNS:
            rows = [dict(row) for row in connection.execute(f'SELECT * FROM "{table_name}"')]
            for row in rows:
                if table_name in {"products", "orders"}:
                    row["created_at"] = parse_timestamp(row["created_at"])
                if table_name == "orders":
                    row["user_id"] = None
                if table_name == "products":
                    row["updated_at"] = parse_timestamp(row["updated_at"])
                    row["price"] = Decimal(str(row["price"]))
                    row["featured"] = bool(row["featured"])
                if table_name == "orders":
                    row["total"] = Decimal(str(row["total"]))
                if table_name == "order_items":
                    row["unit_price"] = Decimal(str(row["unit_price"]))
                    row["subtotal"] = Decimal(str(row["subtotal"]))
            result[table_name] = rows
        return result


def canonical(rows: list[dict[str, Any]]) -> list[tuple[tuple[str, str], ...]]:
    def value(item: Any) -> str:
        if isinstance(item, datetime):
            return item.astimezone(timezone.utc).isoformat()
        if isinstance(item, Decimal):
            return format(item.normalize(), "f")
        return repr(item)

    return sorted(
        [tuple(sorted((key, value(item)) for key, item in row.items())) for row in rows]
    )


def target_matches_source(connection, source_rows: dict[str, list[dict[str, Any]]]) -> bool:
    if connection.execute(text("SELECT COUNT(*) FROM users")).scalar_one():
        return False
    return all(
        canonical([dict(row) for row in connection.execute(select(table)).mappings().all()])
        == canonical(source_rows[table.name])
        for table in TABLES
    )


def migrate(source: Path, settings: Settings) -> None:
    source_rows = read_source(source)
    engine = create_database_engine(settings)
    try:
        with engine.connect() as connection:
            identity = connection.execute(text("SELECT current_database(), current_user")).one()
            if identity != ("pal2paw", "prem"):
                raise RuntimeError("unexpected PostgreSQL identity")
            counts = {
                table.name: connection.execute(select(table.c.id if table.name != "settings" else table.c.key)).all()
                for table in TABLES
            }
            user_count = connection.execute(text("SELECT COUNT(*) FROM users")).scalar_one()
            has_data = user_count or any(counts[table.name] for table in TABLES)
            if has_data and not target_matches_source(connection, source_rows):
                raise RuntimeError("PostgreSQL contains unexpected data; migration aborted")
            if target_matches_source(connection, source_rows):
                print("MIGRATION=already_migrated")
                return

        with engine.begin() as connection:
            for table in TABLES:
                rows = source_rows[table.name]
                if rows:
                    connection.execute(table.insert(), rows)
            connection.execute(text("SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id) FROM products), true)"))
            connection.execute(text("SELECT setval(pg_get_serial_sequence('order_items', 'id'), (SELECT MAX(id) FROM order_items), true)"))
        print("MIGRATION=applied")
        print("PRODUCTS=" + str(len(source_rows["products"])))
        print("ORDERS=" + str(len(source_rows["orders"])))
        print("ORDER_ITEMS=" + str(len(source_rows["order_items"])))
        print("SETTINGS=" + str(len(source_rows["settings"])))
    finally:
        engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    if not args.source.is_file():
        raise SystemExit(f"source SQLite file not found: {args.source}")
    migrate(args.source, Settings())


if __name__ == "__main__":
    main()
