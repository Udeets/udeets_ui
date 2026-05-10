import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

export type InviteToChatRoomInput = {
  actorId: string;
  roomId: string;
  invitedUserId: string;
};

function isDuplicatePendingInviteInsert(error: { code?: string; message?: string } | null): boolean {
  if (!error || error.code !== "23505") return false;
  const m = error.message ?? "";
  return m.includes("chat_room_invites_unique_pending") || /duplicate key.*pending/i.test(m);
}

async function fetchPendingInviteId(
  supabase: SupabaseClient,
  roomId: string,
  invitedUserId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("chat_room_invites")
    .select("id")
    .eq("room_id", roomId)
    .eq("invited_user_id", invitedUserId)
    .eq("status", "pending")
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}

export async function inviteUserToChatRoom(input: InviteToChatRoomInput): Promise<{ inviteId: string }> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "INVITE_USER");

  const { data, error } = await supabase
    .from("chat_room_invites")
    .insert({
      room_id: input.roomId,
      invited_user_id: input.invitedUserId,
      invited_by: input.actorId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error && isDuplicatePendingInviteInsert(error)) {
    const existingId = await fetchPendingInviteId(supabase, input.roomId, input.invitedUserId);
    if (existingId) return { inviteId: existingId };
  }

  if (error || !data?.id) {
    console.error("[inviteUserToChatRoom]", error);
    throw new ChatForbiddenError("Could not create invite (user may already be invited or is a member).");
  }

  return { inviteId: data.id as string };
}
