from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.deets import DeetsRepository, deet_row_to_dict


class DeetsService:
    def __init__(self, db: Session) -> None:
        self.repo = DeetsRepository(db)

    def list_deets(
        self,
        user_id: str,
        hub_ids: list[str] | None = None,
        kinds: list[str] | None = None,
        limit: int | None = None,
        published_only: bool | None = None,
        drafts_only: bool | None = None,
    ) -> dict:
        rows = self.repo.list_deets(
            user_id=user_id,
            hub_ids=hub_ids,
            kinds=kinds,
            limit=limit,
            published_only=published_only,
            drafts_only=drafts_only,
        )
        return {"deets": [deet_row_to_dict(row) for row in rows]}

    def create_deet(self, user_id: str, payload: dict) -> dict:
        hub_id = str(payload.get("hubId") or "")
        if not hub_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="hubId is required."
            )
        if not self.repo.assert_active_member(user_id=user_id, hub_id=hub_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only active hub members can create deets.",
            )
        row = self.repo.create_deet(user_id=user_id, payload=payload)
        return {"deet": deet_row_to_dict(row)}

    def update_deet(self, user_id: str, deet_id: str, payload: dict) -> dict:
        current = self.repo.get_by_id(deet_id)
        if current is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deet not found.")
        hub_id = str(current.hub_id or "")
        if not self.repo.assert_can_write_deet(user_id=user_id, hub_id=hub_id, deet=current):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the author or hub staff can update this deet.",
            )
        updated = self.repo.update_deet(deet_id=deet_id, payload=payload)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update deet.",
            )
        return {"deet": deet_row_to_dict(updated)}

    def delete_deet(self, user_id: str, deet_id: str) -> dict:
        current = self.repo.get_by_id(deet_id)
        if current is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deet not found.")
        hub_id = str(current.hub_id or "")
        if not self.repo.assert_can_write_deet(user_id=user_id, hub_id=hub_id, deet=current):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the author or hub staff can delete this deet.",
            )
        self.repo.delete_deet(deet_id)
        return {"ok": True}
