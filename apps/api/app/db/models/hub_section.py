from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HubSection(Base):
    __tablename__ = "hub_sections"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class HubSectionItem(Base):
    __tablename__ = "hub_section_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    section_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    tag: Mapped[str | None] = mapped_column(Text, nullable=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
