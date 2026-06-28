from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.auth.google_oauth import exchange_google_code, fetch_google_userinfo, normalize_google_profile
from app.auth.jwt_tokens import create_access_token
from app.core.config import Settings
from app.db.repositories.auth import AuthRepository
from app.db.repositories.profiles import ProfilesRepository

GOOGLE_PROVIDER = "google"


@dataclass
class AuthCallbackResult:
    access_token: str
    user_id: str
    email: str | None
    full_name: str | None
    avatar_url: str | None
    is_new_user: bool


class AuthService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.auth_repo = AuthRepository(db)
        self.profiles_repo = ProfilesRepository(db)

    async def handle_google_callback(self, code: str) -> AuthCallbackResult:
        token_body = await exchange_google_code(code, self.settings)
        access_token_provider = token_body.get("access_token")
        if not isinstance(access_token_provider, str) or not access_token_provider:
            raise ValueError("Google token response missing access_token")

        userinfo = await fetch_google_userinfo(access_token_provider)
        profile = normalize_google_profile(userinfo)
        provider_user_id = profile["provider_user_id"]
        if not provider_user_id:
            raise ValueError("Google userinfo missing sub")

        oauth_account = self.auth_repo.get_oauth_account(
            provider=GOOGLE_PROVIDER,
            provider_user_id=provider_user_id,
        )
        is_new_user = oauth_account is None

        if oauth_account is None:
            user, _oauth = self.auth_repo.create_user_with_oauth(
                email=profile["email"],
                email_verified=bool(profile["email_verified"]),
                provider=GOOGLE_PROVIDER,
                provider_user_id=provider_user_id,
            )
            user_id = user.id
        else:
            user = self.auth_repo.get_user_by_id(oauth_account.user_id)
            if user is None:
                raise ValueError("OAuth account references missing user")
            user_id = user.id

        self.profiles_repo.upsert(
            user_id=user_id,
            full_name=profile["full_name"],
            avatar_url=profile["avatar_url"],
            email=profile["email"],
        )

        access_token = create_access_token(
            user_id=user_id,
            email=profile["email"],
            settings=self.settings,
        )

        return AuthCallbackResult(
            access_token=access_token,
            user_id=user_id,
            email=profile["email"],
            full_name=profile["full_name"],
            avatar_url=profile["avatar_url"],
            is_new_user=is_new_user,
        )
