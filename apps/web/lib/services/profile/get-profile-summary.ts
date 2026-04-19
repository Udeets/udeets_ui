import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();

  const { data: { user: viewer } } = await supabase.auth.getUser();
  const viewerId = viewer?.id ?? null;

  const [profileRes, likeCountRes, commentCountRes, postCountRes, viewerLikeRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, email, created_at").eq("id", userId).maybeSingle(),
    supabase.from("profile_likes").select("*", { count: "exact", head: true }).eq("profile_id", userId),
    supabase.from("profile_comments").select("*", { count: "exact", head: true }).eq("profile_id", userId),
    supabase.from("deets").select("*", { count: "exact", head: true }).eq("created_by", userId),
    viewerId
      ? supabase.from("profile_likes").select("id").eq("profile_id", userId).eq("liker_id", viewerId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileRes.error || !profileRes.data) {
    console.warn("[getProfileSummary] profile lookup failed:", profileRes.error);
    return null;
  }

  const profile = profileRes.data as { id: string; full_name: string | null; avatar_url: string | null; email: string | null; created_at: string | null };

  return {
    id: profile.id,
    fullName: profile.full_name || profile.email?.split("@")[0] || "uDeets User",
    avatarUrl: profile.avatar_url,
    email: profile.email,
    joinedAt: profile.created_at,
    likeCount: likeCountRes.count ?? 0,
    commentCount: commentCountRes.count ?? 0,
    postCount: postCountRes.count ?? 0,
    viewerHasLiked: Boolean(viewerLikeRes.data),
  };
}
