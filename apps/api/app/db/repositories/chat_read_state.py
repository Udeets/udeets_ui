"""Per-user chat room read cursors and unread queries."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, exists, or_, select
from sqlalchemy.orm import Session

from app.db.models.chat import ChatMessage, ChatRoom, ChatRoomMembership, ChatRoomReadState


class ChatReadStateRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _now() -> datetime:
        return datetime.now(UTC)

    def upsert_read(
        self,
        *,
        user_id: str,
        room_id: str,
        message_id: str | None,
        read_at: datetime | None = None,
    ) -> None:
        when = read_at or self._now()
        row = self.db.scalar(
            select(ChatRoomReadState)
            .where(ChatRoomReadState.user_id == user_id)
            .where(ChatRoomReadState.room_id == room_id)
            .limit(1)
        )
        if row is None:
            self.db.add(
                ChatRoomReadState(
                    user_id=user_id,
                    room_id=room_id,
                    last_read_message_id=message_id,
                    last_read_at=when,
                )
            )
        else:
            row.last_read_message_id = message_id
            row.last_read_at = when
        self.db.commit()

    def get_hub_unread(self, *, user_id: str, hub_id: str) -> dict[str, Any]:
        unread_room_ids = self.list_unread_room_ids_for_hub(user_id=user_id, hub_id=hub_id)
        return {
            "hubId": hub_id,
            "hasUnread": len(unread_room_ids) > 0,
            "unreadRoomIds": unread_room_ids,
        }

    def list_unread_room_ids_for_hub(self, *, user_id: str, hub_id: str) -> list[str]:
        stmt = (
            select(ChatRoomMembership.room_id)
            .join(ChatRoom, ChatRoom.id == ChatRoomMembership.room_id)
            .where(ChatRoomMembership.user_id == user_id)
            .where(ChatRoomMembership.status == "active")
            .where(ChatRoom.hub_id == hub_id)
        )
        room_ids = [str(rid) for rid in self.db.scalars(stmt).all() if rid]
        return [room_id for room_id in room_ids if self.room_has_unread(user_id=user_id, room_id=room_id)]

    def room_has_unread(self, *, user_id: str, room_id: str) -> bool:
        unread = exists(
            select(ChatMessage.id)
            .outerjoin(
                ChatRoomReadState,
                and_(
                    ChatRoomReadState.room_id == ChatMessage.room_id,
                    ChatRoomReadState.user_id == user_id,
                ),
            )
            .where(ChatMessage.room_id == room_id)
            .where(ChatMessage.deleted_at.is_(None))
            .where(or_(ChatMessage.sender_id.is_(None), ChatMessage.sender_id != user_id))
            .where(
                or_(
                    ChatRoomReadState.last_read_at.is_(None),
                    ChatMessage.created_at > ChatRoomReadState.last_read_at,
                )
            )
        )
        return bool(self.db.scalar(select(unread)))
