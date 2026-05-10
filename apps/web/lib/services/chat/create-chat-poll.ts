import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { sanitizeChatPlainText } from "@/lib/services/chat/sanitize-chat-text";

export type CreateChatPollInput = {
  userId: string;
  roomId: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
  anonymousVoting: boolean;
  closesAt: string | null;
  messageBody: string;
};

export type CreateChatPollResult = { messageId: string; pollId: string };

export async function createChatPoll(input: CreateChatPollInput): Promise<CreateChatPollResult> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "CREATE_POLL_MESSAGE");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", input.userId)
    .maybeSingle();

  const caption = sanitizeChatPlainText(input.messageBody || "");
  const q = sanitizeChatPlainText(input.question, 500);
  const opts = input.options.map((o) => sanitizeChatPlainText(o, 200)).filter(Boolean);
  if (opts.length < 2) throw new ChatForbiddenError("At least two poll options are required.");

  /** Optional caption only; question lives on `chat_polls` (not duplicated as a pseudo-description). */
  const messageBody = caption.length > 0 ? caption : null;

  const { data: msg, error: mErr } = await supabase
    .from("chat_messages")
    .insert({
      room_id: input.roomId,
      sender_id: input.userId,
      message_kind: "poll",
      body: messageBody,
      sender_display_name_snapshot: (profile?.full_name as string | null) ?? null,
      sender_avatar_url_snapshot: (profile?.avatar_url as string | null) ?? null,
    })
    .select("id")
    .single();

  if (mErr || !msg?.id) {
    console.error("[createChatPoll] message", mErr);
    throw new ChatForbiddenError("Could not create poll message.");
  }

  const messageId = msg.id as string;

  const { data: poll, error: pErr } = await supabase
    .from("chat_polls")
    .insert({
      message_id: messageId,
      question: q,
      allow_multiple: input.allowMultiple,
      anonymous_voting: input.anonymousVoting,
      closes_at: input.closesAt,
    })
    .select("id")
    .single();

  if (pErr || !poll?.id) {
    await supabase.from("chat_messages").delete().eq("id", messageId);
    console.error("[createChatPoll] poll", pErr);
    throw new ChatForbiddenError("Could not create poll.");
  }

  const pollId = poll.id as string;

  const optionRows = opts.map((label, position) => ({
    poll_id: pollId,
    position,
    label,
  }));

  const { error: oErr } = await supabase.from("chat_poll_options").insert(optionRows);
  if (oErr) {
    await supabase.from("chat_polls").delete().eq("id", pollId);
    await supabase.from("chat_messages").delete().eq("id", messageId);
    console.error("[createChatPoll] options", oErr);
    throw new ChatForbiddenError("Could not create poll options.");
  }

  return { messageId, pollId };
}
