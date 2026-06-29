import hashlib
import hmac
import secrets


def generate_email_token() -> str:
    return secrets.token_urlsafe(32)


def generate_phone_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_verification_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def verify_token_hash(raw: str, stored_hash: str) -> bool:
    computed = hash_verification_token(raw)
    return hmac.compare_digest(computed, stored_hash)
