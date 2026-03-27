export type Hub = {
  readonly id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  cover_image_url: string | null;
  logo_image_url: string | null;
  created_by: string;
  readonly created_at: string;
  readonly updated_at: string;
};

export type CreateHubInput = {
  name: string;
  slug: string;
  category: string;
  tagline?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  cover_image_url?: string | null;
  logo_image_url?: string | null;
  created_by: string;
};
