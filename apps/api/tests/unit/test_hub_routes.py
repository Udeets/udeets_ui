from datetime import UTC, datetime
from types import SimpleNamespace

from app.dependencies.db import get_db
from app.main import app
from app.services.hubs import HubService


def _sample_hub() -> SimpleNamespace:
    return SimpleNamespace(
        id="hub_1",
        name="Hindu Center of Virginia",
        slug="hindu-center-of-virginia",
        category="religious",
        tagline=None,
        description=None,
        city="Richmond",
        state="VA",
        country=None,
        cover_image_url=None,
        cover_image_offset_y=None,
        dp_image_url=None,
        dp_image_offset_y=None,
        gallery_image_urls=None,
        website_url=None,
        facebook_url=None,
        instagram_url=None,
        youtube_url=None,
        visibility="public",
        accent_color=None,
        created_by="user_1",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def test_hub_list_returns_data(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    monkeypatch.setattr(HubService, "list_hubs", lambda self, category=None: [_sample_hub()])  # noqa: ARG005

    response = client.get("/api/v1/hubs")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["slug"] == "hindu-center-of-virginia"


def test_hub_detail_by_slug_returns_data(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    monkeypatch.setattr(HubService, "get_hub_by_slug", lambda self, category, slug: _sample_hub())  # noqa: ARG005

    response = client.get("/api/v1/hubs/by-slug/religious/hindu-center-of-virginia")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["id"] == "hub_1"


def test_hub_detail_by_slug_not_found(client, monkeypatch) -> None:
    app.dependency_overrides[get_db] = lambda: iter([object()])
    monkeypatch.setattr(HubService, "get_hub_by_slug", lambda self, category, slug: None)  # noqa: ARG005

    response = client.get("/api/v1/hubs/by-slug/religious/missing")
    app.dependency_overrides.clear()

    assert response.status_code == 404
