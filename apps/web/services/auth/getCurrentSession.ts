import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get current session: ${error.message}`);
  }

  return data.session;
}
