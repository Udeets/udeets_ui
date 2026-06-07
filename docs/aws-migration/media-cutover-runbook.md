# Media Provider Cutover Runbook

This runbook describes staged S3 media cutover using `MEDIA_PROVIDER=s3_primary`.

## Preconditions

- `S3_BUCKET_NAME`, `S3_MEDIA_PREFIX`, `S3_PUBLIC_BASE_URL`, and `AWS_REGION` are configured.
- S3 object inventory/parity artifact generation has completed in `migration-artifacts/`.
- `backfill_media_keys.py --apply` completed in staging.
- Smoke tests for upload/download pass for the target wave.

## Wave order

1. avatars + hub-media
2. deet-media
3. chat-media

## Per-wave procedure

1. Set staging config:
   - `MEDIA_PROVIDER=s3_primary`
2. Run upload/download checks:
   - avatar upload + profile render
   - hub image upload + hub page render
   - deet media upload + feed render (for deet wave)
   - chat attachment upload + download (for chat wave)
3. Monitor:
   - API 4xx/5xx rates for `/api/v1/deets/media/prepare`, `/api/v1/hubs/media/prepare`,
     `/api/v1/profiles/me/avatar/prepare`, `/api/v1/chat/*/attachments/*`
   - signed URL expiry failures
   - S3 `AccessDenied` and `SignatureDoesNotMatch`
4. Validate artifacts:
   - object counts/bytes parity by prefix
   - sample checksum parity for migrated objects

## Rollback

- Keep all runtime media on S3 (`MEDIA_PROVIDER=s3_primary`).
- Roll back only deployment version if needed; do not re-enable legacy providers.
- Do not roll back DB key writes; runtime readers support legacy URL rows and key rows.

## Production promotion

- Promote one wave at a time.
- Keep each wave in burn-in for at least 24h before next wave.
- Capture cutover evidence in `migration-artifacts/`:
  - parity summary
  - error-rate snapshot
  - rollback validation result
