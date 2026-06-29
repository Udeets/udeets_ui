from app.auth.verification_status import is_verification_complete, verification_pending_channels
from app.db.models.user import User


def _user(*, email: str | None = None, phone: str | None = None, email_verified=False, phone_verified=False) -> User:
    return User(
        id="u1",
        email=email,
        phone=phone,
        email_verified=email_verified,
        phone_verified=phone_verified,
    )


def test_complete_when_only_email_verified() -> None:
    user = _user(email="a@b.com", phone="+15551234567", email_verified=True, phone_verified=False)
    assert is_verification_complete(user) is True
    assert verification_pending_channels(user) == ["phone"]


def test_complete_when_only_phone_verified() -> None:
    user = _user(email="a@b.com", phone="+15551234567", email_verified=False, phone_verified=True)
    assert is_verification_complete(user) is True
    assert verification_pending_channels(user) == ["email"]


def test_incomplete_when_neither_verified() -> None:
    user = _user(email="a@b.com", phone="+15551234567")
    assert is_verification_complete(user) is False
    assert set(verification_pending_channels(user)) == {"email", "phone"}


def test_complete_for_phone_only_account() -> None:
    user = _user(phone="+15551234567", phone_verified=True)
    assert is_verification_complete(user) is True


def test_incomplete_for_phone_only_unverified() -> None:
    user = _user(phone="+15551234567")
    assert is_verification_complete(user) is False
