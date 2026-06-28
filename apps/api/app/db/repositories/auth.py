from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.oauth_account import OAuthAccount
from app.db.models.user import User


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
