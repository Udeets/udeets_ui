import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type BanChatRoomMemberInput = {
  actorId: string;
  roomId: string;
  targetUserId: string;
  reason?: string | null;
};

export async function banChatRoomMember(input: BanChatRoomMemberInput): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "BAN_MEMBER");

  const { error: banErr } = await supabase.from("chat_room_bans").insert({
    room_id: input.roomId,
    user_id: input.targetUserId,
    banned_by: input.actorId,
    reason: input.reason?.trim() || null,
  });

  if (banErr) {
    console.error("[banChatRoomMember] insert", banErr);
    throw new ChatForbiddenError("Could not ban user (they may already be banned).");
  }

  await supabase
    .from("chat_room_memberships")
    .update({ status: "removed" })
    .eq("room_id", input.roomId)
    .eq("user_id", input.targetUserId);
}
