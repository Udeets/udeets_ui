from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HubContactInvite(Base):
    __tablename__ = "hub_contact_invites"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invited_by: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    contact_type: Mapped[str] = mapped_column(Text, nullable=False)
    contact_value: Mapped[str] = mapped_column(Text, nullable=False)
    contact_normalized: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    matched_user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    hub_invitation_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
