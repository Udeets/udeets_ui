import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { status: "error", message: "You must be signed in to send invitations." };
  }

  // Bail early if this user is already an active member of the hub.
  const { data: existingMember } = await supabase
    .from("hub_members")
    .select("status")
    .eq("hub_id", hubId)
    .eq("user_id", invitedUserId)
    .maybeSingle();
  if (existingMember && existingMember.status === "active") {
    return { status: "already_member" };
  }

  // Bail if a pending invitation already exists. The unique index
  // (hub_id, invited_user_id) where status='pending' would otherwise throw.
  const { data: existingInvitation } = await supabase
    .from("hub_invitations")
    .select("id")
    .eq("hub_id", hubId)
    .eq("invited_user_id", invitedUserId)
    .eq("status", "pending")
    .maybeSingle();
  if (existingInvitation) {
    return { status: "already_invited" };
  }

  const { error } = await supabase.from("hub_invitations").insert({
    hub_id: hubId,
    invited_user_id: invitedUserId,
    invited_by: user.id,
    status: "pending",
  });

  if (error) {
    console.error("[inviteUserToHub]", error);
    // If the invitations table isn't migrated yet, fall back to the older
    // hub_members "invited" row so the invite still shows somewhere.
    if (error.message.toLowerCase().includes("hub_invitations")) {
      const { error: fallbackError } = await supabase.from("hub_members").insert({
        hub_id: hubId,
        user_id: invitedUserId,
        role: "member",
        status: "invited",
      });
      if (fallbackError) {
        return { status: "error", message: fallbackError.message };
      }
      return { status: "invited", message: "Invitation sent (legacy mode)." };
    }
    return { status: "error", message: error.message };
  }

  return { status: "invited" };
}
