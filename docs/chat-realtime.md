# Chat real-time (Supabase Realtime)

uDeets uses **Supabase Realtime** (authenticated WebSocket) with **`postgres_changes`** on chat tables. The database remains the **source of truth** for message IDs, sender IDs, and timestamps. Mutations use the **same REST + service layer** as the HTTP API; the socket path is for **delivery**, not for inventing rows.

---

## Architecture

| Layer | Role |
| --- | --- |
| **Postgres + RLS** | Only members (or policies you define) can `SELECT` rows for a room; Realtime only delivers rows the subscriber is allowed to read. |
| **Publication `supabase_realtime`** | Tables included: `chat_messages`, `chat_message_reactions`, `chat_poll_votes`, `chat_room_memberships`, `chat_room_typing` (after migration `20260510180000_chat_realtime_denorm_typing_publication.sql`). |
| **`GET /api/chat/rooms/:roomId/realtime-preflight`** | Same membership checks as listing messages (`assertCanSubscribeToChatMessages`); fail fast before opening a channel. |
| **`ChatRealtimeCoordinator` (client)** | Maps C2S intents to **REST** + opens one Realtime channel per room. |
| **`subscribeChatRoomRealtime` (client)** | Binds `postgres_changes` with `room_id=eq.<roomId>` where the column exists (denormalized on reactions/votes). |

**Redis:** Not used in this repo. Realtime scaling is handled by Supabase. **HTTP rate limits** use an in-memory sliding window per server instance; for multiple Vercel instances, move the same key scheme to **Redis** (e.g. Upstash) and call it from the API routes.

---

## Client → server (intents)

These are **not** custom WebSocket frames. They map to existing HTTP handlers so **business logic stays in services**.

| Intent | Implementation |
| --- | --- |
| `room.join` | `preflightChatRealtime` + `subscribeChatRoomRealtime` → one Supabase channel, multiple `postgres_changes` bindings. |
| `room.leave` | Unsubscribe / `removeChannel` (coordinator `leave()`). |
| `message.send` | `POST /api/chat/rooms/:roomId/messages` → `sendChatMessage` (same as REST). |
| `message.edit` | `PATCH .../messages/:messageId` → `updateChatMessage`. |
| `message.delete` | `DELETE .../messages/:messageId` (optional JSON `{ "moderationReason" }`) → `softDeleteChatMessage`. |
| `typing.started` | `POST /api/chat/rooms/:roomId/typing` `{ "phase": "started" }` → upsert `chat_room_typing`. |
| `typing.stopped` | `POST` same URL `{ "phase": "stopped" }` → delete row. |
| `reaction.add` | `POST .../messages/:messageId/reactions` → `addChatReaction`. |
| `reaction.remove` | `DELETE .../messages/:messageId/reactions?emoji=` → `removeChatReaction`. |
| `poll.vote` | `POST .../polls/:pollId/vote` → `castChatPollVote`. |

**Rate limits (HTTP):**

- `message.send`: 45 requests / 60s per user per room (`CHAT_MESSAGE_SEND_*`).
- `typing.*`: 60 requests / 60s per user per room (`CHAT_TYPING_*`).

429 responses use `{ "code": "CHAT_RATE_LIMIT", "error": "..." }`.

---

## Server → client (events)

Events are produced by **`mapChatPostgresPayloadToServerEvents`** from `postgres_changes` payloads. Payloads include **raw row shapes** from the DB (snake_case) so clients stay aligned with the schema.

| Event | When |
| --- | --- |
| `message.created` | `INSERT` on `chat_messages`. |
| `message.edited` | `UPDATE` on `chat_messages` when `edited_at` changes (and not a new soft-delete transition). |
| `message.deleted` | `UPDATE` setting `deleted_at` or hard `DELETE` on `chat_messages`. |
| `moderation.message_hidden` | Same soft-delete `UPDATE` when `moderation_reason` is non-empty (in addition to `message.deleted`). |
| `reaction.updated` | `INSERT` / `DELETE` on `chat_message_reactions` (`kind`: `added` \| `removed`). |
| `poll.updated` | `INSERT` / `DELETE` on `chat_poll_votes` (`event`: `INSERT` \| `DELETE`). |
| `typing.started` | `INSERT` / `UPDATE` on `chat_room_typing`. |
| `typing.stopped` | `DELETE` on `chat_room_typing`. |
| `room.member_joined` | `INSERT` active membership, or `UPDATE` to `active`. |
| `room.member_removed` | `UPDATE` away from `active`, or `DELETE` of an active row. |

**Authoritative fields:** Use `message.id`, `message.sender_id`, `message.created_at`, etc. from the payload—never trust optimistic client-only IDs for persisted messages.

---

## Security notes

1. **Auth:** Browser uses the Supabase session (cookies / JWT). Realtime connections use the same session; expired JWTs disconnect until refresh (see Supabase Realtime docs).
2. **Room isolation:** RLS on each replicated table ensures users **never receive rows** for rooms they cannot read. Filters use `room_id=eq.<uuid>`; reactions and votes include a **denormalized `room_id`** (maintained by triggers) so subscriptions stay room-scoped.
3. **Preflight:** Optional defense-in-depth; RLS is still the hard guarantee.
4. **Mutations:** Every C2S write goes through **REST + services** (`resolveChatAuthContext`, `assertChatVerb`, sanitization). Clients cannot assign arbitrary `messageId` / `sender_id` on insert.
5. **Typing:** Rows are scoped to `(room_id, user_id)` with RLS so only members can read/write typing state for that room.
6. **Supabase dashboard:** For Broadcast/Presence private channels, operators may disable “Allow public access” under Realtime settings; this stack uses **postgres_changes** + typing table, not public broadcast topics.

---

## Reconnects

1. On `CHANNEL_ERROR`, `TIMED_OUT`, or auth refresh failures, call **`leave()`** then **`join(handlers)`** again (coordinator is idempotent).
2. After reconnect, **re-fetch** paginated history (cursor from last known `created_at` / id) to fill gaps—Realtime does not guarantee gap-free delivery under all network conditions.
3. Treat **REST responses** as the source of truth for the sender’s own `message.send` ack (`messageId`).

---

## Testing strategy

| Layer | What we test |
| --- | --- |
| **Unit** | `mapChatPostgresPayloadToServerEvents` (event shapes for messages, reactions, typing, moderation). `allowSlidingWindow` for rate limiter. |
| **Local integration** (optional) | Run Supabase CLI (`supabase start`), apply migrations, use `@supabase/supabase-js` in a small script: sign in as two users, `join` room, post message via REST, assert both receive `message.created` on the channel. |
| **E2E** (optional) | Playwright: two browsers, same room, assert UI updates after POST message (or intercept Realtime). |

CI today runs **Vitest unit tests** only (no live Supabase in GitHub Actions unless you add a service container).

---

## Code map

- `apps/web/lib/chat/subscribe-chat-room-realtime.ts` — channel + `postgres_changes`.
- `apps/web/lib/chat/chat-realtime-coordinator.ts` — C2S façade (REST).
- `apps/web/lib/services/chat/map-chat-realtime-postgres.ts` — S2C mapping.
- `apps/web/lib/services/chat/record-chat-typing-phase.ts` — typing persistence.
- `apps/web/app/api/chat/rooms/[roomId]/typing/route.ts` — typing HTTP + throttle.
- `apps/web/lib/services/chat/chat-realtime.ts` — server preflight guard.
