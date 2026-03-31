import { createClient } from "@/lib/supabase/server";

export async function upsertProfile(
  userId: string,
  fullName: string | null,
  avatarUrl: string | null,
  email: string | null,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        email: email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    console.error("[upsert-profile] Failed to upsert profile:", error);
  }
}
