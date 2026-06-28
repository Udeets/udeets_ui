"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { getMyHubMembershipFromApi } from "@/lib/api/members";
import { getMyProfileApi } from "@/lib/api/profiles";
import {
  type AppRole,
  type EffectiveRole,
  type HubMemberRole,
  resolveEffectiveRole,
  resolvePlatformRole,
} from "@/lib/roles";

/* ─── Platform-level role (no hub context) ─── */

export interface PlatformRoleState {
  role: EffectiveRole;
  appRole: AppRole | null;
  isLoading: boolean;
}

/**
 * Resolves the current user's platform-level effective role.
 * Use this on pages that don't have a hub context (dashboard, create-hub, etc.).
 */
export function usePlatformRole(): PlatformRoleState {
  const { isAuthenticated, user, status } = useAuthSession();
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!user?.id) {
      queueMicrotask(() => {
        setAppRole(null);
        setLoaded(true);
      });
      return;
    }

    let ignore = false;
    async function fetchAppRole() {
      const profile = await getMyProfileApi();

      if (!ignore) {
        setAppRole((profile?.app_role as AppRole) ?? "user");
        setLoaded(true);
      }
    }

    void fetchAppRole();
    return () => { ignore = true; };
  }, [user?.id, status]);

  const isLoading = status === "loading" || !loaded;
  const role = isLoading ? "viewer" : resolvePlatformRole(appRole, isAuthenticated);

  return { role, appRole, isLoading };
}

/* ─── Hub-level role (requires hub context) ─── */

export interface HubRoleState {
  /** Effective role combining platform role + hub membership */
  role: EffectiveRole;
  /** Raw platform-level role from profiles */
  appRole: AppRole | null;
  /** Raw hub-level role from hub_members */
  hubRole: HubMemberRole | null;
  /** Hub membership status */
  hubStatus: string | null;
  /** Whether the role is still being resolved */
  isLoading: boolean;
  /** Whether the user is the hub creator specifically */
  isCreator: boolean;
  /** Whether the user has an active membership (any role) */
  isMember: boolean;
  /** Whether there's a pending join request */
  isPending: boolean;
}

/**
 * Resolves the current user's effective role within a specific hub.
 * Combines platform-level app_role with hub_members role.
 */
export function useHubRole(hubId: string, hubCreatedBy: string | null): HubRoleState {
  const { isAuthenticated, user, status } = useAuthSession();
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [hubRole, setHubRole] = useState<HubMemberRole | null>(null);
  const [hubStatus, setHubStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const isCreator = Boolean(user?.id && hubCreatedBy && user.id === hubCreatedBy);

  useEffect(() => {
    if (status === "loading") return;
    if (!user?.id) {
      queueMicrotask(() => {
        setAppRole(null);
        setHubRole(null);
        setHubStatus(null);
        setLoaded(true);
      });
      return;
    }

    let ignore = false;

    async function fetchRoles() {
      const [profile, member] = await Promise.all([
        getMyProfileApi(),
        getMyHubMembershipFromApi(hubId),
      ]);

      if (ignore) return;

      setAppRole((profile?.app_role as AppRole) ?? "user");

      if (member) {
        setHubRole(member.role as HubMemberRole);
        setHubStatus(member.status as string);
      } else if (isCreator) {
        // Creator always has admin access even if hub_members row is missing
        setHubRole("creator");
        setHubStatus("active");
      } else {
        setHubRole(null);
        setHubStatus(null);
      }

      setLoaded(true);
    }

    void fetchRoles();
    return () => { ignore = true; };
  }, [user?.id, hubId, status, isCreator]);

  const isLoading = status === "loading" || !loaded;

  const role = isLoading
    ? "viewer"
    : resolveEffectiveRole(appRole, hubRole, hubStatus, isAuthenticated);

  const isMember = hubStatus === "active" && hubRole !== null;
  const isPending = hubStatus === "pending";

  return {
    role,
    appRole,
    hubRole,
    hubStatus,
    isLoading,
    isCreator,
    isMember,
    isPending,
  };
}
