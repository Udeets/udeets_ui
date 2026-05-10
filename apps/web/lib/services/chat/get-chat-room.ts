import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { isHubStaff, isRoomModPlus } from "@/lib/services/chat/chat-viewer-roles";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import type { ParsedChatRoomSettings } from "@/lib/services/chat/chat-types";

export type ChatRoomDetail = {
  id: string;
  hubId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  settings: ParsedChatRoomSettings;
  /** null = messages kept indefinitely; 30/90/365 = auto-purge policy (see cron / docs). */
  retentionDays: number | null;
  viewerMuted: boolean;
  viewerBanned: boolean;
  /** Room moderator+ or hub staff — used for moderation UI and realtime message visibility. */
  viewerCanModerate: boolean;
};

export async function getChatRoomForUser(userId: string, roomId: string): Promise<ChatRoomDetail> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");
  assertChatVerb(ctx, "VIEW_ROOM");

  const { data, error } = await supabase
    .from("chat_rooms")
    .select("id, hub_id, name, description, archived_at, created_at, settings, retention_days")
    .eq("id", roomId)
    .single();

  if (error || !data) throw new ChatNotFoundError("Chat room not found.");

  return {
    id: data.id as string,
    hubId: data.hub_id as string,
    name: data.name as string,
    description: (data.description as string | null) ?? null,
    archivedAt: (data.archived_at as string | null) ?? null,
    createdAt: data.created_at as string,
    settings: ctx.room.settings,
    retentionDays: (data.retention_days as number | null) ?? null,
    viewerMuted: ctx.isMuted,
    viewerBanned: ctx.isBanned,
    viewerCanModerate: isRoomModPlus(ctx.roomMembership) || isHubStaff(ctx.hubMembership),
  };
}
