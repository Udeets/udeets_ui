from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from uuid import uuid4

from fastapi import WebSocket

logger = logging.getLogger(__name__)


@dataclass
class NotificationConnection:
    id: str
    websocket: WebSocket
    user_id: str


class NotificationConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, NotificationConnection] = {}
        self._user_refs: dict[str, int] = {}
        self._lock = asyncio.Lock()
        self._on_user_subscribe = None
        self._on_user_unsubscribe = None

    def set_user_hooks(self, on_subscribe, on_unsubscribe) -> None:
        self._on_user_subscribe = on_subscribe
        self._on_user_unsubscribe = on_unsubscribe

    async def connect(self, websocket: WebSocket, user_id: str) -> NotificationConnection:
        conn = NotificationConnection(id=str(uuid4()), websocket=websocket, user_id=user_id)
        async with self._lock:
            self._connections[conn.id] = conn
            refs = self._user_refs.get(user_id, 0) + 1
            self._user_refs[user_id] = refs
            first = refs == 1
        if first and self._on_user_subscribe is not None:
            await self._on_user_subscribe(user_id)
        return conn

    async def disconnect(self, conn_id: str) -> None:
        async with self._lock:
            conn = self._connections.pop(conn_id, None)
            if conn is None:
                return
            user_id = conn.user_id
            refs = self._user_refs.get(user_id, 0) - 1
            if refs <= 0:
                self._user_refs.pop(user_id, None)
                last = True
            else:
                self._user_refs[user_id] = refs
                last = False
        if last and self._on_user_unsubscribe is not None:
            await self._on_user_unsubscribe(user_id)

    async def send_to_user(self, user_id: str, message: dict) -> None:
        async with self._lock:
            targets = [c for c in self._connections.values() if c.user_id == user_id]
        for conn in targets:
            try:
                await conn.websocket.send_json(message)
            except Exception:
                logger.debug("Failed to send notification WS message to %s", conn.id)


_manager: NotificationConnectionManager | None = None


def get_notification_connection_manager() -> NotificationConnectionManager:
    global _manager
    if _manager is None:
        _manager = NotificationConnectionManager()
    return _manager
