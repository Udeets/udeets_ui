from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from uuid import uuid4

from fastapi import WebSocket

from app.realtime.events import ChatEventEnvelope

logger = logging.getLogger(__name__)


@dataclass
class ChatConnection:
    id: str
    websocket: WebSocket
    user_id: str
    rooms: set[str] = field(default_factory=set)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, ChatConnection] = {}
        self._room_refs: dict[str, int] = {}
        self._lock = asyncio.Lock()
        self._on_room_subscribe: asyncio.coroutines | None = None
        self._on_room_unsubscribe: asyncio.coroutines | None = None

    def set_room_hooks(
        self,
        on_subscribe,
        on_unsubscribe,
    ) -> None:
        self._on_room_subscribe = on_subscribe
        self._on_room_unsubscribe = on_unsubscribe

    async def connect(self, websocket: WebSocket, user_id: str) -> ChatConnection:
        conn = ChatConnection(id=str(uuid4()), websocket=websocket, user_id=user_id)
        async with self._lock:
            self._connections[conn.id] = conn
        return conn

    async def disconnect(self, conn_id: str) -> None:
        async with self._lock:
            conn = self._connections.pop(conn_id, None)
        if conn is None:
            return
        for room_id in list(conn.rooms):
            await self.leave_room(conn_id, room_id)

    async def join_room(self, conn_id: str, room_id: str) -> None:
        async with self._lock:
            conn = self._connections.get(conn_id)
            if conn is None or room_id in conn.rooms:
                return
            conn.rooms.add(room_id)
            refs = self._room_refs.get(room_id, 0) + 1
            self._room_refs[room_id] = refs
            first = refs == 1
        if first and self._on_room_subscribe is not None:
            await self._on_room_subscribe(room_id)

    async def leave_room(self, conn_id: str, room_id: str) -> None:
        async with self._lock:
            conn = self._connections.get(conn_id)
            if conn is None or room_id not in conn.rooms:
                return
            conn.rooms.discard(room_id)
            refs = self._room_refs.get(room_id, 0) - 1
            if refs <= 0:
                self._room_refs.pop(room_id, None)
                last = True
            else:
                self._room_refs[room_id] = refs
                last = False
        if last and self._on_room_unsubscribe is not None:
            await self._on_room_unsubscribe(room_id)

    async def broadcast_to_room(self, room_id: str, message: dict) -> None:
        async with self._lock:
            targets = [
                c
                for c in self._connections.values()
                if room_id in c.rooms
            ]
        for conn in targets:
            try:
                await conn.websocket.send_json(message)
            except Exception:
                logger.debug("Failed to send WS message to %s", conn.id)

    async def revoke_user_in_room(self, room_id: str, user_id: str, reason: str) -> None:
        async with self._lock:
            targets = [
                c
                for c in self._connections.values()
                if room_id in c.rooms and c.user_id == user_id
            ]
        for conn in targets:
            try:
                await conn.websocket.send_json(
                    {
                        "type": "room.access_revoked",
                        "roomId": room_id,
                        "reason": reason,
                    }
                )
            except Exception:
                pass
            await self.leave_room(conn.id, room_id)

    async def send_event(self, room_id: str, envelope: ChatEventEnvelope) -> None:
        await self.broadcast_to_room(
            room_id,
            {"type": "event", "envelope": envelope.model_dump(mode="json")},
        )

    def users_in_room(self, room_id: str) -> set[str]:
        return {c.user_id for c in self._connections.values() if room_id in c.rooms}


_manager: ConnectionManager | None = None


def get_connection_manager() -> ConnectionManager:
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager
