/**
 * Centralised role & permission system for uDeets.
 *
 * Four-tier hierarchy (highest → lowest):
 *   super_admin  – Platform-level, stored in profiles.app_role
 *   admin        – Hub creator or hub admin (hub_members.role)
 *   member       – Active hub member
 *   viewer       – Authenticated non-member, or unauthenticated visitor
 */

/* ─── Role types ─── */

/** Platform-level role persisted in the `profiles` table. */
export type AppRole = "super_admin" | "user";

/** Hub-level role derived from the `hub_members` table. */
export type HubMemberRole = "creator" | "admin" | "member";

/**
 * Effective role for UI gating.
 * Resolved by combining the user's platform role + hub membership.
 */
export type EffectiveRole = "super_admin" | "admin" | "member" | "viewer";

/* ─── Role hierarchy ─── */

const ROLE_RANK: Record<EffectiveRole, number> = {
  super_admin: 40,
  admin: 30,
  member: 20,
  viewer: 10,
};

/** Returns true when `actual` is at least as privileged as `required`. */
export function hasMinRole(actual: EffectiveRole, required: EffectiveRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

/* ─── Permission definitions ─── */

export type Permission =
  // Navigation / pages
  | "page:dashboard"
  | "page:create_hub"
  | "page:settings"
  | "page:profile"
  | "page:admin_panel"
  // Hub content
  | "hub:view_about"
  | "hub:view_full_content"
  | "hub:post_deet"
  | "hub:upload_media"
  | "hub:comment"
  | "hub:like"
  // Hub management
  | "hub:edit_settings"
  | "hub:manage_members"
  | "hub:manage_admins"
  | "hub:invite_members"
  | "hub:delete_hub"
  | "hub:edit_ctas"
  | "hub:edit_sections"
  | "hub:edit_connect"
  | "hub:edit_description"
  | "hub:edit_media"
  | "hub:change_accent_color"
  // Platform-level
  | "platform:manage_all_hubs"
  | "platform:view_admin_panel";

/**
 * Permissions granted to each effective role.
 * Higher roles inherit all permissions from lower roles automatically.
 */
const ROLE_PERMISSIONS: Record<EffectiveRole, readonly Permission[]> = {
  viewer: [
    "hub:view_about",
  ],
  member: [
    "page:dashboard",
    "page:settings",
    "page:profile",
    "page:create_hub",
    "hub:view_full_content",
    "hub:post_deet",
    "hub:upload_media",
    "hub:comment",
    "hub:like",
  ],
  admin: [
    "hub:edit_settings",
    "hub:manage_members",
    "hub:manage_admins",
    "hub:invite_members",
    "hub:delete_hub",
    "hub:edit_ctas",
    "hub:edit_sections",
    "hub:edit_connect",
    "hub:edit_description",
    "hub:edit_media",
    "hub:change_accent_color",
  ],
  super_admin: [
    "platform:manage_all_hubs",
    "platform:view_admin_panel",
    "page:admin_panel",
  ],
};

/** Collects all permissions for a role, including inherited ones. */
function collectPermissions(role: EffectiveRole): Set<Permission> {
  const order: EffectiveRole[] = ["viewer", "member", "admin", "super_admin"];
  const perms = new Set<Permission>();
  for (const r of order) {
    for (const p of ROLE_PERMISSIONS[r]) perms.add(p);
    if (r === role) break;
  }
  return perms;
}

/** Pre-computed lookup for fast permission checks. */
const PERMISSION_CACHE: Record<EffectiveRole, Set<Permission>> = {
  viewer: collectPermissions("viewer"),
  member: collectPermissions("member"),
  admin: collectPermissions("admin"),
  super_admin: collectPermissions("super_admin"),
};

/** Returns true if the effective role grants the given permission. */
export function can(role: EffectiveRole, permission: Permission): boolean {
  return PERMISSION_CACHE[role].has(permission);
}

/** Returns true if the effective role grants ALL of the given permissions. */
export function canAll(role: EffectiveRole, permissions: Permission[]): boolean {
  const perms = PERMISSION_CACHE[role];
  return permissions.every((p) => perms.has(p));
}

/** Returns true if the effective role grants ANY of the given permissions. */
export function canAny(role: EffectiveRole, permissions: Permission[]): boolean {
  const perms = PERMISSION_CACHE[role];
  return permissions.some((p) => perms.has(p));
}

/* ─── Role resolution helpers ─── */

/**
 * Resolves the effective role for a user in a specific hub context.
 *
 * @param appRole     – Platform-level role from profiles.app_role (nullable)
 * @param hubRole     – Hub-level role from hub_members.role (nullable if not a member)
 * @param hubStatus   – Hub membership status ("active" | "pending" | "invited" | null)
 * @param isAuthenticated – Whether the user is logged in
 */
export function resolveEffectiveRole(
  appRole: AppRole | null | undefined,
  hubRole: HubMemberRole | null | undefined,
  hubStatus: string | null | undefined,
  isAuthenticated: boolean,
): EffectiveRole {
  // Super admin overrides everything
  if (appRole === "super_admin") return "super_admin";

  // Hub-level role (only if membership is active)
  if (hubStatus === "active" && hubRole) {
    if (hubRole === "creator" || hubRole === "admin") return "admin";
    if (hubRole === "member") return "member";
  }

  // Authenticated but not a member of this hub → viewer
  if (isAuthenticated) return "viewer";

  // Unauthenticated → viewer
  return "viewer";
}

/**
 * Resolves the platform-level effective role (no hub context).
 * Used for gating pages like /dashboard, /create-hub.
 */
export function resolvePlatformRole(
  appRole: AppRole | null | undefined,
  isAuthenticated: boolean,
): EffectiveRole {
  if (appRole === "super_admin") return "super_admin";
  if (isAuthenticated) return "member"; // Any logged-in user can access member-level pages
  return "viewer";
}
