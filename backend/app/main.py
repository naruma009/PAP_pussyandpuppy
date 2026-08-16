from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.staticfiles import StaticFiles

from app.api.admin import router as admin_router
from app.api.customer import router as customer_router
from app.api.health import router as health_router
from app.api.orders import router as orders_router
from app.api.products import router as products_router
from app.config import Settings, get_settings
from app.db import initialize_database
from app.sessions import FlaskSessionMiddleware


def create_app(
    settings: Settings | None = None,
    initialize: bool = False,
    initialize_on_startup: bool = False,
) -> FastAPI:
    selected = settings or get_settings()
    project_root = Path(__file__).resolve().parents[2]
    selected.validate_runtime(project_root)
    if initialize:
        selected.upload_dir.mkdir(parents=True, exist_ok=True)
        initialize_database(selected.database_path)

    @asynccontextmanager
    async def lifespan(_application: FastAPI):
        if initialize_on_startup:
            selected.upload_dir.mkdir(parents=True, exist_ok=True)
            initialize_database(selected.database_path)
        yield

    application = FastAPI(title="PAP API", version="0.2.0", lifespan=lifespan)
    application.state.settings = selected
    application.add_middleware(
        FlaskSessionMiddleware, secret_key=selected.secret_key, secure=selected.is_production
    )

    @application.middleware("http")
    async def legacy_headers_and_size(request: Request, call_next):
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


app = create_app(initialize_on_startup=True)
