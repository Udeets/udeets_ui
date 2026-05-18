from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Deet(Base):
    __tablename__ = "deets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    author_name: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    preview_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    preview_image_urls: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    attachments: Mapped[list | dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    like_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    view_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    share_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allow_comments: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
