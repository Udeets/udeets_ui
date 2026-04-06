import type { HubTemplateConfig } from "./types";

export const sportsConfig: HubTemplateConfig = {
  template: "sports",
  layout: "community",
  variants: ["Sports League", "Gym / Fitness Club", "Running Club", "Rec Team"],
  terminology: {
    hub: "Team / Club",
    deets: "Posts",
    members: "Members",
    admin: "Coach / Admin",
    about: "About Us",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "update", icon: "📢", description: "Team announcement" },
    { type: "game", icon: "🏆", description: "Game or match update" },
    { type: "practice", icon: "🏃", description: "Practice schedule" },
    { type: "event", icon: "📅", description: "Team event or social" },
    { type: "alert", icon: "⚠️", description: "Cancellation, weather alert" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Schedule",
    "Roster",
    "Gallery",
    "Location & Facilities",
  ],
  defaultCTAs: [
    { label: "View Schedule", actionType: "url", actionValue: "" },
    { label: "Join Team", actionType: "url", actionValue: "" },
    { label: "Get Directions", actionType: "maps", actionValue: "" },
  ],
  keyFields: [
    "Sport type",
    "League / organization",
    "Season dates",
    "Practice schedule",
    "Home field / location",
    "Registration fee",
  ],
  memberRoles: [
    { role: "Coach", who: "Creator", permissions: "Everything" },
    { role: "Team Manager", who: "Admin", permissions: "Post, manage roster, schedule" },
    { role: "Player", who: "Member", permissions: "View, RSVP, post updates" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["Sport"],
    showRating: false,
    showButton: true,
    buttonLabel: "Join Team",
  },
};
