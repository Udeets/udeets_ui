import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { fetchChatMessageForAuthz, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { sanitizeChatPlainText } from "@/lib/services/chat/sanitize-chat-text";

export type UpdateChatMessageInput = {
  userId: string;
  roomId: string;
  messageId: string;
  body: string;
};

export async function updateChatMessage(input: UpdateChatMessageInput): Promise<void> {
  const supabase = await createClient();
  const msg = await fetchChatMessageForAuthz(supabase, input.messageId);
  if (!msg || msg.room_id !== input.roomId) throw new ChatForbiddenError("Access denied.");

  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");

  assertChatVerb(ctx, "EDIT_OWN_MESSAGE");

  if (msg.sender_id !== input.userId) {
    throw new ChatForbiddenError("You can only edit your own messages.");
  }
  if (msg.message_kind === "system") {
    throw new ChatForbiddenError("System messages cannot be edited.");
  }
  if (msg.deleted_at) {
    throw new ChatForbiddenError("Deleted messages cannot be edited.");
  }

  const { error } = await supabase
    .from("chat_messages")
    .update({ body: sanitizeChatPlainText(input.body), edited_at: new Date().toISOString() })
    .eq("id", input.messageId)
    .eq("room_id", input.roomId);

  if (error) {
    console.error("[updateChatMessage]", error);
    throw new ChatForbiddenError("Could not update message.");
  }
}
