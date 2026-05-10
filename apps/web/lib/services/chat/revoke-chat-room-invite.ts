import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type RevokeChatRoomInviteInput = {
  actorId: string;
  roomId: string;
  invitedUserId: string;
};

/** Sets a pending invite to `revoked`. Idempotent when no pending row exists. */
export async function revokeChatRoomInvite(input: RevokeChatRoomInviteInput): Promise<{ revoked: boolean }> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "INVITE_USER");

  const { data, error } = await supabase
    .from("chat_room_invites")
    .update({ status: "revoked" })
    .eq("room_id", input.roomId)
    .eq("invited_user_id", input.invitedUserId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("[revokeChatRoomInvite]", error);
    throw new ChatForbiddenError("Could not revoke invite.");
  }

  return { revoked: (data?.length ?? 0) > 0 };
}
