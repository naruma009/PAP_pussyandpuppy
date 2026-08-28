from datetime import datetime, timezone
from decimal import Decimal
import os
from uuid import uuid4

import pytest
from sqlalchemy import delete, select, update

from app.config import get_settings
from app.models import order_items, orders, products
from app.postgres import create_database_engine, create_session_factory


@pytest.mark.skipif(
    os.environ.get("RUN_POSTGRES_INTEGRATION") != "1",
    reason="PostgreSQL integration tests require explicit opt-in",
)
def test_postgres_core_smoke_and_cleanup():
    settings = get_settings()
    if not settings.database_url:
        pytest.skip("DATABASE_URL is not configured")

    engine = create_database_engine(settings)
    factory = create_session_factory(engine)
    product_name = f"M2D smoke {uuid4()}"
    customer_email = f"m2d-{uuid4()}@example.invalid"
    order_id = f"m2d-{uuid4()}"
    failed_order_id = f"m2d-failed-{uuid4()}"
    product_id = None

    try:
        with factory() as session:
            identity = session.connection().exec_driver_sql(
                "SELECT current_database(), current_user"
            ).one()
            assert all(isinstance(value, str) and value for value in identity)

        now = datetime.now(timezone.utc)
        with factory.begin() as session:
            product_id = session.execute(
                products.insert()
                .values(
                    name=product_name,
                    description="M2D temporary smoke product",
                    price=Decimal("19.90"),
                    stock=3,
                    category="smoke",
                    pet_type="both",
                    age_group="all",
                    image_url="",
                    emoji="*",
                    featured=False,
                    created_at=now,
                    updated_at=now,
                )
                .returning(products.c.id)
            ).scalar_one()

        with factory() as session:
            created = session.execute(
                select(products).where(products.c.id == product_id)
            ).mappings().one()
            assert created["name"] == product_name
            assert created["stock"] == 3

        with factory.begin() as session:
            session.execute(
                update(products)
                .where(products.c.id == product_id)
                .values(price=Decimal("21.90"), updated_at=now)
            )
            session.execute(
                products.update()
                .where(products.c.id == product_id)
                .values(stock=products.c.stock - 1)
            )
            session.execute(
                orders.insert().values(
                    id=order_id,
                    customer_name="M2D Smoke",
                    customer_email=customer_email,
                    phone="0000000000",
                    address="Temporary test address",
                    district="Test",
                    province="Test",
                    postal_code="00000",
                    total=Decimal("21.90"),
                    created_at=now,
                )
            )
            session.execute(
                order_items.insert().values(
                    order_id=order_id,
                    product_id=product_id,
                    product_name=product_name,
                    quantity=1,
                    unit_price=Decimal("21.90"),
                    subtotal=Decimal("21.90"),
                )
            )

        with pytest.raises(RuntimeError):
            with factory.begin() as session:
                session.execute(
                    orders.insert().values(
                        id=failed_order_id,
                        customer_name="M2D Failed",
                        customer_email=customer_email,
                        phone="0000000000",
                        address="Temporary test address",
                        district="Test",
                        province="Test",
                        postal_code="00000",
                        total=Decimal("21.90"),
                        created_at=now,
                    )
                )
                session.execute(
                    products.update()
                    .where(products.c.id == product_id)
                    .values(stock=products.c.stock - 1)
                )
                raise RuntimeError("intentional rollback")

        with factory() as session:
            current_stock = session.execute(
                select(products.c.stock).where(products.c.id == product_id)
            ).scalar_one()
            customer_orders = session.execute(
                select(orders.c.id).where(orders.c.customer_email == customer_email)
            ).scalars().all()
            admin_orders = session.execute(select(orders.c.id)).scalars().all()
            assert current_stock == 2
            assert customer_orders == [order_id]
            assert order_id in admin_orders
            assert failed_order_id not in admin_orders

        with factory.begin() as session:
            session.execute(delete(order_items).where(order_items.c.order_id == order_id))
            session.execute(delete(orders).where(orders.c.id == order_id))
            session.execute(delete(products).where(products.c.id == product_id))

        with factory() as session:
            assert session.execute(
                select(products.c.id).where(products.c.id == product_id)
            ).first() is None
    finally:
        with factory.begin() as session:
            session.execute(delete(order_items).where(order_items.c.order_id == order_id))
            session.execute(delete(order_items).where(order_items.c.order_id == failed_order_id))
            session.execute(delete(orders).where(orders.c.id.in_([order_id, failed_order_id])))
            if product_id is not None:
                session.execute(delete(products).where(products.c.id == product_id))
        engine.dispose()
