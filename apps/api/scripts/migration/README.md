# Migration scripts

## Scripts

- `generate_table_bundle_sql.py`: generate ordered table + constraint SQL files from a source Postgres DB.
- `deploy_sql_bundle.py`: apply all `.sql` files in a folder to a target Postgres DB.
- `backfill_media_keys.py`: normalize legacy media URLs into key-only values in DB rows.

## Quick usage

Generate:

```bash
python scripts/migration/generate_table_bundle_sql.py \
  --output-dir apps/api/sql/rds-app-schema \
  --tables chat_rooms chat_room_memberships
```

Deploy:

```bash
python scripts/migration/deploy_sql_bundle.py \
  --sql-dir apps/api/sql/rds-app-schema
```

Backfill media keys (dry-run):

```bash
python scripts/migration/backfill_media_keys.py
```

Backfill media keys (apply):

```bash
python scripts/migration/backfill_media_keys.py --apply
```

