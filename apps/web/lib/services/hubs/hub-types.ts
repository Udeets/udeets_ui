export const HUB_VISIBILITIES = ["public", "private"] as const;
export type HubVisibility = (typeof HUB_VISIBILITIES)[number];

export const HUB_POSTING_PERMISSIONS = ["admins_only", "all_members"] as const;
export type HubPostingPermission = (typeof HUB_POSTING_PERMISSIONS)[number];

export const HUB_INTERACTION_PERMISSIONS = ["members_only", "everyone_with_access"] as const;
export type HubInteractionPermission = (typeof HUB_INTERACTION_PERMISSIONS)[number];

export const HUB_ROLES = ["creator", "admin", "member"] as const;
export type HubRole = (typeof HUB_ROLES)[number];

export type HubId = string;
export type HubCategory = string;

export interface HubConnectLinks {
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  whatsapp?: string | null;
  x?: string | null;
}

export interface HubSettings {
  visibility: HubVisibility;
  postingPermission: HubPostingPermission;
  interactionPermission: HubInteractionPermission;
}

export interface HubSummary {
  id: HubId;
  name: string;
  slug: string;
  category: HubCategory;
  tagline?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  logoImageUrl?: string | null;
  createdBy: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Hub extends HubSummary {
  settings: HubSettings;
  connect?: HubConnectLinks | null;
}

export const DEFAULT_HUB_SETTINGS: HubSettings = {
  visibility: "public",
  postingPermission: "admins_only",
  interactionPermission: "members_only",
};

export interface CreateHubInput {
  name: string;
  slug: string;
  category: HubCategory;
  visibility?: HubVisibility;
  tagline?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  coverImageUrl?: string;
  dpImageUrl?: string;
  websiteUrl?: string | null;
}

export interface UpdateHubInput {
  name?: string | null;
  description?: string | null;
  category?: HubCategory;
  visibility?: HubVisibility;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  phoneNumber?: string | null;
  coverImageUrl?: string | null;
  coverImageOffsetY?: number;
  dpImageUrl?: string | null;
  galleryImageUrls?: string[] | null;
  accentColor?: string | null;
}

export interface HubRecord {
  id: HubId;
  name: string;
  slug: string;
  category: HubCategory;
  tagline: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  cover_image_url: string | null;
  cover_image_offset_y?: number | null;
  dp_image_url: string | null;
  gallery_image_urls: string[] | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  phone_number?: string | null;
  visibility?: string | null;
  accent_color?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
