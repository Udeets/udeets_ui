from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import Settings


def create_access_token(
    *,
    user_id: str,
    email: str | None,
    settings: Settings,
    role: str | None = None,
) -> str:
    if not settings.jwt_secret:
        raise ValueError("JWT_SECRET is not configured")
    now = datetime.now(UTC)
    payload: dict = {
        "sub": user_id,
        "email": email,
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_access_ttl_seconds)).timestamp()),
    }
    if role:
        payload["role"] = role
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str, settings: Settings) -> dict:
    if not settings.jwt_secret:
        raise ValueError("JWT_SECRET is not configured")
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=["HS256"],
        issuer=settings.jwt_issuer,
        options={"verify_aud": False},
    )
