from __future__ import annotations

import asyncio
import logging

from app.realtime.events import ChatEventEnvelope
from app.realtime.publisher import get_chat_publisher

logger = logging.getLogger(__name__)


def schedule_publish(envelope: ChatEventEnvelope) -> None:
    """Fire-and-forget publish from sync service code (fail-open)."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(get_chat_publisher().publish_async(envelope))
    except RuntimeError:
        try:
            asyncio.run(get_chat_publisher().publish_async(envelope))
        except Exception:
            logger.exception("Failed to schedule chat publish without running loop")
