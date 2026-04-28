import type {
  HubContent,
  HubFeedDeetOptions,
  HubFeedItemAttachment,
  HubFeedItemKind,
  HubJobDataPersisted,
  HubPollSettingsPersisted,
} from "@/lib/hub-content";
import { mapDeetToDashboardCard } from "@/lib/mappers/deets/map-deet-to-dashboard-card";
import { normalizePollSettings } from "@/lib/deets/normalize-poll-settings";
import type { DeetAttachment, DeetRecord } from "@/lib/services/deets/deet-types";

function formatDeetTime(createdAt?: string | null) {
  if (!createdAt) return "";

  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return createdAt;
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(createdAt).toLocaleDateString();
}

const LOCAL_FEED_TAGS = new Set(["news", "hazard", "deal", "jobs"]);
const DEET_AUDIENCES = new Set(["hub_default", "admins_only", "members_only", "everyone_with_access"]);

function parseDeetOptionsMeta(attachments: unknown[] | undefined): HubFeedDeetOptions | undefined {
  if (!Array.isArray(attachments)) return undefined;
  const raw = attachments.find(
    (a) => a && typeof a === "object" && (a as DeetAttachment).type === "deet_options",
  ) as DeetAttachment | undefined;
  const metaStr = typeof raw?.meta === "string" ? raw.meta.trim() : "";
  if (!metaStr) return undefined;
  try {
    const m = JSON.parse(metaStr) as Record<string, unknown>;
    const out: HubFeedDeetOptions = {};
    if (typeof m.commentsEnabled === "boolean") out.commentsEnabled = m.commentsEnabled;
    if (typeof m.reactionsEnabled === "boolean") out.reactionsEnabled = m.reactionsEnabled;
    if (typeof m.pinToTop === "boolean") out.pinToTop = m.pinToTop;
    if (m.publishTiming === "now" || m.publishTiming === "scheduled") out.publishTiming = m.publishTiming;
    if (typeof m.scheduledAt === "string") out.scheduledAt = m.scheduledAt;
    if (typeof m.audience === "string" && DEET_AUDIENCES.has(m.audience)) {
      out.audience = m.audience as HubFeedDeetOptions["audience"];
    }
    if (m.localFeedTag === null) out.localFeedTag = null;
    else if (typeof m.localFeedTag === "string" && LOCAL_FEED_TAGS.has(m.localFeedTag)) {
      out.localFeedTag = m.localFeedTag as HubFeedDeetOptions["localFeedTag"];
    }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

export function mapDeetToHubFeedItem(item: Partial<DeetRecord>, hubCreatorId?: string): HubContent["feed"][number] {
  const card = mapDeetToDashboardCard(item);
  const kind = resolveHubFeedItemKind(card, item);
  const images = card.previewImageUrls?.length ? card.previewImageUrls : undefined;
  const image = card.previewImageUrl ?? images?.[0] ?? undefined;

  // Determine role based on author ID vs hub creator
  let role: "creator" | "admin" | "member" | undefined = undefined;
  if (item.created_by && hubCreatorId && item.created_by === hubCreatorId) {
    role = "creator";
  }

  // Extract structured attachment data for rich rendering
  const deetAttachments: HubFeedItemAttachment[] = Array.isArray(item.attachments)
    ? item.attachments
        .filter((a) => a && typeof a === "object" && a.type && a.type !== "deet_options")
        .map((a) => {
          const raw = a as DeetAttachment;
          const base: HubFeedItemAttachment = {
            type: a.type,
            title: a.title || undefined,
            detail: a.detail || undefined,
            options: Array.isArray(raw.options) ? (raw.options as string[]) : undefined,
            previews: a.previews || undefined,
            meta: typeof raw.meta === "string" && raw.meta.trim() ? raw.meta : undefined,
            eventData:
              a.type === "event" && raw.eventData && typeof raw.eventData === "object"
                ? (raw.eventData as HubFeedItemAttachment["eventData"])
                : undefined,
          };
          if (a.type === "poll" && raw.pollSettings && typeof raw.pollSettings === "object") {
            base.pollSettings = normalizePollSettings(raw.pollSettings) ?? (raw.pollSettings as HubPollSettingsPersisted);
          }
          if (a.type === "jobs" && raw.jobData && typeof raw.jobData === "object") {
            base.jobData = raw.jobData as HubJobDataPersisted;
          }
          return base;
        })
    : [];

  const createdRaw = card.createdAt ?? item.created_at;
  const createdMs = createdRaw ? new Date(createdRaw).getTime() : NaN;
  const deetOptions = parseDeetOptionsMeta(item.attachments as unknown[] | undefined);

  return {
    id: item.id ?? "",
    kind,
    author: asNonEmptyString(item.author_name) ?? "Hub member",
    authorId: item.created_by ?? "",
    role,
    createdAtMs: Number.isFinite(createdMs) ? createdMs : undefined,
    time: formatDeetTime(card.createdAt ?? item.created_at),
    title: asNonEmptyString(item.title) ?? defaultFeedLabel(kind),
    body: asNonEmptyString(item.body) ?? "",
    image,
    images,
    likes: item.like_count ?? 0,
    comments: item.comment_count ?? 0,
    views: item.view_count ?? 0,
    shares: item.share_count ?? 0,
    deetAttachments: deetAttachments.length > 0 ? deetAttachments : undefined,
    deetOptions,
  };
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

/** Shared by hub feed and dashboard so `resolveDeetType` / chips match the same rules. */
export function resolveHubFeedItemKind(
  card: ReturnType<typeof mapDeetToDashboardCard>,
  item?: Partial<DeetRecord>,
): HubFeedItemKind {
  const hasImage = Boolean(card.previewImageUrl ?? card.previewImageUrls?.[0]);

  // Check attachments for specific types (poll, event, jobs, etc.)
  if (Array.isArray(item?.attachments)) {
    const attTypes = item.attachments.map((a) => a?.type).filter(Boolean);
    if (attTypes.includes("jobs")) return "jobs";
    if (attTypes.includes("poll")) return "poll";
    // Structured hub post types (stored on legacy "Posts" rows) — must win over bucket heuristics.
    if (attTypes.includes("announcement")) return "announcement";
    if (attTypes.includes("notice")) return "notice";
    if (attTypes.includes("event")) return "event";
    if (attTypes.includes("survey")) return "survey";
    if (attTypes.includes("payment")) return "payment";
    // Composer `alert` attachment (distinct from legacy sourceType === "alert" → notice below).
    if (attTypes.includes("alert")) return "alert";
  }

  // Notice: only alert sourceType or explicit "Notices" bucket
  if (card.sourceType === "alert") return "notice";
  if (card.type === "Notices") return "notice";
  // Announcement: explicit announcement sourceType
  if (card.sourceType === "announcement") return "announcement";
  if (card.sourceType === "event") return "event";
  if (card.sourceType === "poll") return "poll";
  if (card.type === "Photos" || card.isMediaLike) return "photo";
  if (card.attachmentCount > 0 && !hasImage) return "file";
  return "post";
}

function defaultFeedLabel(kind: HubFeedItemKind) {
  if (kind === "notice") return "Notice";
  if (kind === "photo") return "Photo";
  if (kind === "event") return "Event";
  if (kind === "poll") return "Poll";
  if (kind === "jobs") return "Jobs";
  if (kind === "survey") return "Survey";
  if (kind === "payment") return "Fundraiser";
  if (kind === "alert") return "Alert";
  if (kind === "file") return "File";
  if (kind === "post") return "Deet";
  return "Deet";
}
