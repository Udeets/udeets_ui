# Provider Toggles and Domain Checklist

This document tracks migration behavior toggles and domain readiness for AWS data/storage cutover.

## Environment toggles

Use these variables in `apps/api/.env`:

```env
DB_PROVIDER=hybrid
MEDIA_PROVIDER=hybrid
AWS_REGION=us-east-1
S3_BUCKET_NAME=udeets-media
S3_MEDIA_PREFIX=development
S3_PUBLIC_BASE_URL=
S3_UPLOAD_URL_TTL_SECONDS=900
```

### Modes

- `DB_PROVIDER=supabase_primary`: force Supabase REST backed reads/writes where implemented.
- `DB_PROVIDER=hybrid`: prefer SQLAlchemy DB path, allow Supabase fallback.
- `DB_PROVIDER=rds_primary`: disable Supabase REST fallback and fail fast on DB path errors.
- `MEDIA_PROVIDER=supabase_primary|hybrid`: use Supabase signed upload flow.
- `MEDIA_PROVIDER=s3_primary`: use S3 pre-signed upload flow (implemented for deet media prepare endpoint).

## Domain migration checklist

- `hubs`:
  - Read path supports `rds_primary` without Supabase fallback.
  - Rollback available via `DB_PROVIDER=hybrid|supabase_primary`.
- `memberships`:
  - Read path supports `rds_primary` without Supabase fallback.
  - Rollback available via `DB_PROVIDER=hybrid|supabase_primary`.
- `deet media`:
  - Upload prepare endpoint supports `MEDIA_PROVIDER=s3_primary`.
  - Rollback available via `MEDIA_PROVIDER=hybrid|supabase_primary`.
- `events`, `deets`, `profiles`, `admin`, `chat`:
  - Still primarily Supabase REST coupled in service layer.
  - Planned next: repository abstraction + dual-write instrumentation before traffic wave.

## Staging validation

1. Start API with `DB_PROVIDER=rds_primary` and run hubs/memberships smoke tests.
2. Start API with `MEDIA_PROVIDER=s3_primary` and run deet image/file upload prepare tests.
3. Revert to `hybrid` to verify rollback toggle works without code changes.
