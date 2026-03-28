import { createClient } from "@/lib/supabase/server";
import type { HubCategory, HubRecord } from "@/lib/services/hubs/hub-types";
import {
  HUB_COLUMNS_WITHOUT_PHONE,
  HUB_COLUMNS_WITH_PHONE,
  isMissingPhoneNumberColumnError,
} from "@/lib/services/hubs/query-utils";

export async function getHubBySlug(
  category: HubCategory | string,
  slug: string,
): Promise<HubRecord | null> {
  const supabase = await createClient();
  const normalizedCategory = category.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();

  const initialResult = await supabase
    .from("hubs")
    .select(HUB_COLUMNS_WITH_PHONE)
    .eq("category", normalizedCategory)
    .eq("slug", normalizedSlug)
    .maybeSingle();
  let data = initialResult.data as HubRecord | null;
  let error = initialResult.error;

  if (isMissingPhoneNumberColumnError(error)) {
    const fallbackResult = await supabase
      .from("hubs")
      .select(HUB_COLUMNS_WITHOUT_PHONE)
      .eq("category", normalizedCategory)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    data = fallbackResult.data as HubRecord | null;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(`Failed to load hub: ${error.message}`);
  }
  return data ?? null;
}
