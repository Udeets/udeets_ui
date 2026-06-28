import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";
import { createDeetApi } from "@/lib/api/deets";
import type { CreateDeetInput, DeetRecord } from "@/lib/services/deets/deet-types";
import { normalizeDeetAttachment, normalizeDeetRecord } from "@/lib/services/deets/query-utils";

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
  return (values ?? []).map((value) => value.trim()).filter((value, index, array) => isPersistableMediaRef(value) && array.indexOf(value) === index);
}

export async function createDeet(input: CreateDeetInput): Promise<DeetRecord> {
  const previewImageUrl = isPersistableMediaRef(input.previewImageUrl) ? input.previewImageUrl!.trim() : null;
  const previewImageUrls = sanitizePersistableMediaRefs(input.previewImageUrls);
  const payload: CreateDeetInput = {
    hubId: input.hubId,
    authorName: input.authorName.trim(),
    title: input.title.trim(),
    body: sanitizeDeetBodyHtml(input.body),
    kind: input.kind,
    previewImageUrl: previewImageUrl ?? undefined,
    previewImageUrls,
    attachments: (input.attachments ?? []).map((attachment) =>
      normalizeDeetAttachment({
        ...attachment,
        previews: sanitizePersistableMediaRefs(attachment.previews),
      }),
    ),
    allowComments: input.allowComments,
    isPublished: input.isPublished === false ? false : true,
  };

  const created = await createDeetApi(payload);
  return normalizeDeetRecord(created as DeetRecord);
}
