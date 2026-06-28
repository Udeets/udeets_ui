import re
from datetime import UTC, datetime
from html import unescape

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.chat import ChatRepository
from app.services.chat.context import (
    assert_add_member_allowed as _assert_add_member_allowed,
)
from app.services.chat.context import (
    assert_ban_member_allowed as _assert_ban_member_allowed,
)
from app.services.chat.context import (
    assert_create_poll_allowed as _assert_create_poll_allowed,
)
from app.services.chat.context import (
    assert_delete_room_allowed as _assert_delete_room_allowed,
)
from app.services.chat.context import (
    assert_invite_allowed as _assert_invite_allowed,
)
from app.services.chat.context import (
    assert_mute_member_allowed as _assert_mute_member_allowed,
)
from app.services.chat.context import (
    assert_remove_member_allowed as _assert_remove_member_allowed,
)
from app.services.chat.context import (
    assert_send_allowed as _assert_send_allowed,
)
from app.services.chat.context import (
    assert_update_room_allowed as _assert_update_room_allowed,
)
from app.services.chat.context import (
    can_view,
    resolve_room_context,
    upsert_membership,
    upsert_mute,
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
from app.realtime.helpers import (
    publish_message_created,
    publish_message_deleted,
    publish_message_edited,
    publish_poll_updated,
    publish_reaction_updated,
    publish_room_member_joined,
    publish_room_member_removed,
)
from app.realtime.revoke import schedule_access_revoked
from app.services.chat_unread_notify import notify_message_created

_MSG_COLUMNS = (
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


def _sanitize_chat_text(raw: str, max_len: int = 8000) -> str:
    stripped = re.sub(r"<[^>]*?>", "", raw or "")
    one_line = unescape(stripped).replace("\r\n", "\n").strip()
    return one_line[:max_len] if len(one_line) > max_len else one_line


def _normalize_emoji(raw: str) -> str:
    emoji = (raw or "").strip()
    return emoji[:32] if emoji else ""


class ChatWriteService:

    def __init__(self, db: Session) -> None:
        self.chat = ChatRepository(db)

    def _message_row(self, message_id: str) -> dict | None:
        return self.chat.get_message(message_id, columns=_MSG_COLUMNS)

    def create_room(
        self, user_id: str, hub_id: str, name: str, description: str | None = None
    ) -> dict:
        hub_membership = self.chat.get_hub_membership(hub_id, user_id)
        if not _is_hub_staff(hub_membership):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only hub creators or admins can create chat rooms.",
            )
        trimmed_name = (name or "").strip()
        if not trimmed_name or len(trimmed_name) > 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room name must be between 1 and 200 characters.",
            )
        trimmed_description = (description or "").strip() if isinstance(description, str) else None
        if trimmed_description and len(trimmed_description) > 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description must be at most 2000 characters.",
            )
        created = self.chat.create_room(
            hub_id=hub_id,
            name=trimmed_name,
            description=trimmed_description or None,
            created_by=user_id,
        )
        room_id = str(created["id"])
        upsert_membership(
            self.chat,
            room_id,
            user_id,
            role="owner",
            status_value="active",
            invited_by=user_id,
        )
        return {"roomId": room_id}

    def update_room(
        self,
        user_id: str,
        room_id: str,
        name: str | None = None,
        description: str | None = None,
        settings_patch: dict | None = None,
        archived: bool | None = None,
        retention_days: int | None = None,
        retention_days_provided: bool = False,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_update_room_allowed(ctx)
        if (
            retention_days_provided
            and retention_days is not None
            and retention_days
            not in {
                30,
                90,
                365,
            }
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid message retention setting.",
            )
        patch: dict = {"updated_at": datetime.now(UTC).isoformat()}
        if name is not None:
            patch["name"] = name.strip()
        if description is not None:
            patch["description"] = description
        if settings_patch is not None:
            base = dict(ctx["settings"])
            patch["settings"] = {
                "attachmentsEnabled": settings_patch.get(
                    "attachmentsEnabled", base["attachmentsEnabled"]
                ),
                "invitePolicy": settings_patch.get("invitePolicy", base["invitePolicy"]),
                "whoCanCreatePolls": settings_patch.get(
                    "whoCanCreatePolls", base["whoCanCreatePolls"]
                ),
            }
        if archived is True:
            patch["archived_at"] = datetime.now(UTC).isoformat()
        if archived is False:
            patch["archived_at"] = None
        if retention_days_provided:
            patch["retention_days"] = retention_days
        self.chat.update_room(room_id, patch)
        return {"ok": True}

    def delete_room(self, user_id: str, room_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_delete_room_allowed(ctx)
        self.chat.delete_room(room_id)
        return {"ok": True}

    def invite_user(self, actor_id: str, room_id: str, invited_user_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=actor_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_invite_allowed(ctx)
        existing_pending = self.chat.get_pending_invite(room_id, invited_user_id)
        if existing_pending and existing_pending.get("id"):
            return {"inviteId": str(existing_pending["id"])}
        created = self.chat.create_invite(
            room_id=room_id, invited_user_id=invited_user_id, invited_by=actor_id
        )
        if not created.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not create invite (user may already be invited or is a member).",
            )
        return {"inviteId": str(created["id"])}

    def revoke_invite(self, actor_id: str, room_id: str, invited_user_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=actor_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_invite_allowed(ctx)
        revoked = self.chat.revoke_pending_invites(room_id, invited_user_id)
        return {"revoked": revoked > 0}

    def respond_invite(self, user_id: str, room_id: str, action: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        pending = self.chat.get_pending_invite_for_user(room_id, user_id)
        if not pending:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No pending invite for this room.",
            )
        invite_id = str(pending["id"])
        if action == "accept":
            if not _is_active(ctx["hub_membership"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be an active hub member to join this chat.",
                )
            if not _is_active(ctx["room_membership"]):
                upsert_membership(
                    self.chat, room_id, user_id, role="member", status_value="active"
                )
            self.chat.update_invite_status(invite_id, "accepted")
            publish_room_member_joined(
                room_id=room_id,
                user_id=user_id,
                payload={"status": "active", "via": "invite_accept"},
            )
            return {"ok": True}
        self.chat.update_invite_status(invite_id, "declined")
        return {"ok": True}

    def add_member(self, actor_id: str, room_id: str, target_user_id: str, role: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=actor_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_add_member_allowed(ctx)
        target_role = role if role in {"member", "moderator", "admin"} else "member"
        if target_role != "member":
            room_membership = ctx["room_membership"]
            is_hub_staff = _is_hub_staff(ctx["hub_membership"])
            is_room_owner = bool(
                room_membership
                and room_membership.get("status") == "active"
                and room_membership.get("role") == "owner"
            )
            if target_role == "admin" and not (is_room_owner or is_hub_staff):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the room owner or hub staff can assign room admins.",
                )
            is_room_owner_or_admin = bool(
                room_membership
                and room_membership.get("status") == "active"
                and room_membership.get("role") in {"owner", "admin"}
            )
            if target_role == "moderator" and not (is_room_owner_or_admin or is_hub_staff):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only room owners/admins or hub staff can assign moderators.",
                )
        upsert_membership(
            self.chat,
            room_id=room_id,
            user_id=target_user_id,
            role=target_role,
            status_value="active",
            invited_by=actor_id,
        )
        publish_room_member_joined(
            room_id=room_id,
            user_id=target_user_id,
            payload={"role": target_role, "status": "active"},
        )
        return {"ok": True}

    def remove_member(self, actor_id: str, room_id: str, target_user_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=actor_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_remove_member_allowed(ctx)
        target = self.chat.get_membership_row(room_id, target_user_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this room."
            )
        if target.get("role") == "owner" and target.get("status") == "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot remove the room owner.",
            )
        self.chat.set_membership_status(
            room_id=room_id, user_id=target_user_id, status="removed"
        )
        publish_room_member_removed(
            room_id=room_id,
            user_id=target_user_id,
            payload={"status": "removed"},
        )
        schedule_access_revoked(
            room_id=room_id, user_id=target_user_id, reason="membership_revoked"
        )
        return {"ok": True}

    def ban_member(
        self, actor_id: str, room_id: str, target_user_id: str, reason: str | None = None
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=actor_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_ban_member_allowed(ctx)
        self.chat.create_room_ban(
            room_id=room_id,
            user_id=target_user_id,
            banned_by=actor_id,
            reason=(reason or "").strip() or None,
        )
        self.chat.set_membership_status(
            room_id=room_id, user_id=target_user_id, status="removed"
        )
        publish_room_member_removed(
            room_id=room_id,
            user_id=target_user_id,
            payload={"status": "banned"},
        )
        schedule_access_revoked(room_id=room_id, user_id=target_user_id, reason="banned")
        return {"ok": True}

    def mute_member(
        self,
        actor_id: str,
        room_id: str,
        target_user_id: str,
        muted_until: str | None = None,
        reason: str | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=actor_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_mute_member_allowed(ctx)
        upsert_mute(
            self.chat,
            room_id=room_id,
            user_id=target_user_id,
            actor_id=actor_id,
            muted_until=muted_until,
            reason=reason,
        )
        return {"ok": True}

    def create_poll(
        self,
        user_id: str,
        room_id: str,
        question: str,
        options: list[str],
        allow_multiple: bool,
        anonymous_voting: bool,
        closes_at: str | None,
        message_body: str,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_create_poll_allowed(ctx)

        profile = self.chat.get_profile(user_id, columns=("full_name", "avatar_url")) or {}
        caption = _sanitize_chat_text(message_body or "", 2000)
        poll_question = _sanitize_chat_text(question or "", 500)
        poll_options = [_sanitize_chat_text(o, 200) for o in options]
        poll_options = [o for o in poll_options if o]
        if len(poll_options) < 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="At least two poll options are required.",
            )

        created_message = self.chat.create_message(
            {
                "room_id": room_id,
                "sender_id": user_id,
                "message_kind": "poll",
                "body": caption or None,
                "sender_display_name_snapshot": profile.get("full_name"),
                "sender_avatar_url_snapshot": profile.get("avatar_url"),
            }
        )
        message_id = str(created_message["id"])

        try:
            created_poll = self.chat.create_poll(
                {
                    "message_id": message_id,
                    "question": poll_question,
                    "allow_multiple": bool(allow_multiple),
                    "anonymous_voting": bool(anonymous_voting),
                    "closes_at": closes_at,
                }
            )
            poll_id = str(created_poll["id"])
            self.chat.create_poll_options(
                [
                    {"poll_id": poll_id, "position": idx, "label": label}
                    for idx, label in enumerate(poll_options)
                ]
            )
        except Exception as exc:
            self.chat.delete_polls_for_message(message_id)
            self.chat.delete_messages_by_ids([message_id])
            if isinstance(exc, HTTPException):
                raise
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Could not create poll."
            ) from exc

        row = self._message_row(message_id)
        if row:
            publish_message_created(room_id=room_id, message=row)
        return {"messageId": message_id, "pollId": poll_id}

    def vote_poll(self, user_id: str, room_id: str, poll_id: str, option_id: str) -> dict:
        poll = self.chat.get_poll(poll_id)
        if not poll:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found.")
        message = self.chat.get_message(
            str(poll["message_id"]), columns=("room_id",)
        )
        if not message or str(message.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        _assert_send_allowed(ctx)
        closes_at = poll.get("closes_at")
        if isinstance(closes_at, str):
            try:
                if datetime.fromisoformat(closes_at.replace("Z", "+00:00")) < datetime.now(UTC):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="This poll is closed.",
                    )
            except ValueError:
                pass
        if not self.chat.get_poll_option(poll_id, option_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid poll option."
            )
        if not bool(poll.get("allow_multiple")):
            self.chat.delete_poll_votes_for_user(poll_id, user_id)
        self.chat.create_poll_vote(
            poll_id=poll_id, option_id=option_id, user_id=user_id, room_id=room_id
        )
        publish_poll_updated(
            room_id=room_id,
            poll_id=poll_id,
            payload={"poll_id": poll_id, "option_id": option_id, "event": "INSERT"},
        )
        return {"ok": True}

    def send_message(
        self,
        user_id: str,
        room_id: str,
        body: str,
        message_kind: str,
        reply_to_id: str | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if message_kind == "poll":
            _assert_create_poll_allowed(ctx)
        else:
            _assert_send_allowed(ctx)

        profile = self.chat.get_profile(user_id, columns=("full_name", "avatar_url")) or {}
        created = self.chat.create_message(
            {
                "room_id": room_id,
                "sender_id": user_id,
                "message_kind": message_kind,
                "body": _sanitize_chat_text(body),
                "reply_to_id": reply_to_id,
                "sender_display_name_snapshot": profile.get("full_name"),
                "sender_avatar_url_snapshot": profile.get("avatar_url"),
            }
        )
        if not created.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not send message (check membership and hub access).",
            )
        message_id = str(created["id"])
        row = self._message_row(message_id)
        if row:
            publish_message_created(room_id=room_id, message=row)
            notify_message_created(
                self.chat.db,
                room_id=room_id,
                hub_id=str(ctx["room"]["hub_id"]),
                message_id=message_id,
                sender_id=user_id,
            )
        return {"messageId": message_id}

    def update_message(self, user_id: str, room_id: str, message_id: str, body: str) -> dict:
        msg = self.chat.get_message(
            message_id,
            columns=("id", "room_id", "sender_id", "deleted_at", "message_kind"),
        )
        if not msg or str(msg.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        _assert_send_allowed(ctx)
        if str(msg.get("sender_id") or "") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages."
            )
        if str(msg.get("message_kind") or "") == "system":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="System messages cannot be edited."
            )
        if msg.get("deleted_at") is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Deleted messages cannot be edited."
            )
        self.chat.update_message(
            message_id,
            room_id,
            {"body": _sanitize_chat_text(body), "edited_at": datetime.now(UTC).isoformat()},
        )
        row = self._message_row(message_id)
        if row:
            publish_message_edited(room_id=room_id, message_id=message_id, message=row)
        return {"ok": True}

    def delete_message(
        self,
        user_id: str,
        room_id: str,
        message_id: str,
        moderation_reason: str | None = None,
    ) -> dict:
        msg = self.chat.get_message(
            message_id, columns=("id", "room_id", "sender_id", "deleted_at")
        )
        if not msg or str(msg.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )
        is_own = str(msg.get("sender_id") or "") == user_id
        can_mod = _is_room_mod_plus(ctx["room_membership"]) or _is_hub_staff(ctx["hub_membership"])
        if msg.get("deleted_at") is not None and not can_mod:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="This message is already deleted."
            )
        if not can_mod and not (
            is_own and _is_active(ctx["room_membership"]) and not ctx["is_banned"]
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete this message."
            )
        now = datetime.now(UTC).isoformat()
        self.chat.update_message(
            message_id,
            room_id,
            {
                "deleted_at": now,
                "deleted_by": user_id,
                "moderation_reason": (moderation_reason or "").strip() or None,
            },
        )
        self.chat.soft_delete_attachments_for_message(message_id)
        row = self._message_row(message_id)
        if row:
            hidden = bool((moderation_reason or "").strip())
            publish_message_deleted(
                room_id=room_id,
                message_id=message_id,
                message=row,
                moderation_hidden=hidden,
            )
        return {"ok": True}

    def add_reaction(self, user_id: str, room_id: str, message_id: str, emoji: str) -> dict:
        msg = self.chat.get_message(message_id, columns=("id", "room_id"))
        if not msg or str(msg.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        _assert_send_allowed(ctx)
        normalized = _normalize_emoji(emoji)
        if not normalized:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid emoji.")
        self.chat.create_reaction(
            message_id=message_id, user_id=user_id, emoji=normalized, room_id=room_id
        )
        publish_reaction_updated(
            room_id=room_id,
            message_id=message_id,
            kind="added",
            reaction={"user_id": user_id, "emoji": normalized},
        )
        return {"ok": True}

    def remove_reaction(self, user_id: str, room_id: str, message_id: str, emoji: str) -> dict:
        msg = self.chat.get_message(message_id, columns=("id", "room_id"))
        if not msg or str(msg.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        _assert_send_allowed(ctx)
        normalized = _normalize_emoji(emoji)
        if not normalized:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid emoji.")
        self.chat.delete_reaction(
            message_id=message_id, user_id=user_id, emoji=normalized
        )
        publish_reaction_updated(
            room_id=room_id,
            message_id=message_id,
            kind="removed",
            reaction={"user_id": user_id, "emoji": normalized},
        )
        return {"ok": True}
