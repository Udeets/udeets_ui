# AWS Traffic Shift Runbook

This runbook defines domain-by-domain traffic shift from Supabase data/storage to AWS RDS/S3.

## Pre-flight checks

- Schema parity artifact has no blocking diffs.
- Backfill verification artifacts show zero mismatches for core tables.
- Blob parity report has zero missing objects for target prefixes.
- Feature toggles are tested in staging (`hybrid`, `rds_primary`, `s3_primary`).

## Wave sequence

1. `profile/admin`
2. `events`
3. `deets` (including deet media)
4. `chat`

## Per-wave procedure

1. Enable target mode for wave domain:
   - `DB_PROVIDER=rds_primary`
   - `MEDIA_PROVIDER=s3_primary` (when wave includes media)
2. Burn-in for agreed window (default: 24h).
3. Monitor:
   - API error rate
   - p95 latency
   - auth failures
   - flow-specific success rate
4. If metrics regress:
   - switch to `DB_PROVIDER=hybrid` and/or `MEDIA_PROVIDER=hybrid`
   - open incident note and retain artifacts
5. If stable:
   - approve next wave

## Rollback matrix

- DB-only incident: set `DB_PROVIDER=hybrid` immediately.
- Media-only incident: set `MEDIA_PROVIDER=hybrid` immediately.
- Broad incident: set both to `hybrid` and pause wave progression.

## Required records per wave

- `wave-<n>-start.md`: config snapshot, approver, timestamp
- `wave-<n>-metrics.json`: key metric deltas from baseline
- `wave-<n>-decision.md`: continue/rollback decision + rationale
