from pathlib import Path

from conftest import admin_login


PRODUCT_FORM = {
    "name": "Cloud Bed",
    "description": "Soft",
    "price": "250.5",
    "stock": "4",
    "category": "Beds",
    "petType": "cat",
    "ageGroup": "adult",
    "featured": "on",
}


def test_product_crud_upload_replace_delete_and_static(client, settings, seed_product):
    assert client.get("/api/products").json() == []
    assert client.post("/api/products", data=PRODUCT_FORM).status_code == 401
    admin_login(client)

    created = client.post(
        "/api/products",
        data=PRODUCT_FORM,
        files={"image": ("bed.PNG", b"first-image", "image/png")},
    )
    assert created.status_code == 201
    product = created.json()
    assert product["petType"] == "cat"
    assert product["ageGroup"] == "adult"
    assert product["featured"] is True
    assert product["image"].startswith("/uploads/products/")
    first_path = settings.upload_dir / Path(product["image"]).name
    assert first_path.read_bytes() == b"first-image"
    assert client.get(product["image"]).content == b"first-image"

    replacement = {**PRODUCT_FORM, "name": "Updated Bed"}
    updated = client.put(
        f"/api/products/{product['id']}",
        data=replacement,
        files={"image": ("new.webp", b"replacement", "image/webp")},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Bed"
    assert not first_path.exists()
    second_path = settings.upload_dir / Path(updated.json()["image"]).name
    assert second_path.read_bytes() == b"replacement"

    assert client.delete(f"/api/products/{product['id']}").status_code == 204
    assert not second_path.exists()
    assert client.get(f"/api/products/{product['id']}").status_code == 404


def test_product_validation_not_found_and_invalid_extension(client):
    admin_login(client)
    missing = client.post("/api/products", data={"name": "Only name"})
    assert (missing.status_code, missing.json()) == (400, {"error": "Missing required product fields"})
    invalid = client.post(
        "/api/products", data=PRODUCT_FORM, files={"image": ("bad.gif", b"gif", "image/gif")}
    )
    assert (invalid.status_code, invalid.json()) == (400, {"error": "Image must be PNG, JPEG, or WebP"})
    assert client.get("/api/products/not-an-int").status_code == 404
    assert client.put("/api/products/999", data=PRODUCT_FORM).status_code == 404
