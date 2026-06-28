from __future__ import annotations

import asyncio
import logging

from redis.asyncio.client import PubSub

from app.core.config import get_settings
from app.realtime.channels import channel_for_room, pattern_for_all_rooms
from app.realtime.connection_manager import get_connection_manager
from app.realtime.events import ChatEventEnvelope
from app.realtime.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)


class RoomSubscriptionManager:
    def __init__(self) -> None:
        self._pubsub: PubSub | None = None
        self._listener_task: asyncio.Task | None = None
        self._subscribed_rooms: set[str] = set()
        self._pattern_mode = False
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        if not is_redis_available():
            return
        redis = get_redis()
        if redis is None:
            return
        self._pubsub = redis.pubsub()
        get_connection_manager().set_room_hooks(self._on_subscribe, self._on_unsubscribe)
        self._listener_task = asyncio.create_task(self._listen_loop())

    async def stop(self) -> None:
        if self._listener_task is not None:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
        if self._pubsub is not None:
            await self._pubsub.unsubscribe()
            await self._pubsub.aclose()
        self._pubsub = None

    async def _on_subscribe(self, room_id: str) -> None:
        settings = get_settings()
        if settings.chat_redis_subscribe_mode == "pattern":
            if not self._pattern_mode and self._pubsub is not None:
                await self._pubsub.psubscribe(pattern_for_all_rooms())
                self._pattern_mode = True
            return
        async with self._lock:
            if room_id in self._subscribed_rooms or self._pubsub is None:
                return
            await self._pubsub.subscribe(channel_for_room(room_id))
            self._subscribed_rooms.add(room_id)

    async def _on_unsubscribe(self, room_id: str) -> None:
        if get_settings().chat_redis_subscribe_mode == "pattern":
            return
        async with self._lock:
            if room_id not in self._subscribed_rooms or self._pubsub is None:
                return
            await self._pubsub.unsubscribe(channel_for_room(room_id))
            self._subscribed_rooms.discard(room_id)

    async def _listen_loop(self) -> None:
        if self._pubsub is None:
            return
        try:
            async for message in self._pubsub.listen():
                if message is None or message.get("type") not in {"message", "pmessage"}:
                    continue
                data = message.get("data")
                if not isinstance(data, str):
                    continue
                channel = message.get("channel") or message.get("pattern") or ""
                room_id = self._room_id_from_channel(str(channel))
                if not room_id:
                    continue
                try:
                    envelope = ChatEventEnvelope.from_json(data)
                except Exception:
                    logger.debug("Invalid chat envelope on %s", channel)
                    continue
                await get_connection_manager().send_event(room_id, envelope)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Redis pub/sub listener stopped")

    def _room_id_from_channel(self, channel: str) -> str | None:
        prefix = get_settings().chat_pubsub_channel_prefix.rstrip(":")
        marker = f"{prefix}:"
        if marker in channel:
            return channel.split(marker, 1)[-1]
        return None


_subscription_manager: RoomSubscriptionManager | None = None


def get_subscription_manager() -> RoomSubscriptionManager:
    global _subscription_manager
    if _subscription_manager is None:
        _subscription_manager = RoomSubscriptionManager()
    return _subscription_manager
