from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.inspection import inspect as sa_inspect

from app.db.base import Base


def serialize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def row_to_dict(row: Base, columns: tuple[str, ...] | None = None) -> dict[str, Any]:
    mapper = sa_inspect(row.__class__)
    data: dict[str, Any] = {}
    for attr in mapper.column_attrs:
        key = "metadata" if attr.key == "metadata_" else attr.key
        if columns is not None and key not in columns:
            continue
        data[key] = serialize_value(getattr(row, attr.key))
    return data


def membership_dict(role: str | None, status: str | None) -> dict[str, str] | None:
    if role is None and status is None:
        return None
    return {"role": role or "", "status": status or ""}


def is_mute_active(muted_until: str | None) -> bool:
    if muted_until is None:
        return True
    try:
        return datetime.fromisoformat(muted_until.replace("Z", "+00:00")) > datetime.now(UTC)
    except ValueError:
        return False


def parse_room_settings(raw: dict | None) -> dict:
    raw = raw or {}
    invite_policy = "room_admins" if raw.get("invitePolicy") == "room_admins" else "hub_admins_only"
    who_can_create_polls = "room_admin_and_moderator"
    if raw.get("whoCanCreatePolls") in {
        "room_admin_and_moderator",
        "room_admin_only",
        "all_active_members",
    }:
        who_can_create_polls = str(raw["whoCanCreatePolls"])
    attachments_enabled = raw.get("attachmentsEnabled") is not False
    return {
        "attachmentsEnabled": attachments_enabled,
        "invitePolicy": invite_policy,
        "whoCanCreatePolls": who_can_create_polls,
    }
