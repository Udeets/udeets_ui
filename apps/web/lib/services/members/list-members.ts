import { createClient } from "@/lib/supabase/server";
import type { HubMember } from "@/lib/services/members/member-types";

export async function listHubMembers(hubId: string): Promise<HubMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hub_members")
    .select("hub_id, user_id, role, status, joined_at")
    .eq("hub_id", hubId)
    .eq("status", "active");

  if (error) {
    console.error("[list-members] Failed to list hub members:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    hubId: row.hub_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at ?? null,
  }));
}
