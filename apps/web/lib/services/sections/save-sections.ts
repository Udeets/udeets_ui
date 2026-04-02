import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  // Delete all existing sections for this hub (cascade deletes items too)
  const { error: deleteError } = await supabase
    .from("hub_sections")
    .delete()
    .eq("hub_id", hubId);

  if (deleteError) {
    throw new Error(`Failed to clear existing sections: ${deleteError.message}`);
  }

  const result: HubSection[] = [];

  for (const section of sections) {
    // Insert section
    const { data: sectionData, error: sectionError } = await supabase
      .from("hub_sections")
      .insert({
        hub_id: hubId,
        title: section.title.trim(),
        position: section.position,
        is_visible: section.is_visible,
      })
      .select("*")
      .single();

    if (sectionError || !sectionData) {
      throw new Error(`Failed to save section "${section.title}": ${sectionError?.message}`);
    }

    // Insert items for this section
    const itemsToInsert = section.items
      .filter((item) => item.label.trim())
      .map((item, idx) => ({
        section_id: sectionData.id,
        label: item.label.trim(),
        tag: item.tag || null,
        value: item.value?.trim() || null,
        position: idx,
      }));

    let savedItems: HubSectionItem[] = [];

    if (itemsToInsert.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("hub_section_items")
        .insert(itemsToInsert)
        .select("*");

      if (itemsError) {
        console.error("[save-sections] Failed to save items:", itemsError);
      }
      savedItems = (itemsData ?? []) as HubSectionItem[];
    }

    result.push({
      ...sectionData,
      items: savedItems,
    } as HubSection);
  }

  return result;
}
