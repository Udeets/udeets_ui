from app.realtime.events import ChatEventEnvelope, ChatEventType


def test_envelope_roundtrip() -> None:
    envelope = ChatEventEnvelope(
        event_type=ChatEventType.MESSAGE_CREATED,
        room_id="22222222-2222-4222-8222-222222222222",
        message_id="33333333-3333-4333-8333-333333333333",
        payload={"body": "hello"},
    )
    restored = ChatEventEnvelope.from_json(envelope.to_json())
    assert restored.event_type == ChatEventType.MESSAGE_CREATED
    assert restored.room_id == envelope.room_id
    assert restored.message_id == envelope.message_id
    assert restored.payload["body"] == "hello"
