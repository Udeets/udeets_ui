import re
from datetime import UTC, datetime
from uuid import uuid4


def sanitize_slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9.-]+", "-", (value or "").strip().lower())
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned


def safe_file_segment(value: str, max_len: int = 120) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", (value or "").strip()).strip("-")
    cleaned = cleaned[:max_len]
    return cleaned or "file"


def extension_for(file_name: str, mime_type: str, fallback: str = "bin") -> str:
    if "." in file_name:
        ext = file_name.rsplit(".", 1)[-1].strip().lower()
        if ext:
            return ext
    mime_map = {
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/quicktime": "mov",
    }
    return mime_map.get((mime_type or "").lower(), fallback)


def now_millis() -> int:
    return int(datetime.now(UTC).timestamp() * 1000)


def build_avatar_key(user_id: str, file_name: str, mime_type: str) -> str:
    ext = extension_for(file_name=file_name, mime_type=mime_type, fallback="jpg")
    return f"avatars/{user_id}/avatar.{ext}"


def build_hub_media_key(
    owner_user_id: str,
    hub_slug_or_id: str,
    kind: str,
    file_name: str,
    mime_type: str,
) -> str:
    ext = extension_for(file_name=file_name, mime_type=mime_type, fallback="jpg")
    hub_segment = sanitize_slug(hub_slug_or_id) or sanitize_slug(owner_user_id) or "hub"
    safe_kind = sanitize_slug(kind) or "media"
    return f"hub-media/{owner_user_id}/{hub_segment}/{safe_kind}-{now_millis()}.{ext}"


def build_deet_media_key(
    user_id: str,
    context: str,
    file_name: str,
    mime_type: str,
    kind: str,
    hub_slug_or_id: str | None = None,
) -> str:
    ext = extension_for(
        file_name=file_name,
        mime_type=mime_type,
        fallback="jpg" if kind == "image" else "bin",
    )
    if context == "deet":
        hub_segment = sanitize_slug(hub_slug_or_id or "") or "hub"
        return f"deet-media/{user_id}/{hub_segment}/deets/{now_millis()}-{uuid4()}.{ext}"
    return f"deet-media/{user_id}/comments/{now_millis()}-{uuid4()}.{ext}"


def build_chat_media_key(
    user_id: str,
    hub_id: str,
    room_id: str,
    message_id: str,
    file_name: str,
) -> str:
    return (
        f"chat-media/{user_id}/{hub_id}/{room_id}/{message_id}/"
        f"{uuid4()}-{safe_file_segment(file_name)}"
    )
