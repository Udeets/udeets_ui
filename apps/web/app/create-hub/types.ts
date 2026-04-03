export type Step = 1 | 2 | 3 | 4 | 5;

export type Visibility = "Private" | "Public";

export type CategoryGroup = {
  title: string;
  items: string[];
};

export type VisibilityOption = {
  title: string;
  value: Visibility;
  description: string;
};

export type HubCategoryOption = {
  value: string;
  label: string;
  emoji: string;
  desc: string;
};

export const HUB_CATEGORY_OPTIONS: HubCategoryOption[] = [
  { value: "communities", label: "Community", emoji: "🏘️", desc: "Neighborhood, local group, or club" },
  { value: "restaurants", label: "Restaurant / Food", emoji: "🍽️", desc: "Restaurant, cafe, bakery, or food business" },
  { value: "hoa", label: "HOA", emoji: "🏡", desc: "Homeowners association" },
  { value: "religious-places", label: "Religious Place", emoji: "🛕", desc: "Temple, church, mosque, or spiritual center" },
  { value: "fitness", label: "Fitness / Sports", emoji: "💪", desc: "Gym, sports club, or fitness group" },
  { value: "pet-clubs", label: "Pet Club", emoji: "🐾", desc: "Pet owners group or animal community" },
  { value: "pta", label: "School / PTA", emoji: "🎒", desc: "School, PTA, or education group" },
  { value: "health-wellness", label: "Health & Wellness", emoji: "🧘", desc: "Wellness center, spa, or health group" },
  { value: "home-services", label: "Home Services", emoji: "🔧", desc: "Plumber, electrician, or handyman" },
  { value: "retail", label: "Retail / Shop", emoji: "🛍️", desc: "Retail store or local shop" },
  { value: "events", label: "Events", emoji: "🎉", desc: "Event group or venue" },
];
