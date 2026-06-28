from __future__ import annotations

import asyncio
import logging

from app.notifications.events import NotificationEventEnvelope
from app.notifications.publisher import get_notification_publisher

logger = logging.getLogger(__name__)


def schedule_notification_publish(envelope: NotificationEventEnvelope) -> None:
    """Fire-and-forget publish from sync service code (fail-open)."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(get_notification_publisher().publish_async(envelope))
    except RuntimeError:
        try:
            asyncio.run(get_notification_publisher().publish_async(envelope))
        except Exception:
            logger.exception("Failed to schedule notification publish without running loop")
