# Chat REST API

Base path: **`/api/chat`**. All routes require an authenticated Supabase session (same cookies / session as the web app). Unauthenticated requests return **401**.

Errors use JSON `{ "error": "..." }` unless noted. Status codes follow `chatRouteError` (404 for missing room, 403 for forbidden, 400 for validation).

---

## Rooms

### 1. Create room (inside hub)

`POST /api/chat/rooms`

**Body**

| Field | Type | Required |
| --- | --- | --- |
| `hubId` | UUID | yes |
| `name` | string, 1–200 | yes |
| `description` | string, max 2000, or null | no |

**Example**

```http
POST /api/chat/rooms
Content-Type: application/json

{"hubId":"11111111-1111-4111-8111-111111111111","name":"General","description":null}
```

**201**

```json
{ "roomId": "22222222-2222-4222-8222-222222222222" }
```

---

### 2. List rooms for a hub

`GET /api/chat/rooms?hubId=<uuid>`

**200**

```json
{
  "rooms": [
    {
      "id": "...",
      "hubId": "...",
      "name": "General",
      "description": null,
      "archived": false,
      "createdAt": "2026-05-01T12:00:00.000Z"
    }
  ]
}
```

---

### 3. Get room details

`GET /api/chat/rooms/:roomId`

**200**

```json
{
  "room": {
    "id": "...",
    "hubId": "...",
    "name": "General",
    "description": null,
    "archived": false,
    "settings": { },
    "createdAt": "..."
  }
}
```

---

### 4. Update room settings (and name / archive)

`PATCH /api/chat/rooms/:roomId`

**Body** (at least one field)

| Field | Notes |
| --- | --- |
| `name` | optional string 1–200 |
| `description` | optional, nullable, max 2000 |
| `archived` | optional boolean |
| `retentionDays` | optional `null` (indefinite) or `30` \| `90` \| `365` — auto-purge messages older than that many days (see `docs/chat-privacy.md`). |
| `settings` | optional object: `attachmentsEnabled`, `invitePolicy`, `whoCanCreatePolls` (see Zod `updateRoomBodySchema`) |

**200** — returns updated `{ "room": { ... } }` including `retentionDays`.

---

### 5. Delete room permanently

`DELETE /api/chat/rooms/:roomId`

**204** — empty body. Deletes the `chat_rooms` row; dependent rows (messages, memberships, invites, etc.) cascade in Postgres.

**Auth:** hub staff (hub creator/admin) or room owner/room admin — not moderator-only.

---

### 6. Archive room

Same as **PATCH** with `{ "archived": true }`.

---

## Members

### 7. Add / invite room member

**Direct add (admin flow):**  
`POST /api/chat/rooms/:roomId/members`

```json
{ "userId": "33333333-3333-4333-8333-333333333333", "role": "member" }
```

`role`: optional `member` | `moderator` | `admin` (default `member`).

**201** `{ "ok": true }`

**Invite (by user id):**  
`POST /api/chat/rooms/:roomId/invites`

```json
{ "invitedUserId": "33333333-3333-4333-8333-333333333333" }
```

**201** — shape from `inviteUserToChatRoom` service.

---

### 8. Remove room member

`DELETE /api/chat/rooms/:roomId/members/:memberUserId`

**200** `{ "ok": true }`

---

### 9. List room members

`GET /api/chat/rooms/:roomId/members`

**200**

```json
{ "members": [ { "userId": "...", "role": "member", "joinedAt": "..." } ] }
```

---

## Messages

### 10. Send message

`POST /api/chat/rooms/:roomId/messages`

```json
{
  "body": "Hello",
  "messageKind": "text",
  "replyToId": null
}
```

`messageKind`: `text` | `media` | `attachment` | `poll`. Plain text is sanitized server-side (HTML stripped).

**201** `{ "messageId": "..." }`

---

### 11. Paginated message history

`GET /api/chat/rooms/:roomId/messages?limit=30&cursor=<messageId>`

- `limit`: 1–100, default **30**.
- `cursor`: optional; opaque **message id** from the previous page (`nextCursor`). Messages are ordered by **`created_at`** (newest first via `chat_messages_page` RPC when deployed).

**200**

```json
{
  "messages": [
    {
      "id": "...",
      "roomId": "...",
      "messageKind": "text",
      "createdAt": "...",
      "editedAt": null,
      "deletedAt": null,
      "senderId": "...",
      "senderDisplayName": "Ada",
      "senderAvatarUrl": null,
      "body": "Hello",
      "attachments": [],
      "reactions": [],
      "redacted": false
    }
  ],
  "nextCursor": null
}
```

**Deleted messages:** for viewers who are not room moderators/admins or hub staff, soft-deleted rows return **`body`: `"This message was deleted."`**, `redacted: true`, and sender/attachments/reactions cleared. Staff see full content where RLS allows.

**Access:** users who cannot access the room get **404** (no message leakage across rooms).

---

### 11b. Messages since cursor (reconnect backfill)

`GET /api/v1/chat/rooms/:roomId/messages/since?after=<messageId>&limit=50`

- Returns messages **newer than** `after` (ordered by `created_at`, then `id`).
- Used after WebSocket reconnect when pub/sub may have missed events.
- Same message shape as paginated history.

**200** `{ "messages": [ ... ] }`

---

### 12. Edit message

`PATCH /api/chat/rooms/:roomId/messages/:messageId`

```json
{ "body": "Updated text" }
```

**200** `{ "ok": true }`

---

### 13. Soft-delete message

`DELETE /api/chat/rooms/:roomId/messages/:messageId`

Optional JSON body: `{ "moderationReason": "..." }` when used in moderation context.

**200** `{ "ok": true }`

---

## Reactions

### 14. Add / remove reaction

**Add:** `POST /api/chat/rooms/:roomId/messages/:messageId/reactions`

```json
{ "emoji": "👍" }
```

**201** `{ "ok": true }`

**Remove:** `DELETE /api/chat/rooms/:roomId/messages/:messageId/reactions?emoji=%F0%9F%91%8D`

**200** `{ "ok": true }`

---

## Polls

### 15. Create poll

`POST /api/chat/rooms/:roomId/polls`

```json
{
  "question": "Snack?",
  "options": ["Samosa", "Cookie"],
  "allowMultiple": false,
  "anonymousVoting": false,
  "closesAt": null,
  "messageBody": ""
}
```

**201** `{ "messageId": "...", "pollId": "..." }`

---

### 16. Vote in poll

`POST /api/chat/rooms/:roomId/polls/:pollId/vote`

```json
{ "optionId": "44444444-4444-4444-8444-444444444444" }
```

**200** `{ "ok": true }`

---

## Attachments

### 17. Prepare upload / complete metadata

**Prepare signed upload**

`POST /api/chat/rooms/:roomId/messages/:messageId/attachments/prepare`

```json
{ "fileName": "photo.jpg", "mimeType": "image/jpeg", "sizeBytes": 1024 }
```

**200**

```json
{
  "bucket": "chat-media",
  "storageKey": "<userId>/<hubId>/<roomId>/<messageId>/<uuid>-photo.jpg",
  "signedUploadUrl": "https://...",
  "token": "...",
  "maxBytesForMime": 26214400
}
```

Use **`signedUploadUrl`** to upload bytes (Supabase storage). Send the opaque **`storageKey`** back to **complete** (never exposed in message lists). Allowed MIME types and per-type size limits are enforced on prepare/complete (e.g. most types 25 MB, video types up to 100 MB — see `chat-attachment-media.ts` and the `chat-media` bucket). Message list responses include attachment metadata **without** storage keys; downloads use the signed URL endpoint below.

**Complete (record row after upload)**

`POST /api/chat/rooms/:roomId/messages/:messageId/attachments/complete`

```json
{
  "storageKey": "<storageKey from prepare>",
  "mimeType": "image/jpeg",
  "originalFilename": "photo.jpg",
  "sizeBytes": 1024
}
```

**201** — attachment record from `completeChatAttachmentUpload`.

**Signed download**

`GET /api/chat/rooms/:roomId/attachments/:attachmentId/download`

**200**

```json
{ "url": "https://...", "expiresIn": 120 }
```

---

## Reports & moderation

### Permission matrix (chat)

| Action | Who may do it |
|--------|----------------|
| Submit report (`CREATE_REPORT`) | Active room member; not banned. |
| List reports / resolve / dismiss (`VIEW_REPORTS`, `UPDATE_REPORT_STATUS`) | Room owner, admin, or moderator; or hub creator/admin. |
| Hide message (soft-delete with `moderation_reason`) | Same as `DELETE_MESSAGE` for that message: author (own), room mod+, or hub staff. Implemented via `DELETE` message or `POST /moderation` `hide_message`. |
| Mute member (`MUTE_MEMBER`) | Room mod+ or hub staff. |
| Ban member (`BAN_MEMBER`) | Room owner/admin or hub staff (not room-only moderator). |
| Remove member (`REMOVE_MEMBER`) | Hub staff or room owner/admin. |

Every **`POST /moderation`** action and every **report resolve/dismiss** writes an append-only row to **`chat_moderation_actions`** (`report_resolved`, `report_dismissed`, `hide_message`, `mute_user`, `ban_user`, …).

**Message list visibility:** Non-moderators receive **redacted** placeholders for soft-deleted messages. Room moderators+ and hub staff receive the original `body` plus **`moderationReason`** when the row was removed with a moderation reason.

---

### 18. Report message (or user)

`POST /api/chat/rooms/:roomId/reports`

Requires **`targetMessageId`** and/or **`targetUserId`**, plus a required human-readable **`reason`** (1–500 chars). Optional **`reasonCode`** (taxonomy) and **`details`** (longer context).

If `targetMessageId` is set, it must belong to this room.

```json
{
  "targetMessageId": "55555555-5555-4555-8555-555555555555",
  "reason": "Harassing language toward another member",
  "reasonCode": "harassment",
  "details": "Optional longer context…"
}
```

**201** `{ "reportId": "..." }`

Reports are stored on **`chat_message_reports`** with `hub_id`, `room_id`, `reporter_id`, targets, `reason`, `reason_code`, `details`, `status`, timestamps, and appeal-oriented columns (`appeal_status`, `appeal_body`, `appeal_submitted_at`, …) reserved for future appeal flows. **Staff-only** `review_notes_internal` is set when resolving/dismissing with optional notes.

---

### 18b. List reports (moderators)

`GET /api/chat/rooms/:roomId/reports?status=pending|resolved|dismissed|all`

- Default **`status=all`** if the query param is omitted (backwards compatible).
- Use **`status=pending`** for a triage queue.

**200**

```json
{
  "reports": [
    {
      "id": "...",
      "hubId": "...",
      "status": "pending",
      "createdAt": "...",
      "resolvedAt": null,
      "resolverId": null,
      "reporterId": "...",
      "targetMessageId": "...",
      "targetUserId": null,
      "reason": "...",
      "reasonCode": "harassment",
      "details": null,
      "appealStatus": "none",
      "appealSubmittedAt": null,
      "reviewNotesInternal": null
    }
  ]
}
```

---

### 19. Resolve / dismiss report

`PATCH /api/chat/rooms/:roomId/reports/:reportId`

```json
{
  "status": "resolved",
  "staffNotes": "Optional internal notes (persisted on the report and echoed in moderation audit metadata)."
}
```

`status`: `resolved` | `dismissed`.  
`staffNotes`: optional, max 4000 chars, stored in **`review_notes_internal`** on the report (moderators only).

**200** `{ "ok": true }`

Also inserts **`chat_moderation_actions`** with `action_type` **`report_resolved`** or **`report_dismissed`** (evidence is not hard-deleted).

---

### 20. Moderation actions (hide / mute / ban)

`POST /api/chat/rooms/:roomId/moderation`

Discriminated by `action`:

**Hide message**

```json
{ "action": "hide_message", "messageId": "...", "reason": "policy" }
```

**Mute user**

```json
{
  "action": "mute_user",
  "userId": "...",
  "mutedUntil": "2026-12-31T23:59:59.000Z",
  "reason": "..."
}
```

**Ban user**

```json
{ "action": "ban_user", "userId": "...", "reason": "..." }
```

**200** `{ "ok": true }`

Each call records **`chat_moderation_actions`** after the underlying mutation. Additional member routes (`mute`, `ban`) may exist under `members/:memberUserId/` for compatibility; the unified **`/moderation`** route matches the numbered requirement set.

---

## User data (GDPR-style)

### 21. Export current user’s chat data

`GET /api/chat/me/export`

**200** — JSON export: `exportedAt`, `userId`, `messagesAuthored`, `reactions`, `pollVotes`, `reportsFiled`, `attachmentsAuthored` (metadata only; capped). `Cache-Control: no-store`.

---

### 22. Delete / anonymize current user’s chat data

`POST /api/chat/me/anonymize`

Intended when the account is deleted or the user requests erasure. Implementation removes or clears chat-linked data per `anonymizeChatUserData` (see service for exact tables and behavior).

**200** `{ "ok": true }`

---

## Assumptions & notes

1. **Auth:** Session-based; no API keys in these handlers.
2. **Pagination:** Cursor is the **last message `id`** from the previous response (`nextCursor`). If the `chat_messages_page` RPC is not applied in the database, the service falls back to a simple select: ordering remains by `created_at`, but cursor semantics may be less precise until the migration is applied.
3. **Prepare upload response** includes **`storageKey`** and **`signedUploadUrl`**; clients should not treat the key as a public URL—use **complete** then **download** signed URL.
4. **Anonymize** endpoint name reflects “erase on account deletion”; confirm legal copy with product (some rows may be deleted rather than nulled).
5. **Report columns** `reason`, `review_notes_internal`, and appeal fields require migration `20260512140000_chat_reports_reason_appeals.sql` (or equivalent) before inserts/updates use them.
6. **Privacy / retention / erasure:** see [`docs/chat-privacy.md`](./chat-privacy.md) (retention cron, service role, notification preview, data inventory).

### Scheduled retention purge (ops)

`POST /api/cron/chat-retention` with header `Authorization: Bearer <CRON_SECRET>` runs `chat_purge_messages_past_retention` using `SUPABASE_SERVICE_ROLE_KEY`. See `docs/chat-privacy.md`.
