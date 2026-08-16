import hmac
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response

from app.api.customer import silent_json
from app.api.dependencies import require_admin
from app.db import get_db
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
def admin_orders(request: Request, db: sqlite3.Connection = Depends(get_db)):
    if denied := require_admin(request):
        return denied
    orders = db.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    return [
        order_json(
            order,
            db.execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],)).fetchall(),
        )
        for order in orders
    ]


@router.post("/admin/migrate")
async def migrate_legacy(request: Request, db: sqlite3.Connection = Depends(get_db)):
    if denied := require_admin(request):
        return denied
    if request.app.state.settings.is_production:
        return error_response("Legacy migration is disabled in production", 403)
    if db.execute("SELECT value FROM settings WHERE key = 'legacy_migrated'").fetchone():
        return {"migrated": False, "reason": "already_migrated"}
    products = (await silent_json(request)).get("products") or []
    now = utc_now()
    migrated = 0
    for product in products:
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
        if product_id:
            db.execute(
                """INSERT INTO products
                   (id,name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                   name=excluded.name,description=excluded.description,price=excluded.price,
                   stock=excluded.stock,category=excluded.category,pet_type=excluded.pet_type,
                   age_group=excluded.age_group,image_url=excluded.image_url,emoji=excluded.emoji,
                   featured=excluded.featured,updated_at=excluded.updated_at""",
                (product_id, *values),
            )
        else:
            db.execute(
                """INSERT INTO products
                   (name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                values,
            )
        migrated += 1
    db.execute("INSERT INTO settings (key,value) VALUES ('legacy_migrated',?)", (now,))
    db.commit()
    return {"migrated": True, "count": migrated}
