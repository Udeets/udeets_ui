import { listHubCTAsApi } from "@/lib/api/hub-customization";
import type { HubCTARecord } from "./cta-types";

/**
 * Fetch all CTA buttons for a hub, ordered by position.
 */
export async function listHubCTAs(hubId: string): Promise<HubCTARecord[]> {
  try {
    return await listHubCTAsApi(hubId);
  } catch (error) {
    console.error("[list-ctas] Failed to list hub CTAs:", error);
    return [];
  }
}
