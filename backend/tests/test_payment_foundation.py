from decimal import Decimal

from app.payments import CheckoutLineItem, CheckoutRequest, PaymentConfigurationError, StripeCheckoutProvider
from conftest import customer_login, shipping


def test_new_order_defaults_to_unpaid_and_exposes_only_safe_payment_fields(client, seed_product):
    product_id = seed_product(price=125.5, stock=2)
    customer_login(client)
    response = client.post(
        "/api/orders",
        json={
            "items": [{"productId": product_id, "quantity": 1}],
            "shipping": shipping(),
            "paymentStatus": "paid",
            "total": 0,
        },
    )
    assert response.status_code == 201
    order = response.json()
    assert order["paymentStatus"] == "unpaid"
    assert order["currency"] == "THB"
    assert order["paymentProvider"] is None
    assert order["paidAt"] is None
    assert "providerPaymentId" not in order
    assert "checkoutSessionId" not in order
    assert order["total"] == 125.5


def test_payment_and_order_status_are_separate(client, seed_product):
    product_id = seed_product(stock=1)
    customer_login(client)
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 1}], "shipping": shipping()},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
    assert response.json()["paymentStatus"] == "unpaid"


def test_stripe_provider_boundary_makes_no_live_call():
    request = CheckoutRequest(
        order_id="PAP-TEST",
        amount=Decimal("10.00"),
        currency="THB",
        line_items=(CheckoutLineItem("Test", 1000, 1),),
        success_url="https://shop.test/success",
        cancel_url="https://shop.test/cancel",
    )
    try:
        StripeCheckoutProvider().create_checkout_session(request)
    except PaymentConfigurationError as error:
        assert "not configured" in str(error)
    else:
        raise AssertionError("A missing Stripe key must not create a Checkout Session")
