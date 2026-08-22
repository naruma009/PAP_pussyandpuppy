from fastapi import Request

from app.responses import error_response
from app.sessions import session_data


def require_admin(request: Request):
    if not session_data(request).get("admin_authenticated"):
        return error_response("Admin authentication required", 401)
    return None


def require_customer(request: Request):
    session = session_data(request)
    if not session.get("customer_user_id") and not session.get("customer"):
        return error_response("Customer login required", 401)
    return None
