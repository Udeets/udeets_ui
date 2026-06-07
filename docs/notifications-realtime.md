# Notifications realtime

Hub-level signals (bell feed, dashboard unread dots, chat tab red dot, join-request toasts) over a **user-scoped WebSocket**, with Redis pub/sub for last-mile delivery. Durable domain events use **Redis Streams** locally (`events:udeets`); AWS EventBridge/SQS is deferred until deploy.

## Architecture

| Layer | Role |
|-------|------|
| REST | Source of truth, initial load, mark-read writes |
| `WS /api/v1/notifications/ws` | Push invalidate signals to the browser |
| Redis `notify:user:{userId}` | Pub/sub fan-out to API workers |
| Redis Stream `events:udeets` | Durable audit / future async workers (local) |
| `WS /api/v1/chat/ws` | In-room message live updates (separate from notifications) |

**Browser rule:** WS events are **signals** — clients refetch REST (`header-feed`, `/chat/unread`, memberships) rather than trusting full payloads (except chat tab dot, which is boolean).

## Event types (v1)

| Event | UI effect |
|-------|-----------|
| `feed.invalidate` | Refetch bell feed + deet subscriptions |
| `unread.changed` | Refetch dashboard hub unread dots |
| `member.pending` | Hub admin join-request toast |
| `member.join_accepted` | Dashboard membership refresh |
| `chat.hub_unread` / `chat.hub_read` | Hub Chat tab red dot |
| `chat.room_unread` / `chat.room_read` | Room row dot in chat sidebar |

## Environment

**API** (`apps/api/.env.local`):

```env
REDIS_URL=redis://localhost:6379/0
NOTIFICATIONS_REALTIME_ENABLED=true
NOTIFICATIONS_PUBSUB_CHANNEL_PREFIX=notify:user
CHAT_REALTIME_ENABLED=true
EVENT_BUS_BACKEND=redis_stream
EVENT_STREAM_KEY=events:udeets
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_CHAT_REALTIME_ENABLED=true
NEXT_PUBLIC_NOTIFICATIONS_REALTIME_ENABLED=true
NEXT_PUBLIC_FASTAPI_WS_URL=ws://localhost:8000/api/v1/chat/ws
NEXT_PUBLIC_NOTIFICATIONS_WS_URL=ws://localhost:8000/api/v1/notifications/ws
NEXT_PUBLIC_CHAT_POLLING_FALLBACK_ENABLED=true
```

Bootstrap (`npm run bootstrap`) sets these for local dev. Restart API and web after env changes.

When `NEXT_PUBLIC_*_REALTIME_ENABLED` is `false`, the app falls back to the previous polling intervals (header 20s, dashboard 20s, deets 8s).

## Local verification

1. `npm run dev:infra` — Postgres + Redis up
2. `cd apps/api && alembic upgrade head` — includes `chat_room_read_state`
3. Two browsers/users on the same hub:
   - User A posts a deet → User B bell updates without refresh
   - User B requests join on private hub → User A (admin) sees toast
   - User A on Posts tab; User B sends chat → Chat tab red dot on A
   - User A opens Chat room → dot clears

## Prod schema

Apply `apps/api/sql/rds-app-schema/003_chat_room_read_state.sql` to RDS (or full bundle deploy). Alembic revision `20260606_000001` matches this table.

## Not in v1

- Server-side bell read/clear (still localStorage in header)
- Mobile push (APNs/FCM)
- EventBridge/SQS (wire at deploy)
- Chat message previews in notifications (red dot only)
