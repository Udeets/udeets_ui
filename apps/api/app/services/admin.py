from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.admin import AdminRepository


class AdminService:
    def __init__(self, db: Session) -> None:
        self.repo = AdminRepository(db)

    def _assert_super_admin(self, requester_id: str) -> None:
        if str(self.repo.get_app_role(requester_id) or "user") != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin required",
            )

    def list_users(
        self,
        requester_id: str,
        search: str | None,
        role_filter: str | None,
        limit: int,
        offset: int,
    ) -> dict:
        self._assert_super_admin(requester_id)
        page_limit = max(1, min(limit, 100))
        page_offset = max(0, offset)
        rows, total = self.repo.list_users(
            search=search,
            role_filter=role_filter,
            limit=page_limit,
            offset=page_offset,
        )
        users = [
            {
                "id": row.id,
                "fullName": row.full_name,
                "email": row.email,
                "avatarUrl": row.avatar_url,
                "appRole": str(row.app_role or "user"),
                "createdAt": row.created_at.isoformat() if row.created_at else None,
                "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
            }
            for row in rows
        ]
        return {"users": users, "total": total}

    def update_user_role(self, requester_id: str, user_id: str, new_role: str) -> dict:
        self._assert_super_admin(requester_id)
        if new_role not in {"user", "super_admin"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid app role")
        if not self.repo.update_app_role(user_id=user_id, new_role=new_role):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"success": True}
