from datetime import datetime

from sqlalchemy import DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DeetLike(Base):
    __tablename__ = "deet_likes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    deet_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    reaction_type: Mapped[str] = mapped_column(Text, nullable=False, default="like")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeetComment(Base):
    __tablename__ = "deet_comments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    deet_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeetView(Base):
    __tablename__ = "deet_views"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    deet_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeetShare(Base):
    __tablename__ = "deet_shares"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    deet_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    shared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    comment_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    reaction_type: Mapped[str] = mapped_column(Text, nullable=False, default="like")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PollVote(Base):
    __tablename__ = "poll_votes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    deet_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    option_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    deet_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    question_index: Mapped[int] = mapped_column(Integer, nullable=False)
    option_index: Mapped[int] = mapped_column(Integer, nullable=False)
    fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
