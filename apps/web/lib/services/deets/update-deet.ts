import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";
import { updateDeetApi } from "@/lib/api/deets";
import type { DeetAttachment, DeetKind, DeetRecord } from "@/lib/services/deets/deet-types";
import { normalizeDeetAttachment, normalizeDeetRecord } from "@/lib/services/deets/query-utils";

export interface UpdateDeetInput {
  id: string;
  title?: string;
  body?: string;
  kind?: DeetKind;
  previewImageUrl?: string | null;
  previewImageUrls?: string[];
  attachments?: DeetAttachment[];
  allowComments?: boolean;
  /** Set true to publish a draft; false to save as draft. */
  isPublished?: boolean;
}

function isPersistableMediaRef(value?: string | null) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("avatars/") ||
    trimmed.startsWith("hub-media/") ||
    trimmed.startsWith("deet-media/") ||
    trimmed.startsWith("chat-media/")
  );
}

function sanitizePersistableMediaRefs(values?: string[]) {
  return (values ?? []).map((v) => v.trim()).filter((v, i, a) => isPersistableMediaRef(v) && a.indexOf(v) === i);
}

/**
 * Updates an existing deet. The caller must be the deet's author or a hub admin.
 * The API enforces ownership / admin authorization.
 */
export async function updateDeet(input: UpdateDeetInput): Promise<DeetRecord> {
  // Build the update payload with only provided fields
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.body !== undefined) payload.body = sanitizeDeetBodyHtml(input.body);
  if (input.kind !== undefined) payload.kind = input.kind;

  if (input.previewImageUrl !== undefined) {
    payload.preview_image_url = isPersistableMediaRef(input.previewImageUrl)
      ? input.previewImageUrl!.trim()
      : null;
  }

  if (input.previewImageUrls !== undefined) {
    payload.preview_image_urls = sanitizePersistableMediaRefs(input.previewImageUrls);
  }

  if (input.attachments !== undefined) {
    payload.attachments = input.attachments.map((att) =>
      normalizeDeetAttachment({
        ...att,
        previews: sanitizePersistableMediaRefs(att.previews),
      })
    );
  }

  if (typeof input.allowComments === "boolean") {
    payload.allow_comments = input.allowComments;
  }

  if (typeof input.isPublished === "boolean") {
    payload.is_published = input.isPublished;
  }

  const apiPayload: Record<string, unknown> = { ...payload };
  if ("allow_comments" in apiPayload) {
    apiPayload.allowComments = apiPayload.allow_comments;
    delete apiPayload.allow_comments;
  }
  if ("is_published" in apiPayload) {
    apiPayload.isPublished = apiPayload.is_published;
    delete apiPayload.is_published;
  }
  if ("preview_image_url" in apiPayload) {
    apiPayload.previewImageUrl = apiPayload.preview_image_url;
    delete apiPayload.preview_image_url;
  }
  if ("preview_image_urls" in apiPayload) {
    apiPayload.previewImageUrls = apiPayload.preview_image_urls;
    delete apiPayload.preview_image_urls;
  }
  const updated = await updateDeetApi(input.id, apiPayload);
  return normalizeDeetRecord(updated as DeetRecord);
}
