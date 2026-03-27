import { supabase } from "@/lib/supabase/client";
import type { Hub } from "@/types/hub";

const HUB_COLUMNS = `
  id,
  name,
  slug,
  category,
  tagline,
  description,
  city,
  state,
  country,
  cover_image_url,
  logo_image_url,
  created_by,
  created_at,
  updated_at
`;

export async function listHubs(): Promise<Hub[]> {
  const { data, error } = await supabase
    .from("hubs")
    .select(HUB_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list hubs: ${error.message}`);
  }

  return (data ?? []) as Hub[];
}
