import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";
import { fetchChatMessageForAuthz, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { normalizeChatReactionEmoji } from "@/lib/services/chat/chat-reaction-emoji";

export async function addChatReaction(input: {
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

  const { error } = await supabase.from("chat_message_reactions").insert({
    message_id: input.messageId,
    user_id: input.userId,
    emoji,
  });

  if (error) {
    console.error("[addChatReaction]", error);
    throw new ChatForbiddenError("Could not add reaction.");
  }
}
