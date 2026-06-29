from app.db.models.user import User


def verification_pending_channels(user: User) -> list[str]:
    """Contact channels on the account that are not verified yet (for profile / optional follow-up)."""
    pending: list[str] = []
    if user.email and not user.email_verified:
        pending.append("email")
    if user.phone and not user.phone_verified:
        pending.append("phone")
    return pending


def is_verification_complete(user: User) -> bool:
    """Account access is allowed once at least one provided contact method is verified."""
    if not user.email and not user.phone:
        return False
    if user.email and user.email_verified:
        return True
    if user.phone and user.phone_verified:
        return True
    return False


# Backwards-compatible alias used in auth responses.
def verification_required_channels(user: User) -> list[str]:
    return verification_pending_channels(user)
