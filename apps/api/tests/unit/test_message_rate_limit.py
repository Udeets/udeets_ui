import pytest

from app.realtime.message_rate_limit import (
    CHAT_MESSAGE_SEND_MAX_PER_WINDOW,
    allow_message_send,
)


@pytest.mark.asyncio
async def test_allow_message_send_memory_window() -> None:
    room = "22222222-2222-4222-8222-222222222222"
    user = "11111111-1111-4111-8111-111111111111"
    for _ in range(CHAT_MESSAGE_SEND_MAX_PER_WINDOW):
        assert await allow_message_send(user, room) is True
    assert await allow_message_send(user, room) is False
