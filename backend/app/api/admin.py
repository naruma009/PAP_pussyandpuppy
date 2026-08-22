from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from app.api.customer import silent_json
from app.api.dependencies import authenticated_user, require_admin
from app.auth import verify_password
from app.db import get_db
from app.models import order_items, orders, products, settings, users
from app.order_status import ORDER_STATUSES, can_transition
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data
from app.uploads import decode_legacy_image

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/admin/login")
async def admin_login(request: Request, db: Session = Depends(get_db)):
    data = await silent_json(request)
    password = data.get("password")
    email = str(data.get("email") or "").strip().casefold()
    user = db.execute(
        select(users).where(
            users.c.email.ilike(email),
            users.c.status == "active",
            users.c.role == "admin",
        )
    ).mappings().first()
    if not email or not isinstance(password, str) or not user or not verify_password(user["password_hash"], password):
        return error_response("Invalid email or password", 401)
    session = session_data(request)
    session.pop("customer", None)
    session["customer_user_id"] = user["id"]
    return {"authenticated": True}


@router.post("/admin/logout")
def admin_logout(request: Request):
    session = session_data(request)
    session.pop("customer_user_id", None)
    return Response(status_code=204)


@router.get("/admin/session")
def admin_session(request: Request, db: Session = Depends(get_db)):
    user = authenticated_user(request, db)
    return {"authenticated": bool(user and user["role"] == "admin")}


@router.get("/admin/orders")
def admin_orders(request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request, db):
        return denied
    order_rows = db.execute(select(orders).order_by(orders.c.created_at.desc())).mappings().all()
    return [
        order_json(
            order,
            db.execute(select(order_items).where(order_items.c.order_id == order["id"])).mappings().all(),
        )
        for order in order_rows
    ]


@router.patch("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request, db):
        return denied
    data = await silent_json(request)
    if set(data) != {"status"} or data.get("status") not in ORDER_STATUSES:
        return error_response("Invalid order status", 400)
    requested_status = data["status"]
    db.rollback()
    try:
        with db.begin():
            order = db.execute(
                select(orders).where(orders.c.id == order_id).with_for_update()
            ).mappings().first()
            if not order:
                raise LookupError("Order not found")
            current_status = order["status"]
            if not can_transition(current_status, requested_status):
                raise RuntimeError("Invalid order status transition")
            if current_status == requested_status:
                pass
            elif requested_status == "cancelled":
                items = db.execute(
                    select(order_items).where(order_items.c.order_id == order_id).with_for_update()
                ).mappings().all()
                now = utc_now()
                for item in items:
                    if item["product_id"] is None:
                        raise RuntimeError("Cannot restore stock for cancelled order")
                    product = db.execute(
                        select(products).where(products.c.id == item["product_id"]).with_for_update()
                    ).mappings().first()
                    if not product:
                        raise RuntimeError("Cannot restore stock for cancelled order")
                    db.execute(
                        update(products)
                        .where(products.c.id == item["product_id"])
                        .values(stock=products.c.stock + item["quantity"], updated_at=now)
                    )
                db.execute(
                    update(orders).where(orders.c.id == order_id).values(status=requested_status)
                )
            else:
                db.execute(
                    update(orders).where(orders.c.id == order_id).values(status=requested_status)
                )
    except LookupError as error:
        db.rollback()
        return error_response(str(error), 404)
    except RuntimeError as error:
        db.rollback()
        return error_response(str(error), 409)
    updated = db.execute(select(orders).where(orders.c.id == order_id)).mappings().one()
    items = db.execute(select(order_items).where(order_items.c.order_id == order_id)).mappings().all()
    return order_json(updated, items)


@router.post("/admin/migrate")
async def migrate_legacy(request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request, db):
        return denied
    if request.app.state.settings.is_production:
        return error_response("Legacy migration is disabled in production", 403)
    if db.execute(select(settings.c.value).where(settings.c.key == "legacy_migrated")).first():
        return {"migrated": False, "reason": "already_migrated"}
    products_payload = (await silent_json(request)).get("products") or []
    now = utc_now()
    migrated = 0
    for product in products_payload:
        if not product.get("name"):
            continue
        age = product.get("age") if product.get("age") in {"all", "young", "adult", "senior"} else "all"
        image_url = decode_legacy_image(product.get("image", ""), request.app.state.settings.upload_dir)
        product_id = int(product.get("id") or 0) or None
        values = (
            product["name"], product.get("description", ""), max(0, float(product.get("price", 0))),
            max(0, int(product.get("stock", 0))), product.get("category") or "Other",
            product.get("petType") if product.get("petType") in {"cat", "dog", "both"} else "both",
            age, image_url, product.get("emoji", "🐾"), 1 if product.get("featured") else 0, now, now,
        )
        values = dict(zip(
            ("name", "description", "price", "stock", "category", "pet_type", "age_group",
             "image_url", "emoji", "featured", "created_at", "updated_at"),
            values,
        ))
        if product_id and db.execute(select(products.c.id).where(products.c.id == product_id)).first():
            db.execute(update(products).where(products.c.id == product_id).values(**values))
        elif product_id:
            db.execute(insert(products).values(id=product_id, **values))
        else:
            db.execute(insert(products).values(**values))
        migrated += 1
    db.execute(insert(settings).values(key="legacy_migrated", value=now))
    db.commit()
    return {"migrated": True, "count": migrated}
