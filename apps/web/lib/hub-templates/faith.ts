import type { HubTemplateConfig } from "./types";

export const faithConfig: HubTemplateConfig = {
  template: "faith",
  layout: "community",
  variants: ["Temple", "Church", "Mosque", "Synagogue", "Gurdwara", "Spiritual Center"],
  terminology: {
    hub: "Place of Worship",
    deets: "Announcements",
    members: "Congregation",
    admin: "Leader",
    about: "About Us",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "announcement", icon: "📢", description: "Official announcement" },
    { type: "event", icon: "📅", description: "Service, ceremony, or gathering" },
    { type: "prayer", icon: "🙏", description: "Prayer request or message" },
    { type: "volunteer", icon: "🤝", description: "Volunteer opportunity" },
    { type: "community_post", icon: "💬", description: "Community sharing" },
    { type: "alert", icon: "⚠️", description: "Urgent notice" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Service Times",
    "Our Mission",
    "Leadership",
    "Gallery",
    "Location & Directions",
    "Upcoming Events",
  ],
  defaultCTAs: [
    { label: "Service Times", actionType: "url", actionValue: "" },
    { label: "Get Directions", actionType: "maps", actionValue: "" },
    { label: "Contact Us", actionType: "phone", actionValue: "" },
  ],
  keyFields: [
    "Denomination / tradition",
    "Service times (weekly schedule)",
    "Address",
    "Languages spoken",
    "Parking info",
    "Accessibility info",
  ],
  memberRoles: [
    { role: "Leader", who: "Creator", permissions: "Everything" },
    { role: "Admin", who: "Admin", permissions: "Post, manage members, manage events" },
    { role: "Member", who: "Member", permissions: "View, RSVP, post community updates" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["Tradition"],
    showRating: false,
    showButton: true,
    buttonLabel: "Visit",
  },
};
