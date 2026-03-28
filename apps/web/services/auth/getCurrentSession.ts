import type { Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get current session: ${error.message}`);
  }

  return data.session;
}
