# Chat privacy, retention, and compliance (engineering)

This document describes **what the product stores**, **how long it is kept**, **user rights (export / erasure)**, and **operational controls**. It is **not legal advice**; align policies with counsel for US, EU, UK, Canada, Australia, India, Brazil, and other jurisdictions.

---

## Data collected (chat)

| Data | Purpose |
|------|--------|
| **Messages** | `body` (plain text after sanitization), `message_kind`, timestamps, optional `reply_to_id`, soft-delete fields, optional `moderation_reason`. |
| **Sender snapshots** | `sender_display_name_snapshot`, `sender_avatar_url_snapshot` for display if profiles change or accounts are removed. |
| **Attachments** | Metadata (`mime_type`, `original_filename`, size, scan status); binary objects in private `chat-media` bucket; `storage_key` is never sent to clients. |
| **Reactions / poll votes** | Tied to `user_id` for functionality and integrity. |
| **Reports** | Reporter, optional targets, `reason`, optional `details`, status, staff-only `review_notes_internal`, appeal placeholders. |
| **Moderation audit** | Append-only `chat_moderation_actions` (actor, action type, targets, optional `reason`, `metadata` JSON). |
| **Room settings** | JSON `settings` (invites, polls, attachments) plus **`retention_days`** on `chat_rooms`. |
| **Notification preferences** | `profiles.notification_preferences` includes `chat_push_preview` (`full` \| `sender_only` \| `generic`) for **push / future notification** copy only. |

**HTML:** Message bodies are stored as plain text; the UI uses `ChatSafeText` (React text nodes) and server-side `sanitize-html` with **no allowed tags** on send/edit paths—do not treat message bodies as HTML.

---

## Retention (`chat_rooms.retention_days`)

| Value | Behavior |
|-------|----------|
| **`null`** (default) | Messages are kept until manually deleted or anonymized. |
| **`30`**, **`90`**, **`365`** | Messages whose **`created_at`** is older than that many days are eligible for **automated hard delete** (cascades attachments, reactions, polls for those rows). |

Room admins / hub staff set retention in **Hub → Chat → Room settings → Message retention**.

**Cleanup job:** Migration `20260512210000_chat_privacy_retention_purge.sql` defines `public.chat_purge_messages_past_retention(p_limit int)`. Run it on a schedule with the **Supabase service role** (see below).

**Suggested schedule:** Daily `POST` to `/api/cron/chat-retention` with header `Authorization: Bearer <CRON_SECRET>` (e.g. Vercel Cron). The handler loops in batches until no rows are deleted (cap: 40 × 500 rows per run).

**Required env (production):**

- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used for retention purge and chat erasure RPC.
- `CRON_SECRET` — shared secret verified by the cron route.

See `apps/web/.env.example`.

---

## Soft delete vs retention purge

- **User / moderator soft delete:** Sets `deleted_at` (and may set `moderation_reason`); attachments get `deleted_at`; messages may stay visible to moderators per list API rules.
- **Retention purge:** **Hard-deletes** `chat_messages` rows past the room’s window; dependent rows cascade. This is irreversible apart from backups.

---

## Export (`GET /api/chat/me/export`)

Returns JSON (no-store) including:

- `messagesAuthored` — capped list of the user’s messages.
- `reactions`, `pollVotes` — capped.
- `reportsFiled` — reports where the user is the reporter (PII fields depend on what was filed).
- `attachmentsAuthored` — **metadata only** (no `storage_key`).

---

## Erasure / anonymization (`POST /api/chat/me/anonymize`)

Intended when the user deletes their account or requests erasure of chat content.

**With `SUPABASE_SERVICE_ROLE_KEY`:** Calls `public.chat_erasure_apply_for_user(user_id)` (migration `20260512220000_chat_erasure_service_function.sql`), which:

- Clears `sender_id` on authored messages, replaces `body` with `[Content removed]`, sets display snapshot to **`Deleted User`**.
- Deletes the user’s reactions and poll votes.
- **Strips PII from reports** they filed (`reason`, `details`, notes, appeal text) and sets `reason_code` to `erasure` (rows retained for aggregate integrity where needed).
- Removes room mutes/bans rows for the user.
- Soft-deletes attachment rows they uploaded (`deleted_at`, clears filename, `scan_status = skipped`).

**Without service role:** Falls back to the authenticated Supabase client (may be incomplete if RLS blocks some updates).

**Storage objects:** Orphaned files in `chat-media` are **not** automatically removed in this pass; a separate storage lifecycle or admin job can purge unreferenced keys.

---

## Audit logs

Moderator and hub-staff actions are recorded in **`chat_moderation_actions`** (including `report_resolved`, `hide_message`, `mute_user`, `ban_user`, etc.).  
`GET /api/chat/rooms/:roomId/moderation-actions` returns rows including **`metadata`** for context (e.g. linked `reportId`).

---

## Notification preview (`profiles.notification_preferences.chat_push_preview`)

| Mode | Intended use (push / OS notifications) |
|------|----------------------------------------|
| `full` | Room + snippet when the client supports it. |
| `sender_only` | Sender label without body. |
| `generic` | “New message” style only. |

Configured in **Settings → Notifications**. In-app chat rendering is unchanged.

---

## Related migrations (order)

1. `20260512140000_chat_reports_reason_appeals.sql` — report columns used by erasure.
2. `20260512210000_chat_privacy_retention_purge.sql` — retention constraint + purge RPC.
3. `20260512220000_chat_erasure_service_function.sql` — erasure RPC.

---

## Tests

See `apps/web/lib/profile/merge-notification-preferences.test.ts`, `apps/web/lib/services/chat/chat-retention.ts` tests, and `chat-schemas` tests for `retentionDays` on room PATCH.
