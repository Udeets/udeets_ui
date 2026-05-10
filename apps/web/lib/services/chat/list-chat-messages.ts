import type { SupabaseClient } from "@supabase/supabase-js";

import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { isHubStaff, isRoomModPlus } from "@/lib/services/chat/chat-viewer-roles";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { createClient } from "@/lib/supabase/server";

export type ChatAttachmentDto = {
  id: string;
  mimeType: string;
  originalFilename: string | null;
  fileSizeBytes: number;
  scanStatus: string;
};

export type ChatReactionDto = {
  id: string;
  userId: string;
  emoji: string;
  createdAt: string;
};

export type ChatMessageListItem = {
  id: string;
  roomId: string;
  messageKind: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  senderId: string | null;
  senderDisplayName: string | null;
  senderAvatarUrl: string | null;
  body: string;
  attachments: ChatAttachmentDto[];
  reactions: ChatReactionDto[];
  redacted: boolean;
  /** Populated for room moderators+ / hub staff when the message is soft-deleted (e.g. hidden). */
  moderationReason: string | null;
};

/** Row shape from `chat_messages` / `chat_messages_page` RPC (subset used by the list API). */
export type ChatMessageListRow = {
  id: string;
  room_id: string;
  sender_id: string | null;
  message_kind: string;
  body: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  moderation_reason: string | null;
  sender_display_name_snapshot: string | null;
  sender_avatar_url_snapshot: string | null;
};

export function buildChatMessageListItemFromRow(
  m: ChatMessageListRow,
  viewerIsMod: boolean,
  viewerUserId: string | null | undefined,
  attachments: ChatAttachmentDto[],
  reactions: ChatReactionDto[],
): ChatMessageListItem {
  const deleted = !!m.deleted_at;
  /** Mods see hidden content for triage, except their own deletes — those look like a normal member tombstone. */
  const isOwn = Boolean(viewerUserId && m.sender_id === viewerUserId);
  const redacted = deleted && (!viewerIsMod || isOwn);
  const attachmentsOut = redacted ? [] : attachments;
  const reactionsOut = redacted ? [] : reactions;
  return {
    id: m.id,
    roomId: m.room_id,
    messageKind: m.message_kind,
    createdAt: m.created_at,
    editedAt: m.edited_at,
    deletedAt: m.deleted_at,
    /** Keep sender visible for soft-deleted rows (WhatsApp-style); only body is replaced. */
    senderId: m.sender_id,
    senderDisplayName: m.sender_display_name_snapshot,
    senderAvatarUrl: m.sender_avatar_url_snapshot,
    body: redacted ? CHAT_DELETED_MESSAGE_PLACEHOLDER : (m.body ?? ""),
    attachments: attachmentsOut,
    reactions: reactionsOut,
    redacted,
    moderationReason: viewerIsMod && deleted && !isOwn ? (m.moderation_reason ?? null) : null,
  };
}

export type ListChatMessagesResult = {
  messages: ChatMessageListItem[];
  nextCursor: string | null;
};

export async function listChatMessages(
  userId: string,
  roomId: string,
  opts: { limit: number; cursorId: string | null },
): Promise<ListChatMessagesResult> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_ROOM");

  const limit = Math.min(Math.max(opts.limit, 1), 100);
  const viewerIsMod = isRoomModPlus(ctx.roomMembership) || isHubStaff(ctx.hubMembership);

  let rows: unknown[] | null = null;
  const rpc = await supabase.rpc("chat_messages_page", {
    p_room_id: roomId,
    p_limit: limit + 1,
    p_cursor_id: opts.cursorId,
  });

  if (rpc.error) {
    console.warn("[listChatMessages] rpc unavailable, falling back:", rpc.error.message);
    const fb = await supabase
      .from("chat_messages")
      .select(
        "id, room_id, sender_id, message_kind, body, created_at, edited_at, deleted_at, moderation_reason, sender_display_name_snapshot, sender_avatar_url_snapshot",
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (fb.error) {
      console.error("[listChatMessages] fallback", fb.error);
      throw new Error("Could not load messages.");
    }
    rows = fb.data ?? [];
  } else {
    rows = rpc.data ?? [];
  }

  const list = (rows ?? []) as ChatMessageListRow[];

  const page = list.slice(0, limit);
  const hasMore = list.length > limit;
  const nextCursor = hasMore && page.length ? page[page.length - 1]!.id : null;

  const ids = page.map((m) => m.id);
  const attMap = await loadAttachmentsByMessageId(supabase, ids);
  const reactMap = await loadReactionsByMessageId(supabase, ids);

  const messages: ChatMessageListItem[] = page.map((m) =>
    buildChatMessageListItemFromRow(m, viewerIsMod, userId, attMap.get(m.id) ?? [], reactMap.get(m.id) ?? []),
  );

  return { messages, nextCursor };
}

async function loadAttachmentsByMessageId(
  supabase: SupabaseClient,
  messageIds: string[],
): Promise<Map<string, ChatAttachmentDto[]>> {
  const map = new Map<string, ChatAttachmentDto[]>();
  if (!messageIds.length) return map;
  const { data, error } = await supabase
    .from("chat_message_attachments")
    .select("id, message_id, mime_type, original_filename, file_size_bytes, scan_status")
    .in("message_id", messageIds)
    .is("deleted_at", null);
  if (error || !data) return map;
  for (const r of data) {
    const mid = r.message_id as string;
    const arr = map.get(mid) ?? [];
    arr.push({
      id: r.id as string,
      mimeType: r.mime_type as string,
      originalFilename: (r.original_filename as string | null) ?? null,
      fileSizeBytes: Number(r.file_size_bytes),
      scanStatus: r.scan_status as string,
    });
    map.set(mid, arr);
  }
  return map;
}

async function loadReactionsByMessageId(
  supabase: SupabaseClient,
  messageIds: string[],
): Promise<Map<string, ChatReactionDto[]>> {
  const map = new Map<string, ChatReactionDto[]>();
  if (!messageIds.length) return map;
  const { data, error } = await supabase
    .from("chat_message_reactions")
    .select("id, message_id, user_id, emoji, created_at")
    .in("message_id", messageIds);
  if (error || !data) return map;
  for (const r of data) {
    const mid = r.message_id as string;
    const arr = map.get(mid) ?? [];
    arr.push({
      id: r.id as string,
      userId: r.user_id as string,
      emoji: r.emoji as string,
      createdAt: r.created_at as string,
    });
    map.set(mid, arr);
  }
  return map;
}
