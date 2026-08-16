from fastapi import Request

from app.responses import error_response
from app.sessions import session_data


def require_admin(request: Request):
    if not session_data(request).get("admin_authenticated"):
        return error_response("Admin authentication required", 401)
    return None


def require_customer(request: Request):
    if not session_data(request).get("customer"):
        return error_response("Customer login required", 401)
    return None
