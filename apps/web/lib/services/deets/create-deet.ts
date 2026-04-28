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

const DEET_COLUMNS_WITHOUT_ALLOW_COMMENTS = DEET_COLUMNS.split(",")
  .map((c) => c.trim())
  .filter((c) => c !== "allow_comments")
  .join(", ");

async function insertDeetPayload(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
): Promise<{ data: DeetRecord | null; error: { message: string } | null }> {
  let { data, error } = await supabase.from("deets").insert(payload).select(DEET_COLUMNS).single();

  if (error?.message.includes("allow_comments")) {
    const { allow_comments: _unused, ...payloadWithout } = payload as Record<string, unknown> & { allow_comments?: boolean };
    void _unused;
    const retry = await supabase.from("deets").insert(payloadWithout).select(DEET_COLUMNS_WITHOUT_ALLOW_COMMENTS).single();
    data = retry.data as typeof data;
    error = retry.error;
  }

  return { data: data as DeetRecord | null, error };
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

  const basePayload: Record<string, unknown> = {
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

  // Only include allow_comments when it was explicitly set. This lets the
  // DB default (true) win when the column exists, and lets the insert still
  // succeed when the column hasn't been migrated yet (we retry without it).
  if (typeof input.allowComments === "boolean") {
    basePayload.allow_comments = input.allowComments;
  }

  let { data, error } = await insertDeetPayload(supabase, basePayload);

  // Older DBs without 'Jobs' in deets_kind_check (apply migration
  // 20260421100009_expand_deets_kind_check_jobs): store bucket as Posts; the
  // structured `jobs` attachment still drives hub feed kind.
  if (error && basePayload.kind === "Jobs" && error.message.includes("deets_kind_check")) {
    const compat = { ...basePayload, kind: "Posts" };
    const retry = await insertDeetPayload(supabase, compat);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(`Failed to create deet: ${error.message}`);
  }

  return normalizeDeetRecord(data as DeetRecord);
}
