import re


def normalize_email(raw: str | None) -> str | None:
    if raw is None:
        return None
    value = raw.strip().lower()
    if not value or "@" not in value:
        return None
    return value


def normalize_phone(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    digits = "".join(ch for ch in text if ch.isdigit())
    if len(digits) == 10:
        national = digits
    elif len(digits) == 11 and digits.startswith("1"):
        national = digits[1:]
    else:
        return None
    if len(national) != 10:
        return None
    return f"+1{national}"


def normalize_login_identifier(raw: str) -> tuple[str, str]:
    """Return (kind, normalized) where kind is 'email' or 'phone'."""
    email = normalize_email(raw)
    if email:
        return "email", email
    phone = normalize_phone(raw)
    if phone:
        return "phone", phone
    raise ValueError("Enter a valid email address or phone number.")
