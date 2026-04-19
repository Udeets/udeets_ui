import { createClient } from "@/lib/supabase/client";

export type SearchedProfile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
};

/**
 * Server-side typeahead for the platform-wide user directory used by the
 * hub invite modal. Returns up to `limit` matches whose `full_name` or
 * `email` contains the query (case-insensitive). Requires a query of at
 * least 2 characters to avoid dumping the whole table at 1 letter.
 *
 * Note on privacy: this is currently scoped to "all users" per the product
 * decision (see OPEN_ITEMS notes). If that changes (e.g. opt-in search via
 * profiles.searchable), update the `.eq("searchable", true)` filter here.
 */
export async function searchProfiles(query: string, limit = 10): Promise<SearchedProfile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = createClient();
  // PostgREST requires percent escaping inside `or=`. Escape any commas/parens
  // that could otherwise break the filter expression.
  const safe = trimmed.replace(/[,()%]/g, "");
  const pattern = `%${safe}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
    .order("full_name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[search-profiles]", error);
    return [];
  }

  return (data ?? []).map((row: { id: string; full_name: string | null; avatar_url: string | null; email: string | null }) => ({
    id: row.id,
    fullName: row.full_name || row.email?.split("@")[0] || "uDeets user",
    avatarUrl: row.avatar_url,
    email: row.email,
  }));
}
