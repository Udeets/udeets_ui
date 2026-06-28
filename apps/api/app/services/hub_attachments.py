from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.repositories.hub_attachments import HubAttachmentsRepository
from app.db.repositories.hubs import HubRepository
from app.db.repositories.memberships import MembershipRepository
from app.services.media import to_public_media_url


class HubAttachmentsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.attachments = HubAttachmentsRepository(db)
        self.hubs = HubRepository(db)
        self.memberships = MembershipRepository(db)

    def _resolve_url(self, value: object) -> str | None:
        raw = str(value or "").strip()
        if not raw:
            return None
        return to_public_media_url(raw) or raw

    def _assert_hub_admin(self, *, hub_id: str, user_id: str) -> None:
        hub = self.hubs.get_hub_by_id(hub_id=hub_id)
        if not hub:
            raise HTTPException(status_code=404, detail="Hub not found")
        if not self.memberships.can_manage_hub(hub_id, user_id):
            raise HTTPException(status_code=403, detail="Only hub admins can upload files")

    def list_hub_attachments(self, hub_id: str) -> list[dict]:
        rows = self.attachments.list_for_hub(hub_id)
        return [
            {
                "id": row.id,
                "file_url": self._resolve_url(row.file_url),
                "file_type": row.file_type,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]

    def create_hub_attachment(
        self,
        *,
        hub_id: str,
        user_id: str,
        file_url: str,
        file_type: str,
        source: str,
    ) -> dict:
        normalized_type = file_type.strip().lower()
        if normalized_type not in {"image", "file"}:
            raise HTTPException(status_code=400, detail="file_type must be image or file")

        normalized_source = source.strip() or "admin_upload"
        normalized_url = file_url.strip()
        if not normalized_url:
            raise HTTPException(status_code=400, detail="file_url is required")

        self._assert_hub_admin(hub_id=hub_id, user_id=user_id)

        row = self.attachments.create(
            hub_id=hub_id,
            file_url=normalized_url,
            file_type=normalized_type,
            source=normalized_source,
        )
        return {
            "id": row.id,
            "file_url": self._resolve_url(row.file_url),
            "file_type": row.file_type,
            "created_at": (
                row.created_at.isoformat()
                if row.created_at
                else datetime.now(UTC).isoformat()
            ),
        }
