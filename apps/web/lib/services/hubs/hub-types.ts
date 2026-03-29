export type HubCategory =
  | "religious-places"
  | "communities"
  | "restaurants"
  | "fitness"
  | "pet-clubs"
  | "hoa";

export interface CreateHubInput {
  name: string;
  slug: string;
  category: HubCategory;
  tagline?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  coverImageUrl?: string;
  dpImageUrl?: string;
}

export interface UpdateHubInput {
  name?: string | null;
  category?: HubCategory;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  phoneNumber?: string | null;
  coverImageUrl?: string | null;
  dpImageUrl?: string | null;
  galleryImageUrls?: string[] | null;
}

export interface HubRecord {
  id: string;
  name: string;
  slug: string;
  category: HubCategory;
  tagline: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  cover_image_url: string | null;
  dp_image_url: string | null;
  gallery_image_urls: string[] | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  phone_number?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
