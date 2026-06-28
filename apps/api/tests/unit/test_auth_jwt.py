import jwt
import pytest

from app.auth.jwt_tokens import create_access_token, decode_access_token
from app.auth.google_oauth import normalize_google_profile
from app.core.config import Settings


@pytest.fixture
def settings() -> Settings:
    return Settings(
        jwt_secret="test-secret-key",
        jwt_issuer="udeets-test",
        jwt_access_ttl_seconds=3600,
    )


def test_create_and_decode_access_token(settings: Settings) -> None:
    token = create_access_token(user_id="user-1", email="alice@example.com", settings=settings)
    payload = decode_access_token(token, settings)
    assert payload["sub"] == "user-1"
    assert payload["email"] == "alice@example.com"
    assert payload["iss"] == "udeets-test"


def test_decode_rejects_wrong_secret(settings: Settings) -> None:
    token = create_access_token(user_id="user-1", email=None, settings=settings)
    other = Settings(jwt_secret="other-secret", jwt_issuer="udeets-test", jwt_access_ttl_seconds=3600)
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(token, other)


def test_decode_rejects_expired_token(settings: Settings) -> None:
    settings.jwt_access_ttl_seconds = -10
    token = create_access_token(user_id="user-1", email=None, settings=settings)
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(token, settings)


def test_normalize_google_profile() -> None:
    profile = normalize_google_profile(
        {
            "sub": "google-sub-123",
            "email": "bob@example.com",
            "email_verified": True,
            "name": "Bob Sharma",
            "picture": "https://example.com/avatar.jpg",
        }
    )
    assert profile["provider_user_id"] == "google-sub-123"
    assert profile["email"] == "bob@example.com"
    assert profile["email_verified"] is True
    assert profile["full_name"] == "Bob Sharma"
    assert profile["avatar_url"] == "https://example.com/avatar.jpg"
