import {
  approveHubMemberFromApi,
  leaveHubFromApi,
  listPendingHubMembersFromApi,
  rejectHubMemberFromApi,
} from "@/lib/api/members";
import { listBriefProfilesApi } from "@/lib/api/profiles";
import type { HubMember } from "@/lib/services/members/member-types";

/**
 * List pending member requests for a hub (admin-only in the UI layer).
 */
export async function listPendingRequests(hubId: string): Promise<HubMember[]> {
  try {
    return await listPendingHubMembersFromApi(hubId);
  } catch (error) {
    console.error("[manage-members] Failed to list pending requests:", error);
    return [];
  }
}

/**
 * Approve a pending member request — sets status to "active".
 */
export async function approveMemberRequest(hubId: string, userId: string): Promise<void> {
  const ok = await approveHubMemberFromApi(hubId, userId);
  if (!ok) {
    throw new Error("Failed to approve member.");
  }
}

/**
 * Reject a pending member request — deletes the membership row.
 */
export async function rejectMemberRequest(hubId: string, userId: string): Promise<void> {
  const ok = await rejectHubMemberFromApi(hubId, userId);
  if (!ok) {
    throw new Error("Failed to reject member request.");
  }
}

/**
 * Fetch profile info for a list of user IDs (for displaying names/avatars).
 */
export async function fetchProfilesForUsers(
  userIds: string[]
): Promise<Map<string, { fullName: string; avatarUrl: string | null; email: string | null }>> {
  const result = new Map<string, { fullName: string; avatarUrl: string | null; email: string | null }>();
  if (!userIds.length) return result;

  const data = await listBriefProfilesApi(userIds);
  for (const p of data) {
    result.set(p.id, {
      fullName: p.full_name ?? p.id.slice(0, 8),
      avatarUrl: p.avatar_url ?? null,
      email: p.email ?? null,
    });
  }

  return result;
}

/**
 * Leave a hub — removes active membership for the user.
 * Attempts to delete the row; if RLS prevents deletion, falls back to updating status to 'left'.
 */
export async function leaveHub(hubId: string, userId: string): Promise<void> {
  void userId;
  const ok = await leaveHubFromApi(hubId);
  if (!ok) {
    throw new Error("Failed to leave hub.");
  }
}
