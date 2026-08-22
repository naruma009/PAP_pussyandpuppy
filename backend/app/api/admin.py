import hmac
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from app.api.customer import silent_json
from app.api.dependencies import require_admin
from app.db import get_db
from app.models import order_items, orders, products, settings
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data
from app.uploads import decode_legacy_image

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/admin/login")
async def admin_login(request: Request):
    supplied = str((await silent_json(request)).get("code", ""))
    if not hmac.compare_digest(supplied, request.app.state.settings.admin_password):
        return error_response("Invalid code", 401)
    session_data(request)["admin_authenticated"] = True
    return {"authenticated": True}


@router.post("/admin/logout")
def admin_logout(request: Request):
    session_data(request).pop("admin_authenticated", None)
    return Response(status_code=204)


@router.get("/admin/session")
def admin_session(request: Request):
    return {"authenticated": bool(session_data(request).get("admin_authenticated"))}


@router.get("/admin/orders")
def admin_orders(request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request):
        return denied
    order_rows = db.execute(select(orders).order_by(orders.c.created_at.desc())).mappings().all()
    return [
        order_json(
            order,
            db.execute(select(order_items).where(order_items.c.order_id == order["id"])).mappings().all(),
        )
        for order in order_rows
    ]


@router.post("/admin/migrate")
async def migrate_legacy(request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request):
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
