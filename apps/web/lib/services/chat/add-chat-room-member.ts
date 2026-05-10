import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type AddChatRoomMemberInput = {
  actorId: string;
  roomId: string;
  targetUserId: string;
  role: "member" | "moderator" | "admin";
};

export async function addChatRoomMember(input: AddChatRoomMemberInput): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "ADD_ROOM_MEMBER");

  if (input.role !== "member") {
    if (!ctx.roomMembership || ctx.roomMembership.status !== "active") {
      throw new ChatForbiddenError("Access denied.");
    }
    const r = ctx.roomMembership.role;
    const isHub =
      ctx.hubMembership?.status === "active" &&
      (ctx.hubMembership.role === "creator" || ctx.hubMembership.role === "admin");
    const isRoomOwner = r === "owner";
    if (input.role === "admin" && !(isRoomOwner || isHub)) {
      throw new ChatForbiddenError("Only the room owner or hub staff can assign room admins.");
    }
    if (input.role === "moderator" && !(r === "owner" || r === "admin" || isHub)) {
      throw new ChatForbiddenError("Only room owners/admins or hub staff can assign moderators.");
    }
  }

  const { error } = await supabase.from("chat_room_memberships").upsert(
    {
      room_id: input.roomId,
      user_id: input.targetUserId,
      role: input.role === "admin" ? "admin" : input.role === "moderator" ? "moderator" : "member",
      status: "active",
      invited_by: input.actorId,
    },
    { onConflict: "room_id,user_id" },
  );

  if (error) {
    console.error("[addChatRoomMember]", error);
    throw new ChatForbiddenError("Could not add member.");
  }
}
