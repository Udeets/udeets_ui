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

export async function getHubBySlug(slug: string): Promise<Hub | null> {
  const { data, error } = await supabase
    .from("hubs")
    .select(HUB_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch hub by slug: ${error.message}`);
  }

  return data as Hub | null;
}
