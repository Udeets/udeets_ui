import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.auth.auth_context import (
    SAFE_HTTP_METHODS,
    VERIFICATION_REQUIRED_BODY,
    auth_context_from_payload,
    auth_context_from_user,
    should_enforce_verification_gate,
    store_auth_context,
)
from app.auth.jwt_tokens import decode_access_token
from app.core.config import get_settings
from app.db.repositories.auth import AuthRepository
from app.db.session import SessionLocal


class VerificationGateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if not should_enforce_verification_gate(path):
            return await call_next(request)

        auth = request.headers.get("authorization", "")
        if not auth.lower().startswith("bearer "):
            return await call_next(request)

        token = auth[7:].strip()
        settings = get_settings()
        if not token or not settings.jwt_secret:
            return await call_next(request)

        try:
            payload = decode_access_token(token, settings)
        except jwt.PyJWTError:
            return await call_next(request)

        if payload.get("verification_complete") is True:
            store_auth_context(request, auth_context_from_payload(payload))
            return await call_next(request)

        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            return await call_next(request)

        db = SessionLocal()
        try:
            user = AuthRepository(db).get_user_by_id(user_id)
            context = auth_context_from_user(payload, user) if user is not None else auth_context_from_payload(payload)
        finally:
            db.close()

        store_auth_context(request, context)
        if context.verification_complete:
            return await call_next(request)

        # Unverified accounts can view (safe methods) but cannot interact (mutations).
        if request.method in SAFE_HTTP_METHODS:
            return await call_next(request)

        return JSONResponse(status_code=403, content=VERIFICATION_REQUIRED_BODY)
