import { HUBS, type HubRecord } from "@/lib/hubs";
import { UDEETS_LOGO_SRC } from "@/lib/branding";

export type HubFeedItemKind = "announcement" | "photo" | "notice" | "event" | "file";
export type HubEventTheme =
  | "Pooja"
  | "Temple"
  | "Church"
  | "Food"
  | "Service"
  | "Party"
  | "Trek"
  | "Voluntary"
  | "Cultural"
  | "Kids"
  | "Sports"
  | "Community";

export type HubFeedItem = {
  id: string;
  kind: HubFeedItemKind;
  author: string;
  time: string;
  title: string;
  body: string;
  image?: string;
  likes: number;
  comments: number;
  views: number;
};

export type HubEventItem = {
  id: string;
  title: string;
  hub: string;
  hubImage?: string;
  category: HubRecord["category"];
  slug: string;
  dateLabel: string;
  time: string;
  location: string;
  badge: string;
  theme: HubEventTheme;
  description: string;
  focusId: string;
  href: string;
  group: "Today" | "Tomorrow" | "This Week";
};

export type HubNotificationItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  hub: string;
  hubImage?: string;
  type: "Tagged" | "New Posts" | "Activity";
  category: HubRecord["category"];
  slug: string;
  focusId: string;
  href: string;
};

export type HubContent = {
  hubId: string;
  feed: HubFeedItem[];
  events: HubEventItem[];
  notifications: HubNotificationItem[];
};

function hrefFor(hub: HubRecord, focusId: string) {
  return `/hubs/${hub.category}/${hub.slug}?focus=${focusId}`;
}

function hubTabHrefFor(hub: HubRecord, tab: "Posts" | "Events", focusId: string) {
  return `/hubs/${hub.category}/${hub.slug}?tab=${tab}&focus=${focusId}`;
}

function fallbackImage(hub: HubRecord, index = 0) {
  return (
    hub.dpImage ||
    hub.feedImages?.[index] ||
    hub.galleryImages?.[index] ||
    hub.heroImage ||
    UDEETS_LOGO_SRC
  );
}

function themeForHub(hub: HubRecord): HubEventItem["theme"] {
  if (hub.category === "religious-places" && hub.name.toLowerCase().includes("catholic")) {
    return "Church";
  }
  if (hub.category === "religious-places") return "Temple";
  if (hub.category === "restaurants") return "Food";
  if (hub.category === "fitness") return "Sports";
  if (hub.category === "pet-clubs") return "Community";
  if (hub.category === "hoa") return "Community";
  return "Cultural";
}

function badgeForHub(hub: HubRecord) {
  if (hub.category === "communities") return "My Hubs";
  if (hub.category === "restaurants") return "Saved";
  if (hub.category === "religious-places") return "Temple";
  if (hub.category === "fitness") return "Sports";
  if (hub.category === "hoa") return "Community";
  return "Saved";
}

function eventLocation(hub: HubRecord) {
  if (hub.category === "fitness") return "Studio Zone B";
  if (hub.category === "restaurants") return "Main Dining Room";
  if (hub.category === "hoa") return "Clubhouse Lawn";
  if (hub.category === "pet-clubs") return "Training Ground";
  return `${hub.locationLabel}`;
}

function buildContentForHub(hub: HubRecord): HubContent {
  const announcementId = `${hub.id}-announcement`;
  const photoId = `${hub.id}-photo`;
  const noticeId = `${hub.id}-notice`;
  const eventPostOneId = `${hub.id}-event-post-1`;
  const eventPostTwoId = `${hub.id}-event-post-2`;
  const eventPostThreeId = `${hub.id}-event-post-3`;

  const primaryTheme = themeForHub(hub);
  const primaryBadge = badgeForHub(hub);

  const feed: HubFeedItem[] = [
    {
      id: announcementId,
      kind: "announcement",
      author: `${hub.name} Admin`,
      time: "10m ago",
      title: "Important announcement",
      body: `A fresh update has been shared for ${hub.name}. Please check today’s notes before planning your visit or participation.`,
      likes: 28,
      comments: 7,
      views: 198,
    },
    {
      id: photoId,
      kind: "photo",
      author: `${hub.name} Team`,
      time: "1h ago",
      title: "Photo highlights",
      body: `New photos from the latest ${hub.name.toLowerCase()} gathering are now available for members and followers.`,
      image: fallbackImage(hub, 1),
      likes: 45,
      comments: 14,
      views: 322,
    },
    {
      id: noticeId,
      kind: "notice",
      author: "Community Moderator",
      time: "3h ago",
      title: "Notice for visitors",
      body: "Parking, arrival flow, and check-in guidance have been updated for the next scheduled activity.",
      likes: 19,
      comments: 5,
      views: 174,
    },
    {
      id: eventPostOneId,
      kind: "event",
      author: `${hub.name} Events`,
      time: "Today",
      title: `${hub.name} featured event`,
      body: "Event details, timing, and participation notes have been posted here so everyone has one clear source of truth.",
      image: fallbackImage(hub, 2),
      likes: 31,
      comments: 10,
      views: 246,
    },
    {
      id: eventPostTwoId,
      kind: "file",
      author: `${hub.name} Ops`,
      time: "Yesterday",
      title: "Schedule and attachments",
      body: "Updated schedules, logistics notes, and supporting files are now attached for quick reference.",
      likes: 14,
      comments: 4,
      views: 129,
    },
    {
      id: eventPostThreeId,
      kind: "event",
      author: `${hub.name} Community`,
      time: "Tomorrow",
      title: "Member check-in thread",
      body: "Use this thread for RSVP confirmations, guest notes, and quick coordination ahead of the next event block.",
      likes: 22,
      comments: 11,
      views: 163,
    },
  ];

  const events: HubEventItem[] = [
    {
      id: `${hub.id}-event-1`,
      title: `${hub.name} community meetup`,
      hub: hub.name,
      hubImage: fallbackImage(hub, 0),
      category: hub.category,
      slug: hub.slug,
      dateLabel: "Today",
      time: "6:30 PM",
      location: eventLocation(hub),
      badge: primaryBadge,
      theme: primaryTheme,
      description: `Join the latest ${hub.name} gathering with updates, volunteer coordination, and community connection.`,
      focusId: eventPostOneId,
      href: hubTabHrefFor(hub, "Events", `${hub.id}-event-1`),
      group: "Today",
    },
    {
      id: `${hub.id}-event-2`,
      title: `${hub.name} weekend session`,
      hub: hub.name,
      hubImage: fallbackImage(hub, 0),
      category: hub.category,
      slug: hub.slug,
      dateLabel: "This Week",
      time: "Saturday, 10:00 AM",
      location: eventLocation(hub),
      badge: primaryBadge === "Saved" ? "My Hubs" : primaryBadge,
      theme: primaryTheme === "Temple" ? "Pooja" : primaryTheme,
      description: `A follow-up session for members, families, and attendees with practical details in the feed.`,
      focusId: eventPostTwoId,
      href: hubTabHrefFor(hub, "Events", `${hub.id}-event-2`),
      group: "This Week",
    },
    {
      id: `${hub.id}-event-3`,
      title: `${hub.name} family spotlight`,
      hub: hub.name,
      hubImage: fallbackImage(hub, 0),
      category: hub.category,
      slug: hub.slug,
      dateLabel: "Tomorrow",
      time: "5:45 PM",
      location: eventLocation(hub),
      badge: primaryBadge,
      theme: primaryTheme === "Church" ? "Community" : primaryTheme,
      description: "A lighter community session with family updates, volunteer reminders, and member highlights.",
      focusId: eventPostThreeId,
      href: hubTabHrefFor(hub, "Events", `${hub.id}-event-3`),
      group: "Tomorrow",
    },
  ];

  const notifications: HubNotificationItem[] = [
    {
      id: `${hub.id}-notification-1`,
      title: `${hub.name} tagged you in an update`,
      body: "A moderator highlighted a new planning note and wants you to review the latest details.",
      meta: "5m ago",
      hub: hub.name,
      hubImage: fallbackImage(hub, 0),
      type: "Tagged",
      category: hub.category,
      slug: hub.slug,
      focusId: announcementId,
      href: hubTabHrefFor(hub, "Posts", announcementId),
    },
    {
      id: `${hub.id}-notification-2`,
      title: `New photo post from ${hub.name}`,
      body: "Fresh visual highlights were shared in the main Deets feed.",
      meta: "32m ago",
      hub: hub.name,
      hubImage: fallbackImage(hub, 0),
      type: "New Posts",
      category: hub.category,
      slug: hub.slug,
      focusId: photoId,
      href: hubTabHrefFor(hub, "Posts", photoId),
    },
    {
      id: `${hub.id}-notification-3`,
      title: `${hub.name} posted a notice`,
      body: "Operational updates and visitor guidance are now live in the hub feed.",
      meta: "1h ago",
      hub: hub.name,
      hubImage: fallbackImage(hub, 0),
      type: "Activity",
      category: hub.category,
      slug: hub.slug,
      focusId: noticeId,
      href: hubTabHrefFor(hub, "Posts", noticeId),
    },
  ];

  return {
    hubId: hub.id,
    feed,
    events,
    notifications,
  };
}

export const HUB_CONTENT_BY_ID = Object.fromEntries(
  HUBS.map((hub) => [hub.id, buildContentForHub(hub)])
) as Record<string, HubContent>;

export function getHubContent(hubId: string): HubContent {
  return (
    HUB_CONTENT_BY_ID[hubId] ?? {
      hubId,
      feed: [],
      events: [],
      notifications: [],
    }
  );
}

export const HOME_NOTIFICATIONS = HUBS.flatMap((hub) => HUB_CONTENT_BY_ID[hub.id]?.notifications ?? []);
export const HOME_EVENTS = HUBS.flatMap((hub) => HUB_CONTENT_BY_ID[hub.id]?.events ?? []);
