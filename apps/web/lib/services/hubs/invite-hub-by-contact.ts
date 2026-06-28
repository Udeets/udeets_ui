import { sendHubContactInviteFromApi } from "@/lib/api/invites";
import { getCurrentSession } from "@/services/auth/getCurrentSession";

import type { InviteContactType } from "./validate-invite-contact";

/**
 * Sends a hub invite by email or phone. Always returns generic success when the
 * server accepts the request — never reveals whether a matching user exists.
 */
export async function inviteHubByContact(
  hubId: string,
  contactType: InviteContactType,
  contactValue: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    return { ok: false, message: "You must be signed in to send invitations." };
  }

  try {
    await sendHubContactInviteFromApi(hubId, session.access_token, contactType, contactValue, 30);
    return { ok: true };
  } catch (error) {
    console.error("[inviteHubByContact]", error);
    return { ok: false, message: "Could not send the invitation. Please try again." };
  }
}
