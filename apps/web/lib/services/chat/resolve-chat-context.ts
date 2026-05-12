import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatRoomRow } from "@/lib/services/chat/chat-types";
import { parseChatRoomSettings } from "@/lib/services/chat/chat-room-settings";
import type { ChatAuthContext } from "@/lib/services/chat/chat-permissions";

function isMuteActive(mutedUntil: string | null): boolean {
  if (!mutedUntil) return true;
  return new Date(mutedUntil).getTime() > Date.now();
}

/**
 * Loads room + memberships + mute/ban for `userId`.
 * Always use `room.hubId` from this result — never trust client-supplied hub_id for authz.
 */
export async function resolveChatAuthContext(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<ChatAuthContext | null> {
  const { data: room, error: roomErr } = await supabase
    .from("chat_rooms")
    .select("id, hub_id, name, description, archived_at, settings")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr || !room) return null;

  const r = room as ChatRoomRow;

  const [hubRes, memRes, muteRes, banRes, inviteRes] = await Promise.all([
    supabase
      .from("hub_members")
      .select("hub_id, user_id, role, status")
      .eq("hub_id", r.hub_id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("chat_room_memberships")
      .select("room_id, user_id, role, status")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("chat_room_mutes").select("muted_until").eq("room_id", roomId).eq("user_id", userId).maybeSingle(),
    supabase.from("chat_room_bans").select("id").eq("room_id", roomId).eq("user_id", userId).maybeSingle(),
    supabase
      .from("chat_room_invites")
      .select("id")
      .eq("room_id", roomId)
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  const hm = hubRes.data;
  const hubMembershipNorm = hm
    ? { role: hm.role as "creator" | "admin" | "member", status: hm.status as string }
    : null;

  const rm = memRes.data;
  const roomMembershipNorm = rm
    ? {
        role: rm.role as "owner" | "admin" | "moderator" | "member",
        status: rm.status as string,
      }
    : null;

  const muteRow = muteRes.data as { muted_until: string | null } | null;
  const isMuted = !!muteRow && isMuteActive(muteRow.muted_until ?? null);
  const isBanned = !!banRes.data;

  return {
    userId,
    room: {
      id: r.id,
      hubId: r.hub_id,
      archivedAt: r.archived_at,
      settings: parseChatRoomSettings(r.settings),
    },
    hubMembership: hubMembershipNorm,
    roomMembership: roomMembershipNorm,
    isMuted,
    isBanned,
    pendingInviteId: inviteRes.data?.id ? String(inviteRes.data.id) : null,
  };
}

export async function fetchHubMembershipRow(
  supabase: SupabaseClient,
  hubId: string,
  userId: string,
): Promise<{ role: "creator" | "admin" | "member"; status: string } | null> {
  const { data, error } = await supabase
    .from("hub_members")
    .select("role, status")
    .eq("hub_id", hubId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return { role: data.role as "creator" | "admin" | "member", status: data.status as string };
}

/** Load message by id; caller must compare `message.room_id` to the route `roomId`. */
export async function fetchChatMessageForAuthz(
  supabase: SupabaseClient,
  messageId: string,
): Promise<{ id: string; room_id: string; sender_id: string | null; deleted_at: string | null; message_kind: string } | null> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, room_id, sender_id, deleted_at, message_kind")
    .eq("id", messageId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as string,
    room_id: data.room_id as string,
    sender_id: (data.sender_id as string | null) ?? null,
    deleted_at: (data.deleted_at as string | null) ?? null,
    message_kind: data.message_kind as string,
  };
}

/** Resolve poll → message → room and return message room id for URL binding checks. */
export async function fetchPollRoomId(supabase: SupabaseClient, pollId: string): Promise<string | null> {
  const { data: poll, error: pErr } = await supabase.from("chat_polls").select("message_id").eq("id", pollId).maybeSingle();
  if (pErr || !poll?.message_id) return null;
  const { data: msg, error: mErr } = await supabase
    .from("chat_messages")
    .select("room_id")
    .eq("id", poll.message_id as string)
    .maybeSingle();
  if (mErr || !msg?.room_id) return null;
  return msg.room_id as string;
}
