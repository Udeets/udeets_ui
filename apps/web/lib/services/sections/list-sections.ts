import { createClient } from "@/lib/supabase/client";
import type { HubSection, HubSectionItem } from "./section-types";

export async function listHubSections(hubId: string): Promise<HubSection[]> {
  const supabase = createClient();

  const { data: sections, error: sectionsError } = await supabase
    .from("hub_sections")
    .select("*")
    .eq("hub_id", hubId)
    .order("position", { ascending: true });

  if (sectionsError) {
    console.error("[list-sections] Failed to list sections:", sectionsError);
    return [];
  }

  if (!sections || sections.length === 0) return [];

  const sectionIds = sections.map((s) => s.id);
  const { data: items, error: itemsError } = await supabase
    .from("hub_section_items")
    .select("*")
    .in("section_id", sectionIds)
    .order("position", { ascending: true });

  if (itemsError) {
    console.error("[list-sections] Failed to list section items:", itemsError);
  }

  const itemsBySectionId = new Map<string, HubSectionItem[]>();
  for (const item of items ?? []) {
    const existing = itemsBySectionId.get(item.section_id) ?? [];
    existing.push(item as HubSectionItem);
    itemsBySectionId.set(item.section_id, existing);
  }

  return sections.map((section) => ({
    ...section,
    items: itemsBySectionId.get(section.id) ?? [],
  })) as HubSection[];
}
