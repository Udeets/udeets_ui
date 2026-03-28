import { createClient } from "@/lib/supabase/client";

export async function signOut(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}
