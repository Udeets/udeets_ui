import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: "You must be signed in to send invitations." };
  }

  const { data, error } = await supabase.rpc("send_hub_contact_invite", {
    p_hub_id: hubId,
    p_contact_type: contactType,
    p_contact_value: contactValue,
  });

  if (error) {
    console.error("[inviteHubByContact]", error);
    if (error.message.includes("invalid_email")) {
      return { ok: false, message: "Enter a valid email address." };
    }
    if (error.message.includes("invalid_phone")) {
      return { ok: false, message: "Enter a valid US phone number." };
    }
    if (error.code === "42501" || error.message.includes("not_authorized")) {
      return { ok: false, message: "You do not have permission to invite members." };
    }
    return { ok: false, message: "Could not send the invitation. Please try again." };
  }

  if (data && typeof data === "object" && "ok" in data && data.ok === true) {
    return { ok: true };
  }

  return { ok: true };
}
