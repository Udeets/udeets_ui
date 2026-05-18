import { apiFetch } from "@/lib/api/client";
import type {
  DeetComment,
  DeetLikeStatusEntry,
  DeetReactor,
  DeetViewer,
} from "@/lib/services/deets/deet-interactions";

export async function toggleDeetLikeApi(
  deetId: string,
  reactionType = "like",
): Promise<{ liked: boolean; likeCount: number; myReactionType: string | null }> {
  return apiFetch(`/deets/${encodeURIComponent(deetId)}/likes/toggle`, {
    method: "POST",
    body: { reactionType },
  });
}

export async function getDeetLikeStatusApi(
  deetIds: string[],
): Promise<Record<string, DeetLikeStatusEntry>> {
  if (!deetIds.length) return {};
  const response = await apiFetch<{ statusByDeetId: Record<string, DeetLikeStatusEntry> }>(
    "/deets/likes/status",
    { query: { ids: deetIds.join(",") } },
  );
  return response.statusByDeetId ?? {};
}

export async function addDeetCommentApi(
  deetId: string,
  body: string,
  parentId?: string,
  attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string },
): Promise<DeetComment> {
  const response = await apiFetch<{ comment: DeetComment }>(`/deets/${encodeURIComponent(deetId)}/comments`, {
    method: "POST",
    body: {
      body,
      parentId: parentId ?? null,
      imageUrl: attachments?.imageUrl,
      attachmentUrl: attachments?.attachmentUrl,
      attachmentName: attachments?.attachmentName,
    },
  });
  return response.comment;
}

export async function listDeetCommentsApi(deetId: string): Promise<DeetComment[]> {
  const response = await apiFetch<{ comments: DeetComment[] }>(
    `/deets/${encodeURIComponent(deetId)}/comments`,
  );
  return response.comments ?? [];
}

export async function editDeetCommentApi(commentId: string, body: string): Promise<void> {
  await apiFetch(`/deets/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: { body },
  });
}

export async function deleteDeetCommentApi(commentId: string, deetId: string): Promise<void> {
  await apiFetch(`/deets/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    query: { deetId },
  });
}

export async function listDeetReactorsApi(deetId: string): Promise<DeetReactor[]> {
  const response = await apiFetch<{ reactors: DeetReactor[] }>(
    `/deets/${encodeURIComponent(deetId)}/reactors`,
  );
  return response.reactors ?? [];
}

export async function getDeetReactorPreviewsApi(
  deetIds: string[],
): Promise<Record<string, DeetReactor[]>> {
  if (!deetIds.length) return {};
  const response = await apiFetch<{ previewsByDeetId: Record<string, DeetReactor[]> }>(
    "/deets/reactors/previews",
    { query: { ids: deetIds.join(",") } },
  );
  return response.previewsByDeetId ?? {};
}

export async function getDeetCountsApi(
  deetIds: string[],
): Promise<Record<string, { likeCount: number; commentCount: number; viewCount: number }>> {
  if (!deetIds.length) return {};
  const response = await apiFetch<{
    countsByDeetId: Record<string, { likeCount: number; commentCount: number; viewCount: number }>;
  }>("/deets/counts", { query: { ids: deetIds.join(",") } });
  return response.countsByDeetId ?? {};
}

export async function incrementDeetViewApi(deetId: string): Promise<{ isNew: boolean }> {
  return apiFetch(`/deets/${encodeURIComponent(deetId)}/views/increment`, {
    method: "POST",
  });
}

export async function listDeetViewersApi(deetId: string): Promise<DeetViewer[]> {
  const response = await apiFetch<{ viewers: DeetViewer[] }>(`/deets/${encodeURIComponent(deetId)}/viewers`);
  return response.viewers ?? [];
}

export async function getDeetViewCountsApi(deetIds: string[]): Promise<Record<string, number>> {
  if (!deetIds.length) return {};
  const response = await apiFetch<{ countsByDeetId: Record<string, number> }>("/deets/views/counts", {
    query: { ids: deetIds.join(",") },
  });
  return response.countsByDeetId ?? {};
}

export async function recordDeetShareApi(
  deetId: string,
): Promise<{ alreadyShared: boolean; total: number }> {
  return apiFetch(`/deets/${encodeURIComponent(deetId)}/shares/record`, {
    method: "POST",
  });
}

export async function getDeetShareCountsApi(deetIds: string[]): Promise<Record<string, number>> {
  if (!deetIds.length) return {};
  const response = await apiFetch<{ countsByDeetId: Record<string, number> }>("/deets/shares/counts", {
    query: { ids: deetIds.join(",") },
  });
  return response.countsByDeetId ?? {};
}

export async function toggleCommentReactionApi(
  commentId: string,
  reactionType: string,
): Promise<{ emoji: string | null }> {
  return apiFetch(`/deets/comments/${encodeURIComponent(commentId)}/reactions/toggle`, {
    method: "POST",
    body: { reactionType },
  });
}

export async function getCommentReactionsApi(commentIds: string[]): Promise<Record<string, string>> {
  if (!commentIds.length) return {};
  const response = await apiFetch<{ reactionsByCommentId: Record<string, string> }>(
    "/deets/comments/reactions",
    { query: { ids: commentIds.join(",") } },
  );
  return response.reactionsByCommentId ?? {};
}
