from collections.abc import Mapping
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from starlette.datastructures import UploadFile
from sqlalchemy import delete, insert, select, update
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db import get_db
from app.models import products
from app.responses import error_response
from app.serializers import product_json
from app.uploads import delete_upload, save_upload

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def product_payload(request: Request, existing: Mapping | None = None) -> tuple[dict, str]:
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
    new_url = await save_upload(upload if isinstance(upload, UploadFile) else None, request.app.state.settings)
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
def list_products(db: Session = Depends(get_db)):
    rows = db.execute(select(products).order_by(products.c.id)).mappings().all()
    return [product_json(row) for row in rows]


@router.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    try:
        parsed_id = int(product_id)
    except ValueError:
        return error_response("Not Found", 404)
    row = db.execute(select(products).where(products.c.id == parsed_id)).mappings().first()
    return product_json(row) if row else error_response("Product not found", 404)


@router.post("/products")
async def create_product(request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request, db):
        return denied
    db.rollback()
    new_url = ""
    try:
        data, new_url = await product_payload(request)
        now = utc_now()
        with db.begin():
            result = db.execute(insert(products).values(**data, created_at=now, updated_at=now))
            product_id = result.inserted_primary_key[0]
    except (ValueError, TypeError) as error:
        delete_upload(new_url, request.app.state.settings)
        return error_response(str(error), 400)
    row = db.execute(select(products).where(products.c.id == product_id)).mappings().one()
    from fastapi.responses import JSONResponse
    return JSONResponse(product_json(row), status_code=201)


@router.put("/products/{product_id}")
async def update_product(product_id: str, request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request, db):
        return denied
    try:
        parsed_id = int(product_id)
    except ValueError:
        return error_response("Not Found", 404)
    existing = db.execute(select(products).where(products.c.id == parsed_id)).mappings().first()
    if not existing:
        return error_response("Product not found", 404)
    db.rollback()
    new_url = ""
    try:
        data, new_url = await product_payload(request, existing)
        with db.begin():
            db.execute(update(products).where(products.c.id == parsed_id).values(**data, updated_at=utc_now()))
    except (ValueError, TypeError) as error:
        delete_upload(new_url, request.app.state.settings)
        return error_response(str(error), 400)
    if new_url:
        delete_upload(existing["image_url"], request.app.state.settings)
    row = db.execute(select(products).where(products.c.id == parsed_id)).mappings().one()
    return product_json(row)


@router.delete("/products/{product_id}")
def delete_product(product_id: str, request: Request, db: Session = Depends(get_db)):
    if denied := require_admin(request, db):
        return denied
    try:
        parsed_id = int(product_id)
    except ValueError:
        return error_response("Not Found", 404)
    row = db.execute(select(products).where(products.c.id == parsed_id)).mappings().first()
    if not row:
        return error_response("Product not found", 404)
    db.rollback()
    with db.begin():
        db.execute(delete(products).where(products.c.id == parsed_id))
    delete_upload(row["image_url"], request.app.state.settings)
    return Response(status_code=204)
