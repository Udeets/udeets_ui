import { listHubMembersFromApi } from "@/lib/api/members";
import type { HubMember } from "@/lib/services/members/member-types";

export async function listHubMembersClient(hubId: string): Promise<HubMember[]> {
  try {
    return await listHubMembersFromApi(hubId);
  } catch (error) {
    console.error("[list-members-client] Failed to list hub members:", error);
    return [];
  }
}
