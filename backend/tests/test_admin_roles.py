import sqlite3

from app.bootstrap_admin import bootstrap_admin
from app.db import initialize_database


def promote(settings, email="admin@example.com"):
    with sqlite3.connect(settings.database_path) as connection:
        connection.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
        connection.commit()


def test_new_customer_has_customer_role_and_client_cannot_set_admin(client, settings):
    response = client.post(
        "/api/customer/register",
        json={"name": "Customer", "email": "customer@example.com", "password": "correct horse battery", "role": "admin"},
    )
    assert response.status_code == 200
    with sqlite3.connect(settings.database_path) as connection:
        assert connection.execute("SELECT role FROM users").fetchone()[0] == "customer"


def test_admin_login_rejects_customer_and_authorizes_admin_api(client, settings):
    assert client.post(
        "/api/customer/register",
        json={"name": "Customer", "email": "customer@example.com", "password": "correct horse battery"},
    ).status_code == 200
    assert client.post("/api/admin/login", json={"email": "customer@example.com", "password": "correct horse battery"}).status_code == 401
    client.post("/api/customer/logout")
    assert client.get("/api/admin/orders").status_code == 401

    assert client.post(
        "/api/customer/register",
        json={"name": "Admin", "email": "admin@example.com", "password": "correct horse battery"},
    ).status_code == 200
    promote(settings)
    client.post("/api/customer/logout")
    assert client.post("/api/admin/login", json={"email": "admin@example.com", "password": "correct horse battery"}).json() == {"authenticated": True}
    assert client.get("/api/admin/session").json() == {"authenticated": True}
    assert client.get("/api/admin/orders").status_code == 200


def test_customer_session_is_rejected_by_admin_guard(client, settings):
    assert client.post(
        "/api/customer/register",
        json={"name": "Customer", "email": "customer@example.com", "password": "correct horse battery"},
    ).status_code == 200
    assert client.get("/api/admin/orders").status_code == 403


def test_bootstrap_admin_creates_argon2_hash_and_is_idempotent(settings):
    initialize_database(settings)
    assert bootstrap_admin(settings, "owner@example.com", "correct horse battery", "Owner") == "created"
    with sqlite3.connect(settings.database_path) as connection:
        role, password_hash = connection.execute("SELECT role, password_hash FROM users").fetchone()
    assert role == "admin"
    assert password_hash != "correct horse battery"
    assert password_hash.startswith("$argon2id$")
    assert bootstrap_admin(settings, "owner@example.com", "ignored", "Ignored") == "already_admin"
