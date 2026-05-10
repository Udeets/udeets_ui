import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type RemoveChatRoomMemberInput = {
  actorId: string;
  roomId: string;
  targetUserId: string;
};

export async function removeChatRoomMember(input: RemoveChatRoomMemberInput): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "REMOVE_MEMBER");

  const { data: target, error: tErr } = await supabase
    .from("chat_room_memberships")
    .select("role, status")
    .eq("room_id", input.roomId)
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (tErr) {
    console.error("[removeChatRoomMember] lookup", tErr);
    throw new ChatForbiddenError("Could not load membership.");
  }
  if (!target) throw new ChatNotFoundError("Member not found in this room.");
  if (target.role === "owner" && target.status === "active") {
    throw new ChatForbiddenError("Cannot remove the room owner.");
  }

  const { error } = await supabase
    .from("chat_room_memberships")
    .update({ status: "removed" })
    .eq("room_id", input.roomId)
    .eq("user_id", input.targetUserId);

  if (error) {
    console.error("[removeChatRoomMember]", error);
    throw new ChatForbiddenError("Could not remove member.");
  }
}
