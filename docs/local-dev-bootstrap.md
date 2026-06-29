# Local development bootstrap

One-command setup for **udeets_ui** on a new machine using Docker for Postgres, Redis, and MinIO (local S3). Authentication uses **Google OAuth** with first-party JWT sessions.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | Latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| Python | 3.11+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |

Ensure ports **5432**, **6379**, and **9000** are free (or use `--skip-docker` with your own URLs).

## Quick start

```bash
# From repo root
npm run bootstrap

# Start apps
npm run dev
```

Or directly:

```bash
python scripts/bootstrap.py
```

Open [http://localhost:3000](http://localhost:3000). API health: [http://localhost:8000/health](http://localhost:8000/health).

For test users, see [local-dev-seed-users.md](local-dev-seed-users.md).

## What bootstrap does

1. **Preflight** — checks Docker, Python, Node, npm, and common port conflicts
2. **Dependencies** — `npm install` + `pip install -e ./apps/api[dev]` (creates `apps/api/.venv` if needed)
3. **Infrastructure** — `docker compose -f docker-compose.dev.yml up -d`
4. **Environment** — writes `apps/api/.env.local` and `apps/web/.env.local` (never overwrites unless `--force-env`)
5. **Database** — creates tables from SQLAlchemy models + `alembic stamp head`
6. **MinIO** — ensures bucket `udeets-media-local` exists and runs an upload smoke test
7. **Verification** — Postgres, Redis, auth config, Alembic revision

## Google OAuth (required)

Bootstrap generates `JWT_SECRET` automatically. Set Google credentials in `apps/api/.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

Web needs (public client id only):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

**One-time Google Cloud setup:** add these authorized redirect URIs to your OAuth client:

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`

## Local services

| Service | URL | Credentials |
|---------|-----|-------------|
| Postgres | `localhost:5432` | `postgres` / `postgres`, DB `udeets` |
| Redis | `localhost:6379` | — |
| MinIO API | `http://127.0.0.1:9000` | `minioadmin` / `minioadmin` |
| MinIO Console | [http://localhost:9001](http://localhost:9001) | `minioadmin` / `minioadmin` |

MinIO is the local stand-in for **Amazon S3** in production.

## Realtime (chat + notifications)

Bootstrap enables WebSocket push against local Redis. See [notifications-realtime.md](notifications-realtime.md).

After first bootstrap (or when pulling migrations):

```bash
cd apps/api
.venv\Scripts\python.exe -m alembic upgrade head   # Windows
# python -m alembic upgrade head                   # macOS/Linux
```

Requires Postgres running (`npm run dev:infra`).

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run bootstrap` | Full local setup |
| `npm run dev:infra` | Start Docker services only |
| `npm run dev:infra:down` | Stop Docker services |
| `npm run dev` | Web + API dev servers |

## Bootstrap CLI flags

| Flag | Behavior |
|------|----------|
| `--skip-docker` | Assume Postgres/Redis/MinIO already running |
| `--skip-deps` | Skip `npm install` and `pip install` |
| `--skip-db` | Skip schema create and Alembic stamp |
| `--force-env` | Regenerate `.env.local` files |
| `--no-minio-init` | Skip MinIO bucket creation |
| `--check-only` | Preflight + verification only |

## Environment files

| File | Purpose |
|------|---------|
| `apps/api/.env` | Committed defaults / team AWS (optional) |
| `apps/api/.env.local` | **Local overrides** (gitignored) — see `.env.local.example` |
| `apps/web/.env.local` | Web local config (gitignored) |

Later files override earlier ones in the API (` .env.local` wins over `.env`).

## Schema note

Local dev creates schema via **SQLAlchemy `create_all()`** from ORM models (`apps/api/scripts/bootstrap_db.py`), then stamps Alembic at head. Production/RDS uses the SQL bundle under `apps/api/sql/rds-app-schema/` plus incremental Alembic revisions. The archived SQL under `supabase/migrations/` is reference-only — do not apply it on new environments (see `supabase/README.md`).

## Troubleshooting

**Port already in use**

- Stop conflicting services or change `DATABASE_URL` / `REDIS_URL` in `.env.local` and use `--skip-docker`.

**Google OAuth / sign-in fails**

- Confirm redirect URIs in Google Cloud Console match `GOOGLE_REDIRECT_URI`.
- Confirm `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/api/.env.local`.
- Confirm `JWT_SECRET` is set in `apps/api/.env.local`.

**Media uploads fail**

- Check MinIO is running: `docker compose -f docker-compose.dev.yml ps`
- Verify `AWS_ENDPOINT_URL=http://127.0.0.1:9000` and `S3_BUCKET_NAME=udeets-media-local` in `apps/api/.env.local`
- Set `NEXT_PUBLIC_MEDIA_PUBLIC_BASE_URL` in web to match `S3_PUBLIC_BASE_URL`

**Chat realtime degraded**

- Ensure `REDIS_URL=redis://localhost:6379/0` and `CHAT_REALTIME_ENABLED=true`
- Check `/health` shows `redis: ok`

## Re-running bootstrap

Safe to re-run; `create_all()` is idempotent. Use `--force-env` to refresh env templates. Use `--skip-db` if schema already exists.
