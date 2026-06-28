from __future__ import annotations

import time

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.realtime.channels import typing_key_for_room
from app.realtime.helpers import publish_typing_snapshot, publish_typing_started, publish_typing_stopped
from app.realtime.rate_limit import allow_typing_started, allow_typing_stopped
from app.realtime.redis_client import get_redis, is_redis_available
from app.services.chat.context import can_view, resolve_room_context
from app.db.repositories.chat import ChatRepository


class ChatTypingService:
    def __init__(self, chat: ChatRepository) -> None:
        self.chat = chat

    async def record_phase(self, user_id: str, room_id: str, phase: str) -> dict:
        ctx = resolve_room_context(self.chat, room_id=room_id, user_id=user_id)
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found."
            )
        if not can_view(ctx):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this chat room.",
            )
        if ctx.get("is_banned"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are banned from this chat room.",
            )

        if not is_redis_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Typing is temporarily unavailable.",
            )

        if phase == "stopped":
            if not await allow_typing_stopped(user_id, room_id):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "CHAT_RATE_LIMIT",
                        "error": "Too many typing updates. Try again shortly.",
                    },
                )
            await self._set_stopped(room_id, user_id)
            publish_typing_stopped(room_id=room_id, user_id=user_id)
            return {"ok": True}

        if not await allow_typing_started(user_id, room_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "CHAT_RATE_LIMIT",
                    "error": "Too many typing updates. Try again shortly.",
                },
            )

        await self._set_started(room_id, user_id)
        publish_typing_started(room_id=room_id, user_id=user_id)
        return {"ok": True}

    async def snapshot_user_ids(self, room_id: str) -> list[str]:
        redis = get_redis()
        if redis is None:
            return []
        key = typing_key_for_room(room_id)
        now_ms = int(time.time() * 1000)
        ttl_ms = get_settings().chat_typing_ttl_seconds * 1000
        raw = await redis.hgetall(key)
        active: list[str] = []
        for user_id, stamp in raw.items():
            try:
                if now_ms - int(stamp) <= ttl_ms:
                    active.append(user_id)
            except ValueError:
                continue
        return active

    async def send_snapshot(self, room_id: str) -> None:
        user_ids = await self.snapshot_user_ids(room_id)
        publish_typing_snapshot(room_id=room_id, user_ids=user_ids)

    async def _set_started(self, room_id: str, user_id: str) -> None:
        redis = get_redis()
        if redis is None:
            return
        key = typing_key_for_room(room_id)
        now_ms = str(int(time.time() * 1000))
        await redis.hset(key, user_id, now_ms)
        await redis.expire(key, get_settings().chat_typing_ttl_seconds)

    async def _set_stopped(self, room_id: str, user_id: str) -> None:
        redis = get_redis()
        if redis is None:
            return
        await redis.hdel(typing_key_for_room(room_id), user_id)
