import asyncio
import base64
import re

import httpx
import pytest
from fastapi import UploadFile

from app.config import Settings
from app.uploads import decode_legacy_image, delete_upload, save_upload


def make_settings(tmp_path, key="sb_secret_test"):
    return Settings(_env_file=None, database_path=tmp_path / "db.sqlite", upload_dir=tmp_path / "uploads",
                    supabase_url="https://project.supabase.co", supabase_secret_key=key)


def test_save_upload_uses_allowed_type_uuid_public_url_and_modern_header(tmp_path, monkeypatch):
    calls = []

    class Client:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return None
        async def post(self, url, **kwargs):
            calls.append((url, kwargs))
            return httpx.Response(201, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.uploads.httpx.AsyncClient", Client)
    upload = UploadFile(filename="submitted.PNG", file=__import__("io").BytesIO(b"png"))
    url = asyncio.run(save_upload(upload, make_settings(tmp_path)))
    assert re.fullmatch(r"https://project\.supabase\.co/storage/v1/object/public/product-images/[0-9a-f]{32}\.png", url)
    assert calls[0][1]["headers"] == {"apikey": "sb_secret_test", "Content-Type": "image/png"}
    assert calls[0][1]["content"] == b"png"


def test_save_upload_rejects_invalid_type_and_hides_http_failure(tmp_path, monkeypatch):
    invalid = UploadFile(filename="image.gif", file=__import__("io").BytesIO(b"gif"))
    with pytest.raises(ValueError, match="PNG"):
        asyncio.run(save_upload(invalid, make_settings(tmp_path)))

    class Client:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return None
        async def post(self, url, **kwargs):
            raise httpx.ConnectError("secret-looking transport detail")

    monkeypatch.setattr("app.uploads.httpx.AsyncClient", Client)
    upload = UploadFile(filename="image.jpg", file=__import__("io").BytesIO(b"jpg"))
    with pytest.raises(ValueError, match="Image upload failed") as error:
        asyncio.run(save_upload(upload, make_settings(tmp_path)))
    assert "secret-looking" not in str(error.value)


def test_delete_upload_is_safe_and_nonfatal(tmp_path, monkeypatch):
    calls = []

    class Client:
        def __enter__(self): return self
        def __exit__(self, *args): return None
        def delete(self, url, **kwargs):
            calls.append((url, kwargs))
            raise httpx.ConnectError("failure")

    monkeypatch.setattr("app.uploads.httpx.Client", Client)
    settings = make_settings(tmp_path)
    delete_upload("https://evil.example/storage/v1/object/public/product-images/a.png", settings)
    delete_upload("https://project.supabase.co/storage/v1/object/public/product-images/../secret", settings)
    assert calls == []
    delete_upload("https://project.supabase.co/storage/v1/object/public/product-images/a.png", settings)
    assert calls[0][1]["headers"]["apikey"] == "sb_secret_test"


def test_legacy_decode_does_not_write_in_production(tmp_path):
    data = "data:image/png;base64," + base64.b64encode(b"png").decode()
    assert decode_legacy_image(data, tmp_path, is_production=True) == ""
    assert not list(tmp_path.iterdir())
