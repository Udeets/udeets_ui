"use client";

import { useEffect, useRef } from "react";
import type { CognitoUser } from "@/lib/auth/cognito-session";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { upsertProfile } from "@/lib/services/profile/upsert-profile";

/**
 * Ensures the current user's profile row has full_name and email populated.
 * Runs once per session — backfills from auth user_metadata if the profile
 * columns are NULL (fixes users who signed up before the upsert was added).
 */
export function useProfileSync(user: CognitoUser | null) {
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || syncedRef.current === user.id) return;
    syncedRef.current = user.id;

    (async () => {
      try {
        const meta = user.user_metadata ?? {};
        const authName = (meta.full_name as string) || (meta.name as string) || null;
        const authEmail = user.email ?? null;
        const authAvatar = (meta.avatar_url as string) || null;
        const session = await getCurrentSession();
        await upsertProfile(
          user.id,
          authName,
          authAvatar,
          authEmail,
          session?.access_token ?? null,
        );
      } catch (err) {
        console.error("[useProfileSync] Failed to sync profile:", err);
      }
    })();
  }, [user]);
}
