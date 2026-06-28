from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.db.models.profile import Profile


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_app_role(self, user_id: str) -> str | None:
        role = self.db.scalar(
            select(Profile.app_role).where(Profile.id == user_id).limit(1)
        )
        return str(role) if role is not None else None

    def list_users(
        self,
        *,
        search: str | None,
        role_filter: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Profile], int]:
        stmt: Select[tuple[Profile]] = select(Profile)
        count_stmt = select(func.count()).select_from(Profile)

        if search:
            safe = search.strip()
            if safe:
                pattern = f"%{safe}%"
                search_filter = or_(
                    Profile.full_name.ilike(pattern),
                    Profile.email.ilike(pattern),
                )
                stmt = stmt.where(search_filter)
                count_stmt = count_stmt.where(search_filter)

        if role_filter and role_filter != "all":
            stmt = stmt.where(Profile.app_role == role_filter)
            count_stmt = count_stmt.where(Profile.app_role == role_filter)

        stmt = stmt.order_by(Profile.created_at.desc()).limit(limit).offset(offset)
        rows = list(self.db.scalars(stmt))
        total = int(self.db.scalar(count_stmt) or 0)
        return rows, total

    def update_app_role(self, *, user_id: str, new_role: str) -> bool:
        profile = self.db.scalar(select(Profile).where(Profile.id == user_id).limit(1))
        if profile is None:
            return False
        profile.app_role = new_role
        profile.updated_at = datetime.now(UTC)
        self.db.commit()
        return True
