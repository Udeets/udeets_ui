import { createClient } from "@/lib/supabase/server";

export class HubUnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "HubUnauthorizedError";
  }
}

export class HubForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "HubForbiddenError";
  }
}

export async function requireHubAdminUserId(hubId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) {
    throw new HubUnauthorizedError();
  }

  const { data: membership, error: memberError } = await supabase
    .from("hub_members")
    .select("role, status")
    .eq("hub_id", hubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    memberError ||
    !membership ||
    membership.status !== "active" ||
    !["creator", "admin"].includes(membership.role)
  ) {
    throw new HubForbiddenError();
  }

  return user.id;
}
