import type { SupabaseClient } from "@supabase/supabase-js";

export type RecordModerationInput = {
  hubId: string;
  roomId: string;
  actorId: string;
  actionType: string;
  reason?: string | null;
  targetUserId?: string | null;
  targetMessageId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordChatModerationAction(
  supabase: SupabaseClient,
  input: RecordModerationInput,
): Promise<void> {
  const { error } = await supabase.from("chat_moderation_actions").insert({
    hub_id: input.hubId,
    room_id: input.roomId,
    actor_id: input.actorId,
    action_type: input.actionType,
    reason: input.reason?.trim() || null,
    target_user_id: input.targetUserId ?? null,
    target_message_id: input.targetMessageId ?? null,
    metadata: (input.metadata ?? {}) as object,
  });
  if (error) {
    console.error("[recordChatModerationAction]", error);
  }
}
