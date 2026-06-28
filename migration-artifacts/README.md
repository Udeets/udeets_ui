# Migration Artifacts

Generated migration outputs are stored here for auditability and rollback analysis.

## Naming conventions

- `schema-apply-<timestamp>.json`
- `schema-parity-<timestamp>.json`
- `table-counts-before-after-<timestamp>.csv`
- `fk-integrity-<timestamp>.json`
- `sample-hash-compare-<timestamp>.json`
- `blob-manifest-source-<bucket>-<timestamp>.csv`
- `blob-manifest-target-<bucket>-<timestamp>.csv`
- `blob-parity-<timestamp>.json`

## Important

- Do not store raw secrets in this directory.
- Treat artifacts as operational records for migration checkpoints.
