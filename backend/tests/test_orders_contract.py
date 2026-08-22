from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import create_app
from app.models import products
from app.postgres import create_database_engine
from conftest import admin_login, customer_login, shipping


def stock(settings, product_id):
    engine = create_database_engine(settings)
    try:
        with engine.connect() as connection:
            return connection.execute(select(products.c.stock).where(products.c.id == product_id)).scalar_one()
    finally:
        engine.dispose()


def test_order_authoritative_total_and_history(client, settings, seed_product):
    product_id = seed_product(price=125.5, stock=5)
    customer_login(client)
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 2, "price": 0}], "shipping": shipping()},
    )
    assert response.status_code == 201
    assert response.json()["total"] == 251.0
    assert response.json()["items"][0]["price"] == 125.5
    assert stock(settings, product_id) == 3
    assert client.get("/api/customer/orders").json()[0]["id"] == response.json()["id"]


def test_real_customer_auth_transaction_is_reused_for_order_creation(client, settings, seed_product):
    product_id = seed_product(stock=2)
    assert client.post(
        "/api/customer/register",
        json={"name": "Real Buyer", "email": "real-buyer@example.com", "password": "correct horse battery"},
    ).status_code == 200
    # The authenticated-user dependency has already queried users and
    # autobegun the Session transaction before the order handler runs.
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 1}], "shipping": shipping("real-buyer@example.com")},
    )
    assert response.status_code == 201
    assert stock(settings, product_id) == 1


def test_failed_cart_rolls_back_everything(client, settings, seed_product):
    first = seed_product(stock=3)
    second = seed_product(name="Sold Out", stock=0)
    customer_login(client)
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": first, "quantity": 1}, {"productId": second, "quantity": 1}], "shipping": shipping()},
    )
    assert response.status_code == 409
    assert stock(settings, first) == 3
    assert client.get("/api/customer/orders").json() == []


def test_auth_shipping_email_and_admin_orders_contract(client, seed_product):
    product_id = seed_product(stock=2)
    payload = {"items": [{"productId": product_id, "quantity": 1}], "shipping": shipping()}
    assert client.post("/api/orders", json=payload).status_code == 401
    assert client.get("/api/admin/orders").status_code == 401
    customer_login(client)
    mismatch = {**payload, "shipping": shipping("other@example.com")}
    response = client.post("/api/orders", json=mismatch)
    assert (response.status_code, response.json()) == (
        400,
        {"error": "Shipping email must match the logged-in customer"},
    )
    created = client.post("/api/orders", json=payload)
    assert created.status_code == 201
    admin_login(client)
    assert client.get("/api/admin/orders").json()[0]["id"] == created.json()["id"]


def test_duplicate_ids_are_aggregated_before_stock_validation(client, settings, seed_product):
    product_id = seed_product(stock=3)
    customer_login(client)
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 2}, {"productId": product_id, "quantity": 2}], "shipping": shipping()},
    )
    assert (response.status_code, response.json()) == (409, {"error": "Not enough stock for Test Bed"})
    assert stock(settings, product_id) == 3


def test_concurrent_orders_cannot_oversell(settings, seed_product):
    product_id = seed_product(stock=1)

    def place(email):
        with TestClient(create_app(settings)) as local_client:
            customer_login(local_client, email)
            return local_client.post(
                "/api/orders",
                json={"items": [{"productId": product_id, "quantity": 1}], "shipping": shipping(email)},
            ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = sorted(executor.map(place, ["one@example.com", "two@example.com"]))
    assert statuses == [201, 409]
    assert stock(settings, product_id) == 0
