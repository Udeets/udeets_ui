# Chat realtime implementation plan

> **Status:** Largely implemented — see [chat-realtime.md](./chat-realtime.md). This plan is kept for history; Supabase realtime references below are obsolete.

---

## Goals

1. Replace 4s Postgres polling in hub chat with WebSocket notifications.
2. Use **ElastiCache Valkey** for pub/sub fanout and ephemeral typing (TTL keys).
3. Keep **Postgres** as the source of truth for messages, rooms, bans, polls.
4. **For v1, durable mutations never go over WebSocket** (REST only).
5. **Ephemeral commands (typing) use REST in v1**; delivery via WS. Transport-agnostic services so WS ingress can be added later without rearchitecture.
6. Ship behind feature flags with polling fallback.

---

## Non-goals (v1)

- ECS / ALB / production `wss://` deployment
- `room_message_seq` column (use `lastSeenMessageId` + since API)
- WebSocket ingress for typing or read receipts
- Presence (optional later)
- Amazon MQ, API Gateway WebSocket, SQS for fanout

---

## Architecture summary

| Layer | Role |
|-------|------|
| REST | All durable writes + history + typing HTTP (v1) |
| WebSocket | Push + `room.join` / `room.leave` / `ping` |
| Postgres | Durable messages, memberships, polls, moderation |
| Redis/Valkey | Pub/sub `chat:room:{roomId}`; typing hash + TTL |

**Hard rules**

- Redis never exposed to browser.
- Pub/sub is not durable; reconnect backfill from Postgres.
- REST 2xx = persisted; WS = best-effort; client dedupes `event_id` + `message_id`.
- Canonical message order: `(created_at ASC, id ASC)`.
- Redis down: writes still persist; health `redis: degraded`; polling fallback if enabled.

---

## Prerequisites

### AWS (done / verify)

- [x] ElastiCache Valkey cluster created
- [ ] TLS + AUTH token configured
- [ ] Security group: dev IP or VPN → port 6379
- [ ] Secret in SSM/Secrets Manager (optional but recommended)

### Local connectivity

```bash
# Example (adjust for TLS/token)
redis-cli --tls -a "$REDIS_TOKEN" -h master.udeets-dev-chat-valkey.rnchv4.use1.cache.amazonaws.com PING
```

### Environment

**`apps/api/.env`** (not committed)

```env
REDIS_URL=rediss://:TOKEN@master.udeets-dev-chat-valkey.rnchv4.use1.cache.amazonaws.com:6379/0
CHAT_REALTIME_ENABLED=false
CHAT_POLLING_FALLBACK_ENABLED=true
CHAT_REDIS_SUBSCRIBE_MODE=per_room
CHAT_PUBSUB_CHANNEL_PREFIX=chat:room:
CHAT_TYPING_TTL_SECONDS=9
CHAT_TYPING_STARTED_RATE_LIMIT_SECONDS=4
```

**`apps/web/.env.local`**

```env
NEXT_PUBLIC_FASTAPI_WS_URL=ws://localhost:8000/api/v1/chat/ws
NEXT_PUBLIC_CHAT_REALTIME_ENABLED=false
NEXT_PUBLIC_CHAT_POLLING_FALLBACK_ENABLED=true
```

Update `apps/api/.env.example` and `apps/web/env.template` (no secrets).

### Dependency

- Add `redis[hiredis]>=5` to `apps/api/pyproject.toml`

---

## Current codebase gaps

| Area | Today | Target |
|------|--------|--------|
| Redis | None | Client, publisher, subscriber, health |
| WebSocket | None | `WS /api/v1/chat/ws` |
| Live UI | `useHubChatThread` polls every 4s | WS + flag-gated poll fallback |
| Realtime client | Supabase code removed | `useChatRealtime` + event merge |
| Typing | Postgres `chat_room_typing` | Redis hash + TTL |
| Backfill | `list_messages` cursor = older pages | `messages/since` for reconnect |
| Fanout | None after commit | Publish after commit (fail-open) |

---

## Event envelope

Channel: `chat:room:{roomId}`

```json
{
  "event_id": "uuid-v4",
  "event_type": "message.created",
  "room_id": "uuid",
  "message_id": "uuid-or-null",
  "created_at": "ISO-8601",
  "payload": {}
}
```

**Durable (after Postgres commit):** `message.created`, `message.edited`, `message.deleted`, `moderation.message_hidden`, `reaction.updated`, `poll.updated`, `room.member_joined`, `room.member_removed`, `room.access_revoked`

**Ephemeral (after Redis update):** `typing.started`, `typing.stopped`, `typing.snapshot`

---

## Redis subscription strategy

| Mode | Config | Use |
|------|--------|-----|
| **per_room** (default prod) | `CHAT_REDIS_SUBSCRIBE_MODE=per_room` | SUBSCRIBE when first local WS joins room; UNSUBSCRIBE when last leaves |
| **pattern** (MVP/low traffic) | `CHAT_REDIS_SUBSCRIBE_MODE=pattern` | `PSUBSCRIBE chat:room:*` — simple, does not scale multi-room |

---

## Typing (v1)

| Layer | Behavior |
|-------|----------|
| Client | Debounce `started` ~4s; `stopped` after ~2.5s idle; stop on send/blur/leave |
| REST | `POST .../typing` — rate limit 1 started / 4s per user+room |
| Redis | `chat:room:{roomId}:typing` hash; key TTL 8–10s |
| WS | Push typing events; `typing.snapshot` on `room.join` |
| Postgres | **No hot-path writes** to `chat_room_typing` |

---

## Suggested package layout

```
apps/api/app/
  realtime/
    redis_client.py
    channels.py
    events.py
    publisher.py
    subscription_manager.py
    connection_manager.py
    rate_limit.py
  services/
    chat_typing.py
  routers/
    chat_ws.py
```

Routers stay thin; existing `chat_write.py` / `chat_moderation_and_compliance.py` call publisher + typing service.

---

## Epics and tasks

### Epic A — Platform foundation (1–2 days)

| ID | Task | Acceptance |
|----|------|------------|
| A1 | Extend `Settings` (Redis + chat flags) | `config.py`, `.env.example` |
| A2 | `RedisClient` connect/ping/close | PING against Valkey |
| A3 | Health: `redis` degraded, app stays up if DB ok | `health.py` |
| A4 | App lifespan: subscriber task start/stop | `main.py` |
| A5 | Unit test (docker/redis in CI) | pytest green |

### Epic B — Event model (1 day)

| ID | Task | Acceptance |
|----|------|------------|
| B1 | `ChatEventType` + `ChatEventEnvelope` | `realtime/events.py` |
| B2 | `channel_for_room()` | `realtime/channels.py` |
| B3 | `ChatRealtimePublisher.publish()` fail-open | `realtime/publisher.py` |
| B4 | Unit tests for envelope | |

### Epic C — WebSocket + subscription manager (3–4 days)

| ID | Task | Acceptance |
|----|------|------------|
| C1 | `RoomSubscriptionManager` refcount subscribe | per_room + pattern flag |
| C2 | `ConnectionManager` connection ↔ rooms | |
| C3 | `chat_ws.py`: Cognito JWT on connect | 4401 if invalid |
| C4 | `room.join` / `room.leave` / `ping`/`pong` | membership + ban check |
| C5 | Redis → WS forward `{ type: "event", envelope }` | integration test |
| C6 | Register `WS /api/v1/chat/ws` | browser can connect |

**Milestone:** Manual PUBLISH → WS client receives event.

### Epic D — Publish after durable writes (2–3 days)

| ID | Service hook | Event |
|----|--------------|-------|
| D1 | `send_message` | `message.created` |
| D2 | `update_message` / `delete_message` | `message.edited` / `message.deleted` |
| D3 | `add_reaction` / `remove_reaction` | `reaction.updated` |
| D4 | `vote_poll` | `poll.updated` |
| D5 | `add_member` / `remove_member` / `ban_member` | `member_*` / `access_revoked` |
| D6 | `perform_moderation` | `message.deleted`, `moderation.message_hidden` |

**Rule:** COMMIT → try PUBLISH → log on failure.

**Milestone:** Two tabs; REST send → other tab updates without poll.

### Epic E — Typing Redis-first (2 days)

| ID | Task | Acceptance |
|----|------|------------|
| E1 | `TypingService` (HSET/HDEL/TTL/snapshot) | No Postgres hot path |
| E2 | Refactor `record_typing` | |
| E3 | Redis rate limit → 429 `CHAT_RATE_LIMIT` | |
| E4 | Publish typing events | |
| E5 | `typing.snapshot` on `room.join` | |

### Epic F — Backfill API (1–2 days)

| ID | Task | Acceptance |
|----|------|------------|
| F1 | Repo `messages_since(room_id, after_message_id)` | `(created_at, id)` ASC |
| F2 | `GET .../messages/since?after=&limit=` | Document in `chat-api.md` |
| F3 | `ChatReadService.list_messages_since` | Same DTO as list |
| F4 | Client: `room.join` + REST backfill with `lastSeenMessageId` | |

**Note:** Do not overload existing `cursor` (older-page pagination).

### Epic G — Access revocation (1 day)

| ID | Task | Acceptance |
|----|------|------------|
| G1 | Publish `room.access_revoked` on ban/kick/remove | |
| G2 | `ConnectionManager` removes socket immediately | |
| G3 | Integration test | |

### Epic H — Frontend (4–5 days)

| ID | Task | Files |
|----|------|-------|
| H1 | Event types | `lib/chat/chat-realtime-types.ts` |
| H2 | `useChatRealtime` | connect, join, dedupe, reconnect |
| H3 | `merge-chat-events.ts` | sort by `(createdAt, id)` |
| H4 | Integrate `useHubChatThread` | flags; disable poll when WS ok |
| H5 | `ChatComposer` debounce | 4s started, 2.5s stopped |
| H6 | `typingMap` from WS | |
| H7 | `ChatPollBlock` on `poll.updated` | |
| H8 | WS Bearer from cookies | mirror v1 proxy |

**Milestone:** Hub chat live without 4s poll (realtime flag on).

### Epic I — Docs and rollout (1 day + soak)

| ID | Task |
|----|------|
| I1 | Rewrite `docs/chat-realtime.md` |
| I2 | Update `docs/chat-api.md` |
| I3 | Staging: realtime on, fallback on |
| I4 | Monitor RDS read QPS |
| I5 | Disable polling fallback; remove poll loop |

### Epic J — Tests (2–3 days, overlap)

- [ ] Redis publish fail → message still 201
- [ ] Health degraded when Redis down
- [ ] Client dedupe `event_id` / `message_id`
- [ ] Out-of-order WS → correct sort
- [ ] 2 WS + REST integration
- [ ] Typing TTL + rate limit
- [ ] `access_revoked` kicks socket

---

## PR sequence

| PR | Scope |
|----|--------|
| PR1 | Epic A + B + env templates + redis dependency |
| PR2 | Epic C |
| PR3 | Epic D (messages + reactions) |
| PR4 | Epic E + G |
| PR5 | Epic F |
| PR6 | Epic H |
| PR7 | Epic I + J + poll removal |

---

## Timeline (suggested)

| Week | Focus |
|------|--------|
| 1 | A → B → C (WS + manual publish) |
| 2 | D → E → G |
| 3 | F → H |
| 4 | J + I + staged cutover |

---

## Rollback

- Set `CHAT_REALTIME_ENABLED=false` (API + web).
- Keep `CHAT_POLLING_FALLBACK_ENABLED=true` until stable.
- Postgres data unaffected; Redis ephemeral only.

---

## Sign-off checklist (production-ready)

- [ ] Valkey reachable from API; TLS + AUTH
- [ ] Two users: sub-second message delivery
- [ ] Reconnect backfill fills pub/sub gap
- [ ] Ban while connected → events stop
- [ ] Redis outage: messages persist, fallback poll works
- [ ] RDS `list_messages` QPS reduced vs polling baseline
- [ ] Docs updated; Supabase realtime references removed

---

## References

- `apps/web/app/hubs/.../useHubChatThread.ts` — current 4s poll
- `apps/api/app/routers/chat.py` — REST surface
- `apps/api/app/services/chat_write.py` — publish hooks
- `apps/api/app/services/chat_moderation_and_compliance.py` — typing, preflight
- `docs/chat-realtime.md` — legacy Supabase doc (replace on cutover)
