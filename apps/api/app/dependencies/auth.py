from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings

bearer = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    user_id: str
    email: str | None = None
    role: str | None = None


@lru_cache(maxsize=1)
def _get_jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(jwks_url)


def _resolve_cognito_jwks_url(settings: Settings) -> str:
    if settings.cognito_jwks_url:
        return settings.cognito_jwks_url
    if not settings.cognito_user_pool_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cognito JWKS is not configured",
        )
    return (
        f"https://cognito-idp.{settings.aws_region}.amazonaws.com/"
        f"{settings.cognito_user_pool_id}/.well-known/jwks.json"
    )


def _decode_with_jwks(
    *,
    token: str,
    jwks_url: str,
    audience: str | None,
    issuer: str | None = None,
) -> dict:
    signing_key = _get_jwks_client(jwks_url).get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        audience=audience,
        issuer=issuer,
        options={"verify_aud": bool(audience), "verify_iss": bool(issuer)},
    )


def _current_user_from_payload(payload: dict) -> CurrentUser:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user subject")
    role = payload.get("role")
    if not role:
        cognito_groups = payload.get("cognito:groups")
        if isinstance(cognito_groups, list) and cognito_groups:
            role = str(cognito_groups[0])
    return CurrentUser(
        user_id=user_id,
        email=payload.get("email"),
        role=role,
    )


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = creds.credentials
    cognito_issuer = (
        f"https://cognito-idp.{settings.aws_region}.amazonaws.com/{settings.cognito_user_pool_id}"
        if settings.cognito_user_pool_id
        else None
    )
    try:
        payload = _decode_with_jwks(
            token=token,
            jwks_url=_resolve_cognito_jwks_url(settings),
            audience=settings.cognito_app_client_id,
            issuer=cognito_issuer,
        )
        return _current_user_from_payload(payload)
    except jwt.PyJWTError:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
    )


def current_user_from_bearer_token(token: str, settings: Settings | None = None) -> CurrentUser:
    """Validate Cognito JWT for WebSocket connect (raises ValueError on failure)."""
    settings = settings or get_settings()
    if not token:
        raise ValueError("Missing bearer token")
    cognito_issuer = (
        f"https://cognito-idp.{settings.aws_region}.amazonaws.com/{settings.cognito_user_pool_id}"
        if settings.cognito_user_pool_id
        else None
    )
    try:
        payload = _decode_with_jwks(
            token=token,
            jwks_url=_resolve_cognito_jwks_url(settings),
            audience=settings.cognito_app_client_id,
            issuer=cognito_issuer,
        )
        return _current_user_from_payload(payload)
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid token") from exc
    except HTTPException as exc:
        raise ValueError(str(exc.detail)) from exc
