import { apiFetch } from "@/lib/api/client";
import type { PlatformUser } from "@/lib/services/admin/admin-types";
import type { AppRole } from "@/lib/roles";

export async function listPlatformUsersApi(opts?: {
  search?: string;
  roleFilter?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: PlatformUser[]; total: number }> {
  return apiFetch<{ users: PlatformUser[]; total: number }>("/admin/users", {
    query: {
      search: opts?.search,
      roleFilter: opts?.roleFilter,
      limit: opts?.limit,
      offset: opts?.offset,
    },
  });
}

export async function updateUserAppRoleApi(
  userId: string,
  role: AppRole,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiFetch<{ success: boolean }>(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: "PATCH",
      body: { role },
    });
    return { success: Boolean(response.success) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update role" };
  }
}
