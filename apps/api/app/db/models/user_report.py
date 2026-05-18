from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserReport(Base):
    __tablename__ = "user_reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    reporter_id: Mapped[str] = mapped_column(Text, nullable=False)
    reported_user_id: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
