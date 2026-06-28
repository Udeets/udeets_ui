import { updateUserAppRoleApi } from "@/lib/api/admin";
import type { AppRole } from "@/lib/roles";

/**
 * Update a user's platform-level app_role.
 * Relies on RLS to restrict this to super_admin users only.
 */
export async function updateUserAppRole(
  userId: string,
  newRole: AppRole,
): Promise<{ success: boolean; error?: string }> {
  return updateUserAppRoleApi(userId, newRole);
}
