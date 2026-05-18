from fastapi.testclient import TestClient


def test_openapi_is_available(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    body = response.json()
    assert body["info"]["title"] == "udeets-api"
