import { getProfileSummaryApi } from "@/lib/api/profiles";

export type ProfileSummary = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  joinedAt: string | null; // ISO timestamp from profiles.created_at or auth.users.created_at
  likeCount: number;       // likes on this profile
  commentCount: number;    // comments on this profile
  postCount: number;       // deets authored by this user
  viewerHasLiked: boolean; // whether the current viewer has liked this profile
};

/**
 * Fetches a lightweight profile summary for the "profile modal" feature.
 * Makes 4 small parallel queries rather than a big join so we can tolerate
 * RLS failures on any single source (e.g. the profile_likes table isn't
 * migrated yet) without blowing up the whole modal.
 */
export async function getProfileSummary(userId: string): Promise<ProfileSummary | null> {
  if (!userId) return null;
  try {
    return await getProfileSummaryApi(userId);
  } catch (error) {
    console.warn("[getProfileSummary] profile lookup failed:", error);
    return null;
  }
}
