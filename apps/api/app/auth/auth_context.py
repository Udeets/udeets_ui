from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import jwt
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.auth.jwt_tokens import decode_access_token
from app.auth.verification_status import is_verification_complete
from app.auth.verification_access import is_user_verification_complete
from app.core.config import Settings
from app.db.models.user import User
from app.db.repositories.auth import AuthRepository

REQUEST_AUTH_CONTEXT = "udeets_auth_context"

# Unverified accounts may read (view) but not mutate (interact).
# Safe HTTP methods are allowed through the verification gate.
SAFE_HTTP_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})

_UNVERIFIED_ALLOWED_PREFIXES = (
    "/api/v1/auth",
    "/api/v1/health",
    "/health",
)

_UNVERIFIED_PROFILES_ME_PATHS = frozenset(
    {
        "/api/v1/profiles/me",
        "/api/v1/profiles/me/upsert",
        "/api/v1/profiles/me/avatar/prepare",
    }
)

VERIFICATION_REQUIRED_BODY = {
    "error": "Verify at least one contact method (email or phone) to continue.",
    "code": "VERIFICATION_REQUIRED",
}


@dataclass(frozen=True, slots=True)
class AuthContext:
    payload: dict
    verification_complete: bool
    email_verified: bool
    phone_verified: bool
    source: Literal["jwt", "db"]


def is_path_allowed_for_unverified(path: str) -> bool:
    for prefix in _UNVERIFIED_ALLOWED_PREFIXES:
        if path.startswith(prefix):
            return True
    return path in _UNVERIFIED_PROFILES_ME_PATHS


def should_enforce_verification_gate(path: str) -> bool:
    return path.startswith("/api/v1") and not is_path_allowed_for_unverified(path)


def auth_context_from_payload(payload: dict) -> AuthContext:
    return AuthContext(
        payload=payload,
        verification_complete=bool(payload.get("verification_complete")),
        email_verified=bool(payload.get("email_verified")),
        phone_verified=bool(payload.get("phone_verified")),
        source="jwt",
    )


def auth_context_from_user(payload: dict, user: User) -> AuthContext:
    return AuthContext(
        payload=payload,
        verification_complete=is_verification_complete(user),
        email_verified=bool(user.email_verified),
        phone_verified=bool(user.phone_verified),
        source="db",
    )


def resolve_auth_context(
    *,
    token: str,
    settings: Settings,
    db: Session | None,
) -> AuthContext:
    payload = decode_access_token(token, settings)
    if payload.get("verification_complete") is True:
        return auth_context_from_payload(payload)

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise jwt.PyJWTError("Missing user subject")

    if db is None:
        return auth_context_from_payload(payload)

    user = AuthRepository(db).get_user_by_id(user_id)
    if user is None:
        return auth_context_from_payload(payload)
    return auth_context_from_user(payload, user)


def store_auth_context(request: Request, context: AuthContext) -> None:
    request.state.__setattr__(REQUEST_AUTH_CONTEXT, context)


def get_auth_context(request: Request) -> AuthContext | None:
    return getattr(request.state, REQUEST_AUTH_CONTEXT, None)


def resolve_verified_user_from_token(
    token: str,
    db: Session,
    settings: Settings | None = None,
) -> AuthContext:
    from app.core.config import get_settings

    resolved_settings = settings or get_settings()
    context = resolve_auth_context(token=token, settings=resolved_settings, db=db)
    if not context.verification_complete:
        raise ValueError("Verification required")
    return context