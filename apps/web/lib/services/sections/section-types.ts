export const SECTION_TAGS = [
  "info",
  "hours",
  "menu",
  "pricing",
  "rule",
  "highlight",
  "link",
  "amenity",
  "service",
  "announcement",
] as const;

export type SectionTag = (typeof SECTION_TAGS)[number];

export const TAG_LABELS: Record<SectionTag, string> = {
  info: "Info",
  hours: "Hours",
  menu: "Menu",
  pricing: "Pricing",
  rule: "Rule",
  highlight: "Highlight",
  link: "Link",
  amenity: "Amenity",
  service: "Service",
  announcement: "Announcement",
};

export const TAG_COLORS: Record<SectionTag, string> = {
  info: "bg-blue-50 text-blue-700",
  hours: "bg-amber-50 text-amber-700",
  menu: "bg-orange-50 text-orange-700",
  pricing: "bg-green-50 text-green-700",
  rule: "bg-red-50 text-red-700",
  highlight: "bg-purple-50 text-purple-700",
  link: "bg-teal-50 text-teal-700",
  amenity: "bg-cyan-50 text-cyan-700",
  service: "bg-indigo-50 text-indigo-700",
  announcement: "bg-rose-50 text-rose-700",
};

export interface HubSectionItem {
  id: string;
  section_id: string;
  label: string;
  tag: SectionTag | null;
  value: string | null;
  position: number;
}

export interface HubSection {
  id: string;
  hub_id: string;
  title: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  items: HubSectionItem[];
}

export const MAX_SECTIONS_PER_HUB = 6;
export const MAX_ITEMS_PER_SECTION = 10;
