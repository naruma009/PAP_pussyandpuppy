from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_customer
from app.auth import hash_password, verify_password
from app.db import get_db
from app.models import order_items, orders, users
from app.payments import (
    CheckoutLineItem,
    CheckoutRequest,
    PaymentConfigurationError,
    PaymentProviderError,
    verify_stripe_webhook,
)
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data


router = APIRouter()


def payment_url(base_url: str, order_id: str) -> str:
    parsed = urlsplit(base_url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["order_id"] = order_id
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


def session_value(session, key: str):
    return session.get(key) if isinstance(session, dict) else getattr(session, key, None)


def payment_session_data(event):
    data = event.get("data", {}) if isinstance(event, dict) else getattr(event, "data", {})
    return data.get("object", {}) if isinstance(data, dict) else getattr(data, "object", {})


def event_type(event):
    return event.get("type") if isinstance(event, dict) else getattr(event, "type", None)


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
        # Real customer sessions are scoped to the immutable user identity.  Do
        # not widen this to an email match: email is an order snapshot, not an
        # authorization key.
        predicate = orders.c.user_id == user_id
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


@router.get("/customer/orders/{order_id}")
def customer_order_detail(order_id: str, request: Request, db: Session = Depends(get_db)):
    if denied := require_customer(request, db):
        return denied
    session = session_data(request)
    user_id = session.get("customer_user_id")
    if user_id:
        predicate = (orders.c.id == order_id) & (orders.c.user_id == user_id)
    else:
        predicate = (orders.c.id == order_id) & orders.c.customer_email.ilike(session["customer"]["email"])
    order = db.execute(select(orders).where(predicate)).mappings().first()
    if not order:
        return error_response("Order not found", 404)
    items = db.execute(select(order_items).where(order_items.c.order_id == order_id)).mappings().all()
    return order_json(order, items)


@router.post("/customer/orders/{order_id}/checkout-session")
def create_checkout_session(order_id: str, request: Request, db: Session = Depends(get_db)):
    if denied := require_customer(request, db):
        return denied
    session = session_data(request)
    user_id = session.get("customer_user_id")
    if user_id:
        predicate = (orders.c.id == order_id) & (orders.c.user_id == user_id)
    else:
        predicate = (orders.c.id == order_id) & orders.c.customer_email.ilike(session["customer"]["email"])
    order = db.execute(select(orders).where(predicate).with_for_update()).mappings().first()
    if not order:
        return error_response("Order not found", 404)
    if order["payment_status"] == "paid":
        return error_response("Order is already paid", 409)
    if order["payment_status"] == "pending" and order["checkout_session_id"]:
        return error_response("Payment is already in progress", 409)
    settings = request.app.state.settings
    if not settings.stripe_success_url or not settings.stripe_cancel_url:
        return error_response("Payment is not configured", 503)
    items = db.execute(select(order_items).where(order_items.c.order_id == order_id)).mappings().all()
    line_items = tuple(
        CheckoutLineItem(
            name=item["product_name"],
            unit_amount=int(Decimal(str(item["unit_price"])) * 100),
            quantity=item["quantity"],
        )
        for item in items
    )
    calculated_total = sum(Decimal(str(item["unit_price"])) * item["quantity"] for item in items)
    if calculated_total != Decimal(str(order["total"])):
        return error_response("Order total is invalid", 409)
    checkout_request = CheckoutRequest(
        order_id=order_id,
        amount=calculated_total,
        currency=order["currency"],
        line_items=line_items,
        success_url=payment_url(settings.stripe_success_url, order_id),
        cancel_url=payment_url(settings.stripe_cancel_url, order_id),
    )
    try:
        checkout = request.app.state.payment_provider.create_checkout_session(checkout_request)
    except (PaymentConfigurationError, PaymentProviderError):
        db.rollback()
        return error_response("Payment provider is unavailable", 503)
    try:
        db.execute(
            orders.update()
            .where(orders.c.id == order_id, orders.c.payment_status.in_(("unpaid", "failed")))
            .values(payment_status="pending", payment_provider="stripe", checkout_session_id=checkout.id)
        )
        db.commit()
    except Exception:
        db.rollback()
        return error_response("Payment could not be started", 503)
    return {"checkoutUrl": checkout.url, "sessionId": checkout.id}


@router.post("/payments/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    try:
        event = verify_stripe_webhook(
            payload,
            request.headers.get("stripe-signature"),
            request.app.state.settings.stripe_webhook_secret,
        )
    except PaymentConfigurationError:
        return error_response("Payment webhook is not configured", 503)
    except PaymentProviderError:
        return error_response("Invalid payment webhook", 400)
    kind = event_type(event)
    if kind not in {"checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"}:
        return {"received": True}
    stripe_session = payment_session_data(event)
    metadata = session_value(stripe_session, "metadata") or {}
    order_id = metadata.get("order_id")
    provider_id = session_value(stripe_session, "id")
    order = db.execute(select(orders).where(orders.c.id == order_id)).mappings().first() if order_id else None
    if not order or not provider_id or order["checkout_session_id"] != provider_id:
        return error_response("Invalid payment webhook", 400)
    if order["payment_status"] == "paid":
        return {"received": True}
    expected_currency = str(order["currency"]).lower()
    actual_currency = str(session_value(stripe_session, "currency") or "").lower()
    expected_amount = int(Decimal(str(order["total"])) * 100)
    if actual_currency != expected_currency or session_value(stripe_session, "amount_total") != expected_amount:
        return error_response("Invalid payment webhook", 400)
    if kind == "checkout.session.async_payment_failed":
        db.execute(orders.update().where(orders.c.id == order_id).values(payment_status="failed"))
    elif kind == "checkout.session.async_payment_succeeded" or session_value(stripe_session, "payment_status") == "paid":
        db.execute(orders.update().where(orders.c.id == order_id).values(payment_status="paid", paid_at=utc_now()))
    db.commit()
    return {"received": True}
