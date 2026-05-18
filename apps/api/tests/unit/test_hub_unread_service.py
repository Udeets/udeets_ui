from app.services.hub_unread import HubUnreadService


class _FakeRepo:
    def __init__(self) -> None:
        self.mark_calls: list[tuple[str, str]] = []

    def list_unread_hub_ids(self, user_id: str) -> list[str]:
        assert user_id == "user_1"
        return ["hub_a", "hub_b"]

    def mark_hub_seen(self, *, hub_id: str, user_id: str) -> bool:
        self.mark_calls.append((hub_id, user_id))
        return hub_id == "hub_ok"


def test_list_unread_hub_ids_wraps_repository() -> None:
    service = HubUnreadService(_FakeRepo())
    assert service.list_unread_hub_ids("user_1") == {"hub_ids": ["hub_a", "hub_b"]}


def test_mark_hub_seen_wraps_repository() -> None:
    repo = _FakeRepo()
    service = HubUnreadService(repo)
    assert service.mark_hub_seen("user_1", "hub_ok") == {"ok": True}
    assert service.mark_hub_seen("user_1", "hub_missing") == {"ok": False}
    assert repo.mark_calls == [("hub_ok", "user_1"), ("hub_missing", "user_1")]
