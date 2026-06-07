from datetime import datetime

from sqlalchemy import JSON, BigInteger, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retention_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    sender_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    message_kind: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    reply_to_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    moderation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    sender_display_name_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    sender_avatar_url_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)


class ChatMessageAttachment(Base):
    __tablename__ = "chat_message_attachments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    message_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    original_filename: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    scan_status: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    thumbnail_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_preview_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    exif_stripped_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class ChatMessageReaction(Base):
    __tablename__ = "chat_message_reactions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    message_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    emoji: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)


class ChatMessageReport(Base):
    __tablename__ = "chat_message_reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    reporter_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    target_message_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    target_user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    reason_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolver_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    appeal_status: Mapped[str] = mapped_column(Text, nullable=False)
    appeal_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    appeal_submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_notes_internal: Mapped[str | None] = mapped_column(Text, nullable=True)


class ChatModerationAction(Base):
    __tablename__ = "chat_moderation_actions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    hub_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    actor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    target_user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    target_message_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    action_type: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ChatPoll(Base):
    __tablename__ = "chat_polls"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    message_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    allow_multiple: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    anonymous_voting: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ChatPollOption(Base):
    __tablename__ = "chat_poll_options"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    poll_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)


class ChatPollVote(Base):
    __tablename__ = "chat_poll_votes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    poll_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    option_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)


class ChatRoomBan(Base):
    __tablename__ = "chat_room_bans"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    banned_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ChatRoomInvite(Base):
    __tablename__ = "chat_room_invites"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invited_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invited_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    token: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ChatRoomMembership(Base):
    __tablename__ = "chat_room_memberships"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    invited_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ChatRoomMute(Base):
    __tablename__ = "chat_room_mutes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    muted_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    muted_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ChatRoomTyping(Base):
    __tablename__ = "chat_room_typing"

    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ChatRoomReadState(Base):
    __tablename__ = "chat_room_read_state"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    last_read_message_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    last_read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
