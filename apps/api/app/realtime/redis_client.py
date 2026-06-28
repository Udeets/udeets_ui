from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from redis.asyncio import Redis

from app.core.config import get_settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

_redis: Redis | None = None
_redis_available: bool = False


def is_redis_available() -> bool:
    return _redis_available


async def connect_redis() -> None:
    global _redis, _redis_available
    settings = get_settings()
    if not settings.redis_url:
        logger.info("REDIS_URL not configured; chat realtime pub/sub disabled")
        _redis = None
        _redis_available = False
        return
    try:
        client: Redis = Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
        )
        await client.ping()
        _redis = client
        _redis_available = True
        logger.info("Redis connected for chat realtime")
    except Exception:
        logger.exception("Failed to connect to Redis")
        _redis = None
        _redis_available = False


async def disconnect_redis() -> None:
    global _redis, _redis_available
    if _redis is not None:
        await _redis.aclose()
    _redis = None
    _redis_available = False


def get_redis() -> Redis | None:
    return _redis


async def ping_redis() -> bool:
    if _redis is None:
        return False
    try:
        await _redis.ping()
        return True
    except Exception:
        return False
