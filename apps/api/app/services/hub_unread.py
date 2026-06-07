from app.db.repositories.hub_unread import HubUnreadRepository
from app.notifications.helpers import publish_unread_changed


class HubUnreadService:
    def __init__(self, repo: HubUnreadRepository) -> None:
        self.repo = repo

    def list_unread_hub_ids(self, user_id: str) -> dict:
        hub_ids = self.repo.list_unread_hub_ids(user_id=user_id)
        return {"hub_ids": hub_ids}

    def mark_hub_seen(self, user_id: str, hub_id: str) -> dict[str, bool]:
        ok = self.repo.mark_hub_seen(hub_id=hub_id, user_id=user_id)
        if ok:
            publish_unread_changed(user_id=user_id, hub_id=hub_id)
        return {"ok": ok}
