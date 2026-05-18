# Chat real-time (FastAPI WebSocket + Valkey)

Hub chat uses **REST for v1 writes** and **WebSocket for push**. Postgres (RDS) is the durable source of truth. **Valkey/Redis** provides pub/sub fanout and ephemeral typing state.

## Architecture

| Layer | Role |
| --- | --- |
| **Postgres** | Messages, rooms, memberships, polls, moderation |
| **Valkey** | `PUBLISH chat:room:{roomId}`; typing hash + TTL |
| **REST** | All durable mutations; typing HTTP (v1); history + `GET .../messages/since` |
| **WebSocket** | `ws://host/api/v1/chat/ws` — join/leave/ping; server events |

For v1, **durable mutations never go over WebSocket**. Ephemeral typing uses REST in, WS out.

## Client

- Browser connects to `NEXT_PUBLIC_FASTAPI_WS_URL` (not the Next `/api/v1` proxy).
- Cognito token via `?token=` or `Authorization: Bearer`.
- Feature flags: `NEXT_PUBLIC_CHAT_REALTIME_ENABLED`, `NEXT_PUBLIC_CHAT_POLLING_FALLBACK_ENABLED`.

## Server events

Envelope: `event_id`, `event_type`, `room_id`, `message_id`, `created_at`, `payload`.

Types include `message.created`, `message.edited`, `message.deleted`, `reaction.updated`, `poll.updated`, `typing.started`, `typing.stopped`, `typing.snapshot`, `room.member_joined`, `room.member_removed`, `room.access_revoked`.

### Client handling (hub chat)

| Event | Client action |
| --- | --- |
| `message.*` | Merge into thread via `merge-chat-events` |
| `reaction.updated` | Patch message reactions |
| `poll.updated` | Bump poll refresh tick |
| `typing.*` | Update typing map |
| `room.member_*` | Refresh members list |
| `room.access_revoked` | Show error; WS closed |

Preflight: `GET /api/v1/chat/rooms/:roomId/realtime-preflight` before opening the socket.

## Reconnect

Redis pub/sub is not durable. On reconnect, client sends `room.join` with `lastSeenMessageId` and calls `GET /api/v1/chat/rooms/{roomId}/messages/since?after=...`.

## Config (API)

- `REDIS_URL`, `CHAT_REALTIME_ENABLED`, `CHAT_REDIS_SUBSCRIBE_MODE` (`per_room` | `pattern`)

See [chat-realtime-implementation-plan.md](./chat-realtime-implementation-plan.md) for rollout checklist.
