import { createClient } from "@/lib/supabase/server";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { evaluateChatPermission } from "@/lib/services/chat/chat-permissions";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type ChatInviteCandidateDto = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  hubRole: string;
  /** Active membership in this chat room */
  inRoom: boolean;
  /** Pending `chat_room_invites` row for this room + user (not yet accepted). */
  pendingInvite: boolean;
};

/** Hub members with profile info; `inRoom` flags who is already in the chat (invite targets are typically `!inRoom`). */
export async function listChatInviteCandidates(userId: string, roomId: string): Promise<ChatInviteCandidateDto[]> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  const canInvite = evaluateChatPermission(ctx, "INVITE_USER");
  const canAdd = evaluateChatPermission(ctx, "ADD_ROOM_MEMBER");
  if (!canInvite.ok && !canAdd.ok) {
    throw new ChatForbiddenError(canInvite.reason || canAdd.reason);
  }

  const hubId = ctx.room.hubId;

  const [{ data: hubMembers, error: hmErr }, { data: roomMembers, error: rmErr }] = await Promise.all([
    supabase.from("hub_members").select("user_id, role, status").eq("hub_id", hubId).eq("status", "active"),
    supabase.from("chat_room_memberships").select("user_id, status").eq("room_id", roomId).eq("status", "active"),
  ]);

  if (hmErr || rmErr) {
    console.error("[listChatInviteCandidates]", hmErr ?? rmErr);
    return [];
  }

  const inRoomSet = new Set((roomMembers ?? []).map((r) => r.user_id as string));
  const hubRows = (hubMembers ?? []) as { user_id: string; role: string }[];
  const userIds = [...new Set(hubRows.map((r) => r.user_id))];

  const pendingInviteUserIds = new Set<string>();
  const { data: pendingInvites, error: piErr } = await supabase
    .from("chat_room_invites")
    .select("invited_user_id")
    .eq("room_id", roomId)
    .eq("status", "pending");
  if (!piErr && pendingInvites) {
    for (const row of pendingInvites) {
      const uid = row.invited_user_id as string;
      if (uid) pendingInviteUserIds.add(uid);
    }
  }

  const profileById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (userIds.length) {
    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);
    if (!pErr && profs) {
      for (const p of profs) {
        profileById.set(p.id as string, {
          full_name: (p.full_name as string | null) ?? null,
          avatar_url: (p.avatar_url as string | null) ?? null,
        });
      }
    }
  }

  return hubRows.map((r) => {
    const uid = r.user_id;
    const p = profileById.get(uid);
    return {
      userId: uid,
      displayName: p?.full_name?.trim() || `Member ${uid.slice(0, 8)}`,
      avatarUrl: p?.avatar_url ?? null,
      hubRole: r.role,
      inRoom: inRoomSet.has(uid),
      pendingInvite: pendingInviteUserIds.has(uid),
    };
  });
}
