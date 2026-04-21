import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";
import { createClient } from "@/lib/supabase/client";
import type { DeetAttachment, DeetKind, DeetRecord } from "@/lib/services/deets/deet-types";
import { DEET_COLUMNS, normalizeDeetAttachment, normalizeDeetRecord } from "@/lib/services/deets/query-utils";

export interface UpdateDeetInput {
  id: string;
  title?: string;
  body?: string;
  kind?: DeetKind;
  previewImageUrl?: string | null;
  previewImageUrls?: string[];
  attachments?: DeetAttachment[];
}

function isPersistableMediaRef(value?: string | null) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  return trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("/");
}

function sanitizePersistableMediaRefs(values?: string[]) {
  return (values ?? []).map((v) => v.trim()).filter((v, i, a) => isPersistableMediaRef(v) && a.indexOf(v) === i);
}

/**
 * Updates an existing deet. The caller must be the deet's author or a hub admin.
 * Supabase RLS policies enforce the ownership / admin check.
 */
export async function updateDeet(input: UpdateDeetInput): Promise<DeetRecord> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to update a post.");
  }

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

  const { data, error } = await supabase
    .from("deets")
    .update(payload)
    .eq("id", input.id)
    .select(DEET_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return normalizeDeetRecord(data as DeetRecord);
}
