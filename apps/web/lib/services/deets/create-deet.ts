import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";
import { createClient } from "@/lib/supabase/client";
import type { CreateDeetInput, DeetRecord } from "@/lib/services/deets/deet-types";
import { DEET_COLUMNS, normalizeDeetAttachment, normalizeDeetRecord } from "@/lib/services/deets/query-utils";

function isPersistableMediaRef(value?: string | null) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  return trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("/");
}

function sanitizePersistableMediaRefs(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter((value, index, array) => isPersistableMediaRef(value) && array.indexOf(value) === index);
}

export async function createDeet(input: CreateDeetInput): Promise<DeetRecord> {
  const supabase = createClient();
  const previewImageUrl = isPersistableMediaRef(input.previewImageUrl) ? input.previewImageUrl!.trim() : null;
  const previewImageUrls = sanitizePersistableMediaRefs(input.previewImageUrls);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to create a deet.");
  }

  const payload = {
    hub_id: input.hubId,
    author_name: input.authorName.trim(),
    title: input.title.trim(),
    body: sanitizeDeetBodyHtml(input.body),
    kind: input.kind,
    preview_image_url: previewImageUrl,
    preview_image_urls: previewImageUrls,
    attachments: (input.attachments ?? []).map((attachment) =>
      normalizeDeetAttachment({
        ...attachment,
        previews: sanitizePersistableMediaRefs(attachment.previews),
      })
    ),
    created_by: user.id,
  };

  const { data, error } = await supabase.from("deets").insert(payload).select(DEET_COLUMNS).single();

  if (error) {
    throw new Error(`Failed to create deet: ${error.message}`);
  }

  return normalizeDeetRecord(data as DeetRecord);
}
