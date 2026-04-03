import type { HubTemplateConfig } from "./types";

export const healthWellnessConfig: HubTemplateConfig = {
  template: "health_wellness",
  layout: "business",
  variants: ["Gym", "Yoga Studio", "Spa", "Wellness Center", "Clinic"],
  terminology: {
    hub: "Wellness Center",
    deets: "Updates",
    members: "Members",
    admin: "Owner / Instructor",
    about: "About Us",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "update", icon: "📢", description: "General announcement" },
    { type: "class", icon: "🧘", description: "Class or session" },
    { type: "deal", icon: "💰", description: "Membership deal or promo" },
    { type: "event", icon: "📅", description: "Workshop, retreat, event" },
    { type: "tip", icon: "💡", description: "Health or wellness tip" },
    { type: "alert", icon: "⚠️", description: "Closure, schedule change" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Classes & Schedule",
    "Our Story",
    "Gallery",
    "Location & Hours",
    "Pricing & Memberships",
  ],
  defaultCTAs: [
    { label: "Book a Class", actionType: "url", actionValue: "" },
    { label: "Call Us", actionType: "phone", actionValue: "" },
    { label: "Get Directions", actionType: "maps", actionValue: "" },
  ],
  keyFields: [
    "Type (Gym / Yoga / Spa / Clinic)",
    "Services offered (multi-select)",
    "Class schedule",
    "Pricing / membership tiers",
    "Hours of operation",
    "Certifications",
  ],
  memberRoles: [
    { role: "Owner", who: "Creator", permissions: "Everything" },
    { role: "Instructor", who: "Admin", permissions: "Post classes, manage schedule" },
    { role: "Member", who: "Member", permissions: "View, book classes, leave reviews" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["Services"],
    showRating: true,
    showButton: true,
    buttonLabel: "Book Now",
  },
};
