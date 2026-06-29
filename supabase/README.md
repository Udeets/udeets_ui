# Archived — do not use

This folder is **legacy history only**. uDeets no longer runs Supabase Auth, Supabase Storage, Supabase Realtime, or `supabase db push`.

## Current schema sources

| Environment | How schema is applied |
|-------------|------------------------|
| **Local Docker Postgres** | `npm run bootstrap` → SQLAlchemy `create_all()` + Alembic stamp (`apps/api/scripts/bootstrap_db.py`) |
| **RDS / production** | `apps/api/sql/rds-app-schema/` SQL bundle + Alembic revisions after baseline |
| **Incremental changes** | Alembic under `apps/api/alembic/versions/` |

The SQL files in `migrations/` here were the original table designs (2026 Q1). They are kept for reference and audit only. Do not apply them to new environments.
