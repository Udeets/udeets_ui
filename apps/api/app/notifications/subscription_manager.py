from __future__ import annotations

import asyncio
import logging

from redis.asyncio.client import PubSub

from app.core.config import get_settings
from app.notifications.channels import channel_for_user, pattern_for_all_users
from app.notifications.connection_manager import get_notification_connection_manager
from app.notifications.events import NotificationEventEnvelope
from app.realtime.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)


class UserNotificationSubscriptionManager:
    def __init__(self) -> None:
        self._pubsub: PubSub | None = None
        self._listener_task: asyncio.Task | None = None
        self._subscribed_users: set[str] = set()
        self._pattern_mode = False
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        if not is_redis_available():
            return
        redis = get_redis()
        if redis is None:
            return
        self._pubsub = redis.pubsub()
        get_notification_connection_manager().set_user_hooks(
            self._on_subscribe,
            self._on_unsubscribe,
        )
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

    async def _on_subscribe(self, user_id: str) -> None:
        settings = get_settings()
        if settings.notifications_redis_subscribe_mode == "pattern":
            if not self._pattern_mode and self._pubsub is not None:
                await self._pubsub.psubscribe(pattern_for_all_users())
                self._pattern_mode = True
            return
        async with self._lock:
            if user_id in self._subscribed_users or self._pubsub is None:
                return
            await self._pubsub.subscribe(channel_for_user(user_id))
            self._subscribed_users.add(user_id)

    async def _on_unsubscribe(self, user_id: str) -> None:
        if get_settings().notifications_redis_subscribe_mode == "pattern":
            return
        async with self._lock:
            if user_id not in self._subscribed_users or self._pubsub is None:
                return
            await self._pubsub.unsubscribe(channel_for_user(user_id))
            self._subscribed_users.discard(user_id)

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
                channel = str(message.get("channel") or message.get("pattern") or "")
                user_id = self._user_id_from_channel(channel)
                if not user_id:
                    continue
                try:
                    envelope = NotificationEventEnvelope.from_json(data)
                except Exception:
                    logger.debug("Invalid notification envelope on %s", channel)
                    continue
                await get_notification_connection_manager().send_to_user(
                    user_id,
                    {"type": "event", "envelope": envelope.model_dump(mode="json")},
                )
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Notification Redis pub/sub listener stopped")

    def _user_id_from_channel(self, channel: str) -> str | None:
        prefix = get_settings().notifications_pubsub_channel_prefix.rstrip(":")
        marker = f"{prefix}:"
        if marker in channel:
            return channel.split(marker, 1)[-1]
        return None


_subscription_manager: UserNotificationSubscriptionManager | None = None


def get_user_notification_subscription_manager() -> UserNotificationSubscriptionManager:
    global _subscription_manager
    if _subscription_manager is None:
        _subscription_manager = UserNotificationSubscriptionManager()
    return _subscription_manager
