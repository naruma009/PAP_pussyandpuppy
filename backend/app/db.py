from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings
from app.models import metadata
from app.postgres import create_database_engine, create_session_factory


def initialize_database(settings: Settings, engine: Engine | None = None) -> None:
    if settings.database_url:
        raise RuntimeError("PostgreSQL databases must be initialized with Alembic")
    selected_engine = engine or create_database_engine(settings)
    try:
        metadata.create_all(selected_engine)
    finally:
        if engine is None:
            selected_engine.dispose()


def get_db(request: Request) -> Iterator[Session]:
    session_factory: sessionmaker[Session] = request.app.state.db_session_factory
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
