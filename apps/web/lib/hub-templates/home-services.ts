import type { HubTemplateConfig } from "./types";

export const homeServicesConfig: HubTemplateConfig = {
  template: "home_services",
  layout: "business",
  variants: ["Plumber", "Electrician", "Landscaper", "Handyman", "Cleaner", "HVAC"],
  terminology: {
    hub: "Service Provider",
    deets: "Posts",
    members: "Members",
    admin: "Owner",
    about: "About",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "update", icon: "📢", description: "General announcement" },
    { type: "availability", icon: "🗓️", description: "Availability update" },
    { type: "deal", icon: "💰", description: "Special offer or discount" },
    { type: "project", icon: "🔨", description: "Completed project showcase" },
    { type: "alert", icon: "⚠️", description: "Schedule change, emergency" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Services Offered",
    "Service Area",
    "Gallery",
    "Location & Hours",
    "Reviews",
  ],
  defaultCTAs: [
    { label: "Request Quote", actionType: "whatsapp", actionValue: "" },
    { label: "Call Now", actionType: "phone", actionValue: "" },
    { label: "Get Directions", actionType: "maps", actionValue: "" },
  ],
  keyFields: [
    "Service type",
    "Service area (zip codes)",
    "License / certification number",
    "Years in business",
    "Hours of operation",
    "Emergency availability",
  ],
  memberRoles: [
    { role: "Owner", who: "Creator", permissions: "Everything" },
    { role: "Staff", who: "Admin", permissions: "Post updates, respond to reviews" },
    { role: "Client", who: "Member", permissions: "View, leave reviews, request services" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["Service Type"],
    showRating: true,
    showButton: true,
    buttonLabel: "Get Quote",
  },
};
