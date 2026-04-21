import type { HubCategorySlug } from "@/lib/hubs";

export type HubFeedItemKind =
  | "announcement"
  | "photo"
  | "notice"
  | "event"
  | "poll"
  | "file"
  | "news"
  | "deal"
  | "hazard"
  | "alert"
  | "jobs"
  | "survey"
  | "payment"
  | "post";
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

/** Persisted with poll attachments — voting UI / composer hydrate. */
export type HubPollSettingsPersisted = {
  allowAnyoneToAdd?: boolean;
  allowMultiSelect?: boolean;
  multiSelectLimit?: number | null;
  allowSecretVoting?: boolean;
  deadline?: string | null;
  showResults?: string;
  sortBy?: string;
};

/** Persisted with job attachments — composer hydrate. */
export type HubJobDataPersisted = {
  jobTitle?: string;
  rolesAndResponsibilities?: string;
  pay?: string;
  kind?: string;
  timings?: string;
  daysPerWeek?: string;
};

export type HubFeedItemAttachment = {
  type: string;
  title?: string;
  detail?: string;
  meta?: string;
  options?: string[];
  previews?: string[];
  /** Present on `event` attachments when stored on the deet record */
  eventData?: { date?: string | null; time?: string | null; location?: string | null };
  /** Present on `poll` attachments when stored on the deet record */
  pollSettings?: HubPollSettingsPersisted;
  /** Present on `jobs` attachments when stored on the deet record */
  jobData?: HubJobDataPersisted;
};

export type HubFeedItem = {
  id: string;
  kind: HubFeedItemKind;
  author: string;
  authorId: string;
  authorAvatar?: string;
  role?: "creator" | "admin" | "member";
  /** UTC ms from `created_at` — used to sort Newest vs Oldest in the hub feed. */
  createdAtMs?: number;
  time: string;
  title: string;
  body: string;
  image?: string;
  images?: string[];
  likes: number;
  comments: number;
  views: number;
  shares: number;
  deetAttachments?: HubFeedItemAttachment[];
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
