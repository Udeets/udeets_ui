from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.config import Settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


def build_google_authorize_url(*, state: str, settings: Settings) -> str:
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise ValueError("Google OAuth is not configured")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_google_code(code: str, settings: Settings) -> dict[str, Any]:
    if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
        raise ValueError("Google OAuth is not configured")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.is_error:
            try:
                body = response.json()
                detail = body.get("error_description") or body.get("error") or response.text
            except Exception:
                detail = response.text
            raise ValueError(f"Google token exchange failed: {detail}")
        return response.json()


async def fetch_google_userinfo(access_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.is_error:
            try:
                body = response.json()
                detail = body.get("error_description") or body.get("error") or response.text
            except Exception:
                detail = response.text
            raise ValueError(f"Google userinfo failed: {detail}")
        return response.json()


def normalize_google_profile(userinfo: dict[str, Any]) -> dict[str, str | bool | None]:
    return {
        "provider_user_id": str(userinfo.get("sub") or ""),
        "email": userinfo.get("email") if isinstance(userinfo.get("email"), str) else None,
        "email_verified": bool(userinfo.get("email_verified")),
        "full_name": userinfo.get("name") if isinstance(userinfo.get("name"), str) else None,
        "avatar_url": userinfo.get("picture") if isinstance(userinfo.get("picture"), str) else None,
    }
