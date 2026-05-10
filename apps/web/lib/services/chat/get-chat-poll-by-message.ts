import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { fetchChatMessageForAuthz, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type ChatPollOptionDto = {
  id: string;
  position: number;
  label: string;
  voteCount: number;
};

export type ChatPollDetailDto = {
  pollId: string;
  messageId: string;
  question: string;
  allowMultiple: boolean;
  anonymousVoting: boolean;
  closesAt: string | null;
  options: ChatPollOptionDto[];
  /** option id -> count */
  totalVotes: number;
  /** Option ids the current user has voted for (for rich UI selection state). */
  mySelectedOptionIds: string[];
};

export async function getChatPollByMessageId(input: {
  userId: string;
  roomId: string;
  messageId: string;
}): Promise<ChatPollDetailDto> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_ROOM");

  const msg = await fetchChatMessageForAuthz(supabase, input.messageId);
  if (!msg || msg.room_id !== input.roomId) throw new ChatForbiddenError("Access denied.");
  if (msg.message_kind !== "poll") throw new ChatNotFoundError("Not a poll message.");

  const { data: poll, error: pErr } = await supabase
    .from("chat_polls")
    .select("id, question, allow_multiple, anonymous_voting, closes_at")
    .eq("message_id", input.messageId)
    .maybeSingle();

  if (pErr || !poll) throw new ChatNotFoundError("Poll not found.");

  const pollId = poll.id as string;

  const { data: options, error: oErr } = await supabase
    .from("chat_poll_options")
    .select("id, position, label")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  if (oErr) {
    console.error("[getChatPollByMessageId] options", oErr);
    throw new ChatForbiddenError("Could not load poll.");
  }

  const optRows = options ?? [];
  const optionIds = optRows.map((o) => o.id as string);

  const counts = new Map<string, number>();
  for (const id of optionIds) counts.set(id, 0);

  if (optionIds.length) {
    const { data: votes, error: vErr } = await supabase
      .from("chat_poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .in("option_id", optionIds);

    if (!vErr && votes) {
      for (const v of votes) {
        const oid = v.option_id as string;
        counts.set(oid, (counts.get(oid) ?? 0) + 1);
      }
    }
  }

  const dtoOpts: ChatPollOptionDto[] = optRows.map((o) => ({
    id: o.id as string,
    position: Number(o.position),
    label: String(o.label ?? ""),
    voteCount: counts.get(o.id as string) ?? 0,
  }));

  let totalVotes = 0;
  for (const c of counts.values()) totalVotes += c;

  let mySelectedOptionIds: string[] = [];
  if (optionIds.length) {
    const { data: mine, error: mErr } = await supabase
      .from("chat_poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", input.userId)
      .in("option_id", optionIds);
    if (!mErr && mine) {
      mySelectedOptionIds = mine.map((v) => v.option_id as string);
    }
  }

  return {
    pollId,
    messageId: input.messageId,
    question: String(poll.question ?? ""),
    allowMultiple: Boolean(poll.allow_multiple),
    anonymousVoting: Boolean(poll.anonymous_voting),
    closesAt: (poll.closes_at as string | null) ?? null,
    options: dtoOpts,
    totalVotes,
    mySelectedOptionIds,
  };
}
