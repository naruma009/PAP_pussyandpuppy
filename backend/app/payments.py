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


class PaymentProvider(Protocol):
    def create_checkout_session(self, request: CheckoutRequest) -> str:
        """Return a provider checkout-session reference."""


class StripeCheckoutProvider:
    """M5B placeholder; deliberately refuses live calls in M5A."""

    def create_checkout_session(self, request: CheckoutRequest) -> str:
        raise NotImplementedError("Stripe Checkout integration is planned for M5B")
