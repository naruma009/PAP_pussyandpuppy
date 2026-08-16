import importlib.util
import shutil
import sqlite3
from pathlib import Path


def test_legacy_duplicate_cart_characterization_uses_only_temp_copy(tmp_path):
    project_root = Path(__file__).resolve().parents[2]
    legacy_root = tmp_path / "legacy-copy"
    legacy_root.mkdir()
    shutil.copy2(project_root / "app.py", legacy_root / "app.py")
    shutil.copy2(project_root / "schema.sql", legacy_root / "schema.sql")
    (legacy_root / "index.html").write_text("<html><head></head></html>", encoding="utf-8")
    spec = importlib.util.spec_from_file_location("pap_legacy_characterization", legacy_root / "app.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.app.config.update(TESTING=False, PROPAGATE_EXCEPTIONS=False, SECRET_KEY="test-secret")

    connection = sqlite3.connect(legacy_root / "instance" / "pap.db")
    connection.execute("UPDATE products SET stock = 3 WHERE id = 1")
    connection.commit()
    connection.close()
    with module.app.test_client() as client:
        client.post("/api/customer/login", json={"name": "Buyer", "email": "buyer@example.com"})
        response = client.post(
            "/api/orders",
            json={
                "items": [{"productId": 1, "quantity": 2}, {"productId": 1, "quantity": 2}],
                "shipping": {
                    "fullName": "Buyer", "phone": "0800000000", "email": "buyer@example.com",
                    "address": "1 Road", "district": "District", "province": "Bangkok", "postalCode": "10000",
                },
            },
        )
    assert response.status_code == 500
    connection = sqlite3.connect(legacy_root / "instance" / "pap.db")
    assert connection.execute("SELECT stock FROM products WHERE id = 1").fetchone()[0] == 3
    assert connection.execute("SELECT COUNT(*) FROM orders").fetchone()[0] == 0
    connection.close()
