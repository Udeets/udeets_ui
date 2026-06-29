from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models.oauth_account import OAuthAccount
from app.db.models.user import User
from app.db.models.verification_challenge import VerificationChallenge


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_oauth_account(self, *, provider: str, provider_user_id: str) -> OAuthAccount | None:
        stmt = select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
        return self.db.scalar(stmt)

    def get_user_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email).limit(1))

    def get_user_by_phone(self, phone: str) -> User | None:
        return self.db.scalar(select(User).where(User.phone == phone).limit(1))

    def user_has_oauth_provider(self, user_id: str) -> bool:
        stmt = select(OAuthAccount.id).where(OAuthAccount.user_id == user_id).limit(1)
        return self.db.scalar(stmt) is not None

    def list_oauth_providers(self, user_id: str) -> list[str]:
        stmt = select(OAuthAccount.provider).where(OAuthAccount.user_id == user_id)
        return [p for p in self.db.scalars(stmt).all() if p]

    def create_user_with_oauth(
        self,
        *,
        email: str | None,
        email_verified: bool,
        provider: str,
        provider_user_id: str,
    ) -> tuple[User, OAuthAccount]:
        now = datetime.now(UTC)
        user_id = str(uuid4())
        user = User(
            id=user_id,
            email=email,
            email_verified=email_verified,
            created_at=now,
            updated_at=now,
        )
        self.db.add(user)
        self.db.flush()
        oauth_account = OAuthAccount(
            id=str(uuid4()),
            user_id=user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            created_at=now,
        )
        self.db.add(oauth_account)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(oauth_account)
        return user, oauth_account

    def create_user_with_password(
        self,
        *,
        email: str | None,
        phone: str | None,
        password_hash: str,
    ) -> User:
        now = datetime.now(UTC)
        user = User(
            id=str(uuid4()),
            email=email,
            email_verified=False,
            phone=phone,
            phone_verified=False,
            password_hash=password_hash,
            created_at=now,
            updated_at=now,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user_contact(self, user_id: str, *, channel: str, value: str) -> User | None:
        """Set a user's email or phone and reset that channel's verified flag."""
        user = self.get_user_by_id(user_id)
        if user is None:
            return None
        if channel == "email":
            user.email = value
            user.email_verified = False
        elif channel == "phone":
            user.phone = value
            user.phone_verified = False
        else:
            raise ValueError("Unsupported contact channel.")
        user.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user)
        return user

    def mark_email_verified(self, user_id: str) -> User | None:
        user = self.get_user_by_id(user_id)
        if user is None:
            return None
        user.email_verified = True
        user.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user)
        return user

    def mark_phone_verified(self, user_id: str) -> User | None:
        user = self.get_user_by_id(user_id)
        if user is None:
            return None
        user.phone_verified = True
        user.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user)
        return user

    def invalidate_active_challenges(self, user_id: str, *, channel: str) -> None:
        self.db.execute(
            delete(VerificationChallenge).where(
                VerificationChallenge.user_id == user_id,
                VerificationChallenge.channel == channel,
                VerificationChallenge.consumed_at.is_(None),
            )
        )
        self.db.commit()

    def create_verification_challenge(
        self,
        *,
        user_id: str,
        channel: str,
        token_hash: str,
        expires_at: datetime,
        purpose: str = "signup",
    ) -> VerificationChallenge:
        now = datetime.now(UTC)
        row = VerificationChallenge(
            id=str(uuid4()),
            user_id=user_id,
            channel=channel,
            purpose=purpose,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=now,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def get_active_challenge_by_hash(self, token_hash: str, *, channel: str) -> VerificationChallenge | None:
        now = datetime.now(UTC)
        stmt = (
            select(VerificationChallenge)
            .where(
                VerificationChallenge.token_hash == token_hash,
                VerificationChallenge.channel == channel,
                VerificationChallenge.consumed_at.is_(None),
                VerificationChallenge.expires_at > now,
            )
            .order_by(VerificationChallenge.created_at.desc())
            .limit(1)
        )
        return self.db.scalar(stmt)

    def consume_challenge(self, challenge_id: str) -> None:
        row = self.db.get(VerificationChallenge, challenge_id)
        if row is None:
            return
        row.consumed_at = datetime.now(UTC)
        self.db.commit()

    def increment_challenge_failed_attempts(self, challenge_id: str) -> int:
        row = self.db.get(VerificationChallenge, challenge_id)
        if row is None:
            return 0
        row.failed_attempts += 1
        self.db.commit()
        self.db.refresh(row)
        return row.failed_attempts

    def increment_user_verification_failures(self, user_id: str) -> User | None:
        user = self.get_user_by_id(user_id)
        if user is None:
            return None
        user.verification_failed_attempts += 1
        if user.verification_failed_attempts >= 10:
            user.verification_locked_until = datetime.now(UTC) + timedelta(minutes=15)
        user.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user)
        return user

    def reset_user_verification_failures(self, user_id: str) -> None:
        user = self.get_user_by_id(user_id)
        if user is None:
            return
        user.verification_failed_attempts = 0
        user.verification_locked_until = None
        user.updated_at = datetime.now(UTC)
        self.db.commit()

    def is_user_verification_locked(self, user: User) -> bool:
        if user.verification_locked_until is None:
            return False
        return user.verification_locked_until > datetime.now(UTC)
