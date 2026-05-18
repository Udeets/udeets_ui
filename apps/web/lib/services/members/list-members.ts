import { listHubMembersFromApi } from "@/lib/api/members";
import type { HubMember } from "@/lib/services/members/member-types";

export async function listHubMembers(hubId: string): Promise<HubMember[]> {
  return listHubMembersFromApi(hubId);
}
