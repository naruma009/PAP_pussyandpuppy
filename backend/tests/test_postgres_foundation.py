from pathlib import Path

from app.config import Settings
from app.postgres import create_database_engine, create_session_factory, database_url


def test_database_url_reads_environment_without_logging(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg:///pal2paw")
    settings = Settings(_env_file=None)

    assert settings.database_url == "postgresql+psycopg:///pal2paw"
    assert database_url(settings) == settings.database_url


def test_foundation_keeps_sqlite_test_compatibility(tmp_path: Path):
    settings = Settings(_env_file=None, database_path=tmp_path / "foundation.db")
    engine = create_database_engine(settings)
    factory = create_session_factory(engine)

    assert engine.dialect.name == "sqlite"
    with factory() as session:
        assert session.connection().exec_driver_sql("SELECT 1").scalar_one() == 1
    engine.dispose()


def test_alembic_scaffolding_and_initial_revision_exist():
    backend = Path(__file__).parents[1]
    config_text = (backend / "alembic.ini").read_text(encoding="utf-8")
    revision_text = (backend / "alembic" / "versions" / "m2c1_initial.py").read_text(encoding="utf-8")

    assert "script_location = %(here)s/alembic" in config_text
    assert "revision: str = \"m2c1_initial\"" in revision_text
    assert "def upgrade()" in revision_text
    assert "def downgrade()" in revision_text
    for table in ("users", "products", "orders", "order_items", "settings"):
        assert f'"{table}"' in revision_text
