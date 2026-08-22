import time
import uuid
from collections import OrderedDict
from contextlib import nullcontext
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from app.api.customer import silent_json
from app.api.dependencies import require_customer
from app.db import get_db
from app.models import order_items, orders, products
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/orders")
async def create_order(request: Request, db: Session = Depends(get_db)):
    if denied := require_customer(request):
        return denied
    data = await silent_json(request)
    shipping = data.get("shipping") or {}
    cart = data.get("items") or []
    required = ("fullName", "phone", "email", "address", "district", "province", "postalCode")
    if not isinstance(shipping, dict) or not isinstance(cart, list) or not cart or any(
        not str(shipping.get(field, "")).strip() for field in required
    ):
        return error_response("Cart and complete shipping address are required", 400)
    customer = session_data(request)["customer"]
    if str(shipping["email"]).strip().lower() != str(customer["email"]).lower():
        return error_response("Shipping email must match the logged-in customer", 400)
    try:
        if db.bind.dialect.name == "sqlite":
            db.rollback()
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")
            transaction = nullcontext()
        else:
            transaction = db.begin()
        with transaction:
            quantities: OrderedDict[int, int] = OrderedDict()
            for item in cart:
                product_id = int(item.get("productId"))
                quantity = int(item.get("quantity"))
                if quantity <= 0:
                    raise ValueError("Invalid quantity")
                quantities[product_id] = quantities.get(product_id, 0) + quantity
            validated = []
            for product_id, quantity in quantities.items():
                product = db.execute(
                    select(products).where(products.c.id == product_id).with_for_update()
                ).mappings().first()
                if not product or product["stock"] < quantity:
                    name = product["name"] if product else "a product"
                    raise ValueError(f"Not enough stock for {name}")
                validated.append((product, quantity))
            order_id = f"PAP-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6].upper()}"
            total = sum(product["price"] * quantity for product, quantity in validated)
            created_at = utc_now()
            db.execute(insert(orders).values(
                id=order_id, customer_name=shipping["fullName"], customer_email=shipping["email"],
                phone=shipping["phone"], address=shipping["address"], district=shipping["district"],
                province=shipping["province"], postal_code=shipping["postalCode"], total=total,
                status="New", created_at=created_at,
            ))
            for product, quantity in validated:
                subtotal = product["price"] * quantity
                db.execute(insert(order_items).values(
                    order_id=order_id, product_id=product["id"], product_name=product["name"],
                    quantity=quantity, unit_price=product["price"], subtotal=subtotal,
                ))
                result = db.execute(
                    update(products)
                    .where(products.c.id == product["id"], products.c.stock >= quantity)
                    .values(stock=products.c.stock - quantity, updated_at=created_at)
                )
                if result.rowcount != 1:
                    raise ValueError(f"Not enough stock for {product['name']}")
        if db.bind.dialect.name == "sqlite":
            db.commit()
    except (ValueError, TypeError, KeyError) as error:
        db.rollback()
        return error_response(str(error), 409)
    order = db.execute(select(orders).where(orders.c.id == order_id)).mappings().one()
    items = db.execute(select(order_items).where(order_items.c.order_id == order_id)).mappings().all()
    return JSONResponse(order_json(order, items), status_code=201)
