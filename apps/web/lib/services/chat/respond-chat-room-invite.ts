import { createClient } from "@/lib/supabase/server";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

function mapRpcError(message: string | undefined): string {
  const m = message ?? "";
  if (m.includes("accept_chat_room_invite_not_found") || m.includes("decline_chat_room_invite_not_found")) {
    return "No pending invite for this room.";
  }
  if (m.includes("accept_chat_room_invite_not_hub_member")) {
    return "You must be an active hub member to join this chat.";
  }
  if (m.includes("accept_chat_room_invite_unauth") || m.includes("decline_chat_room_invite_unauth")) {
    return "You must be signed in.";
  }
  return "Could not update invite.";
}

export async function acceptChatRoomInvite(input: { userId: string; roomId: string }): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  if (!ctx.pendingInviteId) throw new ChatForbiddenError("No pending invite for this room.");
  if (ctx.roomMembership?.status === "active") return;

  const { error } = await supabase.rpc("accept_chat_room_invite", { p_room_id: input.roomId });
  if (error) {
    console.error("[acceptChatRoomInvite]", error);
    throw new ChatForbiddenError(mapRpcError(error.message));
  }
}

export async function declineChatRoomInvite(input: { userId: string; roomId: string }): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  if (!ctx.pendingInviteId) throw new ChatForbiddenError("No pending invite for this room.");

  const { error } = await supabase.rpc("decline_chat_room_invite", { p_room_id: input.roomId });
  if (error) {
    console.error("[declineChatRoomInvite]", error);
    throw new ChatForbiddenError(mapRpcError(error.message));
  }
}
