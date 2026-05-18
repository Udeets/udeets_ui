import { inviteUserToHubApi } from "@/lib/api/hubs";

export type InviteUserToHubResult = {
  status: "invited" | "already_member" | "already_invited" | "error";
  message?: string;
};

/**
 * Creates a pending row in `hub_invitations` so the invitee sees the hub in
 * their Profile → Invitations tab. RLS enforces that only hub creators/admins
 * can call this successfully.
 *
 * If the target user is already an active member or already has a pending
 * invitation, we surface that instead of returning a generic error so the UI
 * can show "Member" or "Invited" accurately.
 */
export async function inviteUserToHub(hubId: string, invitedUserId: string): Promise<InviteUserToHubResult> {
  try {
    const status = await inviteUserToHubApi(hubId, invitedUserId);
    if (status === "invited" || status === "already_member" || status === "already_invited") {
      return { status };
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not send invitation.",
    };
  }
  return { status: "error", message: "Could not send invitation." };
}
