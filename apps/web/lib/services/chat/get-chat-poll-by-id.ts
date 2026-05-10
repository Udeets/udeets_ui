import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { getChatPollByMessageId, type ChatPollDetailDto } from "@/lib/services/chat/get-chat-poll-by-message";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export async function getChatPollByPollId(input: {
  userId: string;
  roomId: string;
  pollId: string;
}): Promise<ChatPollDetailDto> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_ROOM");

  const { data: poll, error: pErr } = await supabase
    .from("chat_polls")
    .select("id, message_id, question, allow_multiple, anonymous_voting, closes_at")
    .eq("id", input.pollId)
    .maybeSingle();

  if (pErr || !poll) throw new ChatNotFoundError("Poll not found.");

  const messageId = poll.message_id as string;
  const { data: msg, error: mErr } = await supabase
    .from("chat_messages")
    .select("id, room_id, message_kind")
    .eq("id", messageId)
    .maybeSingle();

  if (mErr || !msg || (msg.room_id as string) !== input.roomId || msg.message_kind !== "poll") {
    throw new ChatForbiddenError("Access denied.");
  }

  return getChatPollByMessageId({ userId: input.userId, roomId: input.roomId, messageId });
}
