from fastapi.testclient import TestClient

from app.services import geo


def test_geo_reverse_requires_lat_lon(client: TestClient) -> None:
    response = client.get("/api/v1/geo/reverse")
    assert response.status_code == 400


def test_geo_reverse_success(client: TestClient, monkeypatch) -> None:
    geo.limiter.reset()

    async def fake_get_json(path: str, params: dict[str, str]) -> dict:
        assert path == "/reverse"
        assert "lat" in params
        assert "lon" in params
        return {"name": "Current Location", "display_name": "Richmond, VA"}

    monkeypatch.setattr(geo, "get_json", fake_get_json)
    response = client.get("/api/v1/geo/reverse?lat=37.5&lon=-77.4")

    assert response.status_code == 200
    assert response.json()["name"] == "Current Location"


def test_geo_search_rate_limited(client: TestClient, monkeypatch) -> None:
    geo.limiter.reset()

    async def fake_get_json(path: str, params: dict[str, str]) -> list[dict]:
        assert path == "/search"
        return [{"name": "Place", "display_name": "Place Address"}]

    monkeypatch.setattr(geo, "get_json", fake_get_json)

    first = client.get("/api/v1/geo/search?lat=37.5&lon=-77.4")
    second = client.get("/api/v1/geo/search?lat=37.5&lon=-77.4")

    assert first.status_code == 200
    assert second.status_code == 429
