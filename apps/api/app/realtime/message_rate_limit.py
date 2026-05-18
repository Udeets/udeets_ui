from __future__ import annotations

import time

from app.core.config import get_settings
from app.realtime.redis_client import get_redis, is_redis_available

CHAT_MESSAGE_SEND_WINDOW_SECONDS = 60
CHAT_MESSAGE_SEND_MAX_PER_WINDOW = 45

_memory_windows: dict[str, tuple[int, float]] = {}


async def allow_message_send(user_id: str, room_id: str) -> bool:
    key = f"chat:rl:msg:{room_id}:{user_id}"
    window = float(CHAT_MESSAGE_SEND_WINDOW_SECONDS)
    if is_redis_available():
        redis = get_redis()
        if redis is not None:
            try:
                count = await redis.incr(key)
                if count == 1:
                    await redis.expire(key, int(window))
                return count <= CHAT_MESSAGE_SEND_MAX_PER_WINDOW
            except Exception:
                pass
    now = time.monotonic()
    count, started = _memory_windows.get(key, (0, now))
    if now - started >= window:
        _memory_windows[key] = (1, now)
        return True
    if count >= CHAT_MESSAGE_SEND_MAX_PER_WINDOW:
        return False
    _memory_windows[key] = (count + 1, started)
    return True
