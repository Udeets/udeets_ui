from __future__ import annotations

import logging

from app.core.config import get_settings
from app.realtime.channels import channel_for_room
from app.realtime.events import ChatEventEnvelope
from app.realtime.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)


class ChatRealtimePublisher:
    async def publish_async(self, envelope: ChatEventEnvelope) -> bool:
        if not get_settings().chat_realtime_enabled:
            return False
        if not is_redis_available():
            return False
        redis = get_redis()
        if redis is None:
            return False
        channel = channel_for_room(envelope.room_id)
        try:
            await redis.publish(channel, envelope.to_json())
            return True
        except Exception:
            logger.exception("Failed to publish chat event to %s", channel)
            return False


_publisher: ChatRealtimePublisher | None = None


def get_chat_publisher() -> ChatRealtimePublisher:
    global _publisher
    if _publisher is None:
        _publisher = ChatRealtimePublisher()
    return _publisher
