from sqlalchemy.orm import Session

from app.auth.verification_status import is_verification_complete
from app.db.repositories.auth import AuthRepository


def is_user_verification_complete(db: Session, user_id: str) -> bool:
    user = AuthRepository(db).get_user_by_id(user_id)
    return user is not None and is_verification_complete(user)
