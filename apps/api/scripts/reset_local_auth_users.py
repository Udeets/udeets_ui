#!/usr/bin/env python3
"""Delete local credential-auth users so you can sign up again (development only)."""

from __future__ import annotations

import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


def main() -> int:
    from sqlalchemy import delete, func, select

    from app.core.config import get_settings
    from app.db.models.oauth_account import OAuthAccount
    from app.db.models.profile import Profile
    from app.db.models.user import User
    from app.db.models.verification_challenge import VerificationChallenge
    from app.db.session import SessionLocal

    settings = get_settings()
    if settings.env not in ("development", "local", "test"):
        print("Refusing to run outside development.", file=sys.stderr)
        return 1

    with SessionLocal() as db:
        user_count = db.scalar(select(func.count()).select_from(User)) or 0
        if user_count == 0:
            print("No users to delete.")
            return 0

        db.execute(delete(VerificationChallenge))
        db.execute(delete(OAuthAccount))
        db.execute(delete(Profile))
        db.execute(delete(User))
        db.commit()
        print(f"Deleted {user_count} local user(s). You can sign up again at /auth?mode=signup.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
