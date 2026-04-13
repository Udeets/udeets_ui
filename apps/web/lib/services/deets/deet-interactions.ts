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

export async function toggleDeetLike(deetId: string, reactionType = "like"): Promise<{ liked: boolean; likeCount: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to like a deet.");

  // Check if already liked — try with reaction_type, fall back without
  let existing: { id: string; reaction_type?: string } | null = null;
  let hasReactionColumn = true;

  const res = await supabase.from("deet_likes").select("id, reaction_type").eq("deet_id", deetId).eq("user_id", user.id).maybeSingle();
  if (res.error && res.error.message.includes("reaction_type")) {
    hasReactionColumn = false;
    const res2 = await supabase.from("deet_likes").select("id").eq("deet_id", deetId).eq("user_id", user.id).maybeSingle();
    existing = res2.data ? { id: res2.data.id } : null;
  } else {
    existing = res.data;
  }

  if (existing) {
    if (hasReactionColumn && existing.reaction_type === reactionType) {
      // Same reaction — toggle off (unlike)
      await supabase.from("deet_likes").delete().eq("id", existing.id);
    } else if (hasReactionColumn && existing.reaction_type !== reactionType) {
      // Different reaction — update the emoji type
      await supabase.from("deet_likes").update({ reaction_type: reactionType }).eq("id", existing.id);
    } else {
      // No reaction_type column — just toggle off
      await supabase.from("deet_likes").delete().eq("id", existing.id);
    }
  } else {
    // New reaction
    const insertPayload: Record<string, unknown> = { deet_id: deetId, user_id: user.id };
    if (hasReactionColumn) insertPayload.reaction_type = reactionType;
    await supabase.from("deet_likes").insert(insertPayload);
  }

  // Fetch updated count
  const { count } = await supabase
    .from("deet_likes")
    .select("*", { count: "exact", head: true })
    .eq("deet_id", deetId);

  const likeCount = count ?? 0;

  // Update denormalized count (non-blocking — must not break the like toggle)
  updateDenormalizedCount("deets", deetId, "like_count", likeCount);

  // Determine new liked state
  const nowLiked = existing
    ? (hasReactionColumn ? existing.reaction_type !== reactionType : false) // changed emoji = still liked; same or no column = unliked
    : true; // new reaction = liked

  return { liked: nowLiked, likeCount };
}

export async function getDeetLikeStatus(deetIds: string[]): Promise<Map<string, { liked: boolean; count: number }>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = new Map<string, { liked: boolean; count: number }>();
  if (!deetIds.length) return result;

  // Initialize all deets with 0
  for (const id of deetIds) {
    result.set(id, { liked: false, count: 0 });
  }

  // Count actual likes from deet_likes table (not stale denormalized count)
  const { data: allLikes } = await supabase
    .from("deet_likes")
    .select("deet_id")
    .in("deet_id", deetIds);

  for (const like of allLikes ?? []) {
    const entry = result.get(like.deet_id);
    if (entry) entry.count += 1;
  }

  // Heal denormalized counts in background
  for (const [id, entry] of result) {
    updateDenormalizedCount("deets", id, "like_count", entry.count);
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
  parentId?: string | null;
  replies?: DeetComment[];
}

export async function addDeetComment(deetId: string, body: string, parentId?: string): Promise<DeetComment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to comment.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  // PRIMARY OPERATION: insert the comment
  const insertPayload: Record<string, unknown> = { deet_id: deetId, user_id: user.id, body: trimmed };
  if (parentId) insertPayload.parent_id = parentId;

  // Try with parent_id; fall back without if column doesn't exist yet
  type CommentRow = { id: string; deet_id: string; user_id: string; body: string; created_at: string; parent_id?: string | null };
  let data: CommentRow | null = null;

  const res1 = await supabase.from("deet_comments").insert(insertPayload).select("id, deet_id, user_id, body, created_at, parent_id").single();
  if (res1.error && res1.error.message.includes("parent_id")) {
    const basicPayload = { deet_id: deetId, user_id: user.id, body: trimmed };
    const res2 = await supabase.from("deet_comments").insert(basicPayload).select("id, deet_id, user_id, body, created_at").single();
    if (res2.error) throw new Error(`Failed to add comment: ${res2.error.message}`);
    data = res2.data as unknown as CommentRow;
  } else if (res1.error) {
    throw new Error(`Failed to add comment: ${res1.error.message}`);
  } else {
    data = res1.data as unknown as CommentRow;
  }

  if (!data) throw new Error("Failed to add comment: no data returned");

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
    parentId: data.parent_id ?? null,
    authorName: resolvedName,
    authorAvatar: resolvedAvatar,
  };
}

export async function listDeetComments(deetId: string): Promise<DeetComment[]> {
  const supabase = createClient();

  // Try with parent_id first; fall back to without if column doesn't exist yet
  type CommentRow = { id: string; deet_id: string; user_id: string; body: string; created_at: string; parent_id?: string | null };
  let data: CommentRow[] = [];
  let queryError: { message: string } | null = null;

  const res1 = await supabase
    .from("deet_comments")
    .select("id, deet_id, user_id, body, created_at, parent_id")
    .eq("deet_id", deetId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (res1.error && res1.error.message.includes("parent_id")) {
    const res2 = await supabase
      .from("deet_comments")
      .select("id, deet_id, user_id, body, created_at")
      .eq("deet_id", deetId)
      .order("created_at", { ascending: true })
      .limit(100);
    data = (res2.data as unknown as CommentRow[]) ?? [];
    queryError = res2.error;
  } else {
    data = (res1.data as unknown as CommentRow[]) ?? [];
    queryError = res1.error;
  }

  if (queryError) throw new Error(`Failed to load comments: ${queryError.message}`);

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

  const allComments = data.map((row) => {
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
      parentId: row.parent_id ?? null,
      authorName: profile?.full_name || authName || profile?.email?.split("@")[0] || authEmail?.split("@")[0] || undefined,
      authorAvatar: profile?.avatar_url || authAvatar || undefined,
    };
  });

  // Organize into threads: top-level comments with nested replies
  const topLevel: DeetComment[] = [];
  const replyMap = new Map<string, DeetComment[]>();

  for (const c of allComments) {
    if (c.parentId) {
      const existing = replyMap.get(c.parentId) ?? [];
      existing.push(c);
      replyMap.set(c.parentId, existing);
    } else {
      topLevel.push(c);
    }
  }

  // Attach replies to their parent
  for (const c of topLevel) {
    c.replies = replyMap.get(c.id) ?? [];
  }

  return topLevel;
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
  reactionType: string;
  role?: "creator" | "admin" | "member";
}

export async function listDeetReactors(deetId: string): Promise<DeetReactor[]> {
  const supabase = createClient();

  // Try with reaction_type; fall back without
  let likes: Array<{ user_id: string; reaction_type?: string }> = [];
  const res1 = await supabase.from("deet_likes").select("user_id, reaction_type").eq("deet_id", deetId).order("created_at", { ascending: false }).limit(50);
  if (res1.error && res1.error.message.includes("reaction_type")) {
    const res2 = await supabase.from("deet_likes").select("user_id").eq("deet_id", deetId).order("created_at", { ascending: false }).limit(50);
    likes = (res2.data ?? []).map((l) => ({ user_id: l.user_id }));
  } else {
    likes = (res1.data ?? []) as typeof likes;
  }

  if (!likes.length) return [];

  const userIds = [...new Set(likes.map((l) => l.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url, email: p.email });
  }

  return likes.map((l) => {
    const p = profileMap.get(l.user_id);
    return {
      userId: l.user_id,
      name: p?.full_name || p?.email?.split("@")[0] || "Member",
      avatar: p?.avatar_url || undefined,
      reactionType: l.reaction_type ?? "like",
    };
  });
}

/** Get reactors summary for multiple deets (for the preview row). */
export async function getDeetReactorPreviews(deetIds: string[]): Promise<Record<string, DeetReactor[]>> {
  const supabase = createClient();
  const result: Record<string, DeetReactor[]> = {};
  if (!deetIds.length) return result;

  // Try with reaction_type; fall back without
  let likes: Array<{ deet_id: string; user_id: string; reaction_type?: string }> = [];
  const res1 = await supabase.from("deet_likes").select("deet_id, user_id, reaction_type").in("deet_id", deetIds).order("created_at", { ascending: false });
  if (res1.error && res1.error.message.includes("reaction_type")) {
    const res2 = await supabase.from("deet_likes").select("deet_id, user_id").in("deet_id", deetIds).order("created_at", { ascending: false });
    likes = (res2.data ?? []).map((l) => ({ deet_id: l.deet_id, user_id: l.user_id }));
  } else {
    likes = (res1.data ?? []) as typeof likes;
  }

  if (!likes.length) return result;

  // Collect unique user IDs
  const userIds = [...new Set(likes.map((l) => l.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url, email: p.email });
  }

  for (const l of likes) {
    if (!result[l.deet_id]) result[l.deet_id] = [];
    const p = profileMap.get(l.user_id);
    result[l.deet_id].push({
      userId: l.user_id,
      name: p?.full_name || p?.email?.split("@")[0] || "Member",
      avatar: p?.avatar_url || undefined,
      reactionType: l.reaction_type ?? "like",
    });
  }

  return result;
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
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if this user already viewed this deet
    const { data: existing } = await supabase
      .from("deet_views")
      .select("id")
      .eq("deet_id", deetId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Already viewed — just update timestamp, don't count again
      void supabase
        .from("deet_views")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", existing.id);
      return false;
    }

    // New view — insert
    await supabase
      .from("deet_views")
      .insert({ deet_id: deetId, user_id: user.id, viewed_at: new Date().toISOString() });

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

    return true;
  } catch {
    // View tracking is non-critical — swallow
    return false;
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
