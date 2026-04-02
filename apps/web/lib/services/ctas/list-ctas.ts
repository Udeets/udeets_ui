import { createClient } from "@/lib/supabase/client";
import type { HubCTARecord } from "./cta-types";

/**
 * Fetch all CTA buttons for a hub, ordered by position.
 */
export async function listHubCTAs(hubId: string): Promise<HubCTARecord[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hub_ctas")
    .select("*")
    .eq("hub_id", hubId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[list-ctas] Failed to list hub CTAs:", error);
    return [];
  }

  return (data ?? []) as HubCTARecord[];
}
