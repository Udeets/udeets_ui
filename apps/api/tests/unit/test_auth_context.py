import pytest

from app.auth.auth_context import auth_context_from_payload, resolve_auth_context
from app.auth.jwt_tokens import create_access_token, create_access_token_for_user
from app.core.config import Settings
from app.db.models.user import User

class _FakeDb:
    def get(self, _model, _user_id: str):
        return None


@pytest.fixture
def settings() -> Settings:
    return Settings(
        jwt_secret="test-secret-key-for-auth-context-tests",
        jwt_issuer="udeets-test",
        jwt_access_ttl_seconds=3600,
    )


def test_resolve_auth_context_uses_jwt_fast_path_without_db(settings: Settings) -> None:
    user = User(
        id="user-1",
        email="alice@example.com",
        email_verified=True,
        phone_verified=False,
        password_hash="hash",
    )
    token = create_access_token_for_user(user, settings, auth_methods=["password"])
    context = resolve_auth_context(token=token, settings=settings, db=_FakeDb())
    assert context.verification_complete is True
    assert context.source == "jwt"


def test_resolve_auth_context_checks_db_when_jwt_not_verified(settings: Settings) -> None:
    user = User(
        id="user-1",
        email="alice@example.com",
        email_verified=True,
        phone_verified=False,
        password_hash="hash",
    )
    token = create_access_token(
        user_id=user.id,
        email=user.email,
        settings=settings,
        email_verified=False,
        phone_verified=False,
        verification_complete=False,
        auth_methods=["password"],
    )

    class _DbWithUser:
        def get(self, _model, user_id: str):
            if user_id == "user-1":
                return User(
                    id="user-1",
                    email="alice@example.com",
                    email_verified=True,
                    phone_verified=False,
                    password_hash="hash",
                )
            return None

    context = resolve_auth_context(token=token, settings=settings, db=_DbWithUser())
    assert context.verification_complete is True
    assert context.source == "db"


def test_auth_context_from_payload_reflects_claims() -> None:
    context = auth_context_from_payload(
        {
            "sub": "user-1",
            "email_verified": True,
            "phone_verified": False,
            "verification_complete": True,
        }
    )
    assert context.verification_complete is True
    assert context.email_verified is True
