import type { ChatMessageViewModel } from "@/lib/chat/chat-message-view";
import type { ChatEventEnvelope } from "@/lib/chat/chat-realtime-types";
import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";

export type { ChatEventEnvelope };

/** Thread state stores newest messages first (see HubChatSection chronological reverse). */
export function prependMessageIfNew(
  messages: ChatMessageViewModel[],
  incoming: ChatMessageViewModel,
): ChatMessageViewModel[] {
  if (messages.some((m) => m.id === incoming.id)) {
    return messages;
  }
  return [incoming, ...messages];
}

export function messageFromCreatedPayload(envelope: ChatEventEnvelope): ChatMessageViewModel | null {
  if (envelope.event_type !== "message.created") return null;
  const p = envelope.payload;
  const id = String(p.id || envelope.message_id || "");
  if (!id) return null;
  return {
    id,
    roomId: String(p.room_id || envelope.room_id),
    messageKind: String(p.message_kind || "text"),
    createdAt: String(p.created_at || envelope.created_at),
    editedAt: p.edited_at ? String(p.edited_at) : null,
    deletedAt: p.deleted_at ? String(p.deleted_at) : null,
    senderId: p.sender_id ? String(p.sender_id) : null,
    senderDisplayName: p.sender_display_name_snapshot ? String(p.sender_display_name_snapshot) : null,
    senderAvatarUrl: p.sender_avatar_url_snapshot ? String(p.sender_avatar_url_snapshot) : null,
    body: String(p.body ?? ""),
    attachments: [],
    reactions: [],
    redacted: false,
  };
}

export function applyMessageEnvelope(
  messages: ChatMessageViewModel[],
  envelope: ChatEventEnvelope,
): ChatMessageViewModel[] {
  const messageId = envelope.message_id || (envelope.payload.id ? String(envelope.payload.id) : null);
  if (!messageId) return messages;

  if (envelope.event_type === "message.created") {
    const created = messageFromCreatedPayload(envelope);
    return created ? prependMessageIfNew(messages, created) : messages;
  }

  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return messages;

  const copy = [...messages];
  const current = { ...copy[idx] };

  if (envelope.event_type === "message.edited") {
    current.body = String(envelope.payload.body ?? current.body);
    current.editedAt = String(envelope.payload.edited_at ?? envelope.created_at);
    copy[idx] = current;
    return copy;
  }

  if (envelope.event_type === "message.deleted" || envelope.event_type === "moderation.message_hidden") {
    current.deletedAt = String(envelope.payload.deleted_at ?? envelope.created_at);
    current.body = CHAT_DELETED_MESSAGE_PLACEHOLDER;
    current.redacted = true;
    copy[idx] = current;
    return copy;
  }

  return messages;
}

export function applyReactionEnvelope(
  messages: ChatMessageViewModel[],
  envelope: ChatEventEnvelope,
): ChatMessageViewModel[] {
  if (envelope.event_type !== "reaction.updated") return messages;
  const messageId = envelope.message_id;
  if (!messageId) return messages;
  const kind = String(envelope.payload.kind || "");
  const reaction = envelope.payload.reaction as Record<string, unknown> | undefined;
  if (!reaction) return messages;
  const userId = String(reaction.user_id || "");
  const emoji = String(reaction.emoji || "");
  if (!userId || !emoji) return messages;

  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return messages;

  const copy = [...messages];
  const current = { ...copy[idx] };
  const reactions = [...current.reactions];

  if (kind === "removed") {
    current.reactions = reactions.filter((r) => !(r.userId === userId && r.emoji === emoji));
  } else {
    const exists = reactions.some((r) => r.userId === userId && r.emoji === emoji);
    if (!exists) {
      reactions.push({
        id: `rt-${userId}-${emoji}`,
        userId,
        emoji,
        createdAt: envelope.created_at,
      });
    }
    current.reactions = reactions;
  }
  copy[idx] = current;
  return copy;
}
