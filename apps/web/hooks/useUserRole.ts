"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { createClient } from "@/lib/supabase/client";
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
      setAppRole(null);
      setLoaded(true);
      return;
    }

    let ignore = false;
    async function fetchAppRole() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("app_role")
        .eq("id", user!.id)
        .maybeSingle();

      if (!ignore) {
        setAppRole((data?.app_role as AppRole) ?? "user");
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
      setAppRole(null);
      setHubRole(null);
      setHubStatus(null);
      setLoaded(true);
      return;
    }

    let ignore = false;

    async function fetchRoles() {
      const supabase = createClient();

      // Fetch both in parallel
      const [profileResult, memberResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("app_role")
          .eq("id", user!.id)
          .maybeSingle(),
        supabase
          .from("hub_members")
          .select("role, status")
          .eq("hub_id", hubId)
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);

      if (ignore) return;

      setAppRole((profileResult.data?.app_role as AppRole) ?? "user");

      if (memberResult.data) {
        setHubRole(memberResult.data.role as HubMemberRole);
        setHubStatus(memberResult.data.status as string);
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
