from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "pap-fastapi"}


@router.get("/ready")
def readiness(request: Request):
    try:
        with request.app.state.db_session_factory() as db:
            db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse({"status": "not_ready", "service": "pap-fastapi"}, status_code=503)
    return {"status": "ready", "service": "pap-fastapi"}
