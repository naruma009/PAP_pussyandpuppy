from flask import Flask
from flask.sessions import SecureCookieSessionInterface

from app.sessions import FlaskSessionCodec
from conftest import admin_login


def test_customer_and_admin_use_identity_session(client):
    assert client.get("/api/customer/session").json() == {"customer": None}
    assert client.post("/api/customer/login", json={"name": " Cat ", "email": "cat@example.com"}).json() == {
        "customer": {"name": "Cat", "email": "cat@example.com"}
    }
    assert client.post("/api/admin/login", json={"code": "deprecated"}).status_code == 401
    admin_login(client)
    assert client.get("/api/admin/session").json() == {"authenticated": True}
    assert client.post("/api/customer/logout").status_code == 204
    assert client.get("/api/admin/session").json() == {"authenticated": False}
    assert client.post("/api/admin/logout").status_code == 204


def test_flask_golden_cookie_round_trip():
    secret = "golden-secret"
    payload = {
        "customer_user_id": 7,
        "customer": {"name": "Golden", "email": "golden@example.com"},
    }
    flask_app = Flask(__name__)
    flask_app.secret_key = secret
    flask_serializer = SecureCookieSessionInterface().get_signing_serializer(flask_app)
    codec = FlaskSessionCodec(secret)

    flask_cookie = flask_serializer.dumps(payload)
    assert codec.loads(flask_cookie) == payload
    fastapi_cookie = codec.dumps(payload)
    assert flask_serializer.loads(fastapi_cookie) == payload


def test_cookie_security_attributes(client):
    response = client.post("/api/customer/login", json={"name": "A", "email": "a@example.com"})
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "secure" not in cookie
