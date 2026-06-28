from app.core.config import get_settings


def channel_for_room(room_id: str) -> str:
    prefix = get_settings().chat_pubsub_channel_prefix.rstrip(":")
    return f"{prefix}:{room_id}"


def typing_key_for_room(room_id: str) -> str:
    return f"chat:room:{room_id}:typing"


def pattern_for_all_rooms() -> str:
    prefix = get_settings().chat_pubsub_channel_prefix.rstrip(":")
    return f"{prefix}:*"
