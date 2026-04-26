import type { HubRecord as DbHubRecord, HubCategory } from "@/lib/services/hubs/hub-types";

export type HubCategorySlug = HubCategory;
export type HubTag = "trending" | "popular" | "nearby";

export type HubRecord = {
  id: string;
  name: string;
  category: HubCategorySlug;
  slug: string;
  href: string;
  locationLabel: string;
  distanceMi: number;
  membersLabel: string;
  visibility: "Public" | "Private";
  description: string;
  tagline?: string;
  intro?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  phoneNumber?: string;
  heroImage?: string;
  coverImageOffsetY?: number;
  dpImage?: string;
  dpImageOffsetY?: number;
  createdBy?: string;
  galleryImages?: string[];
  feedImages?: string[];
  adminImages?: string[];
  tags: HubTag[];
  quickInfo?: Array<{ label: string; value: string }>;
  about?: string[];
  offerings?: string[];
  highlights?: string[];
  accentColor?: string | null;
  contact?: {
    visit: string;
    stayConnected: string;
  };
  cta?: {
    title: string;
    description: string;
    buttonLabel: string;
  };
  updates?: Array<{
    id: string;
    title: string;
    body: string;
    image?: string;
    dateLabel: string;
    visibility?: "Public" | "Subscribers";
  }>;
  events?: Array<{
    id: string;
    title: string;
    meta: string;
    desc: string;
    visibility?: "Public" | "Subscribers";
  }>;
};

export function normalizePublicSrc(src?: string | null) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

export function locationLabelForDbHub(hub: DbHubRecord) {
  return [hub.city, hub.state, hub.country].filter(Boolean).join(", ") || "";
}

export function toHubRecord(hub: DbHubRecord): HubRecord {
  const locationLabel = locationLabelForDbHub(hub);
  const description = hub.description || "A new uDeets hub is getting set up.";
  const heroImage = normalizePublicSrc(hub.cover_image_url);
  const dpImage = normalizePublicSrc(hub.dp_image_url);
  const galleryImages = (hub.gallery_image_urls ?? []).map(normalizePublicSrc).filter(Boolean);
  const membersCount = 1;

  return {
    id: hub.id,
    name: hub.name,
    category: hub.category,
    slug: hub.slug,
    href: `/hubs/${hub.category}/${hub.slug}`,
    locationLabel,
    distanceMi: 0,
    membersLabel: String(membersCount),
    visibility: hub.visibility === "private" ? "Private" : "Public",
    description,
    tagline: hub.tagline || `${hub.name} on uDeets`,
    intro: description,
    website: hub.website_url || "",
    facebookUrl: hub.facebook_url || "",
    instagramUrl: hub.instagram_url || "",
    youtubeUrl: hub.youtube_url || "",
    phoneNumber: hub.phone_number || "",
    heroImage,
    coverImageOffsetY: typeof hub.cover_image_offset_y === "number" ? hub.cover_image_offset_y : 50,
    dpImage,
    dpImageOffsetY: typeof hub.dp_image_offset_y === "number" ? hub.dp_image_offset_y : 50,
    createdBy: hub.created_by,
    galleryImages,
    feedImages: [],
    adminImages: [],
    tags: [],
    accentColor: hub.accent_color,
    quickInfo: [
      { label: "Type", value: hub.category.replace(/-/g, " ") },
      { label: "Location", value: locationLabel },
      { label: "Status", value: "New hub" },
    ],
    about: [
      description,
      "More details, updates, and media can be added over time.",
    ],
    offerings: ["Updates", "Community posts", "Upcoming activity"],
    highlights: ["Newly created", "Supabase-backed", "Ready for first updates"],
    contact: {
      visit: "Location and contact details can be added as this hub grows.",
      stayConnected: "Follow this hub for future posts, events, and updates.",
    },
    cta: {
      title: "Follow This Hub",
      description: "Stay connected as the first updates and events are added.",
      buttonLabel: "Stay Updated",
    },
    updates: [],
    events: [],
  };
}
