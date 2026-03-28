import { createClient } from "@/lib/supabase/client";
import {
  HUB_COLUMNS_WITHOUT_PHONE,
  HUB_COLUMNS_WITH_PHONE,
  isMissingPhoneNumberColumnError,
} from "@/lib/services/hubs/query-utils";
import type { Hub } from "@/types/hub";

export async function listHubs(): Promise<Hub[]> {
  const supabase = createClient();
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
