from app.core.config import get_settings


class _FakeSqlPost:
    def __init__(self, responses):
        self._responses = responses
        self._idx = 0

    def __call__(self, **_kwargs):  # noqa: ARG002
        value = self._responses[self._idx]
        self._idx += 1
        return value


def test_internal_cron_unauthorized(client) -> None:
    settings = get_settings()
    settings.cron_secret = "secret123"
    response = client.post("/internal/cron/chat-retention")
    assert response.status_code == 401


def test_internal_cron_success(client, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "cron_secret", "secret123")
    fake = _FakeSqlPost([3, 0])
    monkeypatch.setattr(
        "app.db.repositories.chat.ChatRepository.purge_retention",
        fake,
    )

    response = client.post(
        "/internal/cron/chat-retention",
        headers={"Authorization": "Bearer secret123"},
    )
    assert response.status_code == 200
    assert response.json()["deletedMessages"] == 3
