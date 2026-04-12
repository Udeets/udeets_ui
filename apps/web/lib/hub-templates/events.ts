import type { HubTemplateConfig } from "./types";

export const eventsConfig: HubTemplateConfig = {
  template: "events",
  layout: "community",
  variants: ["Festival", "Conference", "Meetup", "Workshop", "Concert"],
  terminology: {
    hub: "Event",
    deets: "Posts",
    members: "Members",
    admin: "Organizer",
    about: "About",
  },
  tabs: ["About", "Posts", "Attachments", "Events", "Members"],
  postTypes: [
    { type: "update", icon: "📢", description: "Event announcement" },
    { type: "lineup", icon: "🎤", description: "Speaker or performer announcement" },
    { type: "logistics", icon: "🗺️", description: "Venue, parking, directions" },
    { type: "reminder", icon: "⏰", description: "Countdown or reminder" },
    { type: "alert", icon: "⚠️", description: "Schedule change, cancellation" },
  ],
  aboutSections: [
    "Hero Block",
    "Quick Info Strip",
    "Event Description",
    "Schedule / Lineup",
    "Venue & Directions",
    "Sponsors",
    "Gallery",
    "FAQ",
  ],
  defaultCTAs: [
    { label: "Get Tickets", actionType: "url", actionValue: "" },
    { label: "Get Directions", actionType: "maps", actionValue: "" },
    { label: "Contact Organizer", actionType: "email", actionValue: "" },
  ],
  keyFields: [
    "Event date and time",
    "Venue name and address",
    "Ticket price / free",
    "Capacity",
    "Dress code",
    "Age restriction",
  ],
  memberRoles: [
    { role: "Organizer", who: "Creator", permissions: "Everything" },
    { role: "Volunteer", who: "Admin", permissions: "Post updates, manage check-in" },
    { role: "Attendee", who: "Member", permissions: "View, RSVP, share" },
  ],
  discoverCard: {
    showCover: true,
    badges: ["Date", "Type"],
    showRating: false,
    showButton: true,
    buttonLabel: "Get Tickets",
  },
};
