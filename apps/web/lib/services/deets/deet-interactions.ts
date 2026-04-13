import { createClient } from "@/lib/supabase/client";

/**
 * Fire-and-forget helper for denormalized count updates.
 * These are nice-to-have but must NEVER break the primary operation.
 */
function updateDenormalizedCount(table: "deets", id: string, column: string, value: number) {
  try {
    const supabase = createClient();
    void supabase.from(table).update({ [column]: value }).eq("id", id);
  } catch {
    // Intentionally swallowed — count will self-heal on next full read
  }
}

// ── Likes ──────────────────────────────────────────────────────────

export async function toggleDeetLike(deetId: string): Promise<{ liked: boolean; likeCount: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to like a deet.");

  // Check if already liked
  const { data: existing } = await supabase
    .from("deet_likes")
    .select("id")
    .eq("deet_id", deetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("deet_likes").delete().eq("id", existing.id);
  } else {
    // Like
    await supabase.from("deet_likes").insert({ deet_id: deetId, user_id: user.id });
  }

  // Fetch updated count
  const { count } = await supabase
    .from("deet_likes")
    .select("*", { count: "exact", head: true })
    .eq("deet_id", deetId);

  const likeCount = count ?? 0;

  // Update denormalized count (non-blocking — must not break the like toggle)
  updateDenormalizedCount("deets", deetId, "like_count", likeCount);

  return { liked: !existing, likeCount };
}

export async function getDeetLikeStatus(deetIds: string[]): Promise<Map<string, { liked: boolean; count: number }>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = new Map<string, { liked: boolean; count: number }>();
  if (!deetIds.length) return result;

  // Get counts for all deets
  const { data: deets } = await supabase
    .from("deets")
    .select("id, like_count")
    .in("id", deetIds);

  for (const d of deets ?? []) {
    result.set(d.id, { liked: false, count: d.like_count ?? 0 });
  }

  // Get user's likes
  if (user) {
    const { data: userLikes } = await supabase
      .from("deet_likes")
      .select("deet_id")
      .eq("user_id", user.id)
      .in("deet_id", deetIds);

    for (const like of userLikes ?? []) {
      const existing = result.get(like.deet_id);
      if (existing) existing.liked = true;
    }
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
}

export async function addDeetComment(deetId: string, body: string): Promise<DeetComment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to comment.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  // PRIMARY OPERATION: insert the comment
  const { data, error } = await supabase
    .from("deet_comments")
    .insert({ deet_id: deetId, user_id: user.id, body: trimmed })
    .select("id, deet_id, user_id, body, created_at")
    .single();

  if (error) throw new Error(`Failed to add comment: ${error.message}`);

  // SECONDARY: Update denormalized count (non-blocking)
  void Promise.resolve(
    supabase
      .from("deet_comments")
      .select("*", { count: "exact", head: true })
      .eq("deet_id", deetId)
  )
    .then(({ count }) => {
      updateDenormalizedCount("deets", deetId, "comment_count", count ?? 0);
    })
    .catch(() => { /* swallow — count will self-heal */ });

  // SECONDARY: Fetch profile for display (non-critical, wrapped in try/catch)
  let resolvedName: string | undefined;
  let resolvedAvatar: string | undefined;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("id", user.id)
      .single();

    const meta = user.user_metadata ?? {};
    const authName = (meta.full_name as string) || (meta.name as string) || null;
    resolvedName = profile?.full_name || authName || profile?.email?.split("@")[0] || user.email?.split("@")[0] || undefined;
    resolvedAvatar = profile?.avatar_url || (meta.avatar_url as string) || undefined;
  } catch {
    // Fall back to auth metadata
    const meta = user.user_metadata ?? {};
    resolvedName = (meta.full_name as string) || (meta.name as string) || user.email?.split("@")[0] || undefined;
    resolvedAvatar = (meta.avatar_url as string) || undefined;
  }

  return {
    id: data.id,
    deetId: data.deet_id,
    userId: data.user_id,
    body: data.body,
    createdAt: data.created_at,
    authorName: resolvedName,
    authorAvatar: resolvedAvatar,
  };
}

export async function listDeetComments(deetId: string): Promise<DeetComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("deet_comments")
    .select("id, deet_id, user_id, body, created_at")
    .eq("deet_id", deetId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw new Error(`Failed to load comments: ${error.message}`);

  if (!data || data.length === 0) return [];

  // Get current user info for self-comments fallback
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentMeta = currentUser?.user_metadata ?? {};

  // Fetch profiles for all comment authors
  const userIds = [...new Set(data.map((row) => row.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url, email: p.email });
  }

  return data.map((row) => {
    const profile = profileMap.get(row.user_id);
    const isCurrentUser = currentUser && row.user_id === currentUser.id;
    const authName = isCurrentUser
      ? (currentMeta.full_name as string) || (currentMeta.name as string) || null
      : null;
    const authEmail = isCurrentUser ? currentUser.email : null;
    const authAvatar = isCurrentUser ? (currentMeta.avatar_url as string) || null : null;

    return {
      id: row.id,
      deetId: row.deet_id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      authorName: profile?.full_name || authName || profile?.email?.split("@")[0] || authEmail?.split("@")[0] || undefined,
      authorAvatar: profile?.avatar_url || authAvatar || undefined,
    };
  });
}

export async function editDeetComment(commentId: string, newBody: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to edit a comment.");

  const trimmed = newBody.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  const { error } = await supabase
    .from("deet_comments")
    .update({ body: trimmed, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id); // RLS also enforces this, but belt-and-suspenders

  if (error) throw new Error(`Failed to edit comment: ${error.message}`);
}

export async function deleteDeetComment(commentId: string, deetId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to delete a comment.");

  const { error } = await supabase
    .from("deet_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to delete comment: ${error.message}`);

  // Update denormalized count (non-blocking)
  void Promise.resolve(
    supabase
      .from("deet_comments")
      .select("*", { count: "exact", head: true })
      .eq("deet_id", deetId)
  )
    .then(({ count }) => {
      updateDenormalizedCount("deets", deetId, "comment_count", count ?? 0);
    })
    .catch(() => { /* swallow */ });
}

/** Sync denormalized comment_count with actual row count for given deets. */
export async function syncDeetCommentCounts(deetIds: string[]): Promise<Record<string, number>> {
  const supabase = createClient();
  const result: Record<string, number> = {};
  if (!deetIds.length) return result;

  // Batch: get actual count per deet from deet_comments
  for (const deetId of deetIds) {
    const { count } = await supabase
      .from("deet_comments")
      .select("*", { count: "exact", head: true })
      .eq("deet_id", deetId);
    const actual = count ?? 0;
    result[deetId] = actual;
    // Also heal the denormalized column
    updateDenormalizedCount("deets", deetId, "comment_count", actual);
  }

  return result;
}

// ── Reactors (who liked) ──────────────────────────────────────────

export interface DeetReactor {
  userId: string;
  name: string;
  avatar?: string;
}

export async function listDeetReactors(deetId: string): Promise<DeetReactor[]> {
  const supabase = createClient();

  const { data: likes, error } = await supabase
    .from("deet_likes")
    .select("user_id")
    .eq("deet_id", deetId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !likes?.length) return [];

  const userIds = likes.map((l) => l.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url, email: p.email });
  }

  return userIds.map((uid) => {
    const p = profileMap.get(uid);
    return {
      userId: uid,
      name: p?.full_name || p?.email?.split("@")[0] || "Member",
      avatar: p?.avatar_url || undefined,
    };
  });
}

// ── Views ──────────────────────────────────────────────────────────

export interface DeetViewer {
  userId: string;
  name: string;
  avatar?: string;
  viewedAt: string;
}

export async function incrementDeetView(deetId: string): Promise<void> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert into deet_views (one row per user per deet)
    await supabase
      .from("deet_views")
      .upsert(
        { deet_id: deetId, user_id: user.id, viewed_at: new Date().toISOString() },
        { onConflict: "deet_id,user_id" }
      );

    // Update denormalized count from actual rows (non-blocking)
    void Promise.resolve(
      supabase
        .from("deet_views")
        .select("*", { count: "exact", head: true })
        .eq("deet_id", deetId)
    )
      .then(({ count }) => {
        updateDenormalizedCount("deets", deetId, "view_count", count ?? 0);
      })
      .catch(() => { /* swallow */ });
  } catch {
    // View tracking is non-critical — swallow
  }
}

export async function listDeetViewers(deetId: string): Promise<DeetViewer[]> {
  const supabase = createClient();

  const { data: views, error } = await supabase
    .from("deet_views")
    .select("user_id, viewed_at")
    .eq("deet_id", deetId)
    .order("viewed_at", { ascending: false })
    .limit(50);

  if (error || !views?.length) return [];

  const userIds = views.map((v) => v.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url, email: p.email });
  }

  return views.map((v) => {
    const p = profileMap.get(v.user_id);
    return {
      userId: v.user_id,
      name: p?.full_name || p?.email?.split("@")[0] || "Member",
      avatar: p?.avatar_url || undefined,
      viewedAt: v.viewed_at,
    };
  });
}

export async function getDeetCounts(deetIds: string[]): Promise<Map<string, { likeCount: number; commentCount: number; viewCount: number }>> {
  const supabase = createClient();
  const result = new Map<string, { likeCount: number; commentCount: number; viewCount: number }>();
  if (!deetIds.length) return result;

  const { data } = await supabase
    .from("deets")
    .select("id, like_count, comment_count, view_count")
    .in("id", deetIds);

  for (const d of data ?? []) {
    result.set(d.id, {
      likeCount: d.like_count ?? 0,
      commentCount: d.comment_count ?? 0,
      viewCount: d.view_count ?? 0,
    });
  }

  return result;
}
