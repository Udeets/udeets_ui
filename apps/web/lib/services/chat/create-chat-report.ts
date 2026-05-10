import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { fetchChatMessageForAuthz, resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { sanitizeChatPlainText } from "@/lib/services/chat/sanitize-chat-text";

export type CreateChatReportInput = {
  userId: string;
  roomId: string;
  targetMessageId?: string | null;
  targetUserId?: string | null;
  /** Required human-readable summary (stored in `reason`). */
  reason: string;
  reasonCode?: string | null;
  details?: string | null;
};

export async function createChatReport(input: CreateChatReportInput): Promise<{ reportId: string }> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "CREATE_REPORT");

  if (input.targetMessageId) {
    const msg = await fetchChatMessageForAuthz(supabase, input.targetMessageId);
    if (!msg || msg.room_id !== input.roomId) {
      throw new ChatForbiddenError("Access denied.");
    }
  }

  const reason = sanitizeChatPlainText(input.reason, 500);
  const { data, error } = await supabase
    .from("chat_message_reports")
    .insert({
      hub_id: ctx.room.hubId,
      room_id: input.roomId,
      reporter_id: input.userId,
      target_message_id: input.targetMessageId ?? null,
      target_user_id: input.targetUserId ?? null,
      reason,
      reason_code: input.reasonCode ? sanitizeChatPlainText(input.reasonCode, 64) : null,
      details: input.details ? sanitizeChatPlainText(input.details, 4000) : null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[createChatReport]", error);
    throw new ChatForbiddenError("Could not create report.");
  }

  return { reportId: data.id as string };
}
