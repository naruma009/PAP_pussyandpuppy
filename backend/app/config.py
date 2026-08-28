from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000
    database_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("DATABASE_URL", "PAP_API_DATABASE_URL"),
    )
    database_path: Path = BACKEND_DIR / "data" / "pap-dev.db"
    upload_dir: Path = BACKEND_DIR / "data" / "uploads" / "products"
    secret_key: str = "pap-development-secret-change-me"
    public_origin: str | None = None
    cors_allowed_origins: str = ""
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None
    stripe_secret_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("STRIPE_SECRET_KEY", "PAP_API_STRIPE_SECRET_KEY"),
    )
    stripe_webhook_secret: str | None = Field(
        default=None,
        validation_alias=AliasChoices("STRIPE_WEBHOOK_SECRET", "PAP_API_STRIPE_WEBHOOK_SECRET"),
    )
    stripe_success_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("STRIPE_SUCCESS_URL", "PAP_API_STRIPE_SUCCESS_URL"),
    )
    stripe_cancel_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("STRIPE_CANCEL_URL", "PAP_API_STRIPE_CANCEL_URL"),
    )
    supabase_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_URL", "PAP_API_SUPABASE_URL"),
    )
    supabase_secret_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "SUPABASE_SECRET_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "PAP_API_SUPABASE_SECRET_KEY",
            "PAP_API_SUPABASE_SERVICE_ROLE_KEY",
        ),
    )
    supabase_storage_bucket: str = Field(
        default="product-images",
        validation_alias=AliasChoices("SUPABASE_STORAGE_BUCKET", "PAP_API_SUPABASE_STORAGE_BUCKET"),
    )
    max_content_length: int = 20 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PAP_API_",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

    @property
    def allowed_origins(self) -> tuple[str, ...]:
        configured = [origin.strip().rstrip("/") for origin in self.cors_allowed_origins.split(",")]
        if self.public_origin:
            configured.append(self.public_origin.strip().rstrip("/"))
        if not self.is_production:
            configured.extend(("http://localhost:5173", "http://127.0.0.1:5173"))
        return tuple(dict.fromkeys(origin for origin in configured if origin))

    def validate_runtime(self, project_root: Path) -> None:
        legacy_database = (project_root / "instance" / "pap.db").resolve()
        legacy_uploads = (project_root / "uploads" / "products").resolve()
        if self.database_path.resolve() == legacy_database:
            raise RuntimeError("FastAPI must not use the legacy instance/pap.db")
        if self.upload_dir.resolve() == legacy_uploads:
            raise RuntimeError("FastAPI must not use the legacy uploads directory")
        if self.cookie_samesite.lower() not in {"lax", "strict", "none"}:
            raise RuntimeError("PAP_API_COOKIE_SAMESITE must be lax, strict, or none")
        if self.cookie_samesite.lower() == "none" and not self.is_production:
            raise RuntimeError("SameSite=None requires production HTTPS")
        if "*" in self.allowed_origins:
            raise RuntimeError("CORS origins must not use wildcard with credentials")
        if self.is_production:
            if not self.secret_key or self.secret_key == "pap-development-secret-change-me":
                raise RuntimeError("PAP_API_SECRET_KEY is required in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
