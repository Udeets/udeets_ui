from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HubJoinLink(Base):
    __tablename__ = "hub_join_links"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    token: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    disabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
