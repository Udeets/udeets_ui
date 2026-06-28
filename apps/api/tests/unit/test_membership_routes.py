from datetime import UTC, datetime
from types import SimpleNamespace

from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.main import app
from app.services.memberships import MembershipService


def _membership_row() -> SimpleNamespace:
    return SimpleNamespace(
        hub_id="hub_1",
        user_id="user_1",
        role="member",
        status="active",
        joined_at=datetime.now(UTC),
    )


def test_list_hub_members(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    monkeypatch.setattr(
        MembershipService,
        "list_hub_members",
        lambda self, hub_id: [_membership_row()],  # noqa: ARG005
    )

    response = client.get("/api/v1/hubs/hub_1/members")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()[0]["user_id"] == "user_1"


def test_list_my_memberships_requires_auth(client) -> None:
    response = client.get("/api/v1/memberships/me")
    assert response.status_code == 401


def test_list_my_memberships_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        MembershipService,
        "list_my_memberships",
        lambda self, user_id: [_membership_row()],  # noqa: ARG005
    )

    response = client.get("/api/v1/memberships/me")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()[0]["hub_id"] == "hub_1"
