import { createClient } from "@/lib/supabase/server";
import { assertListChatRoomsAllowed } from "@/lib/services/chat/assert-chat";
import { isChatTablesMissingFromPostgrest } from "@/lib/services/chat/postgrest-chat-schema";

function isBenignChatRoomsQueryError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (isChatTablesMissingFromPostgrest(error)) return true;
  if (error.code === "42P17" && /infinite recursion/i.test(error.message ?? "")) return true;
  return false;
}
import { fetchHubMembershipRow } from "@/lib/services/chat/resolve-chat-context";

export type ChatRoomListItem = {
  id: string;
  hubId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  /** Present when this row is shown because of a pending invite (not yet an active member). */
  pendingInviteId?: string;
};

function isHubStaff(role: string | undefined): boolean {
  return role === "creator" || role === "admin";
}

/** Lists chat rooms visible to `userId` in `hubId` (never trust hub_id without this check). */
export async function listChatRoomsForHub(userId: string, hubId: string): Promise<ChatRoomListItem[]> {
  const supabase = await createClient();
  const hubM = await fetchHubMembershipRow(supabase, hubId, userId);
  assertListChatRoomsAllowed(hubM);

  if (hubM && hubM.status === "active" && isHubStaff(hubM.role)) {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("id, hub_id, name, description, archived_at, created_at")
      .eq("hub_id", hubId)
      .order("created_at", { ascending: false });

    if (error) {
      if (!isBenignChatRoomsQueryError(error)) {
        console.error("[listChatRoomsForHub]", error);
      }
      return [];
    }
    return (data ?? []).map((r) => ({
      id: r.id as string,
      hubId: r.hub_id as string,
      name: r.name as string,
      description: (r.description as string | null) ?? null,
      archivedAt: (r.archived_at as string | null) ?? null,
      createdAt: r.created_at as string,
    }));
  }

  const { data: memberships, error: mErr } = await supabase
    .from("chat_room_memberships")
    .select("room_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (mErr) {
    if (!isBenignChatRoomsQueryError(mErr)) {
      console.error("[listChatRoomsForHub] memberships", mErr);
      return [];
    }
  }

  const roomIdsFromMembership = [...new Set((memberships ?? []).map((m) => m.room_id as string))];

  let rooms: ChatRoomListItem[] = [];

  if (roomIdsFromMembership.length) {
    const { data: roomRows, error: rErr } = await supabase
      .from("chat_rooms")
      .select("id, hub_id, name, description, archived_at, created_at")
      .eq("hub_id", hubId)
      .in("id", roomIdsFromMembership)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (rErr) {
      if (!isBenignChatRoomsQueryError(rErr)) {
        console.error("[listChatRoomsForHub] rooms", rErr);
      }
    } else {
      rooms = (roomRows ?? []).map((r) => ({
        id: r.id as string,
        hubId: r.hub_id as string,
        name: r.name as string,
        description: (r.description as string | null) ?? null,
        archivedAt: (r.archived_at as string | null) ?? null,
        createdAt: r.created_at as string,
      }));
    }
  }

  const existingIds = new Set(rooms.map((r) => r.id));

  const { data: invRows, error: invErr } = await supabase
    .from("chat_room_invites")
    .select("id, room_id, chat_rooms(id, hub_id, name, description, archived_at, created_at)")
    .eq("invited_user_id", userId)
    .eq("status", "pending");

  if (!invErr && invRows?.length) {
    for (const row of invRows as {
      id: string;
      room_id: string;
      chat_rooms:
        | {
            id: string;
            hub_id: string;
            name: string;
            description: string | null;
            archived_at: string | null;
            created_at: string;
          }
        | {
            id: string;
            hub_id: string;
            name: string;
            description: string | null;
            archived_at: string | null;
            created_at: string;
          }[]
        | null;
    }[]) {
      const crRaw = row.chat_rooms;
      const cr = (Array.isArray(crRaw) ? crRaw[0] : crRaw) as {
        id: string;
        hub_id: string;
        name: string;
        description: string | null;
        archived_at: string | null;
        created_at: string;
      } | null;
      if (!cr || String(cr.hub_id) !== hubId) continue;
      if (cr.archived_at) continue;
      const rid = String(cr.id);
      if (existingIds.has(rid)) continue;
      existingIds.add(rid);
      rooms.push({
        id: rid,
        hubId,
        name: String(cr.name),
        description: (cr.description as string | null) ?? null,
        archivedAt: (cr.archived_at as string | null) ?? null,
        createdAt: String(cr.created_at),
        pendingInviteId: String(row.id),
      });
    }
  }

  rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return rooms;
}
