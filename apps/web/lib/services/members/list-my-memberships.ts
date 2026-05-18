import { listMyMembershipsFromApi } from "@/lib/api/members";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import type { MemberRole, MemberStatus } from "@/lib/services/members/member-types";

export interface MyMembership {
  id?: string | null;
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
  const session = await getCurrentSession();
  const token = session?.access_token;
  if (!token) return [];
  return listMyMembershipsFromApi(token);
}
