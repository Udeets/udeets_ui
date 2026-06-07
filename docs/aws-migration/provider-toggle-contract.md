# Provider Toggle Contract

This contract defines runtime provider behavior and rollback actions.

## Environment toggles

- `DB_PROVIDER=hybrid|rds_primary|supabase_primary`
- `MEDIA_PROVIDER=hybrid|s3_primary|supabase_primary`
- `AUTH_PROVIDER=supabase|dual|cognito`

## DB provider semantics

- `supabase_primary`
  - `rest_*` operations use Supabase HTTP REST only.
- `hybrid`
  - `rest_*` operations try local DB adapter first, then fall back to Supabase HTTP if configured.
  - Use as migration burn-in mode.
- `rds_primary`
  - `rest_*` operations use local DB adapter only.
  - No Supabase DB fallback.

## Media provider semantics

- `supabase_primary` / `hybrid`
  - Media URLs/signing use Supabase Storage paths.
- `s3_primary`
  - Deet and chat media use S3 pre-signed PUT/GET URLs.

## Auth provider semantics

- `supabase`
  - Validate tokens using Supabase JWKS (+ fallback `/auth/v1/user` introspection).
- `dual`
  - Attempt Supabase JWT validation, then Cognito JWT validation.
- `cognito`
  - Validate Cognito JWTs only.

## Rollback actions

- DB incident:
  - `DB_PROVIDER=hybrid` (or `supabase_primary` if needed).
- Media incident:
  - `MEDIA_PROVIDER=hybrid`.
- Auth incident:
  - `AUTH_PROVIDER=dual` or `supabase`.

## Deployment gate

Switch to stricter mode only after:

1. API integration tests pass.
2. Domain parity checks pass.
3. On-call rollback env change is documented and tested.
