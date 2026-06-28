from __future__ import annotations

from app.dependencies.auth import CurrentUser, get_current_user
from app.main import app
from app.services.deet_interactions import DeetInteractionsService


def test_toggle_like_requires_auth(client) -> None:
    response = client.post("/api/v1/deets/deet_1/likes/toggle", json={})
    assert response.status_code == 401


def test_toggle_like_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        DeetInteractionsService,
        "toggle_like",
        lambda self, user_id, deet_id, reaction_type="like": {  # noqa: ARG005
            "liked": True,
            "likeCount": 1,
            "myReactionType": "👍",
        },
    )
    try:
        response = client.post(
            "/api/v1/deets/deet_1/likes/toggle",
            json={"reactionType": "like"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["liked"] is True
    assert response.json()["likeCount"] == 1


def test_like_status_requires_auth(client) -> None:
    response = client.get("/api/v1/deets/likes/status?ids=deet_1")
    assert response.status_code == 401


def test_like_status_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        DeetInteractionsService,
        "like_status",
        lambda self, user_id, deet_ids: {  # noqa: ARG005
            "statusByDeetId": {
                "deet_1": {"liked": True, "count": 2, "myReactionType": "👍"},
            }
        },
    )
    try:
        response = client.get("/api/v1/deets/likes/status?ids=deet_1")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["statusByDeetId"]["deet_1"]["count"] == 2


def test_create_comment_requires_auth(client) -> None:
    response = client.post("/api/v1/deets/deet_1/comments", json={"body": "hi"})
    assert response.status_code == 401


def test_create_comment_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        DeetInteractionsService,
        "add_comment",
        lambda self, user_id, deet_id, body, **kwargs: {  # noqa: ARG005
            "comment": {
                "id": "c1",
                "deetId": deet_id,
                "userId": user_id,
                "body": body,
                "createdAt": "2026-01-01T00:00:00+00:00",
                "parentId": None,
                "authorName": "Test",
                "authorAvatar": None,
                "imageUrl": None,
                "attachmentUrl": None,
                "attachmentName": None,
            }
        },
    )
    try:
        response = client.post(
            "/api/v1/deets/deet_1/comments",
            json={"body": "hello"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["comment"]["body"] == "hello"


def test_poll_vote_requires_auth(client) -> None:
    response = client.post(
        "/api/v1/deets/deet_1/polls/vote",
        json={"optionIndex": 0},
    )
    assert response.status_code == 401


def test_poll_vote_success(client, monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id="user_1")
    monkeypatch.setattr(
        DeetInteractionsService,
        "cast_poll_vote",
        lambda self, user_id, deet_id, option_index: {"ok": True},  # noqa: ARG005
    )
    try:
        response = client.post(
            "/api/v1/deets/deet_1/polls/vote",
            json={"optionIndex": 1},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"ok": True}
