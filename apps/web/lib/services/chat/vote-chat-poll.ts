import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { fetchPollRoomId, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type CastChatPollVoteInput = {
  userId: string;
  roomId: string;
  pollId: string;
  optionId: string;
};

export async function castChatPollVote(input: CastChatPollVoteInput): Promise<void> {
  const supabase = await createClient();
  const resolvedRoom = await fetchPollRoomId(supabase, input.pollId);
  if (!resolvedRoom || resolvedRoom !== input.roomId) {
    throw new ChatForbiddenError("Access denied.");
  }

  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");
  assertChatVerb(ctx, "VOTE_POLL");

  const { data: poll, error: pErr } = await supabase
    .from("chat_polls")
    .select("id, allow_multiple, closes_at")
    .eq("id", input.pollId)
    .single();

  if (pErr || !poll) throw new ChatNotFoundError("Poll not found.");

  if (poll.closes_at) {
    const t = new Date(poll.closes_at as string).getTime();
    if (Number.isFinite(t) && t < Date.now()) {
      throw new ChatForbiddenError("This poll is closed.");
    }
  }

  const { data: opt, error: oErr } = await supabase
    .from("chat_poll_options")
    .select("id")
    .eq("id", input.optionId)
    .eq("poll_id", input.pollId)
    .maybeSingle();

  if (oErr || !opt) throw new ChatForbiddenError("Invalid poll option.");

  if (!poll.allow_multiple) {
    await supabase.from("chat_poll_votes").delete().eq("poll_id", input.pollId).eq("user_id", input.userId);
  }

  const { error: insErr } = await supabase.from("chat_poll_votes").insert({
    poll_id: input.pollId,
    option_id: input.optionId,
    user_id: input.userId,
  });

  if (insErr) {
    console.error("[castChatPollVote]", insErr);
    throw new ChatForbiddenError("Could not record vote (duplicate or poll closed).");
  }
}
