from __future__ import annotations

import os
import sys
from pathlib import Path


def _configure_pycache_prefix() -> None:
    if os.environ.get("PYTHONDONTWRITEBYTECODE"):
        return

    # Respect an explicitly provided location (shell/CI).
    if os.environ.get("PYTHONPYCACHEPREFIX"):
        return

    cache_root = Path(__file__).resolve().parent / ".pycache"
    cache_root.mkdir(parents=True, exist_ok=True)
    os.environ["PYTHONPYCACHEPREFIX"] = str(cache_root)
    sys.pycache_prefix = str(cache_root)


_configure_pycache_prefix()

