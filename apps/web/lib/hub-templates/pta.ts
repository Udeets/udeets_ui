import type { HubTemplateConfig } from "./types";

export const ptaConfig: HubTemplateConfig = {
  template: "pta",
  layout: "community",
  variants: ["PTA", "PTO", "Booster Club", "School Group"],
  terminology: {
    hub: "School Group",
    deets: "Updates",
    members: "Parents & Staff",
    admin: "Board Member",
    about: "About Us",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "notice", icon: "📢", description: "Official PTA announcement" },
    { type: "event", icon: "📅", description: "School event or meeting" },
    { type: "volunteer", icon: "🤝", description: "Volunteer call" },
    { type: "fundraiser", icon: "💰", description: "Fundraising campaign" },
    { type: "poll", icon: "🗳️", description: "Parent vote or survey" },
    { type: "alert", icon: "⚠️", description: "Urgent school notice" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Board Members",
    "School Calendar",
    "Upcoming Events",
    "Documents",
    "Location",
  ],
  defaultCTAs: [
    { label: "Volunteer", actionType: "url", actionValue: "" },
    { label: "Donate", actionType: "url", actionValue: "" },
    { label: "Contact Board", actionType: "email", actionValue: "" },
  ],
  keyFields: [
    "School name",
    "Grade levels served",
    "Meeting schedule",
    "Annual dues amount",
    "Board members",
  ],
  memberRoles: [
    { role: "Board Member", who: "Admin", permissions: "All — post, manage, upload docs" },
    { role: "Teacher/Staff", who: "Special admin", permissions: "Post updates, create events" },
    { role: "Parent", who: "Member", permissions: "View, RSVP, vote in polls" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["School"],
    showRating: false,
    showButton: true,
    buttonLabel: "Join",
  },
};
