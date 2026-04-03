import type { DeetAttachment, DeetRecord } from "@/lib/services/deets/deet-types";

export const DEET_COLUMNS = `
  id,
  hub_id,
  author_name,
  title,
  body,
  kind,
  preview_image_url,
  preview_image_urls,
  attachments,
  created_by,
  created_at,
  updated_at,
  like_count,
  comment_count,
  view_count
`;

function asImageString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "";
}

function uniqueImageStrings(values: unknown[]) {
  return values
    .map((value) => asImageString(value))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

export function normalizeDeetAttachment(attachment: DeetAttachment): DeetAttachment {
  const previews = Array.isArray(attachment.previews)
    ? uniqueImageStrings(attachment.previews)
    : uniqueImageStrings([
        attachment.previewUrl,
        attachment.image,
        attachment.imageUrl,
        attachment.url,
        attachment.src,
      ]);

  return {
    ...attachment,
    previews,
  };
}

export function getDeetPreviewImages(record: Partial<DeetRecord> & Record<string, unknown>) {
  const attachments = Array.isArray(record.attachments)
    ? (record.attachments as DeetAttachment[]).map((attachment) => normalizeDeetAttachment(attachment))
    : [];

  return uniqueImageStrings([
    record.preview_image_url,
    ...(Array.isArray(record.preview_image_urls) ? record.preview_image_urls : []),
    ...attachments.flatMap((attachment) => attachment.previews ?? []),
  ]);
}

export function normalizeDeetRecord(record: DeetRecord): DeetRecord {
  const attachments = Array.isArray(record.attachments)
    ? record.attachments.map((attachment) => normalizeDeetAttachment(attachment))
    : [];
  const previewImages = getDeetPreviewImages({
    ...record,
    attachments,
  });

  return {
    ...record,
    attachments,
    preview_image_url: previewImages[0] || null,
    preview_image_urls: previewImages,
  };
}
