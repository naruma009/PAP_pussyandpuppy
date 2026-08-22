from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import users
from app.responses import error_response
from app.sessions import session_data


def authenticated_user(request: Request, db: Session):
    user_id = session_data(request).get("customer_user_id")
    if not user_id:
        return None
    return db.execute(
        select(users).where(users.c.id == user_id, users.c.status == "active")
    ).mappings().first()


def require_admin(request: Request, db: Session):
    user = authenticated_user(request, db)
    if user and user["role"] == "admin":
        return None
    if not user:
        return error_response("Admin authentication required", 401)
    return error_response("Admin authorization required", 403)


def require_customer(request: Request, db: Session):
    if authenticated_user(request, db) or session_data(request).get("customer"):
        return None
    return error_response("Customer login required", 401)


def require_authenticated_user(request: Request, db: Session):
    if authenticated_user(request, db):
        return None
    return error_response("Customer authentication required", 401)
