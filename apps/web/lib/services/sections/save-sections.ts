import { saveHubSectionsApi } from "@/lib/api/hub-customization";
import type { HubSection, HubSectionItem } from "./section-types";

interface SaveSectionInput {
  id?: string;
  title: string;
  position: number;
  is_visible: boolean;
  items: Array<{
    id?: string;
    label: string;
    tag: string | null;
    value: string | null;
    position: number;
  }>;
}

export async function saveHubSections(
  hubId: string,
  sections: SaveSectionInput[]
): Promise<HubSection[]> {
  const result = await saveHubSectionsApi(hubId, sections);
  return (result ?? []).map((section) => ({
    ...section,
    items: (section.items ?? []) as HubSectionItem[],
  }));
}
