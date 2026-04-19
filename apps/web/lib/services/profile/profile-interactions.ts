import { createClient } from "@/lib/supabase/client";

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

/**
 * Toggle the viewer's like on a profile. Inserts if missing, deletes if present.
 * Returns the new state + updated count so callers can reconcile optimistically.
 *
 * Self-likes are allowed (per the April 19 product call — a user's own like
 * counts toward their profile total). The original DB-level check constraint
 * `profile_id <> liker_id` is dropped by migration 20260419_allow_self_profile_like.
 *
 * Returns null when no user is signed in or the insert/delete failed. If the
 * write fails with an RLS error we refresh the session once and retry, same
 * stale-session recovery we use for deet comments.
 */
const isRlsFailure = (msg?: string) => {
  const m = (msg ?? "").toLowerCase();
  return m.includes("row-level security") || m.includes("row level security");
};

export async function toggleProfileLike(profileId: string): Promise<{ liked: boolean; count: number } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing, error: lookupError } = await supabase
    .from("profile_likes")
    .select("id")
    .eq("profile_id", profileId)
    .eq("liker_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[toggleProfileLike] lookup failed:", lookupError);
    return null;
  }

  if (existing) {
    let { error } = await supabase.from("profile_likes").delete().eq("id", existing.id);
    if (error && isRlsFailure(error.message)) {
      await supabase.auth.refreshSession().catch(() => { /* best-effort */ });
      const retry = await supabase.from("profile_likes").delete().eq("id", existing.id);
      error = retry.error;
    }
    if (error) {
      console.error("[toggleProfileLike] delete failed:", error);
      return null;
    }
  } else {
    let { error } = await supabase
      .from("profile_likes")
      .insert({ profile_id: profileId, liker_id: user.id });
    if (error && isRlsFailure(error.message)) {
      await supabase.auth.refreshSession().catch(() => { /* best-effort */ });
      const retry = await supabase
        .from("profile_likes")
        .insert({ profile_id: profileId, liker_id: user.id });
      error = retry.error;
    }
    if (error) {
      console.error("[toggleProfileLike] insert failed:", error);
      return null;
    }
  }

  const { count } = await supabase
    .from("profile_likes")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);

  return { liked: !existing, count: count ?? 0 };
}

/**
 * List comments on a profile, newest first. Joins to profiles for author info
 * (two-step fetch since the FK is to auth.users, which Supabase can't traverse
 * directly from a RLS select).
 */
export async function listProfileComments(profileId: string, limit = 50): Promise<ProfileComment[]> {
  const supabase = createClient();
  const { data: { user: viewer } } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from("profile_comments")
    .select("id, profile_id, author_id, body, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !rows) {
    console.warn("[listProfileComments] select failed:", error);
    return [];
  }

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const { data: profiles } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url, email").in("id", authorIds)
    : { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null; email: string | null }> };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        name: p.full_name || p.email?.split("@")[0] || "uDeets user",
        avatar: p.avatar_url,
      },
    ])
  );

  return rows.map((row) => {
    const info = profileMap.get(row.author_id);
    return {
      id: row.id,
      profileId: row.profile_id,
      authorId: row.author_id,
      authorName: info?.name ?? "uDeets user",
      authorAvatar: info?.avatar ?? null,
      body: row.body,
      createdAt: row.created_at,
      isOwn: viewer?.id === row.author_id,
    } satisfies ProfileComment;
  });
}

/**
 * Add a comment on a profile.
 */
export async function addProfileComment(profileId: string, body: string): Promise<ProfileComment | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profile_comments")
    .insert({ profile_id: profileId, author_id: user.id, body: trimmed.slice(0, 500) })
    .select("id, profile_id, author_id, body, created_at")
    .single();

  if (error || !data) {
    console.error("[addProfileComment] insert failed:", error);
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: data.id,
    profileId: data.profile_id,
    authorId: data.author_id,
    authorName: profile?.full_name || profile?.email?.split("@")[0] || "uDeets user",
    authorAvatar: profile?.avatar_url ?? null,
    body: data.body,
    createdAt: data.created_at,
    isOwn: true,
  };
}

/**
 * Delete a comment. RLS lets the author or the profile owner delete.
 */
export async function deleteProfileComment(commentId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("profile_comments").delete().eq("id", commentId);
  if (error) {
    console.error("[deleteProfileComment]", error);
    return false;
  }
  return true;
}

/**
 * File a report against another user's profile.
 */
export async function reportUser(reportedUserId: string, reason: string, context?: string): Promise<boolean> {
  const trimmed = reason.trim();
  if (!trimmed) return false;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (user.id === reportedUserId) return false;

  const { error } = await supabase.from("user_reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason: trimmed.slice(0, 1000),
    context: context?.slice(0, 500) ?? null,
  });

  if (error) {
    console.error("[reportUser] insert failed:", error);
    return false;
  }
  return true;
}
