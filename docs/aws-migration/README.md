# AWS migration docs (historical)

These documents describe the **Supabase → AWS (RDS, S3, FastAPI)** cutover plan from early 2026. **The runtime no longer uses Supabase** — auth, DB, storage, and realtime all go through FastAPI + Postgres + S3 + Redis.

Use these files for audit context only. For current setup see:

- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [project-context.md](../../project-context.md)
- [local-dev-bootstrap.md](../local-dev-bootstrap.md)
- [supabase/README.md](../../supabase/README.md) — archived SQL migrations
