from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.dependencies.auth import current_user_from_bearer_token
from app.notifications.connection_manager import get_notification_connection_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["notifications-ws"])


def _extract_token(websocket: WebSocket) -> str | None:
    auth = websocket.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return websocket.query_params.get("token")


@router.websocket("/notifications/ws")
async def notifications_websocket(websocket: WebSocket) -> None:
    settings = get_settings()
    if not settings.notifications_realtime_enabled:
        await websocket.close(code=4403, reason="Notifications realtime disabled")
        return

    token = _extract_token(websocket)
    if not token:
        await websocket.close(code=4401, reason="Missing bearer token")
        return

    try:
        user = current_user_from_bearer_token(token)
    except ValueError:
        await websocket.close(code=4401, reason="Invalid token")
        return

    await websocket.accept()
    manager = get_notification_connection_manager()
    conn = await manager.connect(websocket, user.user_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = str(data.get("type") or "")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
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
        logger.exception("Notification WebSocket error for user %s", user.user_id)
    finally:
        await manager.disconnect(conn.id)
