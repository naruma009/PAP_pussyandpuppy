import hashlib
import json
from collections.abc import Mapping
from typing import Any

from fastapi import Request, Response
from itsdangerous import BadSignature, URLSafeTimedSerializer
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class CompactJSONSerializer:
    def dumps(self, value: Any) -> str:
        return json.dumps(value, ensure_ascii=True, separators=(",", ":"), sort_keys=True)

    def loads(self, value: str) -> Any:
        return json.loads(value)


class FlaskSessionCodec:
    def __init__(self, secret_key: str) -> None:
        self.serializer = URLSafeTimedSerializer(
            secret_key,
            salt="cookie-session",
            serializer=CompactJSONSerializer(),
            signer_kwargs={"key_derivation": "hmac", "digest_method": hashlib.sha1},
        )

    def dumps(self, session: Mapping[str, Any]) -> str:
        return self.serializer.dumps(dict(session))

    def loads(self, cookie: str, max_age: int = 31 * 24 * 60 * 60) -> dict[str, Any]:
        try:
            value = self.serializer.loads(cookie, max_age=max_age)
        except BadSignature:
            return {}
        return value if isinstance(value, dict) else {}


class FlaskSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, secret_key: str, secure: bool) -> None:
        super().__init__(app)
        self.codec = FlaskSessionCodec(secret_key)
        self.secure = secure

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        original = self.codec.loads(request.cookies.get("session", ""))
        request.state.session = dict(original)
        request.state.session_accessed = False
        response = await call_next(request)
        current = request.state.session
        if request.state.session_accessed:
            response.headers.append("Vary", "Cookie")
        if current != original:
            if current:
                response.set_cookie(
                    "session",
                    self.codec.dumps(current),
                    httponly=True,
                    secure=self.secure,
                    samesite="lax",
                    path="/",
                )
            else:
                response.delete_cookie(
                    "session", httponly=True, secure=self.secure, samesite="lax", path="/"
                )
        return response


def session_data(request: Request) -> dict[str, Any]:
    request.state.session_accessed = True
    return request.state.session
