from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models.attachment import Attachment


class HubAttachmentsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_hub(self, hub_id: str) -> list[Attachment]:
        stmt: Select[tuple[Attachment]] = (
            select(Attachment)
            .where(Attachment.hub_id == hub_id)
            .where(Attachment.file_type.in_(("image", "file")))
            .order_by(Attachment.created_at.desc())
            .limit(200)
        )
        return list(self.db.scalars(stmt))

    def create(
        self,
        *,
        hub_id: str,
        file_url: str,
        file_type: str,
        source: str,
    ) -> Attachment:
        row = Attachment(
            id=str(uuid4()),
            hub_id=hub_id,
            file_url=file_url,
            file_type=file_type,
            source=source,
            created_at=datetime.now(UTC),
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row
