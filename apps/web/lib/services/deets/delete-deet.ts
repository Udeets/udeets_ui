import { createClient } from "@/lib/supabase/client";

/**
 * Deletes a deet by ID. The caller must be the deet's author or a hub admin.
 * Supabase RLS policies enforce the ownership / admin check.
 */
export async function deleteDeet(deetId: string): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to delete a post.");
  }

  // Do not chain `.select()` here: RLS often allows DELETE but does not allow SELECT on the
  // deleted row in the RETURNING clause, so `data` comes back empty even when the row was removed.
  const { error } = await supabase.from("deets").delete().eq("id", deetId);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}
