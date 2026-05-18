import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";

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
