"""Payment provider boundary for the future Stripe Checkout integration.

M5A intentionally contains no SDK import, credentials, network call, or
Checkout Session creation. M5B will provide the live provider implementation.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


@dataclass(frozen=True)
class CheckoutRequest:
    order_id: str
    amount: Decimal
    currency: str
    line_items: tuple["CheckoutLineItem", ...]
    success_url: str
    cancel_url: str


@dataclass(frozen=True)
class CheckoutLineItem:
    name: str
    unit_amount: int
    quantity: int


@dataclass(frozen=True)
class CheckoutSession:
    id: str
    url: str


class PaymentConfigurationError(RuntimeError):
    pass


class PaymentProviderError(RuntimeError):
    pass


class PaymentProvider(Protocol):
    def create_checkout_session(self, request: CheckoutRequest) -> CheckoutSession:
        """Create a hosted checkout session from backend-owned snapshots."""


class StripeCheckoutProvider:
    """Stripe Checkout adapter; the caller supplies an SDK client in tests."""

    def __init__(self, secret_key: str | None = None, client=None):
        self.secret_key = secret_key
        self.client = client

    def create_checkout_session(self, request: CheckoutRequest) -> CheckoutSession:
        if not self.secret_key and self.client is None:
            raise PaymentConfigurationError("Stripe Checkout is not configured")
        client = self.client
        if client is None:
            try:
                import stripe
            except ImportError as error:
                raise PaymentConfigurationError("Stripe Checkout is not installed") from error
            stripe.api_key = self.secret_key
            client = stripe.checkout.Session
        payload = {
            "mode": "payment",
            "line_items": [
                {
                    "price_data": {
                        "currency": request.currency.lower(),
                        "product_data": {"name": item.name},
                        "unit_amount": item.unit_amount,
                    },
                    "quantity": item.quantity,
                }
                for item in request.line_items
            ],
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "client_reference_id": request.order_id,
            "metadata": {"order_id": request.order_id},
        }
        try:
            session = client.create(**payload)
        except Exception as error:
            raise PaymentProviderError("Stripe Checkout session creation failed") from error
        session_id = session.get("id") if isinstance(session, dict) else getattr(session, "id", None)
        session_url = session.get("url") if isinstance(session, dict) else getattr(session, "url", None)
        if not session_id or not session_url:
            raise PaymentProviderError("Stripe returned an incomplete Checkout session")
        return CheckoutSession(id=str(session_id), url=str(session_url))


def verify_stripe_webhook(payload: bytes, signature: str | None, secret: str | None):
    if not secret:
        raise PaymentConfigurationError("Stripe webhook verification is not configured")
    try:
        import stripe
    except ImportError as error:
        raise PaymentConfigurationError("Stripe Checkout is not installed") from error
    try:
        return stripe.Webhook.construct_event(payload, signature, secret)
    except Exception as error:
        raise PaymentProviderError("Invalid Stripe webhook signature") from error
