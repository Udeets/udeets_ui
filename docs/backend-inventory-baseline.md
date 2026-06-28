# Backend Inventory Baseline (Pre-FastAPI Migration)

This file freezes the backend-related surface area before migration.
It is the source-of-truth snapshot for parity checks and rollback during incremental migration to `apps/api` (FastAPI).

## Repo And Runtime Baseline

- Monorepo workspaces are defined in `package.json` (`apps/*`, `packages/*`).
- Current frontend/backend runtime:
  - `apps/web` = Next.js app router UI + route handlers
  - `apps/api` = minimal Fastify stub (`/health`, `/hubs`)
  - `supabase/migrations` = authoritative SQL schema/RLS/RPC layer
- No committed CI workflows currently exist in `.github/workflows`.

## Next.js Route Surface

### App Pages (`apps/web/app/**/page.tsx`)

Current page routes include:

- `/`
- `/about`
- `/admin`
- `/alerts`
- `/auth`
- `/create-hub`
- `/dashboard`
- `/discover`
- `/discover/location`
- `/events`
- `/hubs/[category]/[slug]`
- `/hubs/[category]/[slug]/full`
- `/hubs/[category]/[slug]/join`
- `/local`
- `/my-posts`
- `/privacy`
- `/profile`
- `/resources`
- `/seed`
- `/settings`
- `/terms`
- `/use-cases`

### Next Route Handlers (`apps/web/app/api/**/route.ts`)

Current route handlers:

- `app/api/cron/chat-retention/route.ts` (`POST`)
- `app/api/geo/search/route.ts` (`GET`)
- `app/api/geo/reverse/route.ts` (`GET`)
- `app/api/hubs/[hubId]/invites/contact/route.ts` (`POST`)
- `app/api/chat/rooms/route.ts` (`GET`, `POST`)
- `app/api/chat/rooms/[roomId]/route.ts` (`GET`, `PATCH`, `DELETE`)
- `app/api/chat/rooms/[roomId]/messages/route.ts` (`GET`, `POST`)
- `app/api/chat/rooms/[roomId]/messages/[messageId]/route.ts` (`PATCH`, `DELETE`)
- `app/api/chat/rooms/[roomId]/messages/[messageId]/reactions/route.ts` (`POST`, `DELETE`)
- `app/api/chat/rooms/[roomId]/messages/[messageId]/poll/route.ts` (`GET`)
- `app/api/chat/rooms/[roomId]/messages/[messageId]/attachments/prepare/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/messages/[messageId]/attachments/complete/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/attachments/[attachmentId]/download/route.ts` (`GET`)
- `app/api/chat/rooms/[roomId]/members/route.ts` (`GET`, `POST`)
- `app/api/chat/rooms/[roomId]/members/[memberUserId]/route.ts` (`DELETE`)
- `app/api/chat/rooms/[roomId]/members/[memberUserId]/mute/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/members/[memberUserId]/ban/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/invites/route.ts` (`POST`, `DELETE`)
- `app/api/chat/rooms/[roomId]/invites/respond/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/invite-candidates/route.ts` (`GET`)
- `app/api/chat/rooms/[roomId]/typing/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/realtime-preflight/route.ts` (`GET`)
- `app/api/chat/rooms/[roomId]/moderation/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/moderation-actions/route.ts` (`GET`)
- `app/api/chat/rooms/[roomId]/reports/route.ts` (`GET`, `POST`)
- `app/api/chat/rooms/[roomId]/reports/[reportId]/route.ts` (`PATCH`)
- `app/api/chat/rooms/[roomId]/polls/route.ts` (`POST`)
- `app/api/chat/rooms/[roomId]/polls/[pollId]/route.ts` (`GET`)
- `app/api/chat/rooms/[roomId]/polls/[pollId]/vote/route.ts` (`POST`)
- `app/api/chat/me/export/route.ts` (`GET`)
- `app/api/chat/me/anonymize/route.ts` (`POST`)

### Auth Route Handler (Outside `app/api`)

- `app/auth/callback/route.ts` (`GET`) for Supabase OAuth callback + profile upsert.

## Current Backend Logic Locations

### Auth And Session

- `apps/web/lib/supabase/client.ts`
- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/supabase/middleware.ts`
- `apps/web/middleware.ts`
- `apps/web/lib/auth/*`
- `apps/web/services/auth/*`

### Domain Services

- `apps/web/lib/services/hubs/*`
- `apps/web/lib/services/members/*`
- `apps/web/lib/services/deets/*`
- `apps/web/lib/services/events/*`
- `apps/web/lib/services/chat/*`
- `apps/web/lib/services/rate-limit/*`
- `apps/web/lib/services/profile/*`
- `apps/web/lib/services/admin/*`
- `apps/web/lib/services/sections/*`
- `apps/web/lib/services/ctas/*`

### Upload Flows

- Hub media: `apps/web/lib/services/hubs/upload-hub-media.ts`
- Deet media: `apps/web/lib/services/deets/upload-deet-media.ts`
- Chat attachments: `apps/web/app/api/chat/**/attachments/**/route.ts` + `apps/web/lib/services/chat/*attachment*`

## Database And Schema Baseline

- Database stack is Supabase Postgres.
- Migrations are under `supabase/migrations` and currently include 73 SQL files.
- Schema/features represented in migrations include:
  - hubs, members, invitations, join links, contact invites
  - deets (posts/announcements-like), comments, likes, poll votes, survey responses
  - events and RSVPs
  - profiles and role metadata
  - chat rooms/messages/reports/moderation/retention/anonymization
  - storage buckets and RLS policies

## Tests Baseline

- Web tests: Vitest under `apps/web/lib/**/*.test.ts`.
- API tests: none currently in `apps/api`.
- No committed CI workflow YAML files in repo at baseline.

## Migration Guardrails For Parity

- Do not remove old Next route handlers until feature-flagged FastAPI replacement has parity checks.
- Keep response contract compatibility for frontend consumers during each endpoint cutover.
- Preserve Supabase-auth based session behavior while introducing API-side token validation.
