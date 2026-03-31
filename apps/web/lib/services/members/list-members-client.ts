import { createClient } from "@/lib/supabase/client";
import type { HubMember } from "@/lib/services/members/member-types";

export async function listHubMembersClient(hubId: string): Promise<HubMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hub_members")
    .select("hub_id, user_id, role, status, joined_at")
    .eq("hub_id", hubId)
    .eq("status", "active");

  if (error) {
    console.error("[list-members-client] Failed to list hub members:", error);
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
