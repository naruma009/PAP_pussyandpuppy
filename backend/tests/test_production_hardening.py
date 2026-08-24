from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.payments import PaymentProviderError
import pytest


def make_client(tmp_path, **overrides):
    values = dict(_env_file=None, env="production", database_path=tmp_path / "db.sqlite",
                  upload_dir=tmp_path / "uploads", secret_key="production-test-secret",
                  public_origin="https://shop.example.test")
    values.update(overrides)
    return TestClient(create_app(Settings(**values), initialize=True), base_url="https://shop.example.test")


def test_cors_wildcard_is_rejected_with_credentials(tmp_path):
    with pytest.raises(RuntimeError, match="wildcard"):
        create_app(Settings(_env_file=None, env="production", database_path=tmp_path / "db.sqlite",
                            upload_dir=tmp_path / "uploads", secret_key="production-test-secret",
                            cors_allowed_origins="*"))


def test_cors_allows_configured_origin_and_rejects_unknown(tmp_path):
    with make_client(tmp_path) as client:
        allowed = client.options("/api/health", headers={"Origin": "https://shop.example.test",
                                                           "Access-Control-Request-Method": "GET"})
        denied = client.options("/api/health", headers={"Origin": "https://evil.example",
                                                          "Access-Control-Request-Method": "GET"})
    assert allowed.headers["access-control-allow-origin"] == "https://shop.example.test"
    assert denied.headers.get("access-control-allow-origin") is None


def test_state_changing_unknown_origin_is_rejected_but_stripe_webhook_keeps_signature_path(tmp_path, monkeypatch):
    with make_client(tmp_path) as client:
        denied = client.post("/api/customer/login", json={"name": "A", "email": "a@example.com"},
                             headers={"Origin": "https://evil.example"})
        assert denied.status_code == 403
        called = {}
        def verify(payload, signature, secret):
            called.update(payload=payload, signature=signature, secret=secret)
            raise PaymentProviderError("bad signature")
        monkeypatch.setattr("app.api.customer.verify_stripe_webhook", verify)
        webhook = client.post("/api/payments/stripe/webhook", content=b"raw",
                              headers={"Origin": "https://evil.example", "stripe-signature": "sig"})
    assert webhook.status_code == 400
    assert called == {"payload": b"raw", "signature": "sig", "secret": None}
