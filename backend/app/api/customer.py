from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_customer
from app.auth import hash_password, verify_password
from app.db import get_db
from app.models import order_items, orders, users
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data


router = APIRouter()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_email(value: object) -> str:
    return str(value or "").strip().casefold()


def safe_user(row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["full_name"],
        "status": row["status"],
    }


def valid_email(email: str) -> bool:
    return bool(email and "@" in email and " " not in email)


def valid_password(password: object) -> bool:
    return isinstance(password, str) and len(password) >= 8


async def silent_json(request: Request) -> dict:
    try:
        value = await request.json()
    except Exception:
        return {}
    return value if isinstance(value, dict) else {}


@router.post("/customer/register")
async def customer_register(request: Request, db: Session = Depends(get_db)):
    data = await silent_json(request)
    name = str(data.get("name") or data.get("fullName") or "").strip()
    email = normalize_email(data.get("email"))
    password = data.get("password")
    if not name or not valid_email(email) or not valid_password(password):
        return error_response("Name, valid email, and password of at least 8 characters are required", 400)
    if db.execute(select(users.c.id).where(users.c.email.ilike(email))).first():
        return error_response("Email is already registered", 409)
    db.rollback()

    now = utc_now()
    try:
        with db.begin():
            result = db.execute(
                users.insert().values(
                    email=email,
                    full_name=name,
                    password_hash=hash_password(password),
                    role="customer",
                    created_at=now,
                    updated_at=now,
                    status="active",
                )
            )
            user_id = result.inserted_primary_key[0]
    except IntegrityError:
        db.rollback()
        return error_response("Email is already registered", 409)

    user = db.execute(select(users).where(users.c.id == user_id)).mappings().one()
    session = session_data(request)
    session.pop("customer", None)
    session["customer_user_id"] = user_id
    return {"user": safe_user(user)}


@router.post("/customer/login")
async def customer_login(request: Request, db: Session = Depends(get_db)):
    data = await silent_json(request)
    password = data.get("password")
    email = normalize_email(data.get("email"))
    if password is None:
        # Preserve the existing demo session contract until the frontend is replaced.
        name = str(data.get("name", "")).strip()
        if not name or not valid_email(email):
            return error_response("Name and valid email are required", 400)
        session = session_data(request)
        session["customer"] = {"name": name, "email": email}
        return {"customer": {"name": name, "email": email}}

    user = db.execute(
        select(users).where(users.c.email.ilike(email), users.c.status == "active")
    ).mappings().first()
    if not valid_email(email) or not isinstance(password, str) or not user or not verify_password(user["password_hash"], password):
        return error_response("Invalid email or password", 401)
    session = session_data(request)
    session.pop("customer", None)
    session["customer_user_id"] = user["id"]
    return {"user": safe_user(user)}


@router.post("/customer/logout")
def customer_logout(request: Request):
    session = session_data(request)
    session.pop("customer", None)
    session.pop("customer_user_id", None)
    return Response(status_code=204)


@router.get("/customer/me")
def customer_me(request: Request, db: Session = Depends(get_db)):
    if not session_data(request).get("customer_user_id"):
        return error_response("Customer authentication required", 401)
    user = db.execute(
        select(users).where(users.c.id == session_data(request)["customer_user_id"], users.c.status == "active")
    ).mappings().first()
    if not user:
        session_data(request).pop("customer_user_id", None)
        return error_response("Customer authentication required", 401)
    return {"user": safe_user(user)}


@router.get("/customer/session")
def customer_session(request: Request, db: Session = Depends(get_db)):
    user_id = session_data(request).get("customer_user_id")
    if user_id:
        user = db.execute(select(users).where(users.c.id == user_id)).mappings().first()
        return {"customer": safe_user(user)} if user else {"customer": None}
    return {"customer": session_data(request).get("customer")}


@router.get("/customer/orders")
def customer_orders(request: Request, db: Session = Depends(get_db)):
    if denied := require_customer(request, db):
        return denied
    session = session_data(request)
    user_id = session.get("customer_user_id")
    if user_id:
        user = db.execute(select(users).where(users.c.id == user_id)).mappings().first()
        if not user:
            return error_response("Customer login required", 401)
        email = user["email"]
        predicate = or_(orders.c.user_id == user_id, orders.c.customer_email.ilike(email))
    else:
        email = session["customer"]["email"]
        predicate = orders.c.customer_email.ilike(email)
    order_rows = db.execute(select(orders).where(predicate).order_by(orders.c.created_at.desc())).mappings().all()
    return [
        order_json(
            order,
            db.execute(select(order_items).where(order_items.c.order_id == order["id"])).mappings().all(),
        )
        for order in order_rows
    ]
