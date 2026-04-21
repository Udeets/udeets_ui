import type { DeetKind, DeetType } from "@/lib/services/deets/deet-types";
import { mapDeetTypeToLegacyBucket, mapLegacyDeetKindToDeetType } from "@/lib/mappers/deets/map-legacy-deet-kind";

export interface DashboardDeetCardSource {
  id?: string | null;
  hubId?: string | null;
  hub_id?: string | null;
  authorId?: string | null;
  created_by?: string | null;
  type?: DeetType | string | null;
  kind?: DeetKind | string | null;
  title?: string | null;
  body?: string | null;
  attachments?: Array<{
    id?: string | null;
    kind?: string | null;
    name?: string | null;
    url?: string | null;
    previewUrl?: string | null;
    mimeType?: string | null;
    previews?: string[] | null;
    image?: string | null;
    imageUrl?: string | null;
    src?: string | null;
  }> | null;
  previewImageUrl?: string | null;
  preview_image_url?: string | null;
  previewImageUrls?: string[] | null;
  preview_image_urls?: string[] | null;
  createdAt?: string | null;
  created_at?: string | null;
}

export interface DashboardDeetCard {
  id: string;
  hubId: string;
  authorId?: string | null;
  type: DeetKind;
  sourceType: DeetType;
  title?: string | null;
  body?: string | null;
  previewImageUrl?: string | null;
  previewImageUrls: string[];
  attachmentCount: number;
  createdAt?: string | null;
  isNoticeLike: boolean;
  isMediaLike: boolean;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}

function attachmentPreviewUrls(attachments: DashboardDeetCardSource["attachments"]) {
  if (!Array.isArray(attachments)) return [];

  return attachments.flatMap((attachment) =>
    uniqueStrings([
      asNonEmptyString(attachment.previewUrl),
      ...(Array.isArray(attachment.previews) ? attachment.previews.map((value) => asNonEmptyString(value)) : []),
      asNonEmptyString(attachment.image),
      asNonEmptyString(attachment.imageUrl),
      asNonEmptyString(attachment.url),
      asNonEmptyString(attachment.src),
    ])
  );
}

function resolveSourceType(deet: DashboardDeetCardSource): DeetType {
  const directType = asNonEmptyString(deet.type);
  if (directType) {
    return ([
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
    ] as const).includes(directType as DeetType)
      ? (directType as DeetType)
      : mapLegacyDeetKindToDeetType(directType);
  }

  return mapLegacyDeetKindToDeetType(deet.kind);
}

export function mapDeetToDashboardCard(deet: DashboardDeetCardSource): DashboardDeetCard {
  const sourceType = resolveSourceType(deet);
  const previewImageUrls = uniqueStrings([
    asNonEmptyString(deet.previewImageUrl),
    asNonEmptyString(deet.preview_image_url),
    ...(Array.isArray(deet.previewImageUrls) ? deet.previewImageUrls.map((value) => asNonEmptyString(value)) : []),
    ...(Array.isArray(deet.preview_image_urls) ? deet.preview_image_urls.map((value) => asNonEmptyString(value)) : []),
    ...attachmentPreviewUrls(deet.attachments),
  ]);

  return {
    id: asNonEmptyString(deet.id) ?? "",
    hubId: asNonEmptyString(deet.hubId) ?? asNonEmptyString(deet.hub_id) ?? "",
    authorId: asNonEmptyString(deet.authorId) ?? asNonEmptyString(deet.created_by),
    type: mapDeetTypeToLegacyBucket(sourceType),
    sourceType,
    title: asNonEmptyString(deet.title),
    body: asNonEmptyString(deet.body),
    previewImageUrl: previewImageUrls[0] ?? null,
    previewImageUrls,
    attachmentCount: Array.isArray(deet.attachments)
      ? deet.attachments.filter((a) => {
          const t = a && typeof a === "object" ? (a as { type?: string }).type : undefined;
          return t && t !== "deet_options";
        }).length
      : 0,
    createdAt: asNonEmptyString(deet.createdAt) ?? asNonEmptyString(deet.created_at),
    isNoticeLike: sourceType === "announcement" || sourceType === "alert",
    isMediaLike: sourceType === "media",
  };
}
