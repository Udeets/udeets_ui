import re
from datetime import UTC, datetime
from html import unescape

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
    is_room_admin_plus as _is_room_admin_plus,
)
from app.services.chat.context import (
    is_room_mod_plus as _is_room_mod_plus,
)
from app.services.chat_write import ChatWriteService
from app.services.media import build_chat_media_key, get_storage_adapter


def _sanitize_text(raw: str, max_len: int) -> str:
    stripped = re.sub(r"<[^>]*?>", "", raw or "")
    one_line = unescape(stripped).replace("\r\n", "\n").strip()
    return one_line[:max_len] if len(one_line) > max_len else one_line


def _is_allowed_attachment_mime(mime_type: str) -> bool:
    allowed = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "application/zip",
    }
    normalized = (mime_type or "").strip().lower()
    return normalized in allowed


def _max_bytes_for_mime(mime_type: str) -> int:
    normalized = (mime_type or "").strip().lower()
    video_mimes = {"video/mp4", "video/webm", "video/quicktime"}
    return 100 * 1024 * 1024 if normalized in video_mimes else 25 * 1024 * 1024

def _assert_create_report_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if not _is_active(ctx["room_membership"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active room members can submit reports.",
        )
    if ctx["is_banned"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You are banned from this room."
        )


def _assert_view_reports_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if _is_room_mod_plus(ctx["room_membership"]) or _is_hub_staff(ctx["hub_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only moderators or admins can view reports and moderation logs.",
    )


def _record_moderation_action(
    sql: ChatRepository,
    hub_id: str,
    room_id: str,
    actor_id: str,
    action_type: str,
    reason: str | None = None,
    target_user_id: str | None = None,
    target_message_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    sql.record_moderation_action(
        hub_id=hub_id,
        room_id=room_id,
        actor_id=actor_id,
        action_type=action_type,
        reason=reason,
        target_user_id=target_user_id,
        target_message_id=target_message_id,
        metadata=metadata,
    )


class ChatModerationAndComplianceService:

    def __init__(self, db: Session) -> None:
        self.db = db
        self.chat = ChatRepository(db)
    def list_members(self, user_id: str, room_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )

        rows = self.chat.list_room_memberships(room_id)
        user_ids = sorted({str(row["user_id"]) for row in rows if row.get("user_id")})
        profiles_by_id: dict[str, dict] = {}
        if user_ids:
            profiles = self.chat.list_profiles_by_ids(user_ids)
            profiles_by_id = {str(p["id"]): p for p in profiles if p.get("id")}

        members = []
        for row in rows:
            uid = str(row["user_id"])
            profile = profiles_by_id.get(uid, {})
            display_name = str(profile.get("full_name") or "").strip() or f"Member {uid[:8]}"
            members.append(
                {
                    "userId": uid,
                    "role": str(row.get("role") or ""),
                    "status": str(row.get("status") or ""),
                    "joinedAt": str(row.get("joined_at") or ""),
                    "displayName": display_name,
                    "avatarUrl": profile.get("avatar_url"),
                }
            )
        return {"members": members}

    def list_invite_candidates(self, user_id: str, room_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        can_invite = False
        can_add = False
        invite_policy = str(ctx["settings"].get("invitePolicy") or "hub_admins_only")
        if invite_policy == "room_admins":
            can_invite = _is_room_admin_plus(ctx["room_membership"])
        else:
            can_invite = _is_hub_staff(ctx["hub_membership"])
        can_add = _is_hub_staff(ctx["hub_membership"]) or _is_room_admin_plus(
            ctx["room_membership"]
        )
        if not can_invite and not can_add:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only room owners/admins or hub staff can invite users to this room.",
            )

        hub_id = str(ctx["room"]["hub_id"])
        hub_members = self.chat.list_active_hub_members(hub_id)
        room_members = self.chat.list_room_memberships(room_id, status="active")
        in_room = {str(row["user_id"]) for row in room_members if row.get("user_id")}
        pending_set = self.chat.list_pending_invited_user_ids(room_id)
        user_ids = sorted({str(row["user_id"]) for row in hub_members if row.get("user_id")})
        profiles_by_id: dict[str, dict] = {}
        if user_ids:
            profiles = self.chat.list_profiles_by_ids(user_ids)
            profiles_by_id = {str(p["id"]): p for p in profiles if p.get("id")}

        candidates = []
        for row in hub_members:
            uid = str(row["user_id"])
            profile = profiles_by_id.get(uid, {})
            display_name = str(profile.get("full_name") or "").strip() or f"Member {uid[:8]}"
            candidates.append(
                {
                    "userId": uid,
                    "displayName": display_name,
                    "avatarUrl": profile.get("avatar_url"),
                    "hubRole": str(row.get("role") or ""),
                    "inRoom": uid in in_room,
                    "pendingInvite": uid in pending_set,
                }
            )
        return {"candidates": candidates}

    def _poll_detail(self, user_id: str, room_id: str, message_id: str, poll_row: dict) -> dict:
        del room_id
        poll_id = str(poll_row["id"])
        options = self.chat.list_poll_options(poll_id)
        option_ids = [str(opt["id"]) for opt in options if opt.get("id")]
        counts: dict[str, int] = {option_id: 0 for option_id in option_ids}
        if option_ids:
            votes = self.chat.list_poll_votes(poll_id, option_ids=option_ids)
            for vote in votes:
                option_id = str(vote.get("option_id") or "")
                if option_id in counts:
                    counts[option_id] += 1
            mine = self.chat.list_poll_votes(
                poll_id, option_ids=option_ids, user_id=user_id
            )
            my_selected = [str(vote["option_id"]) for vote in mine if vote.get("option_id")]
        else:
            my_selected = []

        poll_options = [
            {
                "id": str(opt["id"]),
                "position": int(opt.get("position") or 0),
                "label": str(opt.get("label") or ""),
                "voteCount": counts.get(str(opt["id"]), 0),
            }
            for opt in options
        ]
        return {
            "pollId": str(poll_row["id"]),
            "messageId": message_id,
            "question": str(poll_row.get("question") or ""),
            "allowMultiple": bool(poll_row.get("allow_multiple")),
            "anonymousVoting": bool(poll_row.get("anonymous_voting")),
            "closesAt": poll_row.get("closes_at"),
            "options": poll_options,
            "totalVotes": sum(counts.values()),
            "mySelectedOptionIds": my_selected,
        }

    def get_poll_by_message(self, user_id: str, room_id: str, message_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if not can_view(ctx):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        message = self.chat.get_message(
            message_id, columns=("id", "room_id", "message_kind")
        )
        if not message:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("message_kind")) != "poll":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not a poll message.")
        poll_row = self.chat.get_poll_by_message(message_id)
        if not poll_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found.")
        return {"poll": self._poll_detail(user_id, room_id, message_id, poll_row)}

    def get_poll_by_id(self, user_id: str, room_id: str, poll_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if not can_view(ctx):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        poll = self.chat.get_poll(poll_id)
        if not poll:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found.")
        message_id = str(poll["message_id"])
        message = self.chat.get_message(
            message_id, columns=("id", "room_id", "message_kind")
        )
        if not message:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("room_id")) != room_id or str(message.get("message_kind")) != "poll":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return {"poll": self._poll_detail(user_id, room_id, message_id, poll)}

    def prepare_attachment_upload(
        self,
        user_id: str,
        room_id: str,
        message_id: str,
        file_name: str,
        mime_type: str,
        size_bytes: int,
    ) -> dict:
        if not _is_allowed_attachment_mime(mime_type):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This file type is not allowed for chat attachments.",
            )
        if not isinstance(size_bytes, int) or size_bytes <= 0:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid file size.")
        max_bytes = _max_bytes_for_mime(mime_type)
        if size_bytes > max_bytes:
            max_mb = round(max_bytes / (1024 * 1024))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"File exceeds the maximum size of {max_mb} MB for this type.",
            )

        message = self.chat.get_message(
            message_id, columns=("id", "room_id", "sender_id")
        )
        if not message:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("sender_id") or "") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only attach files to your own messages.",
            )

        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if (
            not can_view(ctx)
            or not _is_active(ctx["room_membership"])
            or ctx["is_banned"]
            or ctx["is_muted"]
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if not bool(ctx["settings"].get("attachmentsEnabled", True)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Attachments are disabled for this room.",
            )

        hub_id = str(ctx["room"]["hub_id"])
        storage_key = build_chat_media_key(
            user_id=user_id,
            hub_id=hub_id,
            room_id=room_id,
            message_id=message_id,
            file_name=file_name,
        )
        upload = get_storage_adapter().prepare_upload(
            storage_key=storage_key,
            mime_type=mime_type,
            visibility="private",
        )
        return {
            "bucket": upload.bucket,
            "storageKey": storage_key,
            "signedUploadUrl": upload.signed_upload_url,
            "token": upload.token or "",
            "maxBytesForMime": max_bytes,
        }

    def complete_attachment_upload(
        self,
        user_id: str,
        room_id: str,
        message_id: str,
        storage_key: str,
        mime_type: str,
        original_filename: str,
        size_bytes: int,
    ) -> dict:
        if not _is_allowed_attachment_mime(mime_type):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This file type is not allowed for chat attachments.",
            )
        max_bytes = _max_bytes_for_mime(mime_type)
        if not isinstance(size_bytes, int) or size_bytes <= 0 or size_bytes > max_bytes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid file size.")

        message = self.chat.get_message(
            message_id, columns=("id", "room_id", "sender_id")
        )
        if not message:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if str(message.get("sender_id") or "") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only attach files to your own messages.",
            )

        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        hub_id = str(ctx["room"]["hub_id"])
        expected_prefix = f"chat-media/{user_id}/{hub_id}/{room_id}/{message_id}/"
        if ".." in storage_key or "\\" in storage_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid storage key."
            )
        if not storage_key.startswith(expected_prefix):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid storage key."
            )

        created = self.chat.create_attachment(
            {
                "message_id": message_id,
                "storage_key": storage_key,
                "mime_type": mime_type,
                "original_filename": original_filename,
                "file_size_bytes": size_bytes,
                "uploaded_by": user_id,
                "scan_status": "pending",
            }
        )
        if not created.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not save attachment metadata.",
            )
        return {"attachmentId": str(created["id"])}

    def create_attachment_download_url(
        self,
        user_id: str,
        room_id: str,
        attachment_id: str,
        expires_in: int | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if not can_view(ctx):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        attachment = self.chat.get_attachment(attachment_id)
        if not attachment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        msg = self.chat.get_message(
            str(attachment["message_id"]), columns=("room_id", "deleted_at")
        )
        if not msg or str(msg.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if attachment.get("deleted_at") is not None or msg.get("deleted_at") is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment is not available.",
            )

        requested = expires_in if isinstance(expires_in, int) else 120
        ttl = min(600, max(60, requested))
        path = str(attachment["storage_key"])
        if not path.startswith("chat-media/"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid attachment storage key.",
            )
        signed_url = get_storage_adapter().create_download_url(
            storage_key=path,
            expires_in=ttl,
            visibility="private",
        )
        return {"url": signed_url, "expiresIn": ttl}

    def list_reports(self, user_id: str, room_id: str, status_filter: str = "all") -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_view_reports_allowed(ctx)

        report_status = None if status_filter == "all" else status_filter
        rows = self.chat.list_reports(room_id, status=report_status)

        ids: set[str] = set()
        for row in rows:
            reporter_id = row.get("reporter_id")
            target_user_id = row.get("target_user_id")
            resolver_id = row.get("resolver_id")
            if reporter_id:
                ids.add(str(reporter_id))
            if target_user_id:
                ids.add(str(target_user_id))
            if resolver_id:
                ids.add(str(resolver_id))

        names_by_id: dict[str, str] = {}
        if ids:
            profiles = self.chat.list_profiles_by_ids(
                sorted(ids), columns=("id", "full_name")
            )
            for p in profiles:
                pid = str(p.get("id") or "")
                full_name = str(p.get("full_name") or "").strip()
                if pid and full_name:
                    names_by_id[pid] = full_name

        reports = []
        for row in rows:
            reporter_id = str(row.get("reporter_id") or "")
            target_user_id = str(row.get("target_user_id")) if row.get("target_user_id") else None
            resolver_id = str(row.get("resolver_id")) if row.get("resolver_id") else None
            reports.append(
                {
                    "id": str(row["id"]),
                    "hubId": str(row["hub_id"]),
                    "status": str(row["status"]),
                    "createdAt": str(row["created_at"]),
                    "resolvedAt": row.get("resolved_at"),
                    "resolverId": resolver_id,
                    "reporterId": reporter_id,
                    "targetMessageId": row.get("target_message_id"),
                    "targetUserId": target_user_id,
                    "reason": row.get("reason"),
                    "reasonCode": row.get("reason_code"),
                    "details": row.get("details"),
                    "appealStatus": row.get("appeal_status") or "none",
                    "appealSubmittedAt": row.get("appeal_submitted_at"),
                    "reviewNotesInternal": row.get("review_notes_internal"),
                    "reporterDisplayName": names_by_id.get(reporter_id),
                    "targetUserDisplayName": names_by_id.get(target_user_id)
                    if target_user_id
                    else None,
                    "resolverDisplayName": names_by_id.get(resolver_id) if resolver_id else None,
                }
            )
        return {"reports": reports}

    def create_report(
        self,
        user_id: str,
        room_id: str,
        target_message_id: str | None,
        target_user_id: str | None,
        reason: str,
        reason_code: str | None = None,
        details: str | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_create_report_allowed(ctx)
        if target_message_id:
            msg = self.chat.get_message(target_message_id, columns=("room_id",))
            if not msg or str(msg.get("room_id")) != room_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        created = self.chat.create_report(
            {
                "hub_id": str(ctx["room"]["hub_id"]),
                "room_id": room_id,
                "reporter_id": user_id,
                "target_message_id": target_message_id,
                "target_user_id": target_user_id,
                "reason": _sanitize_text(reason, 500),
                "reason_code": _sanitize_text(reason_code or "", 64) or None,
                "details": _sanitize_text(details or "", 4000) or None,
                "status": "pending",
            }
        )
        if not created.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Could not create report."
            )
        return {"reportId": str(created["id"])}

    def update_report_status(
        self,
        user_id: str,
        room_id: str,
        report_id: str,
        status_value: str,
        staff_notes: str | None = None,
    ) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_view_reports_allowed(ctx)

        rep = self.chat.get_report(report_id)
        if not rep or str(rep.get("room_id")) != room_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        previous_status = str(rep.get("status") or "")
        patch = {
            "status": status_value,
            "resolved_at": datetime.now(UTC).isoformat(),
            "resolver_id": user_id,
        }
        notes = _sanitize_text(staff_notes or "", 4000) if staff_notes else None
        if notes:
            patch["review_notes_internal"] = notes
        self.chat.update_report(report_id, room_id, patch)
        action_type = "report_resolved" if status_value == "resolved" else "report_dismissed"
        _record_moderation_action(
            self.chat,
            hub_id=str(rep["hub_id"]),
            room_id=room_id,
            actor_id=user_id,
            action_type=action_type,
            reason=notes,
            target_user_id=rep.get("target_user_id"),
            target_message_id=rep.get("target_message_id"),
            metadata={
                "reportId": report_id,
                "previousStatus": previous_status,
                "reporterId": rep.get("reporter_id"),
            },
        )
        return {"ok": True}

    def perform_moderation(self, user_id: str, room_id: str, payload: dict) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        action = str(payload.get("action") or "")
        reason = payload.get("reason") if isinstance(payload.get("reason"), str) else None
        hub_id = str(ctx["room"]["hub_id"])
        chat_write = ChatWriteService(self.db)
        if action == "hide_message":
            message_id = str(payload.get("messageId") or "")
            chat_write.delete_message(
                user_id=user_id,
                room_id=room_id,
                message_id=message_id,
                moderation_reason=reason or "moderation_hide",
            )
            _record_moderation_action(
                self.chat,
                hub_id=hub_id,
                room_id=room_id,
                actor_id=user_id,
                action_type="hide_message",
                reason=reason,
                target_message_id=message_id,
                metadata={},
            )
            return {"ok": True}
        if action == "mute_user":
            target_user = str(payload.get("userId") or "")
            muted_until = (
                payload.get("mutedUntil") if isinstance(payload.get("mutedUntil"), str) else None
            )
            chat_write.mute_member(
                actor_id=user_id,
                room_id=room_id,
                target_user_id=target_user,
                muted_until=muted_until,
                reason=reason,
            )
            _record_moderation_action(
                self.chat,
                hub_id=hub_id,
                room_id=room_id,
                actor_id=user_id,
                action_type="mute_user",
                reason=reason,
                target_user_id=target_user,
                metadata={"mutedUntil": muted_until},
            )
            return {"ok": True}
        if action == "ban_user":
            target_user = str(payload.get("userId") or "")
            chat_write.ban_member(
                actor_id=user_id,
                room_id=room_id,
                target_user_id=target_user,
                reason=reason,
            )
            _record_moderation_action(
                self.chat,
                hub_id=hub_id,
                room_id=room_id,
                actor_id=user_id,
                action_type="ban_user",
                reason=reason,
                target_user_id=target_user,
                metadata={},
            )
            return {"ok": True}
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Unknown moderation action."
        )

    def list_moderation_actions(self, user_id: str, room_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        _assert_view_reports_allowed(ctx)
        rows = self.chat.list_moderation_actions(room_id)
        actions = []
        for row in rows:
            metadata = row.get("metadata")
            actions.append(
                {
                    "id": str(row["id"]),
                    "actionType": str(row["action_type"]),
                    "reason": row.get("reason"),
                    "actorId": str(row["actor_id"]),
                    "targetUserId": row.get("target_user_id"),
                    "targetMessageId": row.get("target_message_id"),
                    "createdAt": str(row["created_at"]),
                    "metadata": metadata if isinstance(metadata, dict) else {},
                }
            )
        return {"actions": actions}

    def assert_realtime_preflight(self, user_id: str, room_id: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )
        active_member = _is_active(ctx["room_membership"])
        staff = _is_hub_staff(ctx["hub_membership"])
        if not active_member and not staff:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Join this chat room to receive live updates.",
            )
        return {"ok": True}

    def export_user_data(self, user_id: str) -> dict:
        now = datetime.now(UTC).isoformat()
        messages = self.chat.list_messages_by_sender(user_id)
        reactions = self.chat.list_reactions_by_user(user_id)
        poll_votes = self.chat.list_poll_votes_by_user(user_id)
        reports = self.chat.list_reports_by_reporter(user_id)
        attachments = self.chat.list_attachments_by_uploader(user_id)
        return {
            "exportedAt": now,
            "userId": user_id,
            "messagesAuthored": messages,
            "reactions": reactions,
            "pollVotes": poll_votes,
            "reportsFiled": reports,
            "attachmentsAuthored": attachments,
        }

    def anonymize_user_data(self, user_id: str) -> dict:
        if self.chat.apply_user_erasure(user_id):
            return {"ok": True}
        self.chat.anonymize_user_fallback(user_id)
        return {"ok": True}
