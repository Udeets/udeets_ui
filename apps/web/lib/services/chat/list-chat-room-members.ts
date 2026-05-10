import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type ChatRoomMemberDto = {
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function listChatRoomMembers(userId: string, roomId: string): Promise<ChatRoomMemberDto[]> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "LIST_ROOM_MEMBERS");

  const { data, error } = await supabase
    .from("chat_room_memberships")
    .select("user_id, role, status, joined_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[listChatRoomMembers]", error);
    return [];
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
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

  return rows.map((r) => {
    const uid = r.user_id as string;
    const p = profileById.get(uid);
    return {
      userId: uid,
      role: r.role as string,
      status: r.status as string,
      joinedAt: r.joined_at as string,
      displayName: p?.full_name?.trim() || `Member ${uid.slice(0, 8)}`,
      avatarUrl: p?.avatar_url ?? null,
    };
  });
}
