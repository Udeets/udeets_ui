# RDS App Schema SQL Bundle

This folder stores SQL files that can be deployed in order to a Postgres instance.

## Files

- `001_create_tables.sql`: app table DDL
- `002_add_constraints.sql`: app constraint DDL (PK/UNIQUE/CHECK/FK)

## Generate bundle

```bash
python scripts/migration/generate_table_bundle_sql.py \
  --output-dir apps/api/sql/rds-app-schema \
  --tables chat_rooms chat_room_memberships chat_room_invites chat_messages
```

## Deploy bundle

```bash
python scripts/migration/deploy_sql_bundle.py \
  --sql-dir apps/api/sql/rds-app-schema
```
