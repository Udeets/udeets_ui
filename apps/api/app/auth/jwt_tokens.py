from datetime import UTC, datetime, timedelta

import jwt

from app.auth.verification_status import is_verification_complete
from app.core.config import Settings
from app.db.models.user import User


def create_access_token(
    *,
    user_id: str,
    email: str | None,
    settings: Settings,
    role: str | None = None,
    phone: str | None = None,
    email_verified: bool = False,
    phone_verified: bool = False,
    verification_complete: bool | None = None,
    auth_methods: list[str] | None = None,
) -> str:
    if not settings.jwt_secret:
        raise ValueError("JWT_SECRET is not configured")
    now = datetime.now(UTC)
    payload: dict = {
        "sub": user_id,
        "email": email,
        "phone": phone,
        "email_verified": email_verified,
        "phone_verified": phone_verified,
        "verification_complete": (
            verification_complete
            if verification_complete is not None
            else (email_verified and (phone is None or phone_verified))
        ),
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_access_ttl_seconds)).timestamp()),
    }
    if role:
        payload["role"] = role
    if auth_methods:
        payload["auth_methods"] = auth_methods
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_access_token_for_user(
    user: User,
    settings: Settings,
    *,
    role: str | None = None,
    auth_methods: list[str] | None = None,
) -> str:
    methods = auth_methods
    if methods is None:
        methods = ["password"] if user.password_hash else ["oauth"]
    return create_access_token(
        user_id=user.id,
        email=user.email,
        phone=user.phone,
        email_verified=bool(user.email_verified),
        phone_verified=bool(user.phone_verified),
        verification_complete=is_verification_complete(user),
        settings=settings,
        role=role,
        auth_methods=methods,
    )


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
