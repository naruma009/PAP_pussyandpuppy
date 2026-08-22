from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_customer
from app.db import get_db
from app.models import order_items, orders
from app.responses import error_response
from app.serializers import order_json
from app.sessions import session_data

router = APIRouter()


async def silent_json(request: Request) -> dict:
    try:
        value = await request.json()
    except Exception:
        return {}
    return value if isinstance(value, dict) else {}


@router.post("/customer/login")
async def customer_login(request: Request):
    data = await silent_json(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    if not name or "@" not in email:
        return error_response("Name and valid email are required", 400)
    customer = {"name": name, "email": email}
    session_data(request)["customer"] = customer
    return {"customer": customer}


@router.post("/customer/logout")
def customer_logout(request: Request):
    session_data(request).pop("customer", None)
    return Response(status_code=204)


@router.get("/customer/session")
def customer_session(request: Request):
    return {"customer": session_data(request).get("customer")}


@router.get("/customer/orders")
def customer_orders(request: Request, db: Session = Depends(get_db)):
    if denied := require_customer(request):
        return denied
    email = session_data(request)["customer"]["email"]
    order_rows = db.execute(
        select(orders).where(orders.c.customer_email.ilike(email)).order_by(orders.c.created_at.desc())
    ).mappings().all()
    return [
        order_json(
            order,
            db.execute(select(order_items).where(order_items.c.order_id == order["id"])).mappings().all(),
        )
        for order in order_rows
    ]
