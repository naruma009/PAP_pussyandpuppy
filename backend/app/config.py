from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000
    database_path: Path = BACKEND_DIR / "data" / "pap-dev.db"
    upload_dir: Path = BACKEND_DIR / "data" / "uploads" / "products"
    secret_key: str = "pap-development-secret-change-me"
    admin_password: str = "PAP2026"
    max_content_length: int = 20 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PAP_API_",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

    def validate_runtime(self, project_root: Path) -> None:
        legacy_database = (project_root / "instance" / "pap.db").resolve()
        legacy_uploads = (project_root / "uploads" / "products").resolve()
        if self.database_path.resolve() == legacy_database:
            raise RuntimeError("FastAPI must not use the legacy instance/pap.db")
        if self.upload_dir.resolve() == legacy_uploads:
            raise RuntimeError("FastAPI must not use the legacy uploads directory")
        if self.is_production:
            if not self.secret_key or self.secret_key == "pap-development-secret-change-me":
                raise RuntimeError("PAP_API_SECRET_KEY is required in production")
            if not self.admin_password or self.admin_password == "PAP2026":
                raise RuntimeError("PAP_API_ADMIN_PASSWORD is required in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
