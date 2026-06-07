
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.chat import ChatRepository
from app.services.chat.context import (
    can_view,
    resolve_room_context,
)
from app.services.chat.context import (
    is_active as _is_active,
)
from app.services.chat.context import (
    is_hub_staff as _is_hub_staff,
)
from app.services.chat.context import (
    is_room_mod_plus as _is_room_mod_plus,
)
from app.services.chat.context import (
    parse_room_settings as _parse_room_settings,
)

CHAT_DELETED_MESSAGE_PLACEHOLDER = "This message was deleted."


class ChatReadService:

    def __init__(self, db: Session) -> None:
        self.chat = ChatRepository(db)

    def list_rooms_for_hub(self, user_id: str, hub_id: str) -> dict:
        hub_membership = self.chat.get_hub_membership(hub_id, user_id)
        if not _is_active(hub_membership):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an active hub member to list chat rooms.",
            )

        rooms: list[dict] = []
        if _is_hub_staff(hub_membership):
            room_rows = self.chat.list_rooms_for_hub(hub_id)
            rooms = [
                {
                    "id": str(r["id"]),
                    "hubId": str(r["hub_id"]),
                    "name": str(r["name"]),
                    "description": r.get("description"),
                    "archivedAt": r.get("archived_at"),
                    "createdAt": str(r["created_at"]),
                }
                for r in room_rows
            ]
            return {"rooms": rooms}

        room_ids = self.chat.list_active_room_ids_for_user(user_id)
        if room_ids:
            room_rows = self.chat.list_rooms_by_ids(
                hub_id, room_ids, non_archived_only=True
            )
            rooms.extend(
                {
                    "id": str(r["id"]),
                    "hubId": str(r["hub_id"]),
                    "name": str(r["name"]),
                    "description": r.get("description"),
                    "archivedAt": r.get("archived_at"),
                    "createdAt": str(r["created_at"]),
                }
                for r in room_rows
            )

        existing_ids = {r["id"] for r in rooms}
        for row in self.chat.list_pending_invites_with_rooms(user_id=user_id, hub_id=hub_id):
            room = row["room"]
            room_id = str(room["id"])
            if room_id in existing_ids:
                continue
            existing_ids.add(room_id)
            rooms.append(
                {
                    "id": room_id,
                    "hubId": hub_id,
                    "name": str(room["name"]),
                    "description": room.get("description"),
                    "archivedAt": room.get("archived_at"),
                    "createdAt": str(room["created_at"]),
                    "pendingInviteId": str(row["invite_id"]),
                }
            )

        rooms.sort(key=lambda item: item["createdAt"], reverse=True)
        return {"rooms": rooms}

    def get_room_for_user(self, user_id: str, room_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx or not can_view(ctx):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        room = ctx["room"]
        hub_membership = ctx["hub_membership"]
        room_membership = ctx["room_membership"]
        active_member = _is_active(room_membership)
        staff = _is_hub_staff(hub_membership)
        pending_invite = None
        if ctx["pending_invite_id"] and not active_member and not staff:
            invited_by = self.chat.get_invite_invited_by(str(ctx["pending_invite_id"]))
            inviter_display_name = "A hub moderator"
            if invited_by:
                profile = self.chat.get_profile(invited_by, columns=("full_name",))
                if profile and profile.get("full_name"):
                    inviter_display_name = (
                        str(profile["full_name"]).strip() or inviter_display_name
                    )
            pending_invite = {
                "inviteId": str(ctx["pending_invite_id"]),
                "inviterDisplayName": inviter_display_name,
            }

        return {
            "room": {
                "id": str(room["id"]),
                "hubId": str(room["hub_id"]),
                "name": str(room["name"]),
                "description": room.get("description"),
                "archivedAt": room.get("archived_at"),
                "createdAt": str(room["created_at"]),
                "settings": _parse_room_settings(room.get("settings")),
                "retentionDays": room.get("retention_days"),
                "viewerMuted": bool(ctx["is_muted"]),
                "viewerBanned": bool(ctx["is_banned"]),
                "viewerCanModerate": (
                    _is_room_mod_plus(room_membership) or _is_hub_staff(hub_membership)
                ),
                "viewerPendingInvite": pending_invite,
            }
        }

    def list_messages(
        self,
        user_id: str,
        room_id: str,
        limit: int,
        cursor_id: str | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx or not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )
        pending_only = bool(
            ctx["pending_invite_id"]
            and not _is_active(ctx["room_membership"])
            and not _is_hub_staff(ctx["hub_membership"])
        )
        if pending_only:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accept the room invite to read messages.",
            )

        page_limit = max(1, min(limit, 100))
        query_limit = page_limit + 1
        rows = self.chat.messages_page(
            room_id=room_id, limit=query_limit, cursor_id=cursor_id
        )

        page = rows[:page_limit]
        has_more = len(rows) > page_limit
        next_cursor = str(page[-1]["id"]) if has_more and page else None
        message_ids = [str(row["id"]) for row in page]

        attachments_map: dict[str, list[dict]] = {}
        reactions_map: dict[str, list[dict]] = {}
        if message_ids:
            for row in self.chat.list_attachments_for_messages(message_ids):
                mid = str(row["message_id"])
                attachments_map.setdefault(mid, []).append(
                    {
                        "id": str(row["id"]),
                        "mimeType": str(row["mime_type"]),
                        "originalFilename": row.get("original_filename"),
                        "fileSizeBytes": int(row.get("file_size_bytes") or 0),
                        "scanStatus": str(row.get("scan_status") or "pending"),
                    }
                )

            for row in self.chat.list_reactions_for_messages(message_ids):
                mid = str(row["message_id"])
                reactions_map.setdefault(mid, []).append(
                    {
                        "id": str(row["id"]),
                        "userId": str(row["user_id"]),
                        "emoji": str(row["emoji"]),
                        "createdAt": str(row["created_at"]),
                    }
                )

        viewer_is_mod = _is_room_mod_plus(ctx["room_membership"]) or _is_hub_staff(
            ctx["hub_membership"]
        )
        messages = []
        for row in page:
            message_id = str(row["id"])
            sender_id = str(row["sender_id"]) if row.get("sender_id") else None
            deleted_at = row.get("deleted_at")
            is_own = bool(sender_id and sender_id == user_id)
            redacted = bool(deleted_at) and (not viewer_is_mod or is_own)
            messages.append(
                {
                    "id": message_id,
                    "roomId": str(row["room_id"]),
                    "messageKind": str(row["message_kind"]),
                    "createdAt": str(row["created_at"]),
                    "editedAt": row.get("edited_at"),
                    "deletedAt": deleted_at,
                    "senderId": sender_id,
                    "senderDisplayName": row.get("sender_display_name_snapshot"),
                    "senderAvatarUrl": row.get("sender_avatar_url_snapshot"),
                    "body": (
                        CHAT_DELETED_MESSAGE_PLACEHOLDER
                        if redacted
                        else str(row.get("body") or "")
                    ),
                    "attachments": [] if redacted else attachments_map.get(message_id, []),
                    "reactions": [] if redacted else reactions_map.get(message_id, []),
                    "redacted": redacted,
                    "moderationReason": (
                        str(row["moderation_reason"])
                        if (
                            viewer_is_mod
                            and bool(deleted_at)
                            and not is_own
                            and row.get("moderation_reason")
                        )
                        else None
                    ),
                }
            )

        return {"messages": messages, "nextCursor": next_cursor}

    def get_hub_chat_unread(self, user_id: str, hub_id: str) -> dict:
        hub_membership = self.chat.get_hub_membership(hub_id, user_id)
        if not _is_active(hub_membership):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an active hub member to read chat unread state.",
            )
        from app.db.repositories.chat_read_state import ChatReadStateRepository

        return ChatReadStateRepository(self.chat.db).get_hub_unread(
            user_id=user_id, hub_id=hub_id
        )

    def mark_room_read(
        self,
        user_id: str,
        room_id: str,
        message_id: str | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx or not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )
        pending_only = bool(
            ctx["pending_invite_id"]
            and not _is_active(ctx["room_membership"])
            and not _is_hub_staff(ctx["hub_membership"])
        )
        if pending_only:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accept the room invite to read messages.",
            )

        resolved_message_id = message_id
        if not resolved_message_id:
            rows = self.chat.messages_page(room_id=room_id, limit=1, cursor_id=None)
            resolved_message_id = str(rows[0]["id"]) if rows else None

        from app.services.chat_unread_notify import mark_room_read_and_notify

        return mark_room_read_and_notify(
            self.chat.db,
            user_id=user_id,
            room_id=room_id,
            hub_id=str(ctx["room"]["hub_id"]),
            message_id=resolved_message_id,
        )

    def list_messages_since(
        self,
        user_id: str,
        room_id: str,
        after_message_id: str,
        limit: int = 50,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx or not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )
        page_limit = max(1, min(limit, 100))
        rows = self.chat.messages_since(
            room_id=room_id, after_message_id=after_message_id, limit=page_limit
        )
        message_ids = [str(row["id"]) for row in rows]
        attachments_map: dict[str, list[dict]] = {}
        reactions_map: dict[str, list[dict]] = {}
        if message_ids:
            for row in self.chat.list_attachments_for_messages(message_ids):
                mid = str(row["message_id"])
                attachments_map.setdefault(mid, []).append(
                    {
                        "id": str(row["id"]),
                        "mimeType": str(row["mime_type"]),
                        "originalFilename": row.get("original_filename"),
                        "fileSizeBytes": int(row.get("file_size_bytes") or 0),
                        "scanStatus": str(row.get("scan_status") or "pending"),
                    }
                )
            for row in self.chat.list_reactions_for_messages(message_ids):
                mid = str(row["message_id"])
                reactions_map.setdefault(mid, []).append(
                    {
                        "id": str(row["id"]),
                        "userId": str(row["user_id"]),
                        "emoji": str(row["emoji"]),
                        "createdAt": str(row["created_at"]),
                    }
                )
        viewer_is_mod = _is_room_mod_plus(ctx["room_membership"]) or _is_hub_staff(
            ctx["hub_membership"]
        )
        messages = []
        for row in rows:
            message_id = str(row["id"])
            sender_id = str(row["sender_id"]) if row.get("sender_id") else None
            deleted_at = row.get("deleted_at")
            is_own = bool(sender_id and sender_id == user_id)
            redacted = bool(deleted_at) and (not viewer_is_mod or is_own)
            messages.append(
                {
                    "id": message_id,
                    "roomId": str(row["room_id"]),
                    "messageKind": str(row["message_kind"]),
                    "createdAt": str(row["created_at"]),
                    "editedAt": row.get("edited_at"),
                    "deletedAt": deleted_at,
                    "senderId": sender_id,
                    "senderDisplayName": row.get("sender_display_name_snapshot"),
                    "senderAvatarUrl": row.get("sender_avatar_url_snapshot"),
                    "body": (
                        CHAT_DELETED_MESSAGE_PLACEHOLDER
                        if redacted
                        else str(row.get("body") or "")
                    ),
                    "attachments": [] if redacted else attachments_map.get(message_id, []),
                    "reactions": [] if redacted else reactions_map.get(message_id, []),
                    "redacted": redacted,
                    "moderationReason": (
                        str(row["moderation_reason"])
                        if (
                            viewer_is_mod
                            and bool(deleted_at)
                            and not is_own
                            and row.get("moderation_reason")
                        )
                        else None
                    ),
                }
            )
        return {"messages": messages}
