from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.auth.contact_normalize import normalize_email, normalize_phone
from app.auth.google_oauth import exchange_google_code, fetch_google_userinfo, normalize_google_profile
from app.auth.jwt_tokens import create_access_token_for_user
from app.auth.passwords import assert_password_acceptable, hash_password, verify_password
from app.auth.verification_status import is_verification_complete, verification_required_channels
from app.auth.verification_tokens import (
    generate_email_token,
    generate_phone_otp,
    hash_verification_token,
    verify_token_hash,
)
from app.core.config import Settings
from app.db.models.user import User
from app.db.repositories.auth import AuthRepository
from app.db.repositories.profiles import ProfilesRepository
from app.services.auth_delivery import AuthDeliveryService

GOOGLE_PROVIDER = "google"
INVALID_IDENTIFIER_ERROR = "Enter a valid email address or phone number."
GENERIC_LOGIN_ERROR = "Incorrect email/phone or password. Check your details and try again."
DUPLICATE_ACCOUNT_EXISTS_MESSAGE = (
    "An account already exists for this email or phone. Sign in to access your account."
)
OAUTH_ACCOUNT_EXISTS_MESSAGE = "An account already exists for this email. Sign in with Google instead."


@dataclass
class AuthResult:
    access_token: str
    user_id: str
    email: str | None
    phone: str | None
    full_name: str | None
    avatar_url: str | None
    email_verified: bool
    phone_verified: bool
    verification_complete: bool
    verification_required: list[str]
    is_new_user: bool
    message: str | None = None


class AuthService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.auth_repo = AuthRepository(db)
        self.profiles_repo = ProfilesRepository(db)
        self.delivery = AuthDeliveryService(settings)

    def _auth_result_for_user(
        self,
        user: User,
        *,
        full_name: str | None = None,
        avatar_url: str | None = None,
        is_new_user: bool = False,
        message: str | None = None,
        auth_methods: list[str] | None = None,
    ) -> AuthResult:
        profile = self.profiles_repo.get_by_id(user.id)
        resolved_name = full_name or (profile.full_name if profile else None)
        resolved_avatar = avatar_url or (profile.avatar_url if profile else None)
        return AuthResult(
            access_token=create_access_token_for_user(user, self.settings, auth_methods=auth_methods),
            user_id=user.id,
            email=user.email,
            phone=user.phone,
            full_name=resolved_name,
            avatar_url=resolved_avatar,
            email_verified=bool(user.email_verified),
            phone_verified=bool(user.phone_verified),
            verification_complete=is_verification_complete(user),
            verification_required=verification_required_channels(user),
            is_new_user=is_new_user,
            message=message,
        )

    async def handle_google_callback(self, code: str) -> AuthResult:
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
                # Google owns and verifies the account email, so treat it as verified.
                email_verified=True,
                provider=GOOGLE_PROVIDER,
                provider_user_id=provider_user_id,
            )
            user_id = user.id
        else:
            user = self.auth_repo.get_user_by_id(oauth_account.user_id)
            if user is None:
                raise ValueError("OAuth account references missing user")
            user_id = user.id
            if profile["email"] and not user.email_verified:
                user = self.auth_repo.mark_email_verified(user_id) or user

        self.profiles_repo.upsert(
            user_id=user_id,
            full_name=profile["full_name"],
            avatar_url=profile["avatar_url"],
            email=profile["email"],
        )
        user = self.auth_repo.get_user_by_id(user_id)
        if user is None:
            raise ValueError("User missing after Google sign-in")

        return self._auth_result_for_user(
            user,
            full_name=profile["full_name"],
            avatar_url=profile["avatar_url"],
            is_new_user=is_new_user,
            auth_methods=["oauth", "google"],
        )

    async def register(
        self,
        *,
        first_name: str,
        last_name: str,
        full_name: str,
        email: str | None,
        phone: str | None,
        password: str,
        confirm_password: str,
    ) -> AuthResult:
        first = first_name.strip()
        last = last_name.strip()
        name = full_name.strip() or f"{first} {last}".strip()
        if first and not first.replace(" ", ""):
            raise ValueError("Enter your first name.")
        if last and not last.replace(" ", ""):
            raise ValueError("Enter your last name.")
        if not first and not last:
            if len(name) < 2:
                raise ValueError("Enter your first and last name.")
        elif len(first) < 1 or len(last) < 1:
            raise ValueError("Enter your first and last name.")
        if password != confirm_password:
            raise ValueError("Passwords do not match.")

        normalized_email = normalize_email(email)
        normalized_phone = normalize_phone(phone)
        if not normalized_email and not normalized_phone:
            raise ValueError("Enter an email address or phone number.")

        await assert_password_acceptable(password)

        existing = None
        if normalized_email:
            existing = self.auth_repo.get_user_by_email(normalized_email)
        if existing is None and normalized_phone:
            existing = self.auth_repo.get_user_by_phone(normalized_phone)

        if existing is not None:
            if not existing.password_hash and self.auth_repo.user_has_oauth_provider(existing.id):
                return AuthResult(
                    access_token="",
                    user_id="",
                    email=normalized_email,
                    phone=normalized_phone,
                    full_name=None,
                    avatar_url=None,
                    email_verified=False,
                    phone_verified=False,
                    verification_complete=False,
                    verification_required=[],
                    is_new_user=False,
                    message=OAUTH_ACCOUNT_EXISTS_MESSAGE,
                )
            if normalized_email:
                await self.delivery.send_registration_attempt_notice(to_email=normalized_email)
            return AuthResult(
                access_token="",
                user_id="",
                email=normalized_email,
                phone=normalized_phone,
                full_name=None,
                avatar_url=None,
                email_verified=False,
                phone_verified=False,
                verification_complete=False,
                verification_required=[],
                is_new_user=False,
                message=DUPLICATE_ACCOUNT_EXISTS_MESSAGE,
            )

        user = self.auth_repo.create_user_with_password(
            email=normalized_email,
            phone=normalized_phone,
            password_hash=hash_password(password.strip()),
        )
        self.profiles_repo.upsert(
            user_id=user.id,
            full_name=name,
            avatar_url=None,
            email=normalized_email,
        )

        await self._send_signup_verifications(user)

        user = self.auth_repo.get_user_by_id(user.id)
        if user is None:
            raise ValueError("Registration failed")

        return self._auth_result_for_user(
            user,
            full_name=name,
            is_new_user=True,
            auth_methods=["password"],
        )

    async def login(self, *, identifier: str, password: str) -> AuthResult:
        normalized_email = normalize_email(identifier)
        normalized_phone = normalize_phone(identifier)
        if not normalized_email and not normalized_phone:
            raise ValueError(INVALID_IDENTIFIER_ERROR)

        user = None
        if normalized_email:
            user = self.auth_repo.get_user_by_email(normalized_email)
        if user is None and normalized_phone:
            user = self.auth_repo.get_user_by_phone(normalized_phone)
        if user is None:
            raise ValueError(GENERIC_LOGIN_ERROR)

        if not user.password_hash:
            if self.auth_repo.user_has_oauth_provider(user.id):
                raise ValueError(OAUTH_ACCOUNT_EXISTS_MESSAGE)
            raise ValueError(GENERIC_LOGIN_ERROR)

        if not verify_password(password.strip(), user.password_hash):
            raise ValueError(GENERIC_LOGIN_ERROR)

        return self._auth_result_for_user(user, auth_methods=["password"])

    async def change_contact(self, user: User, *, channel: str, value: str) -> AuthResult:
        """Add or change a user's email/phone, reset its verified flag, and send a challenge."""
        if channel not in ("email", "phone"):
            raise ValueError("Choose email or phone.")

        if channel == "email" and self.auth_repo.user_has_oauth_provider(user.id):
            raise ValueError("Your email is managed by your linked sign-in provider and can't be changed here.")

        if channel == "email":
            normalized = normalize_email(value)
            if not normalized:
                raise ValueError("Enter a valid email address.")
        else:
            normalized = normalize_phone(value)
            if not normalized:
                raise ValueError("Enter a valid 10-digit US phone number.")

        current = user.email if channel == "email" else user.phone
        already_verified = user.email_verified if channel == "email" else user.phone_verified
        if current == normalized and already_verified:
            raise ValueError(
                "This email is already verified." if channel == "email" else "This phone is already verified."
            )

        existing = (
            self.auth_repo.get_user_by_email(normalized)
            if channel == "email"
            else self.auth_repo.get_user_by_phone(normalized)
        )
        if existing is not None and existing.id != user.id:
            raise ValueError(
                "This email is already in use by another account."
                if channel == "email"
                else "This phone number is already in use by another account."
            )

        updated = self.auth_repo.update_user_contact(user.id, channel=channel, value=normalized)
        if updated is None:
            raise ValueError("Could not update contact.")

        if channel == "email":
            await self._create_and_send_email_challenge(updated)
        else:
            await self._create_and_send_phone_challenge(updated)

        return self._auth_result_for_user(updated, auth_methods=["password"])

    async def resend_email_verification(self, user: User) -> None:
        if not user.email or user.email_verified:
            return
        await self._create_and_send_email_challenge(user)

    async def send_phone_verification(self, user: User) -> None:
        if not user.phone or user.phone_verified:
            return
        if self.auth_repo.is_user_verification_locked(user):
            raise ValueError("Too many attempts. Try again later.")
        await self._create_and_send_phone_challenge(user)

    async def confirm_email_token(self, raw_token: str) -> AuthResult:
        token_hash = hash_verification_token(raw_token.strip())
        challenge = self.auth_repo.get_active_challenge_by_hash(token_hash, channel="email")
        if challenge is None:
            raise ValueError("This verification link is invalid or has expired.")

        user = self.auth_repo.get_user_by_id(challenge.user_id)
        if user is None:
            raise ValueError("This verification link is invalid or has expired.")

        self.auth_repo.consume_challenge(challenge.id)
        user = self.auth_repo.mark_email_verified(user.id) or user
        self.auth_repo.reset_user_verification_failures(user.id)
        user = self.auth_repo.get_user_by_id(user.id)
        if user is None:
            raise ValueError("Verification failed")

        return self._auth_result_for_user(user, auth_methods=["password"])

    async def confirm_phone_otp(self, user: User, code: str) -> AuthResult:
        if not user.phone or user.phone_verified:
            raise ValueError("Phone verification is not required.")
        if self.auth_repo.is_user_verification_locked(user):
            raise ValueError("Too many attempts. Try again later.")

        cleaned = code.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise ValueError("Enter the 6-digit code.")

        token_hash = hash_verification_token(cleaned)
        challenge = self.auth_repo.get_active_challenge_by_hash(token_hash, channel="phone")
        if challenge is None or challenge.user_id != user.id:
            self.auth_repo.increment_user_verification_failures(user.id)
            raise ValueError("Invalid or expired code.")

        if challenge.failed_attempts >= 5:
            self.auth_repo.increment_user_verification_failures(user.id)
            raise ValueError("Too many incorrect codes. Request a new code.")

        self.auth_repo.consume_challenge(challenge.id)
        user = self.auth_repo.mark_phone_verified(user.id) or user
        self.auth_repo.reset_user_verification_failures(user.id)
        user = self.auth_repo.get_user_by_id(user.id)
        if user is None:
            raise ValueError("Verification failed")

        return self._auth_result_for_user(user, auth_methods=["password"])

    def verification_status(self, user: User) -> dict:
        return {
            "email": user.email,
            "phone": user.phone,
            "emailVerified": bool(user.email_verified),
            "phoneVerified": bool(user.phone_verified),
            "verificationComplete": is_verification_complete(user),
            "verificationRequired": verification_required_channels(user),
        }

    async def _send_signup_verifications(self, user: User) -> None:
        if user.email and not user.email_verified:
            await self._create_and_send_email_challenge(user)
        if user.phone and not user.phone_verified:
            await self._create_and_send_phone_challenge(user)

    async def _create_and_send_email_challenge(self, user: User) -> None:
        self.auth_repo.invalidate_active_challenges(user.id, channel="email")
        raw = generate_email_token()
        expires = datetime.now(UTC) + timedelta(hours=24)
        self.auth_repo.create_verification_challenge(
            user_id=user.id,
            channel="email",
            token_hash=hash_verification_token(raw),
            expires_at=expires,
        )
        verify_url = f"{self.settings.auth_web_base_url.rstrip('/')}/auth/verify-email?token={raw}"
        if user.email:
            await self.delivery.send_email_verification(to_email=user.email, verify_url=verify_url)

    async def _create_and_send_phone_challenge(self, user: User) -> None:
        self.auth_repo.invalidate_active_challenges(user.id, channel="phone")
        raw = generate_phone_otp()
        expires = datetime.now(UTC) + timedelta(minutes=10)
        self.auth_repo.create_verification_challenge(
            user_id=user.id,
            channel="phone",
            token_hash=hash_verification_token(raw),
            expires_at=expires,
        )
        if user.phone:
            await self.delivery.send_phone_otp(to_phone=user.phone, code=raw)
