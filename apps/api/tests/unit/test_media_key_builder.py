import re

from app.services.media.key_builder import (
    build_avatar_key,
    build_chat_media_key,
    build_deet_media_key,
    build_hub_media_key,
)


def test_build_avatar_key() -> None:
    key = build_avatar_key("user-123", "me.png", "image/png")
    assert key == "avatars/user-123/avatar.png"


def test_build_hub_media_key_shape() -> None:
    key = build_hub_media_key(
        owner_user_id="owner-1",
        hub_slug_or_id="My Great Hub",
        kind="cover",
        file_name="cover.jpeg",
        mime_type="image/jpeg",
    )
    assert key.startswith("hub-media/owner-1/my-great-hub/cover-")
    assert key.endswith(".jpeg")


def test_build_deet_media_key_shape() -> None:
    key = build_deet_media_key(
        user_id="u1",
        context="deet",
        file_name="photo.jpg",
        mime_type="image/jpeg",
        kind="image",
        hub_slug_or_id="my-hub",
    )
    assert key.startswith("deet-media/u1/my-hub/deets/")
    assert re.search(r"\d+-[0-9a-f-]+\.jpg$", key) is not None


def test_build_chat_media_key_shape() -> None:
    key = build_chat_media_key(
        user_id="u1",
        hub_id="h1",
        room_id="r1",
        message_id="m1",
        file_name="Very Cool File.pdf",
    )
    assert key.startswith("chat-media/u1/h1/r1/m1/")
    assert key.endswith("-Very-Cool-File.pdf")
