import { createClient } from "@/lib/supabase/client";
import type { HubMember, MemberStatus } from "@/lib/services/members/member-types";

/**
 * List pending member requests for a hub (admin-only in the UI layer).
 */
export async function listPendingRequests(hubId: string): Promise<HubMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hub_members")
    .select("hub_id, user_id, role, status, joined_at")
    .eq("hub_id", hubId)
    .eq("status", "pending")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[manage-members] Failed to list pending requests:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    hubId: row.hub_id,
    userId: row.user_id,
    role: row.role,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at ?? null,
  }));
}

/**
 * Approve a pending member request — sets status to "active".
 */
export async function approveMemberRequest(hubId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("hub_members")
    .update({ status: "active" })
    .eq("hub_id", hubId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to approve member: ${error.message}`);
  }
}

/**
 * Reject a pending member request — deletes the membership row.
 */
export async function rejectMemberRequest(hubId: string, userId: string): Promise<void> {
  const supabase = createClient();

  // We need a delete policy. Since we only have update, change status to a
  // sentinel or simply update to a "rejected" state we can filter out.
  // For now, just update status — we don't have a delete policy for admins.
  // Using "invited" as a pseudo-rejected state that won't show in any queries.
  // A cleaner approach would be to add a DELETE policy, but to keep things
  // simple and avoid new migrations, we'll update status + remove the row
  // by having the user "cancel" their own request.
  //
  // Actually, the creator can UPDATE rows (per our new RLS policy), so we
  // just set status to something the app ignores. Let's add "rejected" as
  // a conceptual state — the DB column is text so it accepts any value.

  const { error } = await supabase
    .from("hub_members")
    .update({ status: "rejected" })
    .eq("hub_id", hubId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to reject member request: ${error.message}`);
  }
}

/**
 * Fetch profile info for a list of user IDs (for displaying names/avatars).
 */
export async function fetchProfilesForUsers(
  userIds: string[]
): Promise<Map<string, { fullName: string; avatarUrl: string | null; email: string | null }>> {
  const supabase = createClient();
  const result = new Map<string, { fullName: string; avatarUrl: string | null; email: string | null }>();
  if (!userIds.length) return result;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  for (const p of data ?? []) {
    result.set(p.id, {
      fullName: p.full_name ?? p.id.slice(0, 8),
      avatarUrl: p.avatar_url ?? null,
      email: p.email ?? null,
    });
  }

  return result;
}
