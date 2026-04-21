export const DEET_TYPES = [
  "update",
  "announcement",
  "alert",
  "event",
  "poll",
  "survey",
  "todo",
  "media",
  "payment",
  "location",
] as const;
export type DeetType = (typeof DEET_TYPES)[number];

export const DEET_VISIBILITIES = [
  "hub_default",
  "admins_only",
  "members_only",
  "everyone_with_access",
] as const;
export type DeetVisibility = (typeof DEET_VISIBILITIES)[number];

export interface DeetAttachmentRef {
  id?: string;
  kind?: string;
  name?: string | null;
  url: string;
  previewUrl?: string | null;
  mimeType?: string | null;
}

export interface EventDeetPayload {
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
}

export interface PollDeetPayload {
  options?: string[];
  multiple?: boolean;
}

export interface TodoDeetPayload {
  items?: Array<{ id: string; label: string; completed?: boolean }>;
}

export interface PaymentDeetPayload {
  amount?: number | null;
  currency?: string | null;
  dueDate?: string | null;
  paymentUrl?: string | null;
}

export interface LocationDeetPayload {
  label?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BaseDeet {
  id: string;
  hubId: string;
  authorId: string;
  type: DeetType;
  title?: string | null;
  body?: string | null;
  payload?: Record<string, unknown> | null;
  attachments?: DeetAttachmentRef[] | null;
  visibility?: DeetVisibility | null;
  allowComments?: boolean | null;
  allowReactions?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type Deet = BaseDeet;

export type DeetKind = "Posts" | "Notices" | "Photos" | "News" | "Deals" | "Hazards" | "Alerts" | "Jobs";

export interface DeetAttachment {
  id?: string;
  kind?: string;
  name?: string | null;
  url?: string;
  previewUrl?: string | null;
  mimeType?: string | null;
  type: string;
  title: string;
  detail?: string;
  meta?: string;
  options?: string[];
  previews?: string[];
  storagePaths?: string[];
  image?: string;
  imageUrl?: string;
  src?: string;
  eventData?: { date?: string | null; time?: string | null; location?: string | null };
  pollSettings?: Record<string, unknown>;
  jobData?: Record<string, unknown>;
}

export interface DeetRecord {
  id: string;
  hub_id: string;
  author_name: string;
  title: string;
  body: string;
  kind: DeetKind;
  preview_image_url: string | null;
  preview_image_urls: string[] | null;
  attachments: DeetAttachment[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  share_count?: number;
}

export interface CreateDeetInput {
  hubId: string;
  authorName: string;
  title: string;
  body: string;
  kind: DeetKind;
  previewImageUrl?: string;
  previewImageUrls?: string[];
  attachments?: DeetAttachment[];
}
