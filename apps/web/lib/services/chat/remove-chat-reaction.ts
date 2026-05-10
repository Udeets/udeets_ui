import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";
import { fetchChatMessageForAuthz, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { normalizeChatReactionEmoji } from "@/lib/services/chat/chat-reaction-emoji";

export async function removeChatReaction(input: {
  userId: string;
  roomId: string;
  messageId: string;
  emoji: string;
}): Promise<void> {
  const supabase = await createClient();
  const msg = await fetchChatMessageForAuthz(supabase, input.messageId);
  if (!msg || msg.room_id !== input.roomId) throw new ChatForbiddenError("Access denied.");

  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");
  assertChatVerb(ctx, "REACT_TO_MESSAGE");

  const emoji = normalizeChatReactionEmoji(input.emoji);
  if (!emoji) throw new ChatForbiddenError("Invalid emoji.");

  const { error } = await supabase
    .from("chat_message_reactions")
    .delete()
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId)
    .eq("emoji", emoji);

  if (error) {
    console.error("[removeChatReaction]", error);
    throw new ChatForbiddenError("Could not remove reaction.");
  }
}
