import { searchProfilesApi } from "@/lib/api/profiles";

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

  try {
    return await searchProfilesApi(trimmed, limit);
  } catch (error) {
    console.error("[search-profiles]", error);
    return [];
  }
}
