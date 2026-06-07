from app.notifications.events import NotificationEventEnvelope, NotificationEventType


def test_notification_envelope_roundtrip() -> None:
    envelope = NotificationEventEnvelope(
        event_type=NotificationEventType.FEED_INVALIDATE,
        user_id="11111111-1111-4111-8111-111111111111",
        payload={"reason": "deet_created", "hubId": "22222222-2222-4222-8222-222222222222"},
    )
    restored = NotificationEventEnvelope.from_json(envelope.to_json())
    assert restored.event_type == NotificationEventType.FEED_INVALIDATE
    assert restored.user_id == envelope.user_id
    assert restored.payload["reason"] == "deet_created"
    assert restored.payload["hubId"] == envelope.payload["hubId"]
