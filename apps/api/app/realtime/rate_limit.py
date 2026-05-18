from __future__ import annotations

import time

from app.core.config import get_settings
from app.realtime.redis_client import get_redis, is_redis_available

_memory_windows: dict[str, float] = {}


async def allow_typing_started(user_id: str, room_id: str) -> bool:
    key = f"chat:rl:typing:started:{room_id}:{user_id}"
    window = get_settings().chat_typing_started_rate_limit_seconds
    return await _allow_sliding(key, window)


async def allow_typing_stopped(user_id: str, room_id: str) -> bool:
    key = f"chat:rl:typing:stopped:{room_id}:{user_id}"
    return await _allow_sliding(key, 2.0)


async def _allow_sliding(key: str, window_seconds: float) -> bool:
    now = time.monotonic()
    if is_redis_available():
        redis = get_redis()
        if redis is not None:
            try:
                acquired = await redis.set(key, "1", nx=True, ex=int(max(1, window_seconds)))
                return bool(acquired)
            except Exception:
                pass
    last = _memory_windows.get(key, 0.0)
    if now - last < window_seconds:
        return False
    _memory_windows[key] = now
    return True
