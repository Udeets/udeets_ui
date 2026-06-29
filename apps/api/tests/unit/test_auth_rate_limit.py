import pytest
from fastapi import HTTPException

from app.services.auth_rate_limit import (
    AUTH_LOGIN_MAX_PER_IDENTIFIER,
    AUTH_REGISTER_MAX_PER_IP,
    enforce_login_rate_limit,
    enforce_register_rate_limit,
    reset_auth_rate_limits_for_tests,
)
from fastapi import Request


class _FakeClient:
    host = "203.0.113.10"


def _request(ip: str = "203.0.113.10") -> Request:
    scope = {
        "type": "http",
        "headers": [],
        "client": (_FakeClient.host if ip else None, 0),
    }
    request = Request(scope)
    if ip != _FakeClient.host:
        request.scope["client"] = (ip, 0)
    return request


def test_register_rate_limit_blocks_after_cap() -> None:
    reset_auth_rate_limits_for_tests()
    request = _request()
    for _ in range(AUTH_REGISTER_MAX_PER_IP):
        enforce_register_rate_limit(request)
    with pytest.raises(HTTPException) as exc:
        enforce_register_rate_limit(request)
    assert exc.value.status_code == 429


def test_login_rate_limit_isolated_per_identifier() -> None:
    reset_auth_rate_limits_for_tests()
    request = _request()
    for _ in range(AUTH_LOGIN_MAX_PER_IDENTIFIER):
        enforce_login_rate_limit(request, "alice@example.com")
    with pytest.raises(HTTPException) as exc:
        enforce_login_rate_limit(request, "alice@example.com")
    assert exc.value.status_code == 429
    enforce_login_rate_limit(request, "bob@example.com")
