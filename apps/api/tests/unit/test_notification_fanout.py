from app.services import notification_fanout as fanout


def test_notify_member_join_accepted_publishes(monkeypatch) -> None:
    calls: list[tuple[str, dict]] = []

    def _record(name: str):
        def _inner(**kwargs):
            calls.append((name, kwargs))

        return _inner

    monkeypatch.setattr(fanout, "publish_member_join_accepted", _record("join"))
    monkeypatch.setattr(fanout, "publish_feed_invalidate", _record("feed"))
    monkeypatch.setattr(fanout, "publish_unread_changed", _record("unread"))

    fanout.notify_member_join_accepted(
        user_id="user-1",
        hub_id="hub-1",
    )

    assert ("join", {"user_id": "user-1", "hub_id": "hub-1"}) in calls
    assert ("feed", {"user_id": "user-1", "reason": "member_join_accepted"}) in calls
    assert ("unread", {"user_id": "user-1", "hub_id": "hub-1"}) in calls


def test_notify_hub_feed_invalidate_excludes_author(monkeypatch) -> None:
    published: list[str] = []

    class _Row:
        def __init__(self, user_id: str) -> None:
            self.user_id = user_id

    class _Repo:
        def list_hub_members(self, hub_id: str):
            assert hub_id == "hub-1"
            return [_Row("author"), _Row("member-a"), _Row("member-b")]

    monkeypatch.setattr(fanout, "MembershipRepository", lambda _db: _Repo())
    monkeypatch.setattr(
        fanout,
        "publish_feed_invalidate",
        lambda *, user_id, reason: published.append(user_id),
    )

    fanout.notify_hub_feed_invalidate(None, "hub-1", exclude_user_id="author", reason="deet")  # type: ignore[arg-type]

    assert sorted(published) == ["member-a", "member-b"]
