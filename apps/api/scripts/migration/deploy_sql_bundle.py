from __future__ import annotations

import argparse
from pathlib import Path

import psycopg
from common import ROOT, require_env


def main() -> None:
    parser = argparse.ArgumentParser(description="Deploy all SQL files in a folder to target DB.")
    parser.add_argument("--target-dsn", default=None)
    parser.add_argument("--sql-dir", required=True, help="Folder containing .sql files.")
    args = parser.parse_args()

    target_dsn = args.target_dsn or require_env("MIGRATION_TARGET_DATABASE_URL")
    sql_dir = ROOT / args.sql_dir if not Path(args.sql_dir).is_absolute() else Path(args.sql_dir)
    sql_files = sorted(sql_dir.glob("*.sql"))
    if not sql_files:
        raise RuntimeError(f"No .sql files found in {sql_dir}")

    with psycopg.connect(target_dsn, autocommit=True) as conn, conn.cursor() as cur:
        for file_path in sql_files:
            sql_text = file_path.read_text(encoding="utf-8")
            cur.execute(sql_text)
            print(f"Applied {file_path.name}")

    print(f"Applied {len(sql_files)} SQL files from {sql_dir}")


if __name__ == "__main__":
    main()
