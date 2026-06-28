"""Typed chat data access via SQLAlchemy."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import and_, delete, or_, select, text, update
from sqlalchemy.orm import Session

from app.db.models.chat import (
    ChatMessage,
    ChatMessageAttachment,
    ChatMessageReaction,
    ChatMessageReport,
    ChatModerationAction,
    ChatPoll,
    ChatPollOption,
    ChatPollVote,
    ChatRoom,
    ChatRoomBan,
    ChatRoomInvite,
    ChatRoomMembership,
    ChatRoomMute,
)
from app.db.models.profile import Profile
from app.db.repositories.chat.mappers import (
    is_mute_active,
    membership_dict,
    parse_room_settings,
    row_to_dict,
)
from app.db.repositories.memberships import MembershipRepository


class ChatRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.memberships = MembershipRepository(db)

    @staticmethod
    def _now() -> datetime:
        return datetime.now(UTC)

    def _commit(self) -> None:
        self.db.commit()

    @staticmethod
    def _parse_dt(value: str | datetime | None) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None

    # --- Hub membership (delegates to MembershipRepository) ---

    def get_hub_membership(self, hub_id: str, user_id: str) -> dict[str, str] | None:
        row = self.memberships.get_my_membership(hub_id=hub_id, user_id=user_id)
        if row is None:
            return None
        return membership_dict(row.role, row.status)

    def list_active_hub_members(self, hub_id: str) -> list[dict[str, Any]]:
        from app.db.models.hub_member import HubMember

        stmt = (
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.status == "active")
        )
        return [row_to_dict(row, ("user_id", "role", "status")) for row in self.db.scalars(stmt)]

    # --- Room context ---

    def resolve_room_context(self, room_id: str, user_id: str) -> dict[str, Any] | None:
        room = self.get_room_by_id(room_id)
        if room is None:
            return None
        hub_id = str(room["hub_id"])

        hub_membership = self.get_hub_membership(hub_id, user_id)
        room_membership = self.get_room_membership(room_id, user_id)
        mute = self.get_room_mute(room_id, user_id)
        is_banned = self.has_room_ban(room_id, user_id)
        pending_invite = self.get_pending_invite_for_user(room_id, user_id)
        pending_invite_id = str(pending_invite["id"]) if pending_invite else None
        muted_until = mute.get("muted_until") if mute else None
        settings = parse_room_settings(
            room.get("settings") if isinstance(room.get("settings"), dict) else None
        )

        return {
            "room": room,
            "settings": settings,
            "hub_membership": hub_membership,
            "room_membership": room_membership,
            "is_muted": mute is not None and is_mute_active(muted_until),
            "is_banned": is_banned,
            "pending_invite_id": pending_invite_id,
        }

    def get_room_by_id(self, room_id: str) -> dict[str, Any] | None:
        row = self.db.scalar(select(ChatRoom).where(ChatRoom.id == room_id).limit(1))
        if row is None:
            return None
        return row_to_dict(
            row,
            (
                "id",
                "hub_id",
                "name",
                "description",
                "archived_at",
                "created_at",
                "settings",
                "retention_days",
            ),
        )

    def list_rooms_for_hub(
        self, hub_id: str, *, include_archived: bool = True
    ) -> list[dict[str, Any]]:
        stmt = select(ChatRoom).where(ChatRoom.hub_id == hub_id)
        if not include_archived:
            stmt = stmt.where(ChatRoom.archived_at.is_(None))
        stmt = stmt.order_by(ChatRoom.created_at.desc())
        cols = ("id", "hub_id", "name", "description", "archived_at", "created_at")
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def list_rooms_by_ids(
        self,
        hub_id: str,
        room_ids: list[str],
        *,
        non_archived_only: bool = False,
    ) -> list[dict[str, Any]]:
        if not room_ids:
            return []
        stmt = select(ChatRoom).where(ChatRoom.hub_id == hub_id).where(ChatRoom.id.in_(room_ids))
        if non_archived_only:
            stmt = stmt.where(ChatRoom.archived_at.is_(None))
        stmt = stmt.order_by(ChatRoom.created_at.desc())
        cols = ("id", "hub_id", "name", "description", "archived_at", "created_at")
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def create_room(
        self,
        *,
        hub_id: str,
        name: str,
        description: str | None,
        created_by: str,
    ) -> dict[str, Any]:
        now = self._now()
        room = ChatRoom(
            id=str(uuid4()),
            hub_id=hub_id,
            name=name,
            description=description,
            created_by=created_by,
            created_at=now,
            updated_at=now,
            settings={},
        )
        self.db.add(room)
        self._commit()
        self.db.refresh(room)
        return row_to_dict(room, ("id",))

    def update_room(self, room_id: str, values: dict[str, Any]) -> None:
        doc = dict(values)
        if "settings" in doc:
            pass
        if "archived_at" in doc and isinstance(doc["archived_at"], str):
            doc["archived_at"] = self._parse_dt(doc["archived_at"])
        if "updated_at" in doc and isinstance(doc["updated_at"], str):
            doc["updated_at"] = self._parse_dt(doc["updated_at"]) or self._now()
        self.db.execute(update(ChatRoom).where(ChatRoom.id == room_id).values(**doc))
        self._commit()

    def delete_room(self, room_id: str) -> None:
        self.db.execute(delete(ChatRoom).where(ChatRoom.id == room_id))
        self._commit()

    # --- Room membership ---

    def list_room_memberships(
        self, room_id: str, *, status: str | None = None
    ) -> list[dict[str, Any]]:
        stmt = select(ChatRoomMembership).where(ChatRoomMembership.room_id == room_id)
        if status:
            stmt = stmt.where(ChatRoomMembership.status == status)
        stmt = stmt.order_by(ChatRoomMembership.joined_at.asc())
        return [
            row_to_dict(row, ("user_id", "role", "status", "joined_at"))
            for row in self.db.scalars(stmt)
        ]

    def get_room_membership(self, room_id: str, user_id: str) -> dict[str, str] | None:
        row = self.db.scalar(
            select(ChatRoomMembership)
            .where(ChatRoomMembership.room_id == room_id)
            .where(ChatRoomMembership.user_id == user_id)
            .limit(1)
        )
        if row is None:
            return None
        return membership_dict(row.role, row.status)

    def list_active_room_ids_for_user(self, user_id: str) -> list[str]:
        stmt = (
            select(ChatRoomMembership.room_id)
            .where(ChatRoomMembership.user_id == user_id)
            .where(ChatRoomMembership.status == "active")
        )
        return [str(rid) for rid in self.db.scalars(stmt).all() if rid]

    def upsert_room_membership(
        self,
        *,
        room_id: str,
        user_id: str,
        role: str,
        status: str,
        invited_by: str | None = None,
    ) -> None:
        row = self.db.scalar(
            select(ChatRoomMembership)
            .where(ChatRoomMembership.room_id == room_id)
            .where(ChatRoomMembership.user_id == user_id)
            .limit(1)
        )
        now = self._now()
        if row:
            row.role = role
            row.status = status
            if invited_by:
                row.invited_by = invited_by
            self._commit()
            return
        self.db.add(
            ChatRoomMembership(
                id=str(uuid4()),
                room_id=room_id,
                user_id=user_id,
                role=role,
                status=status,
                invited_by=invited_by,
                joined_at=now,
            )
        )
        self._commit()

    def set_membership_status(
        self, *, room_id: str, user_id: str, status: str, role: str | None = None
    ) -> None:
        values: dict[str, Any] = {"status": status}
        if role is not None:
            values["role"] = role
        self.db.execute(
            update(ChatRoomMembership)
            .where(ChatRoomMembership.room_id == room_id)
            .where(ChatRoomMembership.user_id == user_id)
            .values(**values)
        )
        self._commit()

    def get_membership_row(self, room_id: str, user_id: str) -> dict[str, Any] | None:
        row = self.db.scalar(
            select(ChatRoomMembership)
            .where(ChatRoomMembership.room_id == room_id)
            .where(ChatRoomMembership.user_id == user_id)
            .limit(1)
        )
        return row_to_dict(row, ("role", "status")) if row else None

    # --- Invites ---

    def get_pending_invite(self, room_id: str, invited_user_id: str) -> dict[str, Any] | None:
        row = self.db.scalar(
            select(ChatRoomInvite)
            .where(ChatRoomInvite.room_id == room_id)
            .where(ChatRoomInvite.invited_user_id == invited_user_id)
            .where(ChatRoomInvite.status == "pending")
            .limit(1)
        )
        return row_to_dict(row, ("id",)) if row else None

    def get_pending_invite_for_user(self, room_id: str, user_id: str) -> dict[str, Any] | None:
        return self.get_pending_invite(room_id, user_id)

    def get_invite_invited_by(self, invite_id: str) -> str | None:
        row = self.db.scalar(
            select(ChatRoomInvite.invited_by).where(ChatRoomInvite.id == invite_id).limit(1)
        )
        return str(row) if row else None

    def list_pending_invites_with_rooms(
        self, *, user_id: str, hub_id: str
    ) -> list[dict[str, Any]]:
        stmt = (
            select(ChatRoomInvite, ChatRoom)
            .join(ChatRoom, ChatRoom.id == ChatRoomInvite.room_id)
            .where(ChatRoomInvite.invited_user_id == user_id)
            .where(ChatRoomInvite.status == "pending")
            .where(ChatRoom.hub_id == hub_id)
            .where(ChatRoom.archived_at.is_(None))
        )
        out: list[dict[str, Any]] = []
        for invite, room in self.db.execute(stmt).all():
            out.append(
                {
                    "invite_id": str(invite.id),
                    "room": row_to_dict(
                        room,
                        ("id", "hub_id", "name", "description", "archived_at", "created_at"),
                    ),
                }
            )
        return out

    def list_pending_invited_user_ids(self, room_id: str) -> set[str]:
        stmt = (
            select(ChatRoomInvite.invited_user_id)
            .where(ChatRoomInvite.room_id == room_id)
            .where(ChatRoomInvite.status == "pending")
        )
        return {str(uid) for uid in self.db.scalars(stmt).all() if uid}

    def create_invite(
        self, *, room_id: str, invited_user_id: str, invited_by: str
    ) -> dict[str, Any]:
        now = self._now()
        invite = ChatRoomInvite(
            id=str(uuid4()),
            room_id=room_id,
            invited_user_id=invited_user_id,
            invited_by=invited_by,
            status="pending",
            created_at=now,
        )
        self.db.add(invite)
        self._commit()
        self.db.refresh(invite)
        return row_to_dict(invite, ("id",))

    def update_invite_status(self, invite_id: str, status: str) -> None:
        self.db.execute(
            update(ChatRoomInvite).where(ChatRoomInvite.id == invite_id).values(status=status)
        )
        self._commit()

    def revoke_pending_invites(self, room_id: str, invited_user_id: str) -> int:
        result = self.db.execute(
            update(ChatRoomInvite)
            .where(ChatRoomInvite.room_id == room_id)
            .where(ChatRoomInvite.invited_user_id == invited_user_id)
            .where(ChatRoomInvite.status == "pending")
            .values(status="revoked")
        )
        self._commit()
        return result.rowcount or 0

    # --- Mutes / bans / typing ---

    def get_room_mute(self, room_id: str, user_id: str) -> dict[str, Any] | None:
        row = self.db.scalar(
            select(ChatRoomMute)
            .where(ChatRoomMute.room_id == room_id)
            .where(ChatRoomMute.user_id == user_id)
            .limit(1)
        )
        return row_to_dict(row, ("muted_until",)) if row else None

    def has_room_ban(self, room_id: str, user_id: str) -> bool:
        row = self.db.scalar(
            select(ChatRoomBan.id)
            .where(ChatRoomBan.room_id == room_id)
            .where(ChatRoomBan.user_id == user_id)
            .limit(1)
        )
        return row is not None

    def upsert_room_mute(
        self,
        *,
        room_id: str,
        user_id: str,
        actor_id: str,
        muted_until: str | None,
        reason: str | None,
    ) -> None:
        row = self.db.scalar(
            select(ChatRoomMute)
            .where(ChatRoomMute.room_id == room_id)
            .where(ChatRoomMute.user_id == user_id)
            .limit(1)
        )
        parsed_until = self._parse_dt(muted_until)
        reason_val = (reason or "").strip() or None
        if row:
            row.muted_by = actor_id
            row.muted_until = parsed_until
            row.reason = reason_val
            self._commit()
            return
        self.db.add(
            ChatRoomMute(
                id=str(uuid4()),
                room_id=room_id,
                user_id=user_id,
                muted_by=actor_id,
                muted_until=parsed_until,
                reason=reason_val,
                created_at=self._now(),
            )
        )
        self._commit()

    def create_room_ban(
        self, *, room_id: str, user_id: str, banned_by: str, reason: str | None
    ) -> None:
        self.db.add(
            ChatRoomBan(
                id=str(uuid4()),
                room_id=room_id,
                user_id=user_id,
                banned_by=banned_by,
                reason=reason,
                created_at=self._now(),
            )
        )
        self._commit()

    # --- Profiles ---

    def get_profile(
        self, user_id: str, *, columns: tuple[str, ...] = ("full_name",)
    ) -> dict | None:
        row = self.db.scalar(select(Profile).where(Profile.id == user_id).limit(1))
        return row_to_dict(row, columns) if row else None

    def list_profiles_by_ids(
        self, user_ids: list[str], *, columns: tuple[str, ...] = ("id", "full_name", "avatar_url")
    ) -> list[dict[str, Any]]:
        if not user_ids:
            return []
        stmt = select(Profile).where(Profile.id.in_(user_ids))
        return [row_to_dict(row, columns) for row in self.db.scalars(stmt)]

    # --- Messages ---

    def messages_page(
        self, *, room_id: str, limit: int, cursor_id: str | None = None
    ) -> list[dict[str, Any]]:
        bounded = max(1, min(limit, 100))
        stmt = select(ChatMessage).where(ChatMessage.room_id == room_id)
        if cursor_id:
            cursor = self.db.scalar(
                select(ChatMessage)
                .where(ChatMessage.id == cursor_id)
                .where(ChatMessage.room_id == room_id)
                .limit(1)
            )
            if cursor is not None:
                stmt = stmt.where(
                    or_(
                        ChatMessage.created_at < cursor.created_at,
                        and_(
                            ChatMessage.created_at == cursor.created_at,
                            ChatMessage.id < cursor.id,
                        ),
                    )
                )
        stmt = stmt.order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc()).limit(bounded)
        cols = (
            "id",
            "room_id",
            "sender_id",
            "message_kind",
            "body",
            "created_at",
            "edited_at",
            "deleted_at",
            "moderation_reason",
            "sender_display_name_snapshot",
            "sender_avatar_url_snapshot",
        )
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def messages_since(
        self, *, room_id: str, after_message_id: str, limit: int
    ) -> list[dict[str, Any]]:
        bounded = max(1, min(limit, 100))
        cursor = self.db.scalar(
            select(ChatMessage)
            .where(ChatMessage.id == after_message_id)
            .where(ChatMessage.room_id == room_id)
            .limit(1)
        )
        if cursor is None:
            return []
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.room_id == room_id)
            .where(
                or_(
                    ChatMessage.created_at > cursor.created_at,
                    and_(
                        ChatMessage.created_at == cursor.created_at,
                        ChatMessage.id > cursor.id,
                    ),
                )
            )
            .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
            .limit(bounded)
        )
        cols = (
            "id",
            "room_id",
            "sender_id",
            "message_kind",
            "body",
            "created_at",
            "edited_at",
            "deleted_at",
            "moderation_reason",
            "sender_display_name_snapshot",
            "sender_avatar_url_snapshot",
        )
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def get_message(
        self, message_id: str, *, columns: tuple[str, ...] | None = None
    ) -> dict | None:
        row = self.db.scalar(select(ChatMessage).where(ChatMessage.id == message_id).limit(1))
        return row_to_dict(row, columns) if row else None

    def create_message(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = self._now()
        msg = ChatMessage(
            id=str(uuid4()),
            room_id=payload["room_id"],
            sender_id=payload.get("sender_id"),
            message_kind=payload["message_kind"],
            body=payload.get("body"),
            reply_to_id=payload.get("reply_to_id"),
            created_at=now,
            sender_display_name_snapshot=payload.get("sender_display_name_snapshot"),
            sender_avatar_url_snapshot=payload.get("sender_avatar_url_snapshot"),
        )
        self.db.add(msg)
        self._commit()
        self.db.refresh(msg)
        return row_to_dict(msg, ("id",))

    def update_message(self, message_id: str, room_id: str, values: dict[str, Any]) -> None:
        doc = dict(values)
        if "edited_at" in doc and isinstance(doc["edited_at"], str):
            doc["edited_at"] = self._parse_dt(doc["edited_at"]) or self._now()
        if "deleted_at" in doc and isinstance(doc["deleted_at"], str):
            doc["deleted_at"] = self._parse_dt(doc["deleted_at"]) or self._now()
        self.db.execute(
            update(ChatMessage)
            .where(ChatMessage.id == message_id)
            .where(ChatMessage.room_id == room_id)
            .values(**doc)
        )
        self._commit()

    def soft_delete_attachments_for_message(self, message_id: str) -> None:
        self.db.execute(
            update(ChatMessageAttachment)
            .where(ChatMessageAttachment.message_id == message_id)
            .where(ChatMessageAttachment.deleted_at.is_(None))
            .values(deleted_at=self._now())
        )
        self._commit()

    def list_attachments_for_messages(self, message_ids: list[str]) -> list[dict[str, Any]]:
        if not message_ids:
            return []
        stmt = (
            select(ChatMessageAttachment)
            .where(ChatMessageAttachment.message_id.in_(message_ids))
            .where(ChatMessageAttachment.deleted_at.is_(None))
        )
        cols = (
            "id",
            "message_id",
            "mime_type",
            "original_filename",
            "file_size_bytes",
            "scan_status",
        )
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def list_reactions_for_messages(self, message_ids: list[str]) -> list[dict[str, Any]]:
        if not message_ids:
            return []
        stmt = select(ChatMessageReaction).where(ChatMessageReaction.message_id.in_(message_ids))
        cols = ("id", "message_id", "user_id", "emoji", "created_at")
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def create_reaction(self, *, message_id: str, user_id: str, emoji: str, room_id: str) -> None:
        self.db.add(
            ChatMessageReaction(
                id=str(uuid4()),
                message_id=message_id,
                user_id=user_id,
                emoji=emoji,
                room_id=room_id,
                created_at=self._now(),
            )
        )
        self._commit()

    def delete_reaction(self, *, message_id: str, user_id: str, emoji: str) -> None:
        self.db.execute(
            delete(ChatMessageReaction)
            .where(ChatMessageReaction.message_id == message_id)
            .where(ChatMessageReaction.user_id == user_id)
            .where(ChatMessageReaction.emoji == emoji)
        )
        self._commit()

    def delete_messages_by_ids(self, message_ids: list[str]) -> None:
        if not message_ids:
            return
        self.db.execute(delete(ChatMessage).where(ChatMessage.id.in_(message_ids)))
        self._commit()

    # --- Polls ---

    def get_poll(self, poll_id: str, *, columns: tuple[str, ...] | None = None) -> dict | None:
        row = self.db.scalar(select(ChatPoll).where(ChatPoll.id == poll_id).limit(1))
        default_cols = (
            "id",
            "message_id",
            "question",
            "allow_multiple",
            "anonymous_voting",
            "closes_at",
        )
        return row_to_dict(row, columns or default_cols) if row else None

    def get_poll_by_message(self, message_id: str) -> dict | None:
        row = self.db.scalar(
            select(ChatPoll).where(ChatPoll.message_id == message_id).limit(1)
        )
        cols = ("id", "question", "allow_multiple", "anonymous_voting", "closes_at")
        return row_to_dict(row, cols) if row else None

    def create_poll(self, payload: dict[str, Any]) -> dict[str, Any]:
        closes = payload.get("closes_at")
        poll = ChatPoll(
            id=str(uuid4()),
            message_id=payload["message_id"],
            question=payload["question"],
            allow_multiple=bool(payload.get("allow_multiple")),
            anonymous_voting=bool(payload.get("anonymous_voting")),
            closes_at=self._parse_dt(closes) if closes else None,
            created_at=self._now(),
        )
        self.db.add(poll)
        self._commit()
        self.db.refresh(poll)
        return row_to_dict(poll, ("id",))

    def create_poll_options(self, rows: list[dict[str, Any]]) -> None:
        for row in rows:
            self.db.add(
                ChatPollOption(
                    id=str(uuid4()),
                    poll_id=row["poll_id"],
                    position=int(row["position"]),
                    label=row["label"],
                )
            )
        self._commit()

    def delete_polls_for_message(self, message_id: str) -> None:
        self.db.execute(delete(ChatPoll).where(ChatPoll.message_id == message_id))
        self._commit()

    def list_poll_options(self, poll_id: str) -> list[dict[str, Any]]:
        stmt = (
            select(ChatPollOption)
            .where(ChatPollOption.poll_id == poll_id)
            .order_by(ChatPollOption.position.asc())
        )
        return [row_to_dict(row, ("id", "position", "label")) for row in self.db.scalars(stmt)]

    def get_poll_option(self, poll_id: str, option_id: str) -> dict | None:
        row = self.db.scalar(
            select(ChatPollOption)
            .where(ChatPollOption.id == option_id)
            .where(ChatPollOption.poll_id == poll_id)
            .limit(1)
        )
        return row_to_dict(row, ("id",)) if row else None

    def delete_poll_votes_for_user(self, poll_id: str, user_id: str) -> None:
        self.db.execute(
            delete(ChatPollVote)
            .where(ChatPollVote.poll_id == poll_id)
            .where(ChatPollVote.user_id == user_id)
        )
        self._commit()

    def create_poll_vote(
        self, *, poll_id: str, option_id: str, user_id: str, room_id: str
    ) -> None:
        self.db.add(
            ChatPollVote(
                id=str(uuid4()),
                poll_id=poll_id,
                option_id=option_id,
                user_id=user_id,
                room_id=room_id,
                created_at=self._now(),
            )
        )
        self._commit()

    def list_poll_votes(
        self, poll_id: str, *, option_ids: list[str] | None = None, user_id: str | None = None
    ) -> list[dict[str, Any]]:
        stmt = select(ChatPollVote).where(ChatPollVote.poll_id == poll_id)
        if option_ids:
            stmt = stmt.where(ChatPollVote.option_id.in_(option_ids))
        if user_id:
            stmt = stmt.where(ChatPollVote.user_id == user_id)
        return [row_to_dict(row, ("option_id",)) for row in self.db.scalars(stmt)]

    # --- Attachments ---

    def get_attachment(self, attachment_id: str) -> dict | None:
        row = self.db.scalar(
            select(ChatMessageAttachment).where(ChatMessageAttachment.id == attachment_id).limit(1)
        )
        return (
            row_to_dict(row, ("id", "storage_key", "message_id", "deleted_at")) if row else None
        )

    def create_attachment(self, payload: dict[str, Any]) -> dict[str, Any]:
        att = ChatMessageAttachment(
            id=str(uuid4()),
            message_id=payload["message_id"],
            storage_key=payload["storage_key"],
            mime_type=payload["mime_type"],
            original_filename=payload.get("original_filename"),
            file_size_bytes=int(payload["file_size_bytes"]),
            scan_status=payload.get("scan_status", "pending"),
            uploaded_by=payload["uploaded_by"],
            created_at=self._now(),
        )
        self.db.add(att)
        self._commit()
        self.db.refresh(att)
        return row_to_dict(att, ("id",))

    # --- Reports & moderation ---

    def list_reports(self, room_id: str, *, status: str | None = None) -> list[dict[str, Any]]:
        stmt = select(ChatMessageReport).where(ChatMessageReport.room_id == room_id)
        if status:
            stmt = stmt.where(ChatMessageReport.status == status)
        stmt = stmt.order_by(ChatMessageReport.created_at.desc())
        return [row_to_dict(row) for row in self.db.scalars(stmt)]

    def get_report(self, report_id: str) -> dict | None:
        row = self.db.scalar(
            select(ChatMessageReport).where(ChatMessageReport.id == report_id).limit(1)
        )
        return row_to_dict(row) if row else None

    def create_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        report = ChatMessageReport(
            id=str(uuid4()),
            hub_id=payload["hub_id"],
            room_id=payload["room_id"],
            reporter_id=payload["reporter_id"],
            target_message_id=payload.get("target_message_id"),
            target_user_id=payload.get("target_user_id"),
            reason=payload.get("reason"),
            reason_code=payload.get("reason_code"),
            details=payload.get("details"),
            status=payload.get("status", "pending"),
            created_at=self._now(),
            appeal_status="none",
        )
        self.db.add(report)
        self._commit()
        self.db.refresh(report)
        return row_to_dict(report, ("id",))

    def update_report(self, report_id: str, room_id: str, values: dict[str, Any]) -> None:
        doc = dict(values)
        if "resolved_at" in doc and isinstance(doc["resolved_at"], str):
            doc["resolved_at"] = self._parse_dt(doc["resolved_at"]) or self._now()
        self.db.execute(
            update(ChatMessageReport)
            .where(ChatMessageReport.id == report_id)
            .where(ChatMessageReport.room_id == room_id)
            .values(**doc)
        )
        self._commit()

    def list_moderation_actions(self, room_id: str) -> list[dict[str, Any]]:
        stmt = (
            select(ChatModerationAction)
            .where(ChatModerationAction.room_id == room_id)
            .order_by(ChatModerationAction.created_at.desc())
        )
        out = []
        for row in self.db.scalars(stmt):
            d = row_to_dict(
                row,
                (
                    "id",
                    "action_type",
                    "reason",
                    "actor_id",
                    "target_user_id",
                    "target_message_id",
                    "created_at",
                ),
            )
            d["metadata"] = row.metadata_ if isinstance(row.metadata_, dict) else {}
            out.append(d)
        return out

    def record_moderation_action(
        self,
        *,
        hub_id: str,
        room_id: str,
        actor_id: str,
        action_type: str,
        reason: str | None = None,
        target_user_id: str | None = None,
        target_message_id: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        try:
            self.db.add(
                ChatModerationAction(
                    id=str(uuid4()),
                    hub_id=hub_id,
                    room_id=room_id,
                    actor_id=actor_id,
                    action_type=action_type,
                    reason=(reason or "").strip() or None,
                    target_user_id=target_user_id,
                    target_message_id=target_message_id,
                    metadata_=metadata or {},
                    created_at=self._now(),
                )
            )
            self._commit()
        except Exception:
            self.db.rollback()

    # --- Compliance export / erasure ---

    def list_messages_by_sender(self, user_id: str, *, limit: int = 2000) -> list[dict]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.sender_id == user_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        cols = ("id", "room_id", "message_kind", "body", "created_at", "edited_at", "deleted_at")
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def list_reactions_by_user(self, user_id: str, *, limit: int = 5000) -> list[dict]:
        stmt = (
            select(ChatMessageReaction)
            .where(ChatMessageReaction.user_id == user_id)
            .limit(limit)
        )
        return [
            row_to_dict(row, ("id", "message_id", "emoji", "created_at"))
            for row in self.db.scalars(stmt)
        ]

    def list_poll_votes_by_user(self, user_id: str, *, limit: int = 5000) -> list[dict]:
        stmt = select(ChatPollVote).where(ChatPollVote.user_id == user_id).limit(limit)
        return [
            row_to_dict(row, ("id", "poll_id", "option_id", "created_at"))
            for row in self.db.scalars(stmt)
        ]

    def list_reports_by_reporter(self, user_id: str, *, limit: int = 1000) -> list[dict]:
        stmt = (
            select(ChatMessageReport)
            .where(ChatMessageReport.reporter_id == user_id)
            .limit(limit)
        )
        cols = (
            "id",
            "room_id",
            "hub_id",
            "status",
            "created_at",
            "target_message_id",
            "target_user_id",
            "reason_code",
            "reason",
        )
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def list_attachments_by_uploader(self, user_id: str, *, limit: int = 2000) -> list[dict]:
        stmt = (
            select(ChatMessageAttachment)
            .where(ChatMessageAttachment.uploaded_by == user_id)
            .order_by(ChatMessageAttachment.created_at.desc())
            .limit(limit)
        )
        cols = (
            "id",
            "message_id",
            "mime_type",
            "original_filename",
            "file_size_bytes",
            "scan_status",
            "created_at",
            "deleted_at",
        )
        return [row_to_dict(row, cols) for row in self.db.scalars(stmt)]

    def apply_user_erasure(self, user_id: str) -> bool:
        try:
            self.db.execute(
                text("SELECT public.chat_erasure_apply_for_user(:uid)"),
                {"uid": user_id},
            )
            self._commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def anonymize_user_fallback(self, user_id: str) -> None:
        now = self._now()
        self.db.execute(
            update(ChatMessage)
            .where(ChatMessage.sender_id == user_id)
            .values(
                sender_id=None,
                body="[Content removed]",
                sender_display_name_snapshot="Deleted User",
                sender_avatar_url_snapshot=None,
            )
        )
        self.db.execute(delete(ChatMessageReaction).where(ChatMessageReaction.user_id == user_id))
        self.db.execute(delete(ChatPollVote).where(ChatPollVote.user_id == user_id))
        self.db.execute(
            update(ChatMessageReport)
            .where(ChatMessageReport.reporter_id == user_id)
            .values(
                reason=None,
                details=None,
                reason_code="erasure",
                review_notes_internal=None,
                appeal_body=None,
            )
        )
        self.db.execute(delete(ChatRoomMute).where(ChatRoomMute.user_id == user_id))
        self.db.execute(delete(ChatRoomBan).where(ChatRoomBan.user_id == user_id))
        self.db.execute(
            update(ChatMessageAttachment)
            .where(ChatMessageAttachment.uploaded_by == user_id)
            .where(ChatMessageAttachment.deleted_at.is_(None))
            .values(deleted_at=now, original_filename=None, scan_status="skipped")
        )
        self._commit()

    def purge_retention(self, *, limit: int = 500) -> int:
        try:
            result = self.db.execute(
                text("SELECT public.chat_purge_messages_past_retention(:lim)"),
                {"lim": limit},
            )
            self._commit()
            row = result.scalar()
            return int(row or 0)
        except Exception as exc:
            self.db.rollback()
            raise RuntimeError("Retention purge failed") from exc
