from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from app.api.admin import router as admin_router
from app.api.customer import router as customer_router
from app.api.health import router as health_router
from app.api.orders import router as orders_router
from app.api.products import router as products_router
from app.config import Settings, get_settings
from app.db import initialize_database
from app.postgres import create_database_engine, create_session_factory
from app.payments import StripeCheckoutProvider
from app.sessions import FlaskSessionMiddleware


def create_app(
    settings: Settings | None = None,
    initialize: bool = False,
    initialize_on_startup: bool = False,
) -> FastAPI:
    selected = settings or get_settings()
    project_root = Path(__file__).resolve().parents[2]
    selected.validate_runtime(project_root)
    selected.upload_dir = selected.upload_dir.expanduser().resolve()
    if selected.upload_dir.exists() and not selected.upload_dir.is_dir():
        raise RuntimeError("PAP_API_UPLOAD_DIR must be a directory")
    engine = create_database_engine(selected)
    if initialize:
        selected.upload_dir.mkdir(parents=True, exist_ok=True)
        initialize_database(selected, engine)

    @asynccontextmanager
    async def lifespan(_application: FastAPI):
        if initialize_on_startup:
            selected.upload_dir.mkdir(parents=True, exist_ok=True)
            if not selected.database_url:
                initialize_database(selected, engine)
        yield
        engine.dispose()

    application = FastAPI(title="PAP API", version="0.2.0", lifespan=lifespan)
    application.state.settings = selected
    application.state.db_engine = engine
    application.state.db_session_factory = create_session_factory(engine)
    application.state.payment_provider = StripeCheckoutProvider(selected.stripe_secret_key)
    application.add_middleware(
        FlaskSessionMiddleware,
        secret_key=selected.secret_key,
        secure=selected.is_production,
        samesite=selected.cookie_samesite,
        domain=selected.cookie_domain,
    )
    if selected.allowed_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(selected.allowed_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "Stripe-Signature"],
        )

    @application.middleware("http")
    async def legacy_headers_and_size(request: Request, call_next):
        if (
            request.method in {"POST", "PUT", "PATCH", "DELETE"}
            and request.url.path.startswith("/api/")
            and request.url.path != "/api/payments/stripe/webhook"
        ):
            origin = request.headers.get("origin")
            if origin and origin.rstrip("/") not in selected.allowed_origins:
                return JSONResponse({"error": "Origin is not allowed"}, status_code=403)
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > selected.max_content_length:
            response = JSONResponse({"error": "Upload is too large"}, status_code=413)
        else:
            response = await call_next(request)
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    application.include_router(health_router, prefix="/api")
    application.include_router(products_router, prefix="/api")
    application.include_router(customer_router, prefix="/api")
    application.include_router(orders_router, prefix="/api")
    application.include_router(admin_router, prefix="/api")
    application.mount(
        "/uploads/products",
        StaticFiles(directory=selected.upload_dir, check_dir=False),
        name="product-uploads",
    )
    return application


app = create_app(initialize_on_startup=not get_settings().is_production)
