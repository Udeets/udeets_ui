import type { HubTemplateConfig } from "./types";

export const retailConfig: HubTemplateConfig = {
  template: "retail",
  layout: "business",
  variants: ["Boutique", "Grocery", "Salon", "General Store", "Specialty Shop"],
  terminology: {
    hub: "Store",
    deets: "Updates",
    members: "Customers",
    admin: "Owner / Manager",
    about: "About Us",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "update", icon: "📢", description: "Store announcement" },
    { type: "new_arrival", icon: "🆕", description: "New product or arrival" },
    { type: "sale", icon: "💰", description: "Sale or discount" },
    { type: "event", icon: "📅", description: "In-store event" },
    { type: "alert", icon: "⚠️", description: "Hours change, closure" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Featured Products",
    "Our Story",
    "Gallery",
    "Location & Hours",
  ],
  defaultCTAs: [
    { label: "Shop Online", actionType: "url", actionValue: "" },
    { label: "Call Us", actionType: "phone", actionValue: "" },
    { label: "Get Directions", actionType: "maps", actionValue: "" },
  ],
  keyFields: [
    "Store type",
    "Product categories",
    "Hours of operation",
    "Delivery / pickup options",
    "Return policy",
  ],
  memberRoles: [
    { role: "Owner", who: "Creator", permissions: "Everything" },
    { role: "Manager", who: "Admin", permissions: "Post, manage inventory updates" },
    { role: "Customer", who: "Member", permissions: "View, leave reviews, follow" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["Category"],
    showRating: true,
    showButton: true,
    buttonLabel: "Shop Now",
  },
};
