import sqlite3


def registration_payload(**overrides):
    payload = {"name": "New Customer", "email": "new@example.com", "password": "correct horse battery"}
    payload.update(overrides)
    return payload


def test_register_success_and_password_is_hashed(client, settings):
    response = client.post("/api/customer/register", json=registration_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "new@example.com"
    assert "password_hash" not in body["user"]
    assert client.get("/api/customer/me").status_code == 200

    with sqlite3.connect(settings.database_path) as connection:
        stored = connection.execute("SELECT email, password_hash FROM users").fetchone()
    assert stored[0] == "new@example.com"
    assert stored[1] != "correct horse battery"
    assert stored[1].startswith("$argon2id$")


def test_duplicate_email_is_rejected_case_insensitively(client):
    assert client.post("/api/customer/register", json=registration_payload()).status_code == 200

    duplicate = client.post(
        "/api/customer/register",
        json=registration_payload(email=" NEW@EXAMPLE.COM ", name="Other"),
    )
    assert duplicate.status_code == 409


def test_login_success_wrong_password_and_current_user(client):
    assert client.post("/api/customer/register", json=registration_payload()).status_code == 200
    client.post("/api/customer/logout")

    assert client.get("/api/customer/me").status_code == 401
    wrong = client.post(
        "/api/customer/login",
        json={"email": "NEW@EXAMPLE.COM", "password": "wrong password"},
    )
    assert wrong.status_code == 401
    assert wrong.json() == {"error": "Invalid email or password"}

    login = client.post(
        "/api/customer/login",
        json={"email": "NEW@EXAMPLE.COM", "password": "correct horse battery"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["name"] == "New Customer"
    assert "password_hash" not in login.json()["user"]
    assert client.get("/api/customer/me").json()["user"]["email"] == "new@example.com"


def test_logout_clears_real_customer_session(client):
    assert client.post("/api/customer/register", json=registration_payload()).status_code == 200
    assert client.post("/api/customer/logout").status_code == 204
    assert client.get("/api/customer/me").status_code == 401
    assert client.get("/api/customer/session").json() == {"customer": None}


def test_customer_cannot_self_register_as_admin(client):
    response = client.post(
        "/api/customer/register",
        json=registration_payload(role="admin", is_admin=True),
    )

    assert response.status_code == 200
    assert "role" not in response.json()["user"]
    assert client.get("/api/admin/session").json() == {"authenticated": False}
