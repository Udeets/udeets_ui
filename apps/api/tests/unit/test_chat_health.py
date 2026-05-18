from fastapi.testclient import TestClient

from app.main import app


def test_health_includes_redis_status() -> None:
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert "redis" in body
    assert "chat_realtime" in body
