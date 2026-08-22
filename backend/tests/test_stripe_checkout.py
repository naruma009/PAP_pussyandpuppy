from decimal import Decimal

import app.api.customer as customer_api
from app.payments import CheckoutSession, PaymentProviderError
from conftest import customer_login, shipping


class FakeProvider:
    def __init__(self, session_id="cs_test_123"):
        self.session_id = session_id
        self.requests = []

    def create_checkout_session(self, request):
        self.requests.append(request)
        return CheckoutSession(self.session_id, "https://checkout.stripe.test/session")


def create_order(client, seed_product, email="buyer@example.com"):
    product_id = seed_product(name="Snapshot Bowl", price=125.5, stock=3)
    customer_login(client, email)
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 2, "price": 1}], "shipping": shipping(email)},
    )
    assert response.status_code == 201
    return response.json()


def configure_payment(client, provider):
    client.app.state.payment_provider = provider
    client.app.state.settings.stripe_success_url = "https://shop.test/payment/success"
    client.app.state.settings.stripe_cancel_url = "https://shop.test/payment/cancel"
    client.app.state.settings.stripe_webhook_secret = "whsec_test"


def test_owner_can_create_session_from_order_snapshots(client, seed_product):
    order = create_order(client, seed_product)
    provider = FakeProvider()
    configure_payment(client, provider)
    response = client.post(f"/api/customer/orders/{order['id']}/checkout-session")
    assert response.status_code == 200
    assert response.json() == {"checkoutUrl": "https://checkout.stripe.test/session", "sessionId": "cs_test_123"}
    request = provider.requests[0]
    assert request.amount == Decimal("251.0")
    assert request.currency == "THB"
    assert request.line_items[0].name == "Snapshot Bowl"
    assert request.line_items[0].unit_amount == 12550
    assert request.line_items[0].quantity == 2
    assert "order_id=" + order["id"] in request.success_url
    assert client.get(f"/api/customer/orders/{order['id']}").json()["paymentStatus"] == "pending"


def test_other_customer_cannot_create_session(client, seed_product):
    order = create_order(client, seed_product, "first@example.com")
    client.post("/api/customer/logout")
    customer_login(client, "second@example.com")
    configure_payment(client, FakeProvider())
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 404


def test_repeated_checkout_start_is_rejected_without_creating_another_session(client, seed_product):
    order = create_order(client, seed_product)
    provider = FakeProvider()
    configure_payment(client, provider)
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 200
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 409
    assert len(provider.requests) == 1


def test_missing_config_and_provider_failure_do_not_change_order(client, seed_product):
    order = create_order(client, seed_product)
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 503
    configure_payment(client, FakeProvider())

    class FailingProvider:
        def create_checkout_session(self, request):
            raise PaymentProviderError("provider failed")

    client.app.state.payment_provider = FailingProvider()
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 503
    assert client.get(f"/api/customer/orders/{order['id']}").json()["paymentStatus"] == "unpaid"


def test_valid_webhook_marks_paid_and_duplicate_is_idempotent(client, seed_product, monkeypatch):
    order = create_order(client, seed_product)
    provider = FakeProvider("cs_test_paid")
    configure_payment(client, provider)
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 200
    event = {"type": "checkout.session.completed", "data": {"object": {
        "id": "cs_test_paid", "metadata": {"order_id": order["id"]},
        "currency": "thb", "amount_total": 25100, "payment_status": "paid",
    }}}
    monkeypatch.setattr(customer_api, "verify_stripe_webhook", lambda payload, signature, secret: event)
    webhook = client.post("/api/payments/stripe/webhook", content=b"raw-body", headers={"stripe-signature": "valid"})
    assert webhook.status_code == 200
    assert client.get(f"/api/customer/orders/{order['id']}").json()["paymentStatus"] == "paid"
    duplicate = client.post("/api/payments/stripe/webhook", content=b"raw-body", headers={"stripe-signature": "valid"})
    assert duplicate.status_code == 200


def test_invalid_webhook_signature_and_amount_are_rejected(client, seed_product, monkeypatch):
    order = create_order(client, seed_product)
    provider = FakeProvider("cs_test_invalid")
    configure_payment(client, provider)
    assert client.post(f"/api/customer/orders/{order['id']}/checkout-session").status_code == 200
    monkeypatch.setattr(customer_api, "verify_stripe_webhook", lambda payload, signature, secret: (_ for _ in ()).throw(PaymentProviderError("bad signature")))
    assert client.post("/api/payments/stripe/webhook", content=b"raw", headers={"stripe-signature": "bad"}).status_code == 400

    event = {"type": "checkout.session.completed", "data": {"object": {
        "id": "cs_test_invalid", "metadata": {"order_id": order["id"]},
        "currency": "thb", "amount_total": 1, "payment_status": "paid",
    }}}
    monkeypatch.setattr(customer_api, "verify_stripe_webhook", lambda payload, signature, secret: event)
    assert client.post("/api/payments/stripe/webhook", content=b"raw", headers={"stripe-signature": "valid"}).status_code == 400
    assert client.get(f"/api/customer/orders/{order['id']}").json()["paymentStatus"] == "pending"
