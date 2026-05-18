from __future__ import annotations

from app.dependencies.auth import CurrentUser, get_current_user
from app.main import app
from app.services.hub_unread import HubUnreadService


def test_hub_unread_requires_auth(client) -> None:
    response = client.get("/api/v1/hubs/unread")
    assert response.status_code == 401


def test_hub_unread_returns_hub_ids(client, monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        HubUnreadService,
        "list_unread_hub_ids",
        lambda self, user_id: {"hub_ids": ["hub_a", "hub_b"]},  # noqa: ARG005
    )

    try:
        response = client.get("/api/v1/hubs/unread")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"hub_ids": ["hub_a", "hub_b"]}


def test_mark_hub_seen_requires_auth(client) -> None:
    response = client.post("/api/v1/hubs/hub_1/seen")
    assert response.status_code == 401


def test_mark_hub_seen_success(client, monkeypatch) -> None:
    seen: dict[str, str] = {}

    def _mark(self, *, user_id: str, hub_id: str) -> dict[str, bool]:  # noqa: ARG002
        seen["user_id"] = user_id
        seen["hub_id"] = hub_id
        return {"ok": True}

    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_42")
    monkeypatch.setattr(HubUnreadService, "mark_hub_seen", _mark)

    try:
        response = client.post("/api/v1/hubs/hub_xyz/seen")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert seen["user_id"] == "user_42"
    assert seen["hub_id"] == "hub_xyz"
