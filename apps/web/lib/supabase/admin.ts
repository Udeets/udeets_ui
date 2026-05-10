import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server jobs (e.g. retention purge). Bypasses RLS.
 * Returns null when `SUPABASE_SERVICE_ROLE_KEY` is not configured.
 */
export function createServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
