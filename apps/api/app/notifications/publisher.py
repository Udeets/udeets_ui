from __future__ import annotations

import logging

from app.core.config import get_settings
from app.notifications.channels import channel_for_user
from app.notifications.events import NotificationEventEnvelope
from app.realtime.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)


class NotificationRealtimePublisher:
    async def publish_async(self, envelope: NotificationEventEnvelope) -> bool:
        if not get_settings().notifications_realtime_enabled:
            return False
        if not is_redis_available():
            return False
        redis = get_redis()
        if redis is None:
            return False
        channel = channel_for_user(envelope.user_id)
        try:
            await redis.publish(channel, envelope.to_json())
            return True
        except Exception:
            logger.exception("Failed to publish notification event to %s", channel)
            return False


_publisher: NotificationRealtimePublisher | None = None


def get_notification_publisher() -> NotificationRealtimePublisher:
    global _publisher
    if _publisher is None:
        _publisher = NotificationRealtimePublisher()
    return _publisher
