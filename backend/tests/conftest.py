import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.db import initialize_database
from app.main import create_app


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        _env_file=None,
        env="test",
        database_path=tmp_path / "pap-test.db",
        upload_dir=tmp_path / "uploads" / "products",
        secret_key="test-secret",
        admin_password="test-admin",
    )


@pytest.fixture
def client(settings: Settings):
    application = create_app(settings, initialize=True)
    with TestClient(application) as test_client:
        yield test_client


@pytest.fixture
def seed_product(settings: Settings):
    def seed(*, name: str = "Test Bed", price: float = 100.0, stock: int = 5, image: str = "") -> int:
        initialize_database(settings)
        connection = sqlite3.connect(settings.database_path)
        try:
            cursor = connection.execute(
                """INSERT INTO products
                   (name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (name, "Description", price, stock, "Beds", "cat", "all", image, "🐾", 0, "2026-01-01", "2026-01-01"),
            )
            connection.commit()
            return cursor.lastrowid
        finally:
            connection.close()

    return seed


def admin_login(client: TestClient) -> None:
    assert client.post("/api/admin/login", json={"code": "test-admin"}).status_code == 200


def customer_login(client: TestClient, email: str = "buyer@example.com") -> None:
    assert client.post("/api/customer/login", json={"name": "Buyer", "email": email}).status_code == 200


def shipping(email: str = "buyer@example.com") -> dict[str, str]:
    return {
        "fullName": "Buyer",
        "phone": "0800000000",
        "email": email,
        "address": "1 Road",
        "district": "District",
        "province": "Bangkok",
        "postalCode": "10000",
    }
