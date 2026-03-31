import { createClient } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  HUB_COLUMNS_WITHOUT_PHONE,
  HUB_COLUMNS_WITH_PHONE,
  isMissingPhoneNumberColumnError,
} from "@/lib/services/hubs/query-utils";
import type { Hub } from "@/types/hub";

export interface ListHubsOptions {
  /**
   * When false, uses a one-shot anon client with auth session persistence
   * disabled. This bypasses the createBrowserClient auth lock entirely,
   * allowing public queries to reach fetch immediately without waiting for
   * auth state initialization. Safe for any publicly readable table.
   *
   * Defaults to true (uses the shared browser singleton with auth).
   */
  requireAuth?: boolean;
}

// One-shot client with auth disabled — never holds an auth lock.
function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function listHubs(options?: ListHubsOptions): Promise<Hub[]> {
  const supabase = options?.requireAuth === false ? createAnonClient() : createClient();

  const initialResult = await supabase
    .from("hubs")
    .select(HUB_COLUMNS_WITH_PHONE)
    .order("created_at", { ascending: false });
  let data = (initialResult.data ?? []) as Hub[];
  let error = initialResult.error;

  if (isMissingPhoneNumberColumnError(error)) {
    const fallbackResult = await supabase
      .from("hubs")
      .select(HUB_COLUMNS_WITHOUT_PHONE)
      .order("created_at", { ascending: false });

    data = (fallbackResult.data ?? []) as Hub[];
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(`Failed to list hubs: ${error.message}`);
  }

  return data;
}
