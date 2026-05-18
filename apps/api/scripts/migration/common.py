from __future__ import annotations

import csv
import json
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import psycopg

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS_DIR = ROOT / "migration-artifacts"


def now_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: dict[str, Any] | list[Any]) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    ensure_dir(path.parent)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames = sorted({key for row in rows for key in row.keys()})
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def require_env(key: str) -> str:
    value = os.getenv(key, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


def optional_env(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value is None:
        return default
    cleaned = value.strip()
    return cleaned if cleaned else default


def connect(dsn: str):
    return psycopg.connect(dsn, autocommit=True)


def query_rows(dsn: str, sql: str, params: tuple[Any, ...] | None = None) -> list[dict[str, Any]]:
    with connect(dsn) as conn, conn.cursor() as cur:
        cur.execute(sql, params or ())
        if cur.description is None:
            return []
        columns = [column.name for column in cur.description]
        return [dict(zip(columns, row, strict=False)) for row in cur.fetchall()]


@dataclass
class MigrationContext:
    source_dsn: str
    target_dsn: str
    artifacts_dir: Path


def load_context() -> MigrationContext:
    source_dsn = require_env("MIGRATION_SOURCE_DATABASE_URL")
    target_dsn = require_env("MIGRATION_TARGET_DATABASE_URL")
    artifacts_root = optional_env("MIGRATION_ARTIFACTS_DIR")
    artifacts_dir = Path(artifacts_root) if artifacts_root else ARTIFACTS_DIR
    ensure_dir(artifacts_dir)
    return MigrationContext(
        source_dsn=source_dsn,
        target_dsn=target_dsn,
        artifacts_dir=artifacts_dir,
    )
