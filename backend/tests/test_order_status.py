from conftest import admin_login, customer_login, shipping


def create_order(client, seed_product, stock=5):
    product_id = seed_product(stock=stock)
    customer_login(client)
    response = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 2}], "shipping": shipping()},
    )
    assert response.status_code == 201
    return response.json(), product_id


def read_stock(settings, product_id):
    from sqlalchemy import select

    from app.models import products
    from app.postgres import create_database_engine

    engine = create_database_engine(settings)
    try:
        with engine.connect() as connection:
            return connection.execute(select(products.c.stock).where(products.c.id == product_id)).scalar_one()
    finally:
        engine.dispose()


def test_new_order_starts_pending_and_customer_sees_updated_status(client, seed_product):
    order, product_id = create_order(client, seed_product)
    assert order["status"] == "pending"
    admin_login(client)
    updated = client.patch(f"/api/admin/orders/{order['id']}/status", json={"status": "processing"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "processing"
    assert client.get("/api/admin/orders").json()[0]["status"] == "processing"
    client.post("/api/admin/logout")
    customer_login(client)
    assert client.get("/api/customer/orders").json()[0]["status"] == "processing"
    assert read_stock(client.app.state.settings, product_id) == 3


def test_status_transitions_and_terminal_states_are_enforced(client, seed_product):
    order, _ = create_order(client, seed_product)
    admin_login(client)
    endpoint = f"/api/admin/orders/{order['id']}/status"
    assert client.patch(endpoint, json={"status": "shipped"}).status_code == 409
    assert client.patch(endpoint, json={"status": "processing"}).status_code == 200
    assert client.patch(endpoint, json={"status": "shipped"}).status_code == 200
    assert client.patch(endpoint, json={"status": "completed"}).status_code == 200
    assert client.patch(endpoint, json={"status": "cancelled"}).status_code == 409


def test_cancellation_restores_stock_once_and_is_idempotent(client, settings, seed_product):
    order, product_id = create_order(client, seed_product, stock=5)
    assert read_stock(settings, product_id) == 3
    admin_login(client)
    endpoint = f"/api/admin/orders/{order['id']}/status"
    assert client.patch(endpoint, json={"status": "cancelled"}).status_code == 200
    assert read_stock(settings, product_id) == 5
    repeated = client.patch(endpoint, json={"status": "cancelled"})
    assert repeated.status_code == 200
    assert read_stock(settings, product_id) == 5


def test_status_endpoint_requires_admin_and_only_accepts_valid_status(client, seed_product):
    order, _ = create_order(client, seed_product)
    endpoint = f"/api/admin/orders/{order['id']}/status"
    assert client.post(
        "/api/customer/register",
        json={"name": "Customer", "email": "status-customer@example.com", "password": "correct horse battery"},
    ).status_code == 200
    assert client.patch(endpoint, json={"status": "processing"}).status_code == 403
    client.post("/api/customer/logout")
    assert client.patch(endpoint, json={"status": "processing"}).status_code == 401
    admin_login(client)
    assert client.patch(endpoint, json={"status": "unknown"}).status_code == 400
    assert client.patch(endpoint, json={"status": "processing", "total": 1}).status_code == 400
    assert client.patch("/api/admin/orders/missing/status", json={"status": "processing"}).status_code == 404
