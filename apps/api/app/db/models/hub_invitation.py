from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HubInvitation(Base):
    __tablename__ = "hub_invitations"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    hub_id: Mapped[str] = mapped_column(Text, nullable=False)
    invited_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    invited_user_id: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
