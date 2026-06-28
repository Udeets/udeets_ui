from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HubRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    category: str
    tagline: str | None = None
    description: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    cover_image_url: str | None = None
    cover_image_offset_y: float | None = None
    dp_image_url: str | None = None
    dp_image_offset_y: float | None = None
    gallery_image_urls: list[str] | None = None
    website_url: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    visibility: str | None = None
    accent_color: str | None = None
    created_by: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class HubCreateRequest(BaseModel):
    name: str
    slug: str
    category: str
    visibility: str | None = "public"
    tagline: str | None = None
    description: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    cover_image_url: str | None = None
    dp_image_url: str | None = None
    website_url: str | None = None


class HubUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    visibility: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    website_url: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    phone_number: str | None = None
    cover_image_url: str | None = None
    cover_image_offset_y: float | None = None
    dp_image_url: str | None = None
    dp_image_offset_y: float | None = None
    gallery_image_urls: list[str] | None = None
    accent_color: str | None = None
