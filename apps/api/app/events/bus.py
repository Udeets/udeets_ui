from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Protocol

from app.core.config import get_settings
from app.realtime.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)


class DomainEventBus(Protocol):
    async def publish(self, event_type: str, payload: dict[str, Any]) -> None: ...


class RedisStreamEventBus:
    async def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        settings = get_settings()
        if settings.event_bus_backend != "redis_stream":
            return
        if not is_redis_available():
            return
        redis = get_redis()
        if redis is None:
            return
        try:
            await redis.xadd(
                settings.event_stream_key,
                {
                    "type": event_type,
                    "payload": json.dumps(payload, default=str),
                },
            )
        except Exception:
            logger.exception("Failed to append domain event to Redis stream")


class NoopEventBus:
    async def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        return


_bus: DomainEventBus | None = None


def get_domain_event_bus() -> DomainEventBus:
    global _bus
    if _bus is None:
        backend = get_settings().event_bus_backend
        if backend == "redis_stream":
            _bus = RedisStreamEventBus()
        else:
            _bus = NoopEventBus()
    return _bus


def schedule_domain_event(event_type: str, payload: dict[str, Any]) -> None:
    """Fire-and-forget domain event from sync service code (fail-open)."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(get_domain_event_bus().publish(event_type, payload))
    except RuntimeError:
        try:
            asyncio.run(get_domain_event_bus().publish(event_type, payload))
        except Exception:
            logger.exception("Failed to schedule domain event without running loop")
