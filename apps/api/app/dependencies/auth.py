from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt_tokens import decode_access_token
from app.core.config import Settings, get_settings

bearer = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    user_id: str
    email: str | None = None
    role: str | None = None


def _current_user_from_payload(payload: dict) -> CurrentUser:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user subject")
    role = payload.get("role")
    if role is not None and not isinstance(role, str):
        role = str(role)
    email = payload.get("email")
    if email is not None and not isinstance(email, str):
        email = str(email)
    return CurrentUser(
        user_id=str(user_id),
        email=email,
        role=role,
    )


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
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


def current_user_from_bearer_token(token: str, settings: Settings | None = None) -> CurrentUser:
    """Validate access JWT for WebSocket connect (raises ValueError on failure)."""
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
