from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.db.repositories.chat import ChatRepository
from app.db.repositories.chat_read_state import ChatReadStateRepository
from app.events.bus import schedule_domain_event
from app.notifications.helpers import (
    publish_chat_hub_read,
    publish_chat_hub_unread,
    publish_chat_room_read,
    publish_chat_room_unread,
)
from app.realtime.connection_manager import get_connection_manager

logger = logging.getLogger(__name__)


def notify_message_created(
    db: Session,
    *,
    room_id: str,
    hub_id: str,
    message_id: str,
    sender_id: str,
) -> None:
    """Update read cursors and push chat unread signals to room members not viewing the room."""
    chat = ChatRepository(db)
    read_state = ChatReadStateRepository(db)

    read_state.upsert_read(user_id=sender_id, room_id=room_id, message_id=message_id)

    members = chat.list_room_memberships(room_id, status="active")
    viewing = get_connection_manager().users_in_room(room_id)

    for member in members:
        user_id = str(member.get("user_id") or "")
        if not user_id or user_id == sender_id:
            continue
        if user_id in viewing:
            read_state.upsert_read(user_id=user_id, room_id=room_id, message_id=message_id)
            publish_chat_room_read(user_id=user_id, hub_id=hub_id, room_id=room_id)
            hub_unread = read_state.get_hub_unread(user_id=user_id, hub_id=hub_id)
            if not hub_unread["hasUnread"]:
                publish_chat_hub_read(user_id=user_id, hub_id=hub_id)
            continue

        publish_chat_room_unread(user_id=user_id, hub_id=hub_id, room_id=room_id)
        publish_chat_hub_unread(user_id=user_id, hub_id=hub_id)

    schedule_domain_event(
        "udeets.chat.message.created",
        {
            "roomId": room_id,
            "hubId": hub_id,
            "messageId": message_id,
            "senderId": sender_id,
        },
    )


def mark_room_read_and_notify(
    db: Session,
    *,
    user_id: str,
    room_id: str,
    hub_id: str,
    message_id: str | None,
) -> dict:
    read_state = ChatReadStateRepository(db)
    read_state.upsert_read(user_id=user_id, room_id=room_id, message_id=message_id)
    hub_unread = read_state.get_hub_unread(user_id=user_id, hub_id=hub_id)
    publish_chat_room_read(user_id=user_id, hub_id=hub_id, room_id=room_id)
    if hub_unread["hasUnread"]:
        publish_chat_hub_unread(user_id=user_id, hub_id=hub_id)
    else:
        publish_chat_hub_read(user_id=user_id, hub_id=hub_id)
    return hub_unread
