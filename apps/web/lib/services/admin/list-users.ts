import { listPlatformUsersApi } from "@/lib/api/admin";
import type { PlatformUser } from "./admin-types";

/**
 * List platform users with optional search and role filter.
 * Only callable client-side; relies on RLS to restrict to super_admin.
 */
export async function listPlatformUsers(opts?: {
  search?: string;
  roleFilter?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: PlatformUser[]; total: number }> {
  try {
    return await listPlatformUsersApi(opts);
  } catch (error) {
    console.error("[list-users] Failed to list users:", error);
    return { users: [], total: 0 };
  }
}
