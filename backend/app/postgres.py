from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import Settings


class Base(DeclarativeBase):
    """Metadata base reserved for the PostgreSQL model layer."""


def database_url(settings: Settings) -> str:
    """Return the configured URL, with SQLite retained for current local tests."""
    if settings.database_url:
        if settings.database_url.startswith("postgres://"):
            return "postgresql+psycopg://" + settings.database_url.removeprefix("postgres://")
        if settings.database_url.startswith("postgresql://"):
            return "postgresql+psycopg://" + settings.database_url.removeprefix("postgresql://")
        return settings.database_url
    return f"sqlite:///{Path(settings.database_path).as_posix()}"


def create_database_engine(settings: Settings, **engine_options: Any) -> Engine:
    url = database_url(settings)
    options: dict[str, Any] = {"pool_pre_ping": True, **engine_options}
    if url.startswith("sqlite"):
        options.setdefault("connect_args", {"check_same_thread": False})
    elif url.startswith("postgresql"):
        options["poolclass"] = NullPool
        options["connect_args"] = {
            **options.get("connect_args", {}),
            "prepare_threshold": None,
        }
    return create_engine(url, **options)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, class_=Session, expire_on_commit=False, autoflush=False)


@contextmanager
def session_scope(factory: sessionmaker[Session]) -> Iterator[Session]:
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
