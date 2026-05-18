import {
  addProfileCommentApi,
  deleteProfileCommentApi,
  listProfileCommentsApi,
  listProfileLikersApi,
  reportUserApi,
  toggleProfileLikeApi,
} from "@/lib/api/profiles";

export type ProfileComment = {
  id: string;
  profileId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
  isOwn: boolean;
};

export type ProfileLiker = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  likedAt: string;
  isOwn: boolean; // true when this liker is the viewer themselves
};

/**
 * Toggle the viewer's like on a profile. Inserts if missing, deletes if present.
 * Returns the new state + updated count so callers can reconcile optimistically.
 *
 * Self-likes are allowed (per the April 19 product call — a user's own like
 * counts toward their profile total). The original DB-level check constraint
 * `profile_id <> liker_id` is dropped by migration `20260419_allow_self_profile_like`.
 *
 * Returns null when no user is signed in or the insert/delete failed. If the
 * write fails with an RLS error we refresh the session once and retry, same
 * stale-session recovery we use for deet comments.
 */
export async function toggleProfileLike(profileId: string): Promise<{ liked: boolean; count: number } | null> {
  try {
    return await toggleProfileLikeApi(profileId);
  } catch (error) {
    console.error("[toggleProfileLike] failed:", error);
    return null;
  }
}

/**
 * List everyone who liked a profile, newest first. Two-step fetch: pull the
 * like rows, then resolve liker profile info (name + avatar) in a follow-up
 * query, then resolve liker profile info (name + avatar) via the API.
 */
export async function listProfileLikers(profileId: string, limit = 100): Promise<ProfileLiker[]> {
  try {
    return await listProfileLikersApi(profileId, limit);
  } catch (error) {
    console.warn("[listProfileLikers] select failed:", error);
    return [];
  }
}

/**
 * List comments on a profile, newest first (author info resolved by the API).
 */
export async function listProfileComments(profileId: string, limit = 50): Promise<ProfileComment[]> {
  try {
    return await listProfileCommentsApi(profileId, limit);
  } catch (error) {
    console.warn("[listProfileComments] select failed:", error);
    return [];
  }
}

/**
 * Add a comment on a profile.
 */
export async function addProfileComment(profileId: string, body: string): Promise<ProfileComment | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;

  try {
    return await addProfileCommentApi(profileId, trimmed);
  } catch (error) {
    console.error("[addProfileComment] insert failed:", error);
    return null;
  }
}

/**
 * Delete a comment. RLS lets the author or the profile owner delete.
 */
export async function deleteProfileComment(commentId: string): Promise<boolean> {
  try {
    return await deleteProfileCommentApi(commentId);
  } catch (error) {
    console.error("[deleteProfileComment]", error);
    return false;
  }
}

/**
 * File a report against another user's profile.
 */
export async function reportUser(reportedUserId: string, reason: string, context?: string): Promise<boolean> {
  const trimmed = reason.trim();
  if (!trimmed) return false;
  try {
    return await reportUserApi(reportedUserId, trimmed, context);
  } catch (error) {
    console.error("[reportUser] insert failed:", error);
    return false;
  }
}
