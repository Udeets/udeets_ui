import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const limit = opts?.limit ?? 25;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, app_role, created_at, updated_at", { count: "exact" });

  if (opts?.search) {
    const term = `%${opts.search}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  if (opts?.roleFilter && opts.roleFilter !== "all") {
    query = query.eq("app_role", opts.roleFilter);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[list-users] Failed to list users:", error);
    return { users: [], total: 0 };
  }

  const users: PlatformUser[] = (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    appRole: row.app_role ?? "user",
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }));

  return { users, total: count ?? users.length };
}
