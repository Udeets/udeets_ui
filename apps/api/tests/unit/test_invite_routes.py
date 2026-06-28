from datetime import UTC, datetime

from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.main import app
from app.schemas.invite import PendingInvitationRead, ResolvedJoinLinkRead
from app.services.invites import InviteService


def test_resolve_join_link(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    monkeypatch.setattr(
        InviteService,
        "resolve_join_token",
        lambda self, token: ResolvedJoinLinkRead(  # noqa: ARG005
            hub_id="hub_1",
            category="religious",
            slug="hindu-center-of-virginia",
            hub_name="Hindu Center of Virginia",
            is_valid=True,
        ),
    )

    response = client.get("/api/v1/join-links/resolve?token=abc123")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["is_valid"] is True


def test_invitations_me_requires_auth(client) -> None:
    response = client.get("/api/v1/invitations/me")
    assert response.status_code == 401


def test_invitations_me_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "list_pending_invitations",
        lambda self, user_id: [  # noqa: ARG005
            PendingInvitationRead(
                invitation_id="inv_1",
                hub_id="hub_1",
                hub_name="Hindu Center of Virginia",
                hub_category="religious",
                hub_slug="hindu-center-of-virginia",
                dp_image="",
                invited_at=datetime.now(UTC),
                invited_by_name="Admin",
            )
        ],
    )

    response = client.get("/api/v1/invitations/me")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()[0]["invitation_id"] == "inv_1"


def test_accept_invitation_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "accept_invitation",
        lambda self, invitation_id, user_id: True,  # noqa: ARG005
    )

    response = client.post("/api/v1/invitations/inv_1/accept")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_decline_invitation_not_found(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "decline_invitation",
        lambda self, invitation_id, user_id: False,  # noqa: ARG005
    )

    response = client.post("/api/v1/invitations/inv_missing/decline")
    app.dependency_overrides.clear()

    assert response.status_code == 404


def test_get_or_create_join_link_requires_auth(client) -> None:
    response = client.get("/api/v1/join-links/hub_1")
    assert response.status_code == 401


def test_get_or_create_join_link_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "get_or_create_join_link",
        lambda self, hub_id, user_id, expires_in_days: {
            "token": "abc",
            "expires_at": None,
            "disabled": False,
        },  # noqa: ARG005
    )

    response = client.get("/api/v1/join-links/hub_1")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["token"] == "abc"


def test_set_join_link_expiration_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "set_join_link_expiration",
        lambda self, hub_id, user_id, expires_in_days: datetime(2026, 1, 1, tzinfo=UTC),  # noqa: ARG005
    )

    response = client.post("/api/v1/join-links/hub_1/expiration", json={"expires_in_days": 7})
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["expires_at"].startswith("2026-01-01")


def test_hub_contact_invite_success(client, monkeypatch) -> None:
    from app.services.hub_contact_invite_rate_limit import reset_hub_contact_invite_limits_for_tests

    reset_hub_contact_invite_limits_for_tests()
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "send_contact_invite",
        lambda self, hub_id, user_id, contact_type, contact_value, expires_in_days: True,  # noqa: ARG005
    )

    response = client.post(
        "/api/v1/hubs/hub_1/invites/contact",
        json={"contact_type": "email", "contact_value": "hello@example.com", "expires_in_days": 30},
    )
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_hub_contact_invite_rate_limited(client, monkeypatch) -> None:
    from app.services import hub_contact_invite_rate_limit as rate_limit

    rate_limit.reset_hub_contact_invite_limits_for_tests()
    app.dependency_overrides[get_db] = lambda: iter([object()])
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        InviteService,
        "send_contact_invite",
        lambda self, hub_id, user_id, contact_type, contact_value, expires_in_days: True,  # noqa: ARG005
    )

    payload = {
        "contact_type": "email",
        "contact_value": "hello@example.com",
        "expires_in_days": 30,
    }
    for _ in range(rate_limit.HUB_CONTACT_INVITE_MAX_PER_WINDOW):
        assert client.post("/api/v1/hubs/hub_1/invites/contact", json=payload).status_code == 200

    blocked = client.post("/api/v1/hubs/hub_1/invites/contact", json=payload)
    app.dependency_overrides.clear()

    assert blocked.status_code == 429
    assert blocked.json()["error"] == "Too many invites sent. Please try again later."
