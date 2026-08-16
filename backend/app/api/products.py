import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from starlette.datastructures import UploadFile

from app.api.dependencies import require_admin
from app.db import get_db
from app.responses import error_response
from app.serializers import product_json
from app.uploads import delete_upload, save_upload

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def product_payload(request: Request, existing: sqlite3.Row | None = None) -> tuple[dict, str]:
    form = await request.form()
    required = ("name", "description", "price", "stock", "category", "petType")
    if any(form.get(field) in (None, "") for field in required):
        raise ValueError("Missing required product fields")
    pet_type = str(form["petType"])
    if pet_type not in {"cat", "dog", "both"}:
        raise ValueError("Invalid pet type")
    age_group = str(form.get("ageGroup") or (existing["age_group"] if existing else "all"))
    if age_group not in {"all", "young", "adult", "senior"}:
        raise ValueError("Invalid age group")
    price = float(str(form["price"]))
    stock = int(str(form["stock"]))
    if price < 0 or stock < 0:
        raise ValueError("Price and stock cannot be negative")
    old_url = existing["image_url"] if existing else ""
    upload = form.get("image")
    new_url = await save_upload(upload if isinstance(upload, UploadFile) else None, request.app.state.settings.upload_dir)
    return {
        "name": str(form["name"]).strip(),
        "description": str(form["description"]).strip(),
        "price": price,
        "stock": stock,
        "category": str(form["category"]).strip(),
        "pet_type": pet_type,
        "age_group": age_group,
        "image_url": new_url or old_url,
        "emoji": str(form.get("emoji", "🐾")),
        "featured": 1 if form.get("featured") in {"true", "on", "1"} else 0,
    }, new_url


@router.get("/products")
def list_products(db: sqlite3.Connection = Depends(get_db)):
    return [product_json(row) for row in db.execute("SELECT * FROM products ORDER BY id").fetchall()]


@router.get("/products/{product_id}")
def get_product(product_id: str, db: sqlite3.Connection = Depends(get_db)):
    try:
        parsed_id = int(product_id)
    except ValueError:
        return error_response("Not Found", 404)
    row = db.execute("SELECT * FROM products WHERE id = ?", (parsed_id,)).fetchone()
    return product_json(row) if row else error_response("Product not found", 404)


@router.post("/products")
async def create_product(request: Request, db: sqlite3.Connection = Depends(get_db)):
    if denied := require_admin(request):
        return denied
    new_url = ""
    try:
        data, new_url = await product_payload(request)
        now = utc_now()
        cursor = db.execute(
            """INSERT INTO products
               (name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at)
               VALUES (:name,:description,:price,:stock,:category,:pet_type,:age_group,:image_url,:emoji,:featured,:created_at,:updated_at)""",
            {**data, "created_at": now, "updated_at": now},
        )
        db.commit()
    except (ValueError, TypeError) as error:
        delete_upload(new_url, request.app.state.settings.upload_dir)
        db.rollback()
        return error_response(str(error), 400)
    row = db.execute("SELECT * FROM products WHERE id = ?", (cursor.lastrowid,)).fetchone()
    from fastapi.responses import JSONResponse
    return JSONResponse(product_json(row), status_code=201)


@router.put("/products/{product_id}")
async def update_product(product_id: str, request: Request, db: sqlite3.Connection = Depends(get_db)):
    if denied := require_admin(request):
        return denied
    try:
        parsed_id = int(product_id)
    except ValueError:
        return error_response("Not Found", 404)
    existing = db.execute("SELECT * FROM products WHERE id = ?", (parsed_id,)).fetchone()
    if not existing:
        return error_response("Product not found", 404)
    new_url = ""
    try:
        data, new_url = await product_payload(request, existing)
        db.execute(
            """UPDATE products SET name=:name,description=:description,price=:price,stock=:stock,
               category=:category,pet_type=:pet_type,age_group=:age_group,image_url=:image_url,
               emoji=:emoji,featured=:featured,updated_at=:updated_at WHERE id=:id""",
            {**data, "updated_at": utc_now(), "id": parsed_id},
        )
        db.commit()
    except (ValueError, TypeError) as error:
        delete_upload(new_url, request.app.state.settings.upload_dir)
        db.rollback()
        return error_response(str(error), 400)
    if new_url:
        delete_upload(existing["image_url"], request.app.state.settings.upload_dir)
    row = db.execute("SELECT * FROM products WHERE id = ?", (parsed_id,)).fetchone()
    return product_json(row)


@router.delete("/products/{product_id}")
def delete_product(product_id: str, request: Request, db: sqlite3.Connection = Depends(get_db)):
    if denied := require_admin(request):
        return denied
    try:
        parsed_id = int(product_id)
    except ValueError:
        return error_response("Not Found", 404)
    row = db.execute("SELECT * FROM products WHERE id = ?", (parsed_id,)).fetchone()
    if not row:
        return error_response("Product not found", 404)
    db.execute("DELETE FROM products WHERE id = ?", (parsed_id,))
    db.commit()
    delete_upload(row["image_url"], request.app.state.settings.upload_dir)
    return Response(status_code=204)
