from __future__ import annotations

import asyncio
import logging

from app.realtime.connection_manager import get_connection_manager
from app.realtime.helpers import publish_room_access_revoked

logger = logging.getLogger(__name__)


def schedule_access_revoked(*, room_id: str, user_id: str, reason: str) -> None:
    publish_room_access_revoked(room_id=room_id, user_id=user_id, reason=reason)
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            get_connection_manager().revoke_user_in_room(room_id, user_id, reason)
        )
    except RuntimeError:
        logger.debug("No running loop to revoke WS for user %s in room %s", user_id, room_id)
