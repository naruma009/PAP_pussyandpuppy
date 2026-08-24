from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_health(tmp_path) -> None:
    settings = Settings(
        _env_file=None,
        env="test",
        database_path=tmp_path / "health.db",
        upload_dir=tmp_path / "uploads",
        secret_key="test-secret",
    )
    with TestClient(create_app(settings, initialize=True)) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "pap-fastapi"}


def test_readiness_checks_database(tmp_path) -> None:
    settings = Settings(
        _env_file=None, env="test", database_path=tmp_path / "ready.db",
        upload_dir=tmp_path / "uploads", secret_key="test-secret",
    )
    with TestClient(create_app(settings, initialize=True)) as client:
        response = client.get("/api/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "service": "pap-fastapi"}
