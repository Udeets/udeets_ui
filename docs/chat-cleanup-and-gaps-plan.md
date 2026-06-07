# Chat cleanup, port alignment, and gap closure

> Follow-up after chat realtime MVP. **Do not edit** `chat_realtime_modernization_b4d94539.plan.md`.

## Execution order

1. **Phase 1** — Cleanup (dead code)
2. **Phase 2** — Port / env alignment
3. **Phase 3** — Realtime event coverage (API + web)
4. **Phase 4** — UX and rate limits
5. **Phase 5** — Tests and docs
6. **Phase 6** — Rollout trim (after soak)

Work as **5 PRs** (A–E); Phase 6 is config-only until staging soak completes.

---

## Phase 1 — Cleanup

### API

| Action | File |
|--------|------|
| Delete `record_typing` (Postgres path) | `apps/api/app/services/chat_moderation_and_compliance.py` |
| Remove or deprecate `upsert_typing` / `delete_typing` if unused | `apps/api/app/db/repositories/chat/repository.py` |
| Remove `chat_polling_fallback_enabled` from API Settings (web-only concern) | `apps/api/app/core/config.py`, `.env.example` |
| Keep `GET .../realtime-preflight` — wire in Phase 3 | `apps/api/app/routers/chat.py` |

### Web

| Action | File |
|--------|------|
| Remove unused `messagesRef` | `useHubChatThread.ts` |
| Remove unused `compareMessages` | `merge-chat-events.ts` |
| Fix typing-prune effect (only when realtime off) | `useHubChatThread.ts` |
| Update stale “until WebSocket ships” comment | `useHubChatThread.ts` |

**Exit:** No Postgres typing in hot path.

---

## Phase 2 — Port alignment

**Problem:** `apps/api/.env` has `PORT=8002`; web uses `localhost:8000` for REST + WS.

**Standard (recommended):** Use **8000** everywhere.

| File | Change |
|------|--------|
| `apps/api/.env` | `PORT=8000` (local) |
| `apps/web/.env.local` | `NEXT_PUBLIC_FASTAPI_BASE_URL` + `NEXT_PUBLIC_FASTAPI_WS_URL` on same port |
| `apps/web/env.template` | Note: must match API `PORT` |
| `apps/web/app/api/v1/[...path]/route.ts` | Default fallback port consistent (today defaults `8002`) |

**Exit:** `/health` and `ws://.../api/v1/chat/ws` on same process.

---

## Phase 3 — Event coverage

### 3a API

| Change | File |
|--------|------|
| `respond_invite` accept → `publish_room_member_joined` | `chat_write.py` |
| Optional: mute → `access_revoked` if product blocks participation | `chat_write.py` |

### 3b Web

| Event | Work |
|-------|------|
| `reaction.updated` | `merge-chat-events.ts` + `useHubChatThread` patch reactions |
| `room.member_*` | Light `reloadRoom` or members revision counter in `HubChatSection` |
| Preflight | `chatApiRealtimePreflight` + call before WS in `use-chat-realtime.ts` |

**Exit:** Reactions and members update without full message poll.

---

## Phase 4 — UX and limits

| Task | File |
|------|------|
| Typing `stopped` after ~2.5s idle | `ChatComposer.tsx` |
| Message send rate limit ~45/min per user+room | New `chat_rate_limit.py` + `chat.py` / `chat_write` |
| Fewer `reloadMessages` when WS connected | `HubChatSection.tsx` |

---

## Phase 5 — Tests and docs

- API: publish-on-invite, publish-fail-open, typing 429
- Web: `reaction.updated` in `merge-chat-events.test.ts`
- Docs: `chat-api.md`, `chat-realtime.md` event table

---

## Phase 6 — Rollout (after soak)

1. `NEXT_PUBLIC_CHAT_POLLING_FALLBACK_ENABLED=true` — verify
2. Set `false` — verify reconnect + `messages/since`
3. Optional: trim `pollTick` if polls merge from WS payload

---

## PR map

| PR | Phases |
|----|--------|
| **A** | 1 + 2 |
| **B** | 3 |
| **C** | 4 |
| **D** | 5 |
| **E** | 6 (when ready) |

## Verification checklist

- [x] Code changes through PR-A–D (rollout flags unchanged)
- [ ] REST + WS same port (set `PORT=8000` in local `apps/api/.env` if still on 8002)
- [ ] Two users: message, reaction, typing, poll (realtime on, fallback off)
- [ ] Reconnect backfill
- [ ] Ban kicks WS
- [ ] Invite accept → member joined event
- [ ] No Postgres typing in hot path
