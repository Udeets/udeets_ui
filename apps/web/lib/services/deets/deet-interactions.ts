import {
  addDeetCommentApi,
  deleteDeetCommentApi,
  editDeetCommentApi,
  getCommentReactionsApi,
  getDeetCountsApi,
  getDeetLikeStatusApi,
  getDeetReactorPreviewsApi,
  getDeetShareCountsApi,
  getDeetViewCountsApi,
  incrementDeetViewApi,
  listDeetCommentsApi,
  listDeetReactorsApi,
  listDeetViewersApi,
  recordDeetShareApi,
  toggleCommentReactionApi,
  toggleDeetLikeApi,
} from "@/lib/api/deet-interactions";

// ── Likes ──────────────────────────────────────────────────────────

/** Normalize legacy `"like"` and empty/null to 👍 for UI and equality checks. */
export function canonicalDeetReactionType(stored: string | null | undefined): string {
  if (stored == null || stored === "") return "👍";
  if (stored === "like") return "👍";
  return stored;
}

export type DeetLikeStatusEntry = {
  liked: boolean;
  count: number;
  /** Canonical emoji for the signed-in user's reaction, or null if they have not reacted. */
  myReactionType: string | null;
};

export async function toggleDeetLike(
  deetId: string,
  reactionType = "like",
): Promise<{ liked: boolean; likeCount: number; myReactionType: string | null }> {
  const result = await toggleDeetLikeApi(deetId, reactionType);
  return {
    liked: Boolean(result.liked),
    likeCount: Number(result.likeCount ?? 0),
    myReactionType: result.myReactionType ?? null,
  };
}

export async function getDeetLikeStatus(deetIds: string[]): Promise<Map<string, DeetLikeStatusEntry>> {
  const result = new Map<string, DeetLikeStatusEntry>();
  if (!deetIds.length) return result;
  const statusByDeetId = await getDeetLikeStatusApi(deetIds);
  for (const id of deetIds) {
    const item = statusByDeetId[id];
    result.set(id, {
      liked: Boolean(item?.liked),
      count: Number(item?.count ?? 0),
      myReactionType: item?.myReactionType ?? null,
    });
  }
  return result;
}

// ── Comments ───────────────────────────────────────────────────────

export interface DeetComment {
  id: string;
  deetId: string;
  userId: string;
  body: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string;
  parentId?: string | null;
  replies?: DeetComment[];
  imageUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

export async function addDeetComment(
  deetId: string,
  body: string,
  parentId?: string,
  attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string },
): Promise<DeetComment> {
  return addDeetCommentApi(deetId, body, parentId, attachments);
}

export async function listDeetComments(deetId: string): Promise<DeetComment[]> {
  return listDeetCommentsApi(deetId);
}

export async function editDeetComment(commentId: string, newBody: string): Promise<void> {
  await editDeetCommentApi(commentId, newBody);
}

export async function deleteDeetComment(commentId: string, deetId: string): Promise<void> {
  await deleteDeetCommentApi(commentId, deetId);
}

/** Sync denormalized comment_count with actual row count for given deets. */
export async function syncDeetCommentCounts(deetIds: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (!deetIds.length) return result;
  const countsByDeetId = await getDeetCountsApi(deetIds);
  for (const deetId of deetIds) {
    result[deetId] = Number(countsByDeetId[deetId]?.commentCount ?? 0);
  }
  return result;
}

// ── Reactors (who liked) ──────────────────────────────────────────

export interface DeetReactor {
  userId: string;
  name: string;
  avatar?: string;
  reactionType: string;
  role?: "creator" | "admin" | "member";
}

export async function listDeetReactors(deetId: string): Promise<DeetReactor[]> {
  return listDeetReactorsApi(deetId);
}

/** Get reactors summary for multiple deets (for the preview row). */
export async function getDeetReactorPreviews(deetIds: string[]): Promise<Record<string, DeetReactor[]>> {
  return getDeetReactorPreviewsApi(deetIds);
}

// ── Views ──────────────────────────────────────────────────────────

export interface DeetViewer {
  userId: string;
  name: string;
  avatar?: string;
  viewedAt: string;
}

/** Returns true if this was a NEW view (first time this user viewed this deet). */
export async function incrementDeetView(deetId: string): Promise<boolean> {
  try {
    const result = await incrementDeetViewApi(deetId);
    return Boolean(result.isNew);
  } catch {
    return false;
  }
}

export async function listDeetViewers(deetId: string): Promise<DeetViewer[]> {
  return listDeetViewersApi(deetId);
}

/** Sync denormalized view_count with actual deet_views rows. */
export async function syncDeetViewCounts(deetIds: string[]): Promise<Record<string, number>> {
  try {
    return await getDeetViewCountsApi(deetIds);
  } catch {
    const fallback: Record<string, number> = {};
    for (const deetId of deetIds) fallback[deetId] = 0;
    return fallback;
  }
}

// ── Shares ──────────────────────────────────────────────────────────

/**
 * Record a share for a deet. One share per user per deet (idempotent).
 * Returns { alreadyShared, total } — alreadyShared=true means the user
 * already shared this deet before (no new row was inserted).
 */
export async function recordDeetShare(deetId: string): Promise<{ alreadyShared: boolean; total: number }> {
  try {
    return await recordDeetShareApi(deetId);
  } catch {
    return { alreadyShared: false, total: 0 };
  }
}

/** Sync denormalized share_count with actual deet_shares rows. */
export async function syncDeetShareCounts(deetIds: string[]): Promise<Record<string, number>> {
  try {
    return await getDeetShareCountsApi(deetIds);
  } catch {
    const fallback: Record<string, number> = {};
    for (const deetId of deetIds) fallback[deetId] = 0;
    return fallback;
  }
}

// ── Comment Reactions ──────────────────────────────────────────────

/**
 * Toggle a reaction on a comment. If the user already reacted with the same
 * emoji it removes the reaction; if a different emoji it updates in place;
 * if no reaction exists it inserts one. Returns the new emoji (null = removed).
 */
export async function toggleCommentReaction(
  commentId: string,
  reactionType: string,
): Promise<{ emoji: string | null }> {
  return toggleCommentReactionApi(commentId, reactionType);
}

/**
 * Fetch the current user's reactions for a batch of comment IDs.
 * Returns a map of commentId → emoji string (only for comments the user reacted to).
 */
export async function getCommentReactions(commentIds: string[]): Promise<Record<string, string>> {
  try {
    return await getCommentReactionsApi(commentIds);
  } catch {
    return {};
  }
}

export async function getDeetCounts(deetIds: string[]): Promise<Map<string, { likeCount: number; commentCount: number; viewCount: number }>> {
  const result = new Map<string, { likeCount: number; commentCount: number; viewCount: number }>();
  if (!deetIds.length) return result;
  const countsByDeetId = await getDeetCountsApi(deetIds);
  for (const [deetId, counts] of Object.entries(countsByDeetId)) {
    result.set(deetId, {
      likeCount: Number(counts.likeCount ?? 0),
      commentCount: Number(counts.commentCount ?? 0),
      viewCount: Number(counts.viewCount ?? 0),
    });
  }
  return result;
}
