from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Iterable
from datetime import UTC, datetime
from pathlib import Path

import psycopg

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.media.storage_adapter import extract_storage_key  # noqa: E402


def _utc_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


def _safe_json(value: object) -> str:
    try:
        return json.dumps(value, ensure_ascii=True)
    except TypeError:
        return json.dumps(str(value), ensure_ascii=True)


def _candidate_string_values(payload: object) -> list[str]:
    if isinstance(payload, str):
        return [payload]
    if isinstance(payload, list):
        out: list[str] = []
        for item in payload:
            out.extend(_candidate_string_values(item))
        return out
    if isinstance(payload, dict):
        out: list[str] = []
        for item in payload.values():
            out.extend(_candidate_string_values(item))
        return out
    return []


def _normalize_json_payload(payload: object) -> object:
    if isinstance(payload, str):
        key = extract_storage_key(payload)
        return key or payload
    if isinstance(payload, list):
        return [_normalize_json_payload(item) for item in payload]
    if isinstance(payload, dict):
        return {k: _normalize_json_payload(v) for k, v in payload.items()}
    return payload


def _iter_updates(conn: psycopg.Connection, query: str) -> Iterable[tuple]:
    with conn.cursor() as cur:
        cur.execute(query)
        yield from cur.fetchall()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill URL media references into key-only values."
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL", ""),
        help="Target database URL. Defaults to DATABASE_URL.",
    )
    parser.add_argument(
        "--artifacts-dir",
        default=str(Path(__file__).resolve().parents[3] / "migration-artifacts"),
        help="Directory for artifact logs.",
    )
    parser.add_argument("--apply", action="store_true", help="Persist updates; default is dry-run.")
    args = parser.parse_args()

    if not args.database_url:
        raise SystemExit("DATABASE_URL is required.")

    conn = psycopg.connect(args.database_url)
    conn.autocommit = False

    applied = 0
    candidates = 0
    changes: list[dict] = []

    scalar_targets = [
        ("profiles", "id", "avatar_url"),
        ("hubs", "id", "dp_image_url"),
        ("hubs", "id", "cover_image_url"),
        ("deets", "id", "preview_image_url"),
        ("deet_comments", "id", "image_url"),
        ("deet_comments", "id", "attachment_url"),
    ]

    try:
        for table, pk, column in scalar_targets:
            query = f"select {pk}, {column} from {table} where {column} is not null"
            for row_id, raw_value in _iter_updates(conn, query):
                if not isinstance(raw_value, str):
                    continue
                candidates += 1
                key = extract_storage_key(raw_value)
                if not key or key == raw_value:
                    continue
                changes.append(
                    {
                        "table": table,
                        "pk": str(row_id),
                        "column": column,
                        "before": raw_value,
                        "after": key,
                    }
                )
                if args.apply:
                    with conn.cursor() as cur:
                        cur.execute(
                            f"update {table} set {column} = %s where {pk} = %s",
                            (key, row_id),
                        )
                    applied += 1

        # JSON targets.
        for row_id, gallery in _iter_updates(
            conn, "select id, gallery_image_urls from hubs where gallery_image_urls is not null"
        ):
            candidates += len(_candidate_string_values(gallery))
            normalized = _normalize_json_payload(gallery)
            if normalized == gallery:
                continue
            changes.append(
                {
                    "table": "hubs",
                    "pk": str(row_id),
                    "column": "gallery_image_urls",
                    "before": _safe_json(gallery),
                    "after": _safe_json(normalized),
                }
            )
            if args.apply:
                with conn.cursor() as cur:
                    cur.execute(
                        "update hubs set gallery_image_urls = %s where id = %s",
                        (json.dumps(normalized), row_id),
                    )
                applied += 1

        for row_id, preview_urls, attachments in _iter_updates(
            conn,
            "select id, preview_image_urls, attachments from deets",
        ):
            row_changed = False
            normalized_preview = preview_urls
            normalized_attachments = attachments

            if preview_urls is not None:
                candidates += len(_candidate_string_values(preview_urls))
                normalized_preview = _normalize_json_payload(preview_urls)
                if normalized_preview != preview_urls:
                    row_changed = True
            if attachments is not None:
                candidates += len(_candidate_string_values(attachments))
                normalized_attachments = _normalize_json_payload(attachments)
                if normalized_attachments != attachments:
                    row_changed = True

            if not row_changed:
                continue

            changes.append(
                {
                    "table": "deets",
                    "pk": str(row_id),
                    "column": "preview_image_urls/attachments",
                    "before": _safe_json(
                        {
                            "preview_image_urls": preview_urls,
                            "attachments": attachments,
                        }
                    ),
                    "after": _safe_json(
                        {
                            "preview_image_urls": normalized_preview,
                            "attachments": normalized_attachments,
                        }
                    ),
                }
            )
            if args.apply:
                with conn.cursor() as cur:
                    cur.execute(
                        "update deets set preview_image_urls = %s, attachments = %s where id = %s",
                        (
                            json.dumps(normalized_preview),
                            json.dumps(normalized_attachments),
                            row_id,
                        ),
                    )
                applied += 1

        if args.apply:
            conn.commit()
        else:
            conn.rollback()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    artifacts_dir = Path(args.artifacts_dir)
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    stamp = _utc_stamp()
    output = {
        "timestamp": stamp,
        "mode": "apply" if args.apply else "dry-run",
        "candidates": candidates,
        "changes": len(changes),
        "applied": applied,
    }
    (artifacts_dir / f"media-key-backfill-summary-{stamp}.json").write_text(
        json.dumps(output, indent=2),
        encoding="utf-8",
    )
    (artifacts_dir / f"media-key-backfill-changes-{stamp}.json").write_text(
        json.dumps(changes, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
