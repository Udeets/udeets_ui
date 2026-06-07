from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class NotificationEventType(StrEnum):
    CHAT_HUB_UNREAD = "chat.hub_unread"
    CHAT_HUB_READ = "chat.hub_read"
    CHAT_ROOM_UNREAD = "chat.room_unread"
    CHAT_ROOM_READ = "chat.room_read"
    FEED_INVALIDATE = "feed.invalidate"
    UNREAD_CHANGED = "unread.changed"
    MEMBER_PENDING = "member.pending"
    MEMBER_JOIN_ACCEPTED = "member.join_accepted"


class NotificationEventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: NotificationEventType
    user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    payload: dict[str, Any] = Field(default_factory=dict)

    def to_json(self) -> str:
        return self.model_dump_json()

    @classmethod
    def from_json(cls, raw: str) -> "NotificationEventEnvelope":
        return cls.model_validate_json(raw)
