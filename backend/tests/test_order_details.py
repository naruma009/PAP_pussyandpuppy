from sqlalchemy import update

from app.models import products
from conftest import admin_login, shipping


def register_customer(client, name, email):
    response = client.post(
        "/api/customer/register",
        json={"name": name, "email": email, "password": "correct horse battery"},
    )
    assert response.status_code == 200


def test_order_keeps_customer_shipping_and_product_snapshots(client, seed_product):
    product_id = seed_product(name="Original Bed", price=125.5, stock=4)
    register_customer(client, "Snapshot Buyer", "snapshot@example.com")
    created = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 2}], "shipping": shipping("snapshot@example.com")},
    )
    assert created.status_code == 201
    order = created.json()
    assert order["customer"] == {
        "fullName": "Buyer",
        "email": "snapshot@example.com",
        "phone": "0800000000",
        "address": "1 Road",
        "district": "District",
        "province": "Bangkok",
        "postalCode": "10000",
    }
    assert order["total"] == 251.0
    assert order["items"] == [{"productId": product_id, "name": "Original Bed", "qty": 2, "price": 125.5, "subtotal": 251.0}]

    with client.app.state.db_session_factory() as db:
        db.execute(update(products).where(products.c.id == product_id).values(name="Renamed Bed", price=999))
        db.commit()

    detail = client.get(f"/api/customer/orders/{order['id']}")
    assert detail.status_code == 200
    assert detail.json()["items"] == order["items"]
    assert detail.json()["total"] == 251.0


def test_customer_order_detail_is_scoped_to_authenticated_user(client, seed_product):
    product_id = seed_product(stock=3)
    register_customer(client, "First Buyer", "first@example.com")
    created = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 1}], "shipping": shipping("first@example.com")},
    )
    assert created.status_code == 201
    order_id = created.json()["id"]
    client.post("/api/customer/logout")
    register_customer(client, "Second Buyer", "second@example.com")
    assert client.get(f"/api/customer/orders/{order_id}").status_code == 404
    assert client.get("/api/customer/orders").json() == []


def test_admin_can_read_order_detail(client, seed_product):
    product_id = seed_product(stock=2)
    register_customer(client, "Buyer", "buyer-detail@example.com")
    created = client.post(
        "/api/orders",
        json={"items": [{"productId": product_id, "quantity": 1}], "shipping": shipping("buyer-detail@example.com")},
    )
    assert created.status_code == 201
    admin_login(client)
    detail = client.get(f"/api/admin/orders/{created.json()['id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == created.json()["id"]
