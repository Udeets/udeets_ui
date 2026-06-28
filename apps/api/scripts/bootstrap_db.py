#!/usr/bin/env python3
"""Create local dev schema from SQLAlchemy models and stamp Alembic head."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


def main() -> int:
    from sqlalchemy import text

    import app.db.models  # noqa: F401 — register all models on Base.metadata
    from app.db.base import Base
    from app.db.session import engine

    print("Creating database tables from SQLAlchemy models...")
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    print("Tables created (existing tables left unchanged).")

    print("Stamping Alembic revision head...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "stamp", "head"],
        cwd=API_ROOT,
        check=False,
    )
    if result.returncode != 0:
        print("Alembic stamp failed.", file=sys.stderr)
        return result.returncode

    print("Database bootstrap complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
