from __future__ import annotations

from app.core.config import get_settings


def channel_for_user(user_id: str) -> str:
    prefix = get_settings().notifications_pubsub_channel_prefix.rstrip(":")
    return f"{prefix}:{user_id}"


def pattern_for_all_users() -> str:
    prefix = get_settings().notifications_pubsub_channel_prefix.rstrip(":")
    return f"{prefix}:*"
