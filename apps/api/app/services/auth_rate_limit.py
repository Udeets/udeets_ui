from __future__ import annotations

import time
from threading import Lock

from fastapi import HTTPException, Request, status

from app.core.config import get_settings

_windows: dict[str, tuple[int, float]] = {}
_lock = Lock()


def _is_development() -> bool:
    try:
        return get_settings().env == "development"
    except Exception:
        return False


def _effective_max(max_count: int, *, dev_max: int = 1000) -> int:
    """In local development, relax limits so verification testing isn't blocked."""
    return dev_max if _is_development() else max_count

AUTH_REGISTER_MAX_PER_IP = 10
AUTH_REGISTER_WINDOW_SECONDS = 3600

AUTH_LOGIN_MAX_PER_IP = 30
AUTH_LOGIN_MAX_PER_IDENTIFIER = 10
AUTH_LOGIN_WINDOW_SECONDS = 900

AUTH_VERIFY_EMAIL_RESEND_MAX = 5
AUTH_VERIFY_EMAIL_RESEND_WINDOW_SECONDS = 3600

AUTH_VERIFY_EMAIL_CONFIRM_MAX_PER_IP = 20
AUTH_VERIFY_EMAIL_CONFIRM_WINDOW_SECONDS = 3600

AUTH_VERIFY_PHONE_SEND_MAX = 5
AUTH_VERIFY_PHONE_SEND_WINDOW_SECONDS = 3600

AUTH_CHANGE_CONTACT_MAX = 10
AUTH_CHANGE_CONTACT_WINDOW_SECONDS = 3600

AUTH_GOOGLE_CALLBACK_MAX_PER_IP = 30
AUTH_GOOGLE_CALLBACK_WINDOW_SECONDS = 3600


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _allow(key: str, *, max_count: int, window_seconds: int) -> bool:
    now = time.monotonic()
    with _lock:
        count, started = _windows.get(key, (0, now))
        if now - started >= window_seconds:
            _windows[key] = (1, now)
            return True
        if count >= max_count:
            return False
        _windows[key] = (count + 1, started)
        return True


def enforce_rate_limit(key: str, *, max_count: int, window_seconds: int) -> None:
    if _allow(key, max_count=max_count, window_seconds=window_seconds):
        return
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please try again later.",
    )


def enforce_register_rate_limit(request: Request) -> None:
    enforce_rate_limit(
        f"auth:register:{client_ip(request)}",
        max_count=AUTH_REGISTER_MAX_PER_IP,
        window_seconds=AUTH_REGISTER_WINDOW_SECONDS,
    )


def enforce_login_rate_limit(request: Request, identifier: str) -> None:
    normalized = identifier.strip().lower()
    enforce_rate_limit(
        f"auth:login:ip:{client_ip(request)}",
        max_count=AUTH_LOGIN_MAX_PER_IP,
        window_seconds=AUTH_LOGIN_WINDOW_SECONDS,
    )
    enforce_rate_limit(
        f"auth:login:id:{normalized}",
        max_count=AUTH_LOGIN_MAX_PER_IDENTIFIER,
        window_seconds=AUTH_LOGIN_WINDOW_SECONDS,
    )


def enforce_verify_email_resend_rate_limit(user_id: str) -> None:
    enforce_rate_limit(
        f"auth:verify-email-resend:{user_id}",
        max_count=_effective_max(AUTH_VERIFY_EMAIL_RESEND_MAX),
        window_seconds=AUTH_VERIFY_EMAIL_RESEND_WINDOW_SECONDS,
    )


def enforce_verify_email_confirm_rate_limit(request: Request) -> None:
    enforce_rate_limit(
        f"auth:verify-email-confirm:{client_ip(request)}",
        max_count=AUTH_VERIFY_EMAIL_CONFIRM_MAX_PER_IP,
        window_seconds=AUTH_VERIFY_EMAIL_CONFIRM_WINDOW_SECONDS,
    )


def enforce_verify_phone_send_rate_limit(user_id: str) -> None:
    enforce_rate_limit(
        f"auth:verify-phone-send:{user_id}",
        max_count=_effective_max(AUTH_VERIFY_PHONE_SEND_MAX),
        window_seconds=AUTH_VERIFY_PHONE_SEND_WINDOW_SECONDS,
    )


def enforce_change_contact_rate_limit(user_id: str) -> None:
    enforce_rate_limit(
        f"auth:change-contact:{user_id}",
        max_count=_effective_max(AUTH_CHANGE_CONTACT_MAX),
        window_seconds=AUTH_CHANGE_CONTACT_WINDOW_SECONDS,
    )


def enforce_google_callback_rate_limit(request: Request) -> None:
    enforce_rate_limit(
        f"auth:google:{client_ip(request)}",
        max_count=AUTH_GOOGLE_CALLBACK_MAX_PER_IP,
        window_seconds=AUTH_GOOGLE_CALLBACK_WINDOW_SECONDS,
    )


def reset_auth_rate_limits_for_tests() -> None:
    with _lock:
        _windows.clear()
