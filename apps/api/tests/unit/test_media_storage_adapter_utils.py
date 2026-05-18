from app.core.config import get_settings
from app.services.media.storage_adapter import (
    extract_storage_key,
    strip_s3_prefix,
    to_public_media_url,
    with_s3_prefix,
)


def test_extract_storage_key_from_s3_public_base_url() -> None:
    settings = get_settings()
    settings.s3_media_prefix = "staging"
    settings.s3_public_base_url = "https://cdn.udeets.com"
    key = extract_storage_key("https://cdn.udeets.com/staging/avatars/user1/avatar.png")
    assert key == "avatars/user1/avatar.png"


def test_extract_storage_key_from_s3_url() -> None:
    settings = get_settings()
    settings.s3_bucket_name = "udeets-media"
    settings.s3_media_prefix = "staging"
    key = extract_storage_key("s3://udeets-media/staging/deet-media/u1/hub/deets/1-a.jpg")
    assert key == "deet-media/u1/hub/deets/1-a.jpg"


def test_prefix_helpers_roundtrip() -> None:
    settings = get_settings()
    settings.s3_media_prefix = "production"
    key = "chat-media/u1/h1/r1/m1/file.txt"
    assert with_s3_prefix(key) == "production/chat-media/u1/h1/r1/m1/file.txt"
    assert strip_s3_prefix("production/chat-media/u1/h1/r1/m1/file.txt") == key


def test_to_public_media_url_with_s3_primary() -> None:
    settings = get_settings()
    settings.s3_bucket_name = "udeets-media"
    settings.s3_media_prefix = "dev"
    settings.s3_public_base_url = "https://cdn.udeets.com"
    resolved = to_public_media_url("avatars/user1/avatar.jpg")
    assert resolved == "https://cdn.udeets.com/dev/avatars/user1/avatar.jpg"
