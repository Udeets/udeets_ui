import { apiFetch } from "@/lib/api/client";
import type { CreateHubInput, HubRecord, UpdateHubInput } from "@/lib/services/hubs/hub-types";

export async function listHubsFromApi(category?: string): Promise<HubRecord[]> {
  return apiFetch<HubRecord[]>("/hubs", {
    query: category ? { category } : undefined,
  });
}

export async function getHubBySlugFromApi(
  category: string,
  slug: string
): Promise<HubRecord | null> {
  return apiFetch<HubRecord>(`/hubs/by-slug/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`);
}

export type PreparedHubMediaUpload = {
  bucket: string;
  storageKey: string;
  path: string;
  signedUploadUrl: string;
  publicUrl: string;
  token?: string | null;
  kind: "dp" | "cover" | "gallery";
  mimeType: string;
  sizeBytes: number;
  fileName: string;
};

export async function prepareHubMediaUploadApi(payload: {
  hubId: string;
  kind: "dp" | "cover" | "gallery";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PreparedHubMediaUpload> {
  return apiFetch("/hubs/media/prepare", {
    method: "POST",
    body: payload,
  });
}

export async function createHubApi(payload: CreateHubInput): Promise<HubRecord> {
  return apiFetch<HubRecord>("/hubs", {
    method: "POST",
    body: {
      name: payload.name,
      slug: payload.slug,
      category: payload.category,
      visibility: payload.visibility ?? "public",
      tagline: payload.tagline ?? null,
      description: payload.description ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      country: payload.country ?? null,
      cover_image_url: payload.coverImageUrl ?? null,
      dp_image_url: payload.dpImageUrl ?? null,
      website_url: payload.websiteUrl ?? null,
    },
  });
}

export async function updateHubApi(hubId: string, payload: UpdateHubInput): Promise<HubRecord> {
  return apiFetch<HubRecord>(`/hubs/${encodeURIComponent(hubId)}`, {
    method: "PATCH",
    body: {
      name: payload.name ?? undefined,
      description: payload.description ?? undefined,
      category: payload.category ?? undefined,
      visibility: payload.visibility ?? undefined,
      city: payload.city ?? undefined,
      state: payload.state ?? undefined,
      country: payload.country ?? undefined,
      website_url: payload.websiteUrl ?? undefined,
      facebook_url: payload.facebookUrl ?? undefined,
      instagram_url: payload.instagramUrl ?? undefined,
      youtube_url: payload.youtubeUrl ?? undefined,
      phone_number: payload.phoneNumber ?? undefined,
      cover_image_url: payload.coverImageUrl ?? undefined,
      cover_image_offset_y: payload.coverImageOffsetY ?? undefined,
      dp_image_url: payload.dpImageUrl ?? undefined,
      dp_image_offset_y: payload.dpImageOffsetY ?? undefined,
      gallery_image_urls: payload.galleryImageUrls ?? undefined,
      accent_color: payload.accentColor ?? undefined,
    },
  });
}

export async function deleteHubApi(hubId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/hubs/${encodeURIComponent(hubId)}`, {
    method: "DELETE",
  });
  return Boolean(response.ok);
}

export async function inviteUserToHubApi(
  hubId: string,
  invitedUserId: string,
): Promise<"invited" | "already_member" | "already_invited" | "error"> {
  const response = await apiFetch<{ status: string }>(
    `/hubs/${encodeURIComponent(hubId)}/invites/users/${encodeURIComponent(invitedUserId)}`,
    { method: "POST" },
  );
  const status = response.status;
  if (status === "invited" || status === "already_member" || status === "already_invited") {
    return status;
  }
  return "error";
}

export type HubAttachment = {
  id: string;
  file_url: string | null;
  file_type: "image" | "file" | string;
  created_at?: string | null;
};

export async function listHubAttachmentsApi(hubId: string): Promise<HubAttachment[]> {
  const response = await apiFetch<{ attachments: HubAttachment[] }>(
    `/hubs/${encodeURIComponent(hubId)}/attachments`
  );
  return response.attachments ?? [];
}

export async function createHubAttachmentApi(
  hubId: string,
  payload: { file_url: string; file_type: "image" | "file"; source?: string }
): Promise<HubAttachment> {
  return apiFetch<HubAttachment>(`/hubs/${encodeURIComponent(hubId)}/attachments`, {
    method: "POST",
    body: payload,
  });
}

export async function listUnreadHubIdsApi(): Promise<string[]> {
  const response = await apiFetch<{ hub_ids: string[] }>("/hubs/unread");
  return response.hub_ids ?? [];
}

export async function markHubSeenApi(hubId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/hubs/${encodeURIComponent(hubId)}/seen`, {
    method: "POST",
  });
  return Boolean(response.ok);
}
