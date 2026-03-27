import { supabase } from "@/lib/supabase/client";
import type { CreateHubInput, Hub } from "@/types/hub";

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

export async function createHub(input: CreateHubInput): Promise<Hub> {
  const { data, error } = await supabase
    .from("hubs")
    .insert(input)
    .select(HUB_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Failed to create hub: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create hub: no hub was returned.");
  }

  return data as Hub;
}
