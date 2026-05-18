from fastapi import HTTPException, status

from app.db.repositories.chat import ChatRepository
from app.db.repositories.chat.mappers import (  # noqa: F401 — re-exported
    is_mute_active,
    parse_room_settings,
)


def is_active(membership: dict | None) -> bool:
    return bool(membership and membership.get("status") == "active")


def is_hub_staff(membership: dict | None) -> bool:
    return is_active(membership) and membership.get("role") in {"creator", "admin"}


def is_room_admin_plus(membership: dict | None) -> bool:
    return is_active(membership) and membership.get("role") in {"owner", "admin"}


def is_room_mod_plus(membership: dict | None) -> bool:
    return is_active(membership) and membership.get("role") in {"owner", "admin", "moderator"}


def resolve_room_context(sql: ChatRepository, room_id: str, user_id: str) -> dict | None:
    return sql.resolve_room_context(room_id, user_id)


def can_view(ctx: dict) -> bool:
    room = ctx["room"]
    room_archived = room.get("archived_at") is not None
    hub_membership = ctx["hub_membership"]
    room_membership = ctx["room_membership"]
    if room_archived:
        return is_hub_staff(hub_membership) or is_room_admin_plus(room_membership)
    if is_active(room_membership) or is_hub_staff(hub_membership):
        return True
    return bool(is_active(hub_membership) and ctx.get("pending_invite_id"))


def assert_create_poll_allowed(ctx: dict) -> None:
    assert_send_allowed(ctx)
    policy = ctx["settings"]["whoCanCreatePolls"]
    membership = ctx["room_membership"]
    if policy == "all_active_members":
        return
    if policy == "room_admin_only":
        if is_room_admin_plus(membership):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owners or admins can create polls here.",
        )
    if is_room_mod_plus(membership):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only room moderators or admins can create polls here.",
    )


def assert_update_room_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if is_hub_staff(ctx["hub_membership"]) or is_room_admin_plus(ctx["room_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only hub staff or room owners/admins can update this room.",
    )


def assert_delete_room_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if is_hub_staff(ctx["hub_membership"]) or is_room_admin_plus(ctx["room_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only hub staff or room owners/admins can delete this room.",
    )


def assert_invite_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    invite_policy = str(ctx["settings"].get("invitePolicy") or "hub_admins_only")
    if invite_policy == "room_admins":
        if is_room_admin_plus(ctx["room_membership"]):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owners or admins can invite users to this room.",
        )
    if is_hub_staff(ctx["hub_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only hub creators or admins can invite users to this room.",
    )


def assert_add_member_allowed(ctx: dict) -> None:
    if is_hub_staff(ctx["hub_membership"]) or is_room_admin_plus(ctx["room_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only hub staff or room owners/admins can add members.",
    )


def assert_remove_member_allowed(ctx: dict) -> None:
    if is_hub_staff(ctx["hub_membership"]) or is_room_admin_plus(ctx["room_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only hub staff or room owners/admins can remove members.",
    )


def assert_ban_member_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if is_hub_staff(ctx["hub_membership"]) or is_room_admin_plus(ctx["room_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only room owners/admins or hub staff can ban users from this room.",
    )


def assert_mute_member_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if is_hub_staff(ctx["hub_membership"]) or is_room_mod_plus(ctx["room_membership"]):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only moderators or admins can mute members.",
    )


def assert_send_allowed(ctx: dict) -> None:
    if not can_view(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat room.",
        )
    if not is_active(ctx["room_membership"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active room members can send messages.",
        )
    if ctx["is_banned"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You are banned from this room."
        )
    if ctx["is_muted"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You are muted in this room."
        )


def upsert_membership(
    sql: ChatRepository,
    room_id: str,
    user_id: str,
    role: str,
    status_value: str,
    invited_by: str | None = None,
) -> None:
    sql.upsert_room_membership(
        room_id=room_id,
        user_id=user_id,
        role=role,
        status=status_value,
        invited_by=invited_by,
    )


def upsert_mute(
    sql: ChatRepository,
    room_id: str,
    user_id: str,
    actor_id: str,
    muted_until: str | None,
    reason: str | None,
) -> None:
    sql.upsert_room_mute(
        room_id=room_id,
        user_id=user_id,
        actor_id=actor_id,
        muted_until=muted_until,
        reason=reason,
    )
