from __future__ import annotations

import time
from threading import Lock

HUB_CONTACT_INVITE_MAX_PER_WINDOW = 30
HUB_CONTACT_INVITE_WINDOW_SECONDS = 3600

_windows: dict[str, tuple[int, float]] = {}
_lock = Lock()


def allow_hub_contact_invite(hub_id: str, user_id: str) -> bool:
    """Sliding-window limit per hub + user (in-process; matches former Next.js route)."""
    key = f"hub-contact-invite:{hub_id}:{user_id}"
    now = time.monotonic()
    with _lock:
        count, started = _windows.get(key, (0, now))
        if now - started >= HUB_CONTACT_INVITE_WINDOW_SECONDS:
            _windows[key] = (1, now)
            return True
        if count >= HUB_CONTACT_INVITE_MAX_PER_WINDOW:
            return False
        _windows[key] = (count + 1, started)
        return True


def reset_hub_contact_invite_limits_for_tests() -> None:
    with _lock:
        _windows.clear()
