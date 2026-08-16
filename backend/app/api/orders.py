import sqlite3
import time
import uuid
from collections import OrderedDict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.api.customer import silent_json
from app.api.dependencies import require_customer
from app.db import get_db
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/orders")
async def create_order(request: Request, db: sqlite3.Connection = Depends(get_db)):
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
        db.execute("BEGIN IMMEDIATE")
        quantities: OrderedDict[int, int] = OrderedDict()
        for item in cart:
            product_id = int(item.get("productId"))
            quantity = int(item.get("quantity"))
            if quantity <= 0:
                raise ValueError("Invalid quantity")
            quantities[product_id] = quantities.get(product_id, 0) + quantity
        validated = []
        for product_id, quantity in quantities.items():
            product = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
            if not product or product["stock"] < quantity:
                name = product["name"] if product else "a product"
                raise ValueError(f"Not enough stock for {name}")
            validated.append((product, quantity))
        order_id = f"PAP-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6].upper()}"
        total = sum(product["price"] * quantity for product, quantity in validated)
        created_at = utc_now()
        db.execute(
            """INSERT INTO orders
               (id,customer_name,customer_email,phone,address,district,province,postal_code,total,status,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,'New',?)""",
            (
                order_id, shipping["fullName"], shipping["email"], shipping["phone"],
                shipping["address"], shipping["district"], shipping["province"],
                shipping["postalCode"], total, created_at,
            ),
        )
        for product, quantity in validated:
            subtotal = product["price"] * quantity
            db.execute(
                """INSERT INTO order_items
                   (order_id,product_id,product_name,quantity,unit_price,subtotal)
                   VALUES (?,?,?,?,?,?)""",
                (order_id, product["id"], product["name"], quantity, product["price"], subtotal),
            )
            db.execute(
                "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?",
                (quantity, created_at, product["id"]),
            )
        db.commit()
    except (ValueError, TypeError, KeyError) as error:
        db.rollback()
        return error_response(str(error), 409)
    order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    items = db.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,)).fetchall()
    return JSONResponse(order_json(order, items), status_code=201)
