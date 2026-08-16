from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_health(tmp_path) -> None:
    settings = Settings(
        env="test",
        database_path=tmp_path / "health.db",
        upload_dir=tmp_path / "uploads",
        secret_key="test-secret",
        admin_password="test-admin",
    )
    with TestClient(create_app(settings, initialize=True)) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "pap-fastapi"}
