from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class ChatEventType(StrEnum):
    MESSAGE_CREATED = "message.created"
    MESSAGE_EDITED = "message.edited"
    MESSAGE_DELETED = "message.deleted"
    MODERATION_MESSAGE_HIDDEN = "moderation.message_hidden"
    REACTION_UPDATED = "reaction.updated"
    POLL_UPDATED = "poll.updated"
    ROOM_MEMBER_JOINED = "room.member_joined"
    ROOM_MEMBER_REMOVED = "room.member_removed"
    ROOM_ACCESS_REVOKED = "room.access_revoked"
    ROOM_SETTINGS_UPDATED = "room.settings_updated"
    TYPING_STARTED = "typing.started"
    TYPING_STOPPED = "typing.stopped"
    TYPING_SNAPSHOT = "typing.snapshot"
    PRESENCE_UPDATED = "presence.updated"


class ChatEventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: ChatEventType
    room_id: str
    message_id: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    payload: dict[str, Any] = Field(default_factory=dict)

    def to_json(self) -> str:
        return self.model_dump_json()

    @classmethod
    def from_json(cls, raw: str) -> "ChatEventEnvelope":
        return cls.model_validate_json(raw)
