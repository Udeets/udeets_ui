# Supabase Storage Decommission Checklist

Use this checklist only after all media waves are stable on S3.

## Exit criteria

- `MEDIA_PROVIDER=s3_primary` in production for at least one full burn-in cycle.
- No active runtime calls to Supabase Storage SDK/API in web/api codepaths.
- Backfill artifacts and parity artifacts are archived in `migration-artifacts/`.
- Rollback rehearsal (deployment rollback while keeping `MEDIA_PROVIDER=s3_primary`) has been executed successfully.

## Code cleanup

- Remove legacy Supabase storage branches from API adapters/services.
- Remove Supabase storage env dependencies from runtime deployment config.
- Keep migration scripts and runbooks for audit until formal archival.
- Remove obsolete web service modules that directly call Supabase storage.

## Infrastructure cleanup

- Lock Supabase storage buckets to read-only for a grace period.
- Confirm no writes observed during grace period.
- Export final object manifest for archival.
- Decommission Supabase storage write credentials after sign-off.

## Post-cleanup validation

- Run full media smoke suite (avatar, hub, deet, chat).
- Verify error budgets and latency are within baseline.
- Verify object ownership and access policy checks remain enforced.
