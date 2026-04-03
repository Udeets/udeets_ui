import type { HubCategorySlug } from "@/lib/hubs";

export type HubFeedItemKind = "announcement" | "photo" | "notice" | "event" | "file" | "news" | "deal" | "hazard" | "alert";
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
  authorId: string;
  role?: "creator" | "admin" | "member";
  time: string;
  title: string;
  body: string;
  image?: string;
  images?: string[];
  likes: number;
  comments: number;
  views: number;
};

export type HubEventItem = {
  id: string;
  title: string;
  hub: string;
  hubImage?: string;
  category: HubCategorySlug;
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
  category: HubCategorySlug;
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

export const HOME_NOTIFICATIONS: HubNotificationItem[] = [];
export const HOME_EVENTS: HubEventItem[] = [];
