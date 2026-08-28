import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select, text

from app.config import get_settings
from app.main import create_app
from app.models import users
from app.postgres import create_database_engine, create_session_factory


@pytest.mark.skipif(
    os.environ.get("RUN_POSTGRES_INTEGRATION") != "1",
    reason="PostgreSQL integration tests require explicit opt-in",
)
def test_postgres_customer_auth_smoke_cleans_up_account():
    settings = get_settings()
    if not settings.database_url:
        pytest.skip("DATABASE_URL is not configured")
    engine = create_database_engine(settings)
    factory = create_session_factory(engine)
    email = f"m3a-{uuid4()}@example.invalid"
    user_id = None
    try:
        with engine.connect() as connection:
            identity = connection.execute(
                text("SELECT current_database(), current_user")
            ).one()
            assert all(isinstance(value, str) and value for value in identity)
        with TestClient(create_app(settings, initialize=False)) as client:
            registered = client.post(
                "/api/customer/register",
                json={"name": "M3A Smoke", "email": email, "password": "correct horse battery"},
            )
            assert registered.status_code == 200
            body = registered.json()
            user_id = body["user"]["id"]
            assert "password_hash" not in body["user"]
            assert client.get("/api/customer/me").status_code == 200
            assert client.post("/api/customer/logout").status_code == 204
            assert client.post(
                "/api/customer/login",
                json={"email": email, "password": "wrong password"},
            ).status_code == 401
            assert client.post(
                "/api/customer/login",
                json={"email": email, "password": "correct horse battery"},
            ).status_code == 200
            assert client.get("/api/customer/me").json()["user"]["email"] == email
        with factory() as session:
            stored = session.execute(select(users).where(users.c.id == user_id)).mappings().one()
            assert stored["password_hash"] != "correct horse battery"
            assert stored["password_hash"].startswith("$argon2id$")
    finally:
        if user_id is not None:
            with factory.begin() as session:
                session.execute(delete(users).where(users.c.id == user_id))
        engine.dispose()
