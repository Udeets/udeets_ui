import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { sanitizeChatPlainText } from "@/lib/services/chat/sanitize-chat-text";

export type OutboundChatMessageKind = "text" | "media" | "attachment" | "poll";

export type SendChatMessageInput = {
  userId: string;
  roomId: string;
  body: string;
  messageKind: OutboundChatMessageKind;
  replyToId?: string | null;
};

export type SendChatMessageResult = { messageId: string };

export async function sendChatMessage(input: SendChatMessageInput): Promise<SendChatMessageResult> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");

  if (input.messageKind === "poll") {
    assertChatVerb(ctx, "CREATE_POLL_MESSAGE");
  } else {
    assertChatVerb(ctx, "SEND_MESSAGE");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", input.userId)
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: input.roomId,
      sender_id: input.userId,
      message_kind: input.messageKind,
      body: sanitizeChatPlainText(input.body),
      reply_to_id: input.replyToId ?? null,
      sender_display_name_snapshot: (profile?.full_name as string | null) ?? null,
      sender_avatar_url_snapshot: (profile?.avatar_url as string | null) ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("[sendChatMessage]", error);
    throw new ChatForbiddenError("Could not send message (check membership and hub access).");
  }

  return { messageId: inserted.id as string };
}
