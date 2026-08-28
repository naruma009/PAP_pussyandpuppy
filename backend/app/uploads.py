import base64
import binascii
import uuid
from urllib.parse import quote, unquote, urlsplit

import httpx
from fastapi import UploadFile

from app.config import Settings

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_URL_PREFIX = "/uploads/products/"


def _headers(settings: Settings) -> dict[str, str]:
    if not settings.supabase_secret_key:
        raise ValueError("Supabase Storage is not configured")
    headers = {"apikey": settings.supabase_secret_key}
    if not settings.supabase_secret_key.startswith("sb_secret_"):
        headers["Authorization"] = f"Bearer {settings.supabase_secret_key}"
    return headers


def _object_url(settings: Settings, filename: str, *, public: bool = False) -> str:
    base = (settings.supabase_url or "").rstrip("/")
    visibility = "/public" if public else ""
    bucket = quote(settings.supabase_storage_bucket, safe="")
    path = quote(filename, safe="/")
    return f"{base}/storage/v1/object{visibility}/{bucket}/{path}"


async def save_upload(upload: UploadFile | None, settings: Settings) -> str:
    if upload is None or not upload.filename:
        return ""
    extension = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Image must be PNG, JPEG, or WebP")
    unique_name = f"{uuid.uuid4().hex}.{extension}"
    mime_type = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}[extension]
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                _object_url(settings, unique_name),
                content=await upload.read(),
                headers={**_headers(settings), "Content-Type": mime_type},
            )
            response.raise_for_status()
    except (httpx.HTTPError, ValueError) as error:
        if isinstance(error, ValueError):
            raise
        raise ValueError("Image upload failed") from error
    return _object_url(settings, unique_name, public=True)


def delete_upload(image_url: str, settings: Settings) -> None:
    if not image_url or not settings.supabase_url:
        return
    try:
        parsed = urlsplit(image_url)
        configured = urlsplit(settings.supabase_url.rstrip("/"))
        public_prefix = f"/storage/v1/object/public/{quote(settings.supabase_storage_bucket, safe='')}/"
        if (parsed.scheme, parsed.netloc) != (configured.scheme, configured.netloc):
            return
        if parsed.query or parsed.fragment or not parsed.path.startswith(public_prefix):
            return
        object_path = unquote(parsed.path[len(public_prefix):])
        segments = object_path.split("/")
        if not object_path or any(not segment or segment in {".", ".."} for segment in segments):
            return
        with httpx.Client() as client:
            response = client.delete(_object_url(settings, object_path), headers=_headers(settings))
            response.raise_for_status()
    except (httpx.HTTPError, ValueError, UnicodeError):
        pass


def decode_legacy_image(data_uri: object, upload_dir, *, is_production: bool = False) -> str:
    if not data_uri or not str(data_uri).startswith("data:image/"):
        return str(data_uri) if str(data_uri).startswith("/uploads/") else ""
    if is_production:
        return ""
    header, encoded = str(data_uri).split(",", 1)
    subtype = header.split(";")[0].split("/")[1].lower()
    extension = "jpg" if subtype == "jpeg" else subtype
    if extension not in ALLOWED_EXTENSIONS:
        return ""
    try:
        payload = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        return ""
    if len(payload) > 2 * 1024 * 1024:
        return ""
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"legacy-{uuid.uuid4().hex}.{extension}"
    (upload_dir / filename).write_bytes(payload)
    return f"{UPLOAD_URL_PREFIX}{filename}"
