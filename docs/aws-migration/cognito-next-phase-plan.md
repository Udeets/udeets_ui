# Cognito Cutover Next-Phase Plan

Authentication remains on Supabase Auth in the current migration phase. This document defines the next dedicated phase.

## Goals

- Validate Cognito JWTs in FastAPI.
- Preserve existing authorization semantics.
- Migrate identity references without breaking current user-linked data.

## Workstreams

### 1) Identity mapping

- Create `auth_identity_map` table:
  - `supabase_user_id`
  - `cognito_sub`
  - `created_at`, `verified_at`
- Backfill mappings for existing users.
- Add reconciliation job to detect missing/duplicate mappings.

### 2) Dual-token validation in API

- Extend auth dependency to support:
  - Supabase JWKS
  - Cognito JWKS
- Feature flag:
  - `AUTH_PROVIDER=supabase|dual|cognito`
- In `dual` mode:
  - accept both token issuers
  - normalize claims to existing app auth context

### 3) Session and claims compatibility

- Define canonical claims set used by API services.
- Ensure role/permission derivation remains unchanged.
- Add regression tests for protected endpoints under both token types.

### 4) Cutover execution

1. Enable `AUTH_PROVIDER=dual` in staging.
2. Validate login/callback/profile flows.
3. Run production dual mode with monitors.
4. Switch to `AUTH_PROVIDER=cognito` after burn-in.
5. Remove Supabase auth fallback only after stable period.

## Hardening checklist after cutover

- Remove legacy Supabase-auth-only branches in auth dependency.
- Rotate any auth-related temporary credentials.
- Publish final auth incident/rollback playbook.
