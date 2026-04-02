import type { HubTemplate, HubTemplateConfig } from "./types";
import { eventsConfig } from "./events";
import { faithConfig } from "./faith";
import { foodDiningConfig } from "./food-dining";
import { healthWellnessConfig } from "./health-wellness";
import { hoaConfig } from "./hoa";
import { homeServicesConfig } from "./home-services";
import { ptaConfig } from "./pta";
import { retailConfig } from "./retail";
import { sportsConfig } from "./sports";

/**
 * General / fallback template used when no category-specific template exists.
 */
const generalConfig: HubTemplateConfig = {
  template: "general",
  layout: "community",
  variants: [],
  terminology: {
    hub: "Hub",
    deets: "Deets",
    members: "Members",
    admin: "Admin",
    about: "About",
  },
  tabs: ["About", "Posts", "Attachments", "Members"],
  postTypes: [
    { type: "update", icon: "📢", description: "General announcement" },
    { type: "event", icon: "📅", description: "Event" },
    { type: "poll", icon: "🗳️", description: "Poll" },
    { type: "alert", icon: "⚠️", description: "Alert" },
  ],
  aboutSections: ["Hero Block", "Quick Info Strip", "Description", "Gallery", "Location"],
  defaultCTAs: [],
  keyFields: [],
  memberRoles: [
    { role: "Creator", who: "Creator", permissions: "Everything" },
    { role: "Admin", who: "Admin", permissions: "Post, manage members" },
    { role: "Member", who: "Member", permissions: "View, interact" },
  ],
  discoverCard: {
    showCover: true,
    badges: [],
    showButton: true,
    buttonLabel: "Join",
  },
};

const TEMPLATE_MAP: Record<HubTemplate, HubTemplateConfig> = {
  general: generalConfig,
  food_dining: foodDiningConfig,
  hoa: hoaConfig,
  home_services: homeServicesConfig,
  health_wellness: healthWellnessConfig,
  faith: faithConfig,
  pta: ptaConfig,
  sports: sportsConfig,
  events: eventsConfig,
  retail: retailConfig,
};

/**
 * Retrieve the template config for a given hub template.
 * Falls back to the general template if the template is unknown.
 */
export function getHubConfig(template?: HubTemplate | string | null): HubTemplateConfig {
  if (!template) return generalConfig;
  return TEMPLATE_MAP[template as HubTemplate] ?? generalConfig;
}

/**
 * Map a hub category slug (from the hubs table) to a HubTemplate key.
 */
const CATEGORY_TO_TEMPLATE: Record<string, HubTemplate> = {
  restaurants: "food_dining",
  hoa: "hoa",
  "home-services": "home_services",
  "health-wellness": "health_wellness",
  "religious-places": "faith",
  pta: "pta",
  fitness: "sports",
  "pet-clubs": "general",
  events: "events",
  retail: "retail",
  communities: "general",
};

/**
 * Get the template config for a hub category slug.
 */
export function getHubConfigByCategory(categorySlug?: string | null): HubTemplateConfig {
  if (!categorySlug) return generalConfig;
  const template = CATEGORY_TO_TEMPLATE[categorySlug];
  return template ? getHubConfig(template) : generalConfig;
}

export type { HubTemplate, HubTemplateConfig } from "./types";
