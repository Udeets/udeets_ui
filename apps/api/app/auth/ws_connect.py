from __future__ import annotations

import jwt
from fastapi import WebSocket

from app.auth.auth_context import resolve_verified_user_from_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.dependencies.auth import CurrentUser, _current_user_from_payload


async def authenticate_verified_websocket(
    websocket: WebSocket,
    token: str | None,
) -> CurrentUser | None:
    if not token:
        await websocket.close(code=4401, reason="Missing bearer token")
        return None

    settings = get_settings()
    if not settings.jwt_secret:
        await websocket.close(code=4401, reason="Invalid token")
        return None

    db = SessionLocal()
    try:
        try:
            context = resolve_verified_user_from_token(token, db, settings=settings)
        except jwt.PyJWTError:
            await websocket.close(code=4401, reason="Invalid token")
            return None
        except ValueError:
            await websocket.close(code=4403, reason="Verification required")
            return None

        return _current_user_from_payload(
            context.payload,
            email_verified=context.email_verified,
            phone_verified=context.phone_verified,
            verification_complete=True,
        )
    finally:
        db.close()
