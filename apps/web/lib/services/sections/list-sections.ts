import { listHubSectionsApi } from "@/lib/api/hub-customization";
import type { HubSection, HubSectionItem } from "./section-types";

export async function listHubSections(hubId: string): Promise<HubSection[]> {
  try {
    const sections = await listHubSectionsApi(hubId);
    return (sections ?? []).map((section) => ({
      ...section,
      items: (section.items ?? []) as HubSectionItem[],
    }));
  } catch (error) {
    console.error("[list-sections] Failed to list sections:", error);
    return [];
  }
}
