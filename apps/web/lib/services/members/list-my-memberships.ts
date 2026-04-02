import { createClient } from "@/lib/supabase/client";
import type { MemberRole, MemberStatus } from "@/lib/services/members/member-types";

export interface MyMembership {
  hubId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string | null;
}

/**
 * Fetch all hub_members rows for the currently authenticated user.
 * Returns every membership regardless of status so the dashboard
 * can bucket hubs into My Hubs / Joined / Requested.
 */
export async function listMyMemberships(): Promise<MyMembership[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("hub_members")
    .select("hub_id, role, status, joined_at")
    .eq("user_id", user.id);

  if (error) {
    console.error("[list-my-memberships] Failed:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    hubId: row.hub_id,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at ?? null,
  }));
}
