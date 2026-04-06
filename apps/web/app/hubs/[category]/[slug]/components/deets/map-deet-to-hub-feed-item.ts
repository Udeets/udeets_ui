import type { HubContent, HubFeedItemAttachment, HubFeedItemKind } from "@/lib/hub-content";
import { mapDeetToDashboardCard } from "@/lib/mappers/deets/map-deet-to-dashboard-card";
import type { DeetRecord } from "@/lib/services/deets/deet-types";

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

export function mapDeetToHubFeedItem(item: Partial<DeetRecord>, hubCreatorId?: string): HubContent["feed"][number] {
  const card = mapDeetToDashboardCard(item);
  const kind = resolveHubFeedItemKind(card);
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
        .filter((a) => a && typeof a === "object" && a.type)
        .map((a) => ({
          type: a.type,
          title: a.title || undefined,
          detail: a.detail || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options: Array.isArray((a as any).options)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? ((a as any).options as string[])
            : undefined,
          previews: a.previews || undefined,
        }))
    : [];

  return {
    id: item.id ?? "",
    kind,
    author: asNonEmptyString(item.author_name) ?? "Hub member",
    authorId: item.created_by ?? "",
    role,
    time: formatDeetTime(card.createdAt ?? item.created_at),
    title: asNonEmptyString(item.title) ?? defaultFeedLabel(kind),
    body: asNonEmptyString(item.body) ?? "",
    image,
    images,
    likes: item.like_count ?? 0,
    comments: item.comment_count ?? 0,
    views: item.view_count ?? 0,
    deetAttachments: deetAttachments.length > 0 ? deetAttachments : undefined,
  };
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function resolveHubFeedItemKind(card: ReturnType<typeof mapDeetToDashboardCard>): HubFeedItemKind {
  const hasImage = Boolean(card.previewImageUrl ?? card.previewImageUrls?.[0]);

  if (card.sourceType === "alert") return "notice";
  if (card.sourceType === "event") return "event";
  if (card.type === "Notices" || card.isNoticeLike) return "notice";
  if (card.type === "Photos" || card.isMediaLike) return "photo";
  if (card.attachmentCount > 0 && !hasImage) return "file";
  return "announcement";
}

function defaultFeedLabel(kind: HubFeedItemKind) {
  if (kind === "notice") return "Notice";
  if (kind === "photo") return "Photo";
  if (kind === "event") return "Event";
  if (kind === "file") return "File";
  return "Deet";
}
