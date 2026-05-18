# UDeets API (FastAPI)

FastAPI backend scaffold for incremental migration from Next.js route handlers.

## Local setup

1. Use Python 3.11+.
2. Create and activate a virtual environment.
3. Install dependencies:
   - `pip install -e .[dev]`
4. Copy `.env.example` to `.env` and update values.

## Run

- Dev: `npm --workspace apps/api run dev`
- Start: `npm --workspace apps/api run start`

## Migrations

- Upgrade: `npm --workspace apps/api run migrate`
- Alembic config: `apps/api/alembic.ini`
- Baseline revision tracks the RDS app schema; use `apps/api/sql/rds-app-schema/` for greenfield DDL bundles.
