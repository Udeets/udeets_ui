from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.auth_context import SAFE_HTTP_METHODS, get_auth_context
from app.auth.jwt_tokens import decode_access_token
from app.auth.verification_status import is_verification_complete
from app.core.config import Settings, get_settings
from app.db.repositories.auth import AuthRepository
from app.dependencies.db import get_db

bearer = HTTPBearer(auto_error=False)

VERIFICATION_REQUIRED_DETAIL = {
    "error": "Verify at least one contact method (email or phone) to continue.",
    "code": "VERIFICATION_REQUIRED",
}


@dataclass
class CurrentUser:
    user_id: str
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    email_verified: bool = False
    phone_verified: bool = False
    verification_complete: bool = False
    auth_methods: list[str] | None = None


def _current_user_from_payload(
    payload: dict,
    *,
    email_verified: bool | None = None,
    phone_verified: bool | None = None,
    verification_complete: bool | None = None,
) -> CurrentUser:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user subject")
    role = payload.get("role")
    if role is not None and not isinstance(role, str):
        role = str(role)
    email = payload.get("email")
    if email is not None and not isinstance(email, str):
        email = str(email)
    phone = payload.get("phone")
    if phone is not None and not isinstance(phone, str):
        phone = str(phone)
    auth_methods = payload.get("auth_methods")
    if auth_methods is not None and not isinstance(auth_methods, list):
        auth_methods = [str(auth_methods)]
    return CurrentUser(
        user_id=str(user_id),
        email=email,
        phone=phone,
        role=role,
        email_verified=email_verified if email_verified is not None else bool(payload.get("email_verified")),
        phone_verified=phone_verified if phone_verified is not None else bool(payload.get("phone_verified")),
        verification_complete=(
            verification_complete
            if verification_complete is not None
            else bool(payload.get("verification_complete"))
        ),
        auth_methods=auth_methods,
    )


def _current_user_from_auth_context(request: Request) -> CurrentUser | None:
    context = get_auth_context(request)
    if context is None:
        return None
    return _current_user_from_payload(
        context.payload,
        email_verified=context.email_verified,
        phone_verified=context.phone_verified,
        verification_complete=context.verification_complete,
    )


def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    cached = _current_user_from_auth_context(request)
    if cached is not None:
        return cached

    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    if not settings.jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT is not configured",
        )

    try:
        payload = decode_access_token(creds.credentials, settings)
        return _current_user_from_payload(payload)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc


def get_verified_user(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUser:
    # Unverified accounts may read (view) but not mutate (interact). Allow safe
    # methods through so viewing works; mutations still require verification.
    if request.method in SAFE_HTTP_METHODS:
        return current_user

    context = get_auth_context(request)
    if context is not None:
        if context.verification_complete:
            return current_user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=VERIFICATION_REQUIRED_DETAIL)

    if current_user.verification_complete:
        return current_user

    user = AuthRepository(db).get_user_by_id(current_user.user_id)
    if user is not None and is_verification_complete(user):
        current_user.email_verified = bool(user.email_verified)
        current_user.phone_verified = bool(user.phone_verified)
        current_user.verification_complete = True
        return current_user

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=VERIFICATION_REQUIRED_DETAIL)


def current_user_from_bearer_token(token: str, settings: Settings | None = None) -> CurrentUser:
    """Validate access JWT for callers without a Starlette request (raises ValueError on failure)."""
    settings = settings or get_settings()
    if not token:
        raise ValueError("Missing bearer token")
    if not settings.jwt_secret:
        raise ValueError("JWT is not configured")
    try:
        payload = decode_access_token(token, settings)
        return _current_user_from_payload(payload)
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid token") from exc
    except HTTPException as exc:
        raise ValueError(str(exc.detail)) from exc
