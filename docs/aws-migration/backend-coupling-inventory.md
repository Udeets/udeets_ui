# Backend Coupling Inventory

> **Historical** — documents the Supabase cutover inventory from early 2026. Runtime no longer uses Supabase REST, Supabase Auth, or provider toggles. See [README.md](./README.md).

This inventory tracked Supabase coupling points in the API backend during migration.

## Supabase DB/REST coupling

- `app/services/chat_read.py`
- `app/services/chat_write.py`
- `app/services/chat_phase3.py`
- `app/services/deets.py`
- `app/services/deet_interactions.py`
- `app/services/events.py`
- `app/services/profiles.py`
- `app/services/admin.py`
- `app/services/hub_customization.py`
- `app/routers/internal_cron.py` (previously direct RPC call; now routed through `rest_post`)

## SQLAlchemy repository coverage

- `app/db/repositories/hubs.py` (SQL-only read paths)
- `app/db/repositories/memberships.py` (SQL-only read paths)
- `app/db/repositories/invites.py` (SQL-only invite/join-link paths)

## Auth coupling

- `app/dependencies/auth.py` supports:
  - `AUTH_PROVIDER=supabase`
  - `AUTH_PROVIDER=dual` (Supabase + Cognito)
  - `AUTH_PROVIDER=cognito`

## Storage coupling

- Deet media: `app/services/deet_media.py` (supports `MEDIA_PROVIDER=s3_primary`)
- Chat media: `app/services/chat_phase3.py` (supports `MEDIA_PROVIDER=s3_primary`)

## Owners (working groups)

- Data/repository migration: backend-api
- Auth migration: backend-security
- Storage migration: backend-media
- CI/provider matrix: platform
