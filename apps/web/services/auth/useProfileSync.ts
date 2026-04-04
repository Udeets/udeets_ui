"use client";

import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Ensures the current user's profile row has full_name and email populated.
 * Runs once per session — backfills from auth user_metadata if the profile
 * columns are NULL (fixes users who signed up before the upsert was added).
 */
export function useProfileSync(user: User | null) {
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || syncedRef.current === user.id) return;
    syncedRef.current = user.id;

    const supabase = createClient();

    (async () => {
      try {
        // Read the current profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        const meta = user.user_metadata ?? {};
        const authName =
          (meta.full_name as string) ||
          (meta.name as string) ||
          null;
        const authEmail = user.email ?? null;
        const authAvatar = (meta.avatar_url as string) || null;

        if (!profile) {
          // No profile row at all — create one
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              full_name: authName,
              email: authEmail,
              avatar_url: authAvatar,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
          return;
        }

        // Backfill any NULL columns from auth metadata
        const updates: Record<string, string> = {};
        if (!profile.full_name && authName) updates.full_name = authName;
        if (!profile.email && authEmail) updates.email = authEmail;
        if (!profile.avatar_url && authAvatar) updates.avatar_url = authAvatar;

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          await supabase.from("profiles").update(updates).eq("id", user.id);
        }
      } catch (err) {
        console.error("[useProfileSync] Failed to sync profile:", err);
      }
    })();
  }, [user]);
}
