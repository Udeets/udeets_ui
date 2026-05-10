import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { banChatRoomMember } from "@/lib/services/chat/ban-chat-room-member";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { muteChatRoomMember } from "@/lib/services/chat/mute-chat-room-member";
import { recordChatModerationAction } from "@/lib/services/chat/record-chat-moderation-action";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { softDeleteChatMessage } from "@/lib/services/chat/soft-delete-chat-message";

export type ModerationPayload =
  | { action: "hide_message"; messageId: string; reason?: string | null }
  | { action: "mute_user"; userId: string; mutedUntil?: string | null; reason?: string | null }
  | { action: "ban_user"; userId: string; reason?: string | null };

export async function performChatModeration(actorId: string, roomId: string, payload: ModerationPayload): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, actorId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");

  if (payload.action === "hide_message") {
    await softDeleteChatMessage({
      userId: actorId,
      roomId,
      messageId: payload.messageId,
      moderationReason: payload.reason ?? "moderation_hide",
    });
    await recordChatModerationAction(supabase, {
      hubId: ctx.room.hubId,
      roomId,
      actorId,
      actionType: "hide_message",
      reason: payload.reason ?? null,
      targetMessageId: payload.messageId,
      metadata: {},
    });
    return;
  }

  if (payload.action === "mute_user") {
    assertChatVerb(ctx, "MUTE_MEMBER");
    await muteChatRoomMember({
      actorId,
      roomId,
      targetUserId: payload.userId,
      mutedUntil: payload.mutedUntil ?? null,
      reason: payload.reason ?? null,
    });
    await recordChatModerationAction(supabase, {
      hubId: ctx.room.hubId,
      roomId,
      actorId,
      actionType: "mute_user",
      reason: payload.reason ?? null,
      targetUserId: payload.userId,
      metadata: { mutedUntil: payload.mutedUntil ?? null },
    });
    return;
  }

  if (payload.action === "ban_user") {
    assertChatVerb(ctx, "BAN_MEMBER");
    await banChatRoomMember({
      actorId,
      roomId,
      targetUserId: payload.userId,
      reason: payload.reason ?? null,
    });
    await recordChatModerationAction(supabase, {
      hubId: ctx.room.hubId,
      roomId,
      actorId,
      actionType: "ban_user",
      reason: payload.reason ?? null,
      targetUserId: payload.userId,
      metadata: {},
    });
    return;
  }

  throw new ChatForbiddenError("Unknown moderation action.");
}
