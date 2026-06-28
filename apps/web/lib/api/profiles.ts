import { apiFetch } from "@/lib/api/client";
import type { HubEventItem, HubNotificationItem } from "@/lib/hub-content";
import type { ProfileComment, ProfileLiker } from "@/lib/services/profile/profile-interactions";
import type { ProfileSummary } from "@/lib/services/profile/get-profile-summary";
import type { SearchedProfile } from "@/lib/services/profile/search-profiles";

export async function getProfileSummaryApi(userId: string): Promise<ProfileSummary | null> {
  const response = await apiFetch<{ summary: ProfileSummary | null }>(`/profiles/${encodeURIComponent(userId)}/summary`);
  return response.summary ?? null;
}

export async function searchProfilesApi(query: string, limit = 10): Promise<SearchedProfile[]> {
  const response = await apiFetch<{ profiles: SearchedProfile[] }>("/profiles/search", {
    query: { query, limit },
  });
  return response.profiles ?? [];
}

export async function toggleProfileLikeApi(profileId: string): Promise<{ liked: boolean; count: number } | null> {
  const response = await apiFetch<{ liked: boolean; count: number }>(
    `/profiles/${encodeURIComponent(profileId)}/likes/toggle`,
    { method: "POST" },
  );
  if (typeof response.liked !== "boolean" || typeof response.count !== "number") return null;
  return { liked: response.liked, count: response.count };
}

export async function listProfileLikersApi(profileId: string, limit = 100): Promise<ProfileLiker[]> {
  const response = await apiFetch<{ likers: ProfileLiker[] }>(`/profiles/${encodeURIComponent(profileId)}/likes`, {
    query: { limit },
  });
  return response.likers ?? [];
}

export async function listProfileCommentsApi(profileId: string, limit = 50): Promise<ProfileComment[]> {
  const response = await apiFetch<{ comments: ProfileComment[] }>(`/profiles/${encodeURIComponent(profileId)}/comments`, {
    query: { limit },
  });
  return response.comments ?? [];
}

export async function addProfileCommentApi(profileId: string, body: string): Promise<ProfileComment | null> {
  const response = await apiFetch<{ comment: ProfileComment | null }>(`/profiles/${encodeURIComponent(profileId)}/comments`, {
    method: "POST",
    body: { body },
  });
  return response.comment ?? null;
}

export async function deleteProfileCommentApi(commentId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/profiles/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
  return Boolean(response.ok);
}

export async function reportUserApi(
  profileId: string,
  reason: string,
  context?: string,
): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/profiles/${encodeURIComponent(profileId)}/reports`, {
    method: "POST",
    body: { reason, context },
  });
  return Boolean(response.ok);
}

export async function upsertMyProfileApi(input: {
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
}): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>("/profiles/me/upsert", {
    method: "POST",
    body: input,
  });
  return Boolean(response.ok);
}

export async function updateMyProfileApi(input: {
  fullName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  notificationPreferences?: Record<string, unknown> | null;
  privacySettings?: Record<string, unknown> | null;
}): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>("/profiles/me", {
    method: "PATCH",
    body: input,
  });
  return Boolean(response.ok);
}

export async function getMyProfileApi(): Promise<{
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  app_role?: string | null;
  notification_preferences?: Record<string, unknown> | null;
  privacy_settings?: Record<string, unknown> | null;
} | null> {
  const response = await apiFetch<{
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string | null;
      app_role?: string | null;
      notification_preferences?: Record<string, unknown> | null;
      privacy_settings?: Record<string, unknown> | null;
    } | null;
  }>("/profiles/me");
  return response.profile ?? null;
}

export type PreparedAvatarUpload = {
  bucket: string;
  storageKey: string;
  path: string;
  signedUploadUrl: string;
  publicUrl: string;
  token?: string | null;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
};

export async function prepareMyAvatarUploadApi(payload: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PreparedAvatarUpload> {
  return apiFetch("/profiles/me/avatar/prepare", {
    method: "POST",
    body: payload,
  });
}

export async function cancelMyHubJoinRequestApi(membershipId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/profiles/me/requests/${encodeURIComponent(membershipId)}`, {
    method: "DELETE",
  });
  return Boolean(response.ok);
}

export async function getMyHeaderFeedApi(): Promise<{
  notifications: HubNotificationItem[];
  events: HubEventItem[];
}> {
  return apiFetch<{ notifications: HubNotificationItem[]; events: HubEventItem[] }>("/profiles/me/header-feed");
}

export type BriefProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export async function listBriefProfilesApi(userIds: string[]): Promise<BriefProfile[]> {
  if (!userIds.length) return [];
  const response = await apiFetch<{ profiles: BriefProfile[] }>("/profiles/bulk", {
    query: { ids: userIds.join(",") },
  });
  return response.profiles ?? [];
}
