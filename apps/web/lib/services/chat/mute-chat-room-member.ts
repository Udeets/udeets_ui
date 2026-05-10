import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type MuteChatRoomMemberInput = {
  actorId: string;
  roomId: string;
  targetUserId: string;
  /** null = indefinite until unmute */
  mutedUntil?: string | null;
  reason?: string | null;
};

export async function muteChatRoomMember(input: MuteChatRoomMemberInput): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "MUTE_MEMBER");

  const { error } = await supabase.from("chat_room_mutes").upsert(
    {
      room_id: input.roomId,
      user_id: input.targetUserId,
      muted_by: input.actorId,
      muted_until: input.mutedUntil ?? null,
      reason: input.reason?.trim() || null,
    },
    { onConflict: "room_id,user_id" },
  );

  if (error) {
    console.error("[muteChatRoomMember]", error);
    throw new ChatForbiddenError("Could not mute user.");
  }
}
