from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.realtime.events import ChatEventEnvelope, ChatEventType
from app.realtime.publish import schedule_publish


def _iso(value: Any) -> str:
    if value is None:
        return datetime.now(UTC).isoformat()
    return str(value)


def publish_message_created(*, room_id: str, message: dict[str, Any]) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.MESSAGE_CREATED,
            room_id=room_id,
            message_id=str(message.get("id")),
            created_at=_iso(message.get("created_at")),
            payload=_message_payload(message),
        )
    )


def publish_message_edited(*, room_id: str, message_id: str, message: dict[str, Any]) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.MESSAGE_EDITED,
            room_id=room_id,
            message_id=message_id,
            created_at=_iso(message.get("created_at")),
            payload=_message_payload(message),
        )
    )


def publish_message_deleted(
    *,
    room_id: str,
    message_id: str,
    message: dict[str, Any],
    moderation_hidden: bool = False,
) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.MESSAGE_DELETED,
            room_id=room_id,
            message_id=message_id,
            created_at=datetime.now(UTC).isoformat(),
            payload=_message_payload(message),
        )
    )
    if moderation_hidden:
        schedule_publish(
            ChatEventEnvelope(
                event_type=ChatEventType.MODERATION_MESSAGE_HIDDEN,
                room_id=room_id,
                message_id=message_id,
                created_at=datetime.now(UTC).isoformat(),
                payload=_message_payload(message),
            )
        )


def publish_reaction_updated(
    *,
    room_id: str,
    message_id: str,
    kind: str,
    reaction: dict[str, Any],
) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.REACTION_UPDATED,
            room_id=room_id,
            message_id=message_id,
            created_at=_iso(reaction.get("created_at")),
            payload={"kind": kind, "reaction": reaction},
        )
    )


def publish_poll_updated(*, room_id: str, poll_id: str, payload: dict[str, Any]) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.POLL_UPDATED,
            room_id=room_id,
            message_id=None,
            created_at=datetime.now(UTC).isoformat(),
            payload={"poll_id": poll_id, **payload},
        )
    )


def publish_room_member_joined(*, room_id: str, user_id: str, payload: dict[str, Any]) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.ROOM_MEMBER_JOINED,
            room_id=room_id,
            created_at=datetime.now(UTC).isoformat(),
            payload={"user_id": user_id, **payload},
        )
    )


def publish_room_member_removed(*, room_id: str, user_id: str, payload: dict[str, Any]) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.ROOM_MEMBER_REMOVED,
            room_id=room_id,
            created_at=datetime.now(UTC).isoformat(),
            payload={"user_id": user_id, **payload},
        )
    )


def publish_room_access_revoked(*, room_id: str, user_id: str, reason: str) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.ROOM_ACCESS_REVOKED,
            room_id=room_id,
            created_at=datetime.now(UTC).isoformat(),
            payload={"user_id": user_id, "reason": reason},
        )
    )


def publish_typing_started(*, room_id: str, user_id: str) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.TYPING_STARTED,
            room_id=room_id,
            created_at=datetime.now(UTC).isoformat(),
            payload={"user_id": user_id},
        )
    )


def publish_typing_stopped(*, room_id: str, user_id: str) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.TYPING_STOPPED,
            room_id=room_id,
            created_at=datetime.now(UTC).isoformat(),
            payload={"user_id": user_id},
        )
    )


def publish_typing_snapshot(*, room_id: str, user_ids: list[str]) -> None:
    schedule_publish(
        ChatEventEnvelope(
            event_type=ChatEventType.TYPING_SNAPSHOT,
            room_id=room_id,
            created_at=datetime.now(UTC).isoformat(),
            payload={"user_ids": user_ids},
        )
    )


def _message_payload(message: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(message.get("id") or ""),
        "room_id": str(message.get("room_id") or ""),
        "sender_id": str(message.get("sender_id")) if message.get("sender_id") else None,
        "message_kind": str(message.get("message_kind") or "text"),
        "body": message.get("body"),
        "created_at": _iso(message.get("created_at")),
        "edited_at": str(message.get("edited_at")) if message.get("edited_at") else None,
        "deleted_at": str(message.get("deleted_at")) if message.get("deleted_at") else None,
        "moderation_reason": message.get("moderation_reason"),
    }
