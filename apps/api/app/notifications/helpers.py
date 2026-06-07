from __future__ import annotations

from typing import Any

from app.notifications.events import NotificationEventEnvelope, NotificationEventType
from app.notifications.publish import schedule_notification_publish


def publish_chat_hub_unread(*, user_id: str, hub_id: str) -> None:
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.CHAT_HUB_UNREAD,
            user_id=user_id,
            payload={"hubId": hub_id},
        )
    )


def publish_chat_hub_read(*, user_id: str, hub_id: str) -> None:
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.CHAT_HUB_READ,
            user_id=user_id,
            payload={"hubId": hub_id},
        )
    )


def publish_chat_room_unread(*, user_id: str, hub_id: str, room_id: str) -> None:
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.CHAT_ROOM_UNREAD,
            user_id=user_id,
            payload={"hubId": hub_id, "roomId": room_id},
        )
    )


def publish_chat_room_read(*, user_id: str, hub_id: str, room_id: str) -> None:
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.CHAT_ROOM_READ,
            user_id=user_id,
            payload={"hubId": hub_id, "roomId": room_id},
        )
    )


def publish_feed_invalidate(*, user_id: str, reason: str | None = None) -> None:
    payload: dict[str, Any] = {}
    if reason:
        payload["reason"] = reason
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.FEED_INVALIDATE,
            user_id=user_id,
            payload=payload,
        )
    )


def publish_unread_changed(*, user_id: str, hub_id: str | None = None) -> None:
    payload: dict[str, Any] = {}
    if hub_id:
        payload["hubId"] = hub_id
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.UNREAD_CHANGED,
            user_id=user_id,
            payload=payload,
        )
    )


def publish_member_pending(*, user_id: str, hub_id: str, requester_user_id: str) -> None:
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.MEMBER_PENDING,
            user_id=user_id,
            payload={"hubId": hub_id, "requesterUserId": requester_user_id},
        )
    )


def publish_member_join_accepted(*, user_id: str, hub_id: str) -> None:
    schedule_notification_publish(
        NotificationEventEnvelope(
            event_type=NotificationEventType.MEMBER_JOIN_ACCEPTED,
            user_id=user_id,
            payload={"hubId": hub_id},
        )
    )
