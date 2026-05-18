from app.db.repositories.hubs import HubRepository
from app.schemas.hub import HubRead
from app.services.media import to_public_media_url


def _resolve_hub_media(hub: HubRead) -> HubRead:
    gallery = (
        [to_public_media_url(value) or value for value in hub.gallery_image_urls]
        if hub.gallery_image_urls
        else []
    )
    return hub.model_copy(
        update={
            "dp_image_url": to_public_media_url(hub.dp_image_url),
            "cover_image_url": to_public_media_url(hub.cover_image_url),
            "gallery_image_urls": gallery,
        }
    )


class HubService:
    def __init__(self, repo: HubRepository) -> None:
        self.repo = repo

    def list_hubs(self, category: str | None = None) -> list[HubRead]:
        hubs = self.repo.list_hubs(category=category)
        return [_resolve_hub_media(HubRead.model_validate(hub)) for hub in hubs]

    def get_hub_by_id(self, hub_id: str) -> HubRead | None:
        hub = self.repo.get_hub_by_id(hub_id=hub_id)
        if not hub:
            return None
        return _resolve_hub_media(HubRead.model_validate(hub))

    def get_hub_by_slug(self, category: str, slug: str) -> HubRead | None:
        hub = self.repo.get_hub_by_slug(category=category, slug=slug)
        if not hub:
            return None
        return _resolve_hub_media(HubRead.model_validate(hub))

    def create_hub(self, payload: dict, user_id: str) -> HubRead:
        hub = self.repo.create_hub(payload=payload, created_by=user_id)
        return _resolve_hub_media(HubRead.model_validate(hub))

    def update_hub(self, hub_id: str, user_id: str, payload: dict) -> HubRead | None:
        hub = self.repo.update_hub(
            hub_id=hub_id,
            actor_user_id=user_id,
            payload=payload,
        )
        if not hub:
            return None
        return _resolve_hub_media(HubRead.model_validate(hub))

    def delete_hub(self, hub_id: str, user_id: str) -> bool:
        return self.repo.delete_hub(hub_id=hub_id, actor_user_id=user_id)

    def invite_user_to_hub(self, hub_id: str, user_id: str, invited_user_id: str) -> str:
        return self.repo.invite_user_to_hub(
            hub_id=hub_id,
            invited_by=user_id,
            invited_user_id=invited_user_id,
        )
