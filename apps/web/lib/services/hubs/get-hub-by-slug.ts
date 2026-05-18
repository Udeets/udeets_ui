import { getHubBySlugFromApi } from "@/lib/api/hubs";
import type { HubCategory, HubRecord } from "@/lib/services/hubs/hub-types";

export async function getHubBySlug(
  category: HubCategory | string,
  slug: string,
): Promise<HubRecord | null> {
  return getHubBySlugFromApi(category, slug);
}
