import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type ChatModerationActionRow = {
  id: string;
  actionType: string;
  reason: string | null;
  actorId: string;
  targetUserId: string | null;
  targetMessageId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export async function listChatModerationActions(userId: string, roomId: string): Promise<ChatModerationActionRow[]> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_MODERATION_LOGS");

  const { data, error } = await supabase
    .from("chat_moderation_actions")
    .select("id, action_type, reason, actor_id, target_user_id, target_message_id, created_at, metadata")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listChatModerationActions]", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    actionType: r.action_type as string,
    reason: (r.reason as string | null) ?? null,
    actorId: r.actor_id as string,
    targetUserId: (r.target_user_id as string | null) ?? null,
    targetMessageId: (r.target_message_id as string | null) ?? null,
    createdAt: r.created_at as string,
    metadata: (r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata)
      ? (r.metadata as Record<string, unknown>)
      : {}) as Record<string, unknown>,
  }));
}
