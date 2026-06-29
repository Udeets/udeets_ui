from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth.ws_connect import authenticate_verified_websocket
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.db.repositories.chat import ChatRepository
from app.realtime.connection_manager import get_connection_manager
from app.services.chat.context import can_view, resolve_room_context
from app.services.chat.context import is_active as _is_active
from app.services.chat.context import is_hub_staff as _is_hub_staff
from app.services.chat_typing import ChatTypingService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat-ws"])


def _extract_token(websocket: WebSocket) -> str | None:
    auth = websocket.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return websocket.query_params.get("token")


def _assert_can_join_room(chat: ChatRepository, room_id: str, user_id: str) -> None:
    ctx = resolve_room_context(chat, room_id=room_id, user_id=user_id)
    if not ctx:
        raise ValueError("Chat room not found.")
    if not can_view(ctx):
        raise ValueError("You do not have access to this chat room.")
    if ctx.get("is_banned"):
        raise ValueError("You are banned from this chat room.")
    active_member = _is_active(ctx["room_membership"])
    staff = _is_hub_staff(ctx["hub_membership"])
    if not active_member and not staff:
        raise ValueError("Join this chat room to receive live updates.")


@router.websocket("/chat/ws")
async def chat_websocket(websocket: WebSocket) -> None:
    settings = get_settings()
    if not settings.chat_realtime_enabled:
        await websocket.close(code=4403, reason="Chat realtime disabled")
        return

    token = _extract_token(websocket)
    user = await authenticate_verified_websocket(websocket, token)
    if user is None:
        return

    await websocket.accept()
    manager = get_connection_manager()
    conn = await manager.connect(websocket, user.user_id)

    db = SessionLocal()
    try:
        chat = ChatRepository(db)
        typing_service = ChatTypingService(chat)

        while True:
            data = await websocket.receive_json()
            msg_type = str(data.get("type") or "")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type == "room.leave":
                room_id = str(data.get("roomId") or "")
                if room_id:
                    await manager.leave_room(conn.id, room_id)
                continue

            if msg_type == "room.join":
                room_id = str(data.get("roomId") or "")
                if not room_id:
                    await websocket.send_json(
                        {"type": "error", "code": "invalid_room", "message": "roomId required"}
                    )
                    continue
                try:
                    _assert_can_join_room(chat, room_id, user.user_id)
                except ValueError as exc:
                    await websocket.send_json(
                        {"type": "error", "code": "forbidden", "message": str(exc)}
                    )
                    continue
                await manager.join_room(conn.id, room_id)
                await typing_service.send_snapshot(room_id)
                await websocket.send_json({"type": "room.joined", "roomId": room_id})
                continue

            await websocket.send_json(
                {
                    "type": "error",
                    "code": "unsupported_command",
                    "message": f"Unsupported type: {msg_type}",
                }
            )
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error for user %s", user.user_id)
    finally:
        await manager.disconnect(conn.id)
        db.close()
