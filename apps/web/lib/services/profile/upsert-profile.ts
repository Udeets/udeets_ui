import { createClient } from "@/lib/supabase/server";

/**
 * Upsert profile on OAuth sign-in.
 * On first login (INSERT): populate full_name, avatar_url, email from the OAuth provider.
 * On subsequent logins (UPDATE): only update email (which may change); never
 * overwrite full_name or avatar_url since the user may have customised them.
 */
export async function upsertProfile(
  userId: string,
  fullName: string | null,
  avatarUrl: string | null,
  email: string | null,
): Promise<void> {
  const supabase = await createClient();

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (existing) {
    // Existing user — only update email (keep custom name/avatar intact)
    const { error } = await supabase
      .from("profiles")
      .update({
        email: email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[upsert-profile] Failed to update profile:", error);
    }
  } else {
    // New user — insert with all OAuth data
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        email: email,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("[upsert-profile] Failed to insert profile:", error);
    }
  }
}
