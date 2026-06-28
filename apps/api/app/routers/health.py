from fastapi import APIRouter

from app.core.config import get_settings
from app.realtime.redis_client import is_redis_available, ping_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def healthcheck() -> dict[str, str | bool]:
    settings = get_settings()
    redis_configured = bool(settings.redis_url)
    redis_ok = await ping_redis() if redis_configured else False

    if not redis_configured:
        redis_status = "not_configured"
    elif redis_ok:
        redis_status = "ok"
    else:
        redis_status = "degraded"

    chat_realtime = "unavailable"
    if settings.chat_realtime_enabled and redis_ok:
        chat_realtime = "ok"
    elif settings.chat_realtime_enabled and redis_configured:
        chat_realtime = "degraded"

    return {
        "ok": True,
        "service": "udeets-api",
        "redis": redis_status,
        "chat_realtime": chat_realtime,
        "chat_realtime_enabled": settings.chat_realtime_enabled,
    }
