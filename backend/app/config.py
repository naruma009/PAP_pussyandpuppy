from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PAP_API_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
