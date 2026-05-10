import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { fetchChatMessageForAuthz, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type SoftDeleteChatMessageInput = {
  userId: string;
  roomId: string;
  messageId: string;
  moderationReason?: string | null;
};

export async function softDeleteChatMessage(input: SoftDeleteChatMessageInput): Promise<void> {
  const supabase = await createClient();
  const msg = await fetchChatMessageForAuthz(supabase, input.messageId);
  if (!msg || msg.room_id !== input.roomId) throw new ChatForbiddenError("Access denied.");

  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");

  assertChatVerb(ctx, "DELETE_MESSAGE", {
    messageAuthorId: msg.sender_id,
    messageDeletedAt: msg.deleted_at,
  });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chat_messages")
    .update({
      deleted_at: now,
      deleted_by: input.userId,
      moderation_reason: input.moderationReason?.trim() || null,
    })
    .eq("id", input.messageId)
    .eq("room_id", input.roomId);

  if (error) {
    console.error("[softDeleteChatMessage]", error);
    throw new ChatForbiddenError("Could not delete message.");
  }

  const { error: attErr } = await supabase
    .from("chat_message_attachments")
    .update({ deleted_at: now })
    .eq("message_id", input.messageId)
    .is("deleted_at", null);

  if (attErr) {
    console.error("[softDeleteChatMessage] attachments", attErr);
  }
}
