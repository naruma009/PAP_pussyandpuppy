import base64
from pathlib import Path

import pytest

from app.config import Settings
from app.main import create_app
from conftest import admin_login, customer_login, shipping


def test_malformed_requests_no_store_and_413(client, seed_product):
    assert client.post("/api/customer/login", content=b"not-json", headers={"content-type": "application/json"}).status_code == 400
    customer_login(client)
    malformed = client.post("/api/orders", content=b"not-json", headers={"content-type": "application/json"})
    assert malformed.status_code == 400
    assert malformed.headers["cache-control"] == "no-store"
    client.app.state.settings.max_content_length = 100
    too_large = client.post(
        "/api/products",
        content=b"x" * 101,
        headers={"content-length": "101", "content-type": "application/octet-stream"},
    )
    assert (too_large.status_code, too_large.json()) == (413, {"error": "Upload is too large"})
    assert too_large.headers["cache-control"] == "no-store"


def test_legacy_migration_endpoint_is_one_shot(client, settings):
    admin_login(client)
    encoded = base64.b64encode(b"png-data").decode()
    response = client.post(
        "/api/admin/migrate",
        json={"products": [{"id": 50, "name": "Legacy", "price": -2, "stock": -1, "image": f"data:image/png;base64,{encoded}"}]},
    )
    assert response.json() == {"migrated": True, "count": 1}
    product = client.get("/api/products/50").json()
    assert product["price"] == 0
    assert product["stock"] == 0
    assert client.get(product["image"]).content == b"png-data"
    assert client.post("/api/admin/migrate", json={"products": []}).json() == {
        "migrated": False, "reason": "already_migrated"
    }


def test_guard_rejects_legacy_paths(tmp_path):
    project_root = Path(__file__).resolve().parents[2]
    legacy = Settings(database_path=project_root / "instance" / "pap.db", upload_dir=tmp_path)
    with pytest.raises(RuntimeError, match="legacy instance"):
        create_app(legacy)
    uploads = Settings(database_path=tmp_path / "db.sqlite", upload_dir=project_root / "uploads" / "products")
    with pytest.raises(RuntimeError, match="legacy uploads"):
        create_app(uploads)


def test_production_requires_non_default_credentials(tmp_path):
    settings = Settings(env="production", database_path=tmp_path / "db.sqlite", upload_dir=tmp_path / "uploads")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        create_app(settings)


def test_production_cookie_is_secure_and_migration_is_disabled(tmp_path):
    settings = Settings(
        env="production",
        database_path=tmp_path / "db.sqlite",
        upload_dir=tmp_path / "uploads",
        secret_key="production-test-secret",
        admin_password="production-test-admin",
    )
    from fastapi.testclient import TestClient

    with TestClient(create_app(settings, initialize=True), base_url="https://testserver") as client:
        login = client.post("/api/admin/login", json={"code": "production-test-admin"})
        assert "secure" in login.headers["set-cookie"].lower()
        response = client.post("/api/admin/migrate", json={"products": []})
        assert (response.status_code, response.json()) == (
            403,
            {"error": "Legacy migration is disabled in production"},
        )
