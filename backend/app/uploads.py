import base64
import binascii
import uuid
from pathlib import Path

from fastapi import UploadFile

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_URL_PREFIX = "/uploads/products/"


async def save_upload(upload: UploadFile | None, upload_dir: Path) -> str:
    if upload is None or not upload.filename:
        return ""
    extension = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Image must be PNG, JPEG, or WebP")
    unique_name = f"{uuid.uuid4().hex}.{extension}"
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / unique_name).write_bytes(await upload.read())
    return f"{UPLOAD_URL_PREFIX}{unique_name}"


def delete_upload(image_url: str, upload_dir: Path) -> None:
    if image_url and image_url.startswith(UPLOAD_URL_PREFIX):
        path = upload_dir.resolve() / Path(image_url).name
        if path.is_file():
            try:
                path.unlink()
            except OSError:
                pass


def decode_legacy_image(data_uri: object, upload_dir: Path) -> str:
    if not data_uri or not str(data_uri).startswith("data:image/"):
        return str(data_uri) if str(data_uri).startswith("/uploads/") else ""
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
