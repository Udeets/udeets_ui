import hashlib
import logging
import re

import httpx
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

logger = logging.getLogger(__name__)

_hasher = PasswordHasher(time_cost=2, memory_cost=19_456, parallelism=1, hash_len=32, salt_len=16)

_MIN_LENGTH = 12
_MAX_LENGTH = 128


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, plain)
    except VerifyMismatchError:
        return False


def validate_password_policy(plain: str) -> str | None:
    trimmed = plain.strip()
    if trimmed != plain:
        return "Password cannot have leading or trailing spaces."
    if len(plain) < _MIN_LENGTH:
        return f"Password must be at least {_MIN_LENGTH} characters."
    if len(plain) > _MAX_LENGTH:
        return f"Password must be at most {_MAX_LENGTH} characters."
    return None


async def is_password_breached(plain: str) -> bool:
    """Check Have I Been Pwned k-anonymity API; fail open on network errors."""
    digest = hashlib.sha1(plain.encode("utf-8")).hexdigest().upper()
    prefix, suffix = digest[:5], digest[5:]
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                headers={"Add-Padding": "true"},
            )
            response.raise_for_status()
            for line in response.text.splitlines():
                part, _count = line.split(":", 1)
                if part.strip().upper() == suffix:
                    return True
    except Exception:
        logger.debug("HIBP password check skipped due to error", exc_info=True)
    return False


async def assert_password_acceptable(plain: str) -> None:
    policy_error = validate_password_policy(plain)
    if policy_error:
        raise ValueError(policy_error)
    if await is_password_breached(plain):
        raise ValueError("This password has appeared in a data breach. Choose a different password.")


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***"
    if len(local) <= 1:
        masked_local = "*"
    else:
        masked_local = f"{local[0]}***"
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 4:
        return "••••"
    return f"••• ••• {digits[-4:]}"
