#!/usr/bin/env python3
"""Reset local Docker Postgres (fixes corruption) and re-bootstrap schema."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPOSE = ROOT / "docker-compose.dev.yml"
VOLUME = "udeets-dev_udeets_postgres_data_v2"
API_ROOT = ROOT / "apps" / "api"


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd or ROOT, check=True)


def main() -> int:
    run(["docker", "compose", "-f", str(COMPOSE), "down"])
    rm = subprocess.run(["docker", "volume", "rm", VOLUME], cwd=ROOT)
    if rm.returncode not in (0, 1):
        rm.check_returncode()
    run(["docker", "compose", "-f", str(COMPOSE), "up", "-d"])

    print("Waiting for Postgres…")
    for _ in range(30):
        ready = subprocess.run(
            ["docker", "exec", "udeets-dev-postgres-1", "pg_isready", "-U", "postgres", "-d", "udeets"],
            cwd=ROOT,
        )
        if ready.returncode == 0:
            break
        time.sleep(2)
    else:
        print("Postgres did not become ready in time.", file=sys.stderr)
        return 1

    import os

    merged = os.environ.copy()
    merged.update({"DATABASE_URL": "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/udeets"})
    print("+ bootstrap_db.py")
    subprocess.run([sys.executable, "scripts/bootstrap_db.py"], cwd=API_ROOT, check=True, env=merged)
    print("Local Postgres reset complete. Restart npm run dev if it was running.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
