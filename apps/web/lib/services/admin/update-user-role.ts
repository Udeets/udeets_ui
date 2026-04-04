import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/roles";

/**
 * Update a user's platform-level app_role.
 * Relies on RLS to restrict this to super_admin users only.
 */
export async function updateUserAppRole(
  userId: string,
  newRole: AppRole,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ app_role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[update-user-role] Failed:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
