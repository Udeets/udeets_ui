from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies.auth import CurrentUser, get_verified_user
from app.dependencies.db import get_db
from app.db.repositories.chat import ChatRepository
from app.services.chat_moderation_and_compliance import ChatModerationAndComplianceService
from app.services.chat_read import ChatReadService
from app.realtime.message_rate_limit import allow_message_send
from app.services.chat_typing import ChatTypingService
from app.services.chat_write import ChatWriteService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/rooms")
def list_rooms(
    hub_id: str = Query(alias="hubId"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatReadService(db)
    return service.list_rooms_for_hub(user_id=current_user.user_id, hub_id=hub_id)


@router.post("/rooms")
def create_room(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.create_room(
        user_id=current_user.user_id,
        hub_id=str(payload.get("hubId") or ""),
        name=str(payload.get("name") or ""),
        description=payload.get("description")
        if isinstance(payload.get("description"), str) or payload.get("description") is None
        else None,
    )


@router.get("/rooms/{room_id}")
def get_room(
    room_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatReadService(db)
    return service.get_room_for_user(user_id=current_user.user_id, room_id=room_id)


@router.patch("/rooms/{room_id}")
def patch_room(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    retention_present = "retentionDays" in payload
    retention_raw = payload.get("retentionDays")
    retention_days = retention_raw if isinstance(retention_raw, int) else None
    service.update_room(
        user_id=current_user.user_id,
        room_id=room_id,
        name=payload.get("name") if isinstance(payload.get("name"), str) else None,
        description=(
            payload.get("description")
            if isinstance(payload.get("description"), str) or payload.get("description") is None
            else None
        ),
        settings_patch=payload.get("settings")
        if isinstance(payload.get("settings"), dict)
        else None,
        archived=payload.get("archived") if isinstance(payload.get("archived"), bool) else None,
        retention_days=retention_days,
        retention_days_provided=retention_present,
    )
    return ChatReadService(db).get_room_for_user(user_id=current_user.user_id, room_id=room_id)


@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.delete_room(user_id=current_user.user_id, room_id=room_id)


@router.get("/rooms/{room_id}/messages")
def list_messages(
    room_id: str,
    limit: int = Query(default=30, ge=1, le=100),
    cursor: str | None = Query(default=None),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatReadService(db)
    return service.list_messages(
        user_id=current_user.user_id,
        room_id=room_id,
        limit=limit,
        cursor_id=cursor,
    )


@router.get("/rooms/{room_id}/messages/since")
def list_messages_since(
    room_id: str,
    after: str = Query(alias="after"),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatReadService(db)
    return service.list_messages_since(
        user_id=current_user.user_id,
        room_id=room_id,
        after_message_id=after,
        limit=limit,
    )


@router.get("/unread")
def get_hub_chat_unread(
    hub_id: str = Query(alias="hubId"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatReadService(db)
    return service.get_hub_chat_unread(user_id=current_user.user_id, hub_id=hub_id)


@router.post("/rooms/{room_id}/read")
def mark_room_read(
    room_id: str,
    payload: dict = Body(default={}),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    message_id = payload.get("messageId")
    resolved = str(message_id) if isinstance(message_id, str) and message_id.strip() else None
    service = ChatReadService(db)
    return service.mark_room_read(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=resolved,
    )


@router.post("/rooms/{room_id}/messages")
async def send_message(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    if not await allow_message_send(current_user.user_id, room_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "CHAT_RATE_LIMIT",
                "error": "Too many messages. Try again shortly.",
            },
        )
    service = ChatWriteService(db)
    return service.send_message(
        user_id=current_user.user_id,
        room_id=room_id,
        body=str(payload.get("body") or ""),
        message_kind=str(payload.get("messageKind") or "text"),
        reply_to_id=payload.get("replyToId"),
    )


@router.patch("/rooms/{room_id}/messages/{message_id}")
def patch_message(
    room_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.update_message(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
        body=str(payload.get("body") or ""),
    )


@router.delete("/rooms/{room_id}/messages/{message_id}")
def delete_message(
    room_id: str,
    message_id: str,
    payload: dict | None = Body(default=None),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    moderation_reason = payload.get("moderationReason") if isinstance(payload, dict) else None
    return service.delete_message(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
        moderation_reason=moderation_reason if isinstance(moderation_reason, str) else None,
    )


@router.post("/rooms/{room_id}/messages/{message_id}/reactions")
def add_reaction(
    room_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.add_reaction(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
        emoji=str(payload.get("emoji") or ""),
    )


@router.delete("/rooms/{room_id}/messages/{message_id}/reactions")
def remove_reaction(
    room_id: str,
    message_id: str,
    emoji: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.remove_reaction(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
        emoji=emoji,
    )


@router.post("/rooms/{room_id}/invites")
def invite_user(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.invite_user(
        actor_id=current_user.user_id,
        room_id=room_id,
        invited_user_id=str(payload.get("invitedUserId") or ""),
    )


@router.delete("/rooms/{room_id}/invites")
def revoke_invite(
    room_id: str,
    invited_user_id: str = Query(alias="invitedUserId"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.revoke_invite(
        actor_id=current_user.user_id,
        room_id=room_id,
        invited_user_id=invited_user_id,
    )


@router.post("/rooms/{room_id}/invites/respond")
def respond_invite(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    action = str(payload.get("action") or "")
    service = ChatWriteService(db)
    return service.respond_invite(
        user_id=current_user.user_id,
        room_id=room_id,
        action=action,
    )


@router.post("/rooms/{room_id}/members")
def add_member(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.add_member(
        actor_id=current_user.user_id,
        room_id=room_id,
        target_user_id=str(payload.get("userId") or ""),
        role=str(payload.get("role") or "member"),
    )


@router.get("/rooms/{room_id}/members")
def list_members(
    room_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.list_members(user_id=current_user.user_id, room_id=room_id)


@router.delete("/rooms/{room_id}/members/{member_user_id}")
def remove_member(
    room_id: str,
    member_user_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.remove_member(
        actor_id=current_user.user_id,
        room_id=room_id,
        target_user_id=member_user_id,
    )


@router.post("/rooms/{room_id}/members/{member_user_id}/ban")
def ban_member(
    room_id: str,
    member_user_id: str,
    payload: dict | None = Body(default=None),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    reason = (
        payload.get("reason")
        if isinstance(payload, dict) and isinstance(payload.get("reason"), str)
        else None
    )
    service = ChatWriteService(db)
    return service.ban_member(
        actor_id=current_user.user_id,
        room_id=room_id,
        target_user_id=member_user_id,
        reason=reason,
    )


@router.post("/rooms/{room_id}/members/{member_user_id}/mute")
def mute_member(
    room_id: str,
    member_user_id: str,
    payload: dict | None = Body(default=None),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    muted_until = (
        payload.get("mutedUntil")
        if isinstance(payload, dict) and isinstance(payload.get("mutedUntil"), str)
        else None
    )
    reason = (
        payload.get("reason")
        if isinstance(payload, dict) and isinstance(payload.get("reason"), str)
        else None
    )
    service = ChatWriteService(db)
    return service.mute_member(
        actor_id=current_user.user_id,
        room_id=room_id,
        target_user_id=member_user_id,
        muted_until=muted_until,
        reason=reason,
    )


@router.post("/rooms/{room_id}/polls")
def create_poll(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    options = payload.get("options") if isinstance(payload.get("options"), list) else []
    option_values = [str(o) for o in options]
    return service.create_poll(
        user_id=current_user.user_id,
        room_id=room_id,
        question=str(payload.get("question") or ""),
        options=option_values,
        allow_multiple=bool(payload.get("allowMultiple")),
        anonymous_voting=bool(payload.get("anonymousVoting")),
        closes_at=payload.get("closesAt")
        if isinstance(payload.get("closesAt"), str) or payload.get("closesAt") is None
        else None,
        message_body=str(payload.get("messageBody") or ""),
    )


@router.get("/rooms/{room_id}/invite-candidates")
def invite_candidates(
    room_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.list_invite_candidates(user_id=current_user.user_id, room_id=room_id)


@router.get("/rooms/{room_id}/polls/{poll_id}")
def get_poll(
    room_id: str,
    poll_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.get_poll_by_id(
        user_id=current_user.user_id,
        room_id=room_id,
        poll_id=poll_id,
    )


@router.get("/rooms/{room_id}/messages/{message_id}/poll")
def get_poll_by_message(
    room_id: str,
    message_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.get_poll_by_message(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
    )


@router.post("/rooms/{room_id}/messages/{message_id}/attachments/prepare")
def prepare_attachment(
    room_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.prepare_attachment_upload(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
        file_name=str(payload.get("fileName") or ""),
        mime_type=str(payload.get("mimeType") or ""),
        size_bytes=int(payload.get("sizeBytes") or 0),
    )


@router.post("/rooms/{room_id}/messages/{message_id}/attachments/complete")
def complete_attachment(
    room_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.complete_attachment_upload(
        user_id=current_user.user_id,
        room_id=room_id,
        message_id=message_id,
        storage_key=str(payload.get("storageKey") or ""),
        mime_type=str(payload.get("mimeType") or ""),
        original_filename=str(payload.get("originalFilename") or ""),
        size_bytes=int(payload.get("sizeBytes") or 0),
    )


@router.get("/rooms/{room_id}/attachments/{attachment_id}/download")
def attachment_download(
    room_id: str,
    attachment_id: str,
    expires_in: int | None = Query(default=None, alias="expiresIn"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.create_attachment_download_url(
        user_id=current_user.user_id,
        room_id=room_id,
        attachment_id=attachment_id,
        expires_in=expires_in,
    )


@router.post("/rooms/{room_id}/polls/{poll_id}/vote")
def vote_poll(
    room_id: str,
    poll_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatWriteService(db)
    return service.vote_poll(
        user_id=current_user.user_id,
        room_id=room_id,
        poll_id=poll_id,
        option_id=str(payload.get("optionId") or ""),
    )


@router.get("/rooms/{room_id}/reports")
def list_reports(
    room_id: str,
    status_filter: str = Query(default="all", alias="status"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.list_reports(
        user_id=current_user.user_id,
        room_id=room_id,
        status_filter=status_filter,
    )


@router.post("/rooms/{room_id}/reports")
def create_report(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.create_report(
        user_id=current_user.user_id,
        room_id=room_id,
        target_message_id=(
            payload.get("targetMessageId")
            if isinstance(payload.get("targetMessageId"), str)
            else None
        ),
        target_user_id=(
            payload.get("targetUserId") if isinstance(payload.get("targetUserId"), str) else None
        ),
        reason=str(payload.get("reason") or ""),
        reason_code=(
            payload.get("reasonCode") if isinstance(payload.get("reasonCode"), str) else None
        ),
        details=payload.get("details") if isinstance(payload.get("details"), str) else None,
    )


@router.patch("/rooms/{room_id}/reports/{report_id}")
def patch_report(
    room_id: str,
    report_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.update_report_status(
        user_id=current_user.user_id,
        room_id=room_id,
        report_id=report_id,
        status_value=str(payload.get("status") or ""),
        staff_notes=payload.get("staffNotes")
        if isinstance(payload.get("staffNotes"), str)
        else None,
    )


@router.post("/rooms/{room_id}/moderation")
def moderation_action(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.perform_moderation(
        user_id=current_user.user_id,
        room_id=room_id,
        payload=payload,
    )


@router.get("/rooms/{room_id}/moderation-actions")
def moderation_actions(
    room_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.list_moderation_actions(
        user_id=current_user.user_id,
        room_id=room_id,
    )


@router.post("/rooms/{room_id}/typing")
async def typing(
    room_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatTypingService(ChatRepository(db))
    return await service.record_phase(
        user_id=current_user.user_id,
        room_id=room_id,
        phase=str(payload.get("phase") or ""),
    )


@router.get("/rooms/{room_id}/realtime-preflight")
def realtime_preflight(
    room_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.assert_realtime_preflight(
        user_id=current_user.user_id,
        room_id=room_id,
    )


@router.get("/me/export")
def export_me(
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.export_user_data(user_id=current_user.user_id)


@router.post("/me/anonymize")
def anonymize_me(
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ChatModerationAndComplianceService(db)
    return service.anonymize_user_data(user_id=current_user.user_id)
