import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { recordChatModerationAction } from "@/lib/services/chat/record-chat-moderation-action";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { sanitizeChatPlainText } from "@/lib/services/chat/sanitize-chat-text";

export async function updateChatReportStatus(input: {
  userId: string;
  roomId: string;
  reportId: string;
  status: "resolved" | "dismissed";
  staffNotes?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "UPDATE_REPORT_STATUS");

  const { data: rep, error: rErr } = await supabase
    .from("chat_message_reports")
    .select("id, room_id, hub_id, status, target_message_id, target_user_id, reporter_id")
    .eq("id", input.reportId)
    .maybeSingle();

  if (rErr || !rep || (rep.room_id as string) !== input.roomId) {
    throw new ChatForbiddenError("Access denied.");
  }

  const previousStatus = rep.status as string;
  const staffNotes =
    input.staffNotes != null && input.staffNotes !== ""
      ? sanitizeChatPlainText(input.staffNotes, 4000)
      : null;

  const patch: Record<string, unknown> = {
    status: input.status,
    resolved_at: new Date().toISOString(),
    resolver_id: input.userId,
  };
  if (staffNotes != null) {
    patch.review_notes_internal = staffNotes;
  }

  const { error } = await supabase.from("chat_message_reports").update(patch).eq("id", input.reportId).eq("room_id", input.roomId);

  if (error) {
    console.error("[updateChatReportStatus]", error);
    throw new ChatForbiddenError("Could not update report.");
  }

  const actionType = input.status === "resolved" ? "report_resolved" : "report_dismissed";
  await recordChatModerationAction(supabase, {
    hubId: rep.hub_id as string,
    roomId: input.roomId,
    actorId: input.userId,
    actionType,
    reason: staffNotes,
    targetUserId: (rep.target_user_id as string | null) ?? null,
    targetMessageId: (rep.target_message_id as string | null) ?? null,
    metadata: {
      reportId: input.reportId,
      previousStatus,
      reporterId: rep.reporter_id as string,
    },
  });
}
