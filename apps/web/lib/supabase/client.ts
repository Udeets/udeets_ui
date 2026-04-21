import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableOrAnonKey());
}
