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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to like a deet.");

  const incoming = canonicalDeetReactionType(reactionType);

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
    if (hasReactionColumn) {
      const storedCanon = canonicalDeetReactionType(existing.reaction_type);
      if (storedCanon === incoming) {
        const { error: delErr } = await supabase.from("deet_likes").delete().eq("id", existing.id);
        if (delErr) throw new Error(`Failed to remove reaction: ${delErr.message}`);
      } else {
        const { error: updErr } = await supabase
          .from("deet_likes")
          .update({ reaction_type: incoming })
          .eq("id", existing.id)
          .eq("user_id", user.id);
        if (updErr) throw new Error(`Failed to update reaction: ${updErr.message}`);
      }
    } else {
      const { error: delErr } = await supabase.from("deet_likes").delete().eq("id", existing.id);
      if (delErr) throw new Error(`Failed to remove reaction: ${delErr.message}`);
    }
  } else {
    const insertPayload: Record<string, unknown> = { deet_id: deetId, user_id: user.id };
    if (hasReactionColumn) insertPayload.reaction_type = incoming;
    const { error: insErr } = await supabase.from("deet_likes").insert(insertPayload);
    if (insErr) throw new Error(`Failed to add reaction: ${insErr.message}`);
  }

  // Fetch updated count
  const { count } = await supabase
    .from("deet_likes")
    .select("*", { count: "exact", head: true })
    .eq("deet_id", deetId);

  const likeCount = count ?? 0;

  // Update denormalized count (non-blocking — must not break the like toggle)
  updateDenormalizedCount("deets", deetId, "like_count", likeCount);

  const nowLiked = existing ? (hasReactionColumn ? canonicalDeetReactionType(existing.reaction_type) !== incoming : false) : true;

  return {
    liked: nowLiked,
    likeCount,
    myReactionType: nowLiked ? incoming : null,
  };
}

export async function getDeetLikeStatus(deetIds: string[]): Promise<Map<string, DeetLikeStatusEntry>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = new Map<string, DeetLikeStatusEntry>();
  if (!deetIds.length) return result;

  // Initialize all deets with 0
  for (const id of deetIds) {
    result.set(id, { liked: false, count: 0, myReactionType: null });
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

  // Get user's likes (with reaction emoji when the column exists)
  if (user) {
    let userLikes: Array<{ deet_id: string; reaction_type?: string }> = [];
    const resLikes = await supabase
      .from("deet_likes")
      .select("deet_id, reaction_type")
      .eq("user_id", user.id)
      .in("deet_id", deetIds);

    if (resLikes.error) {
      if (resLikes.error.message.includes("reaction_type")) {
        const res2 = await supabase
          .from("deet_likes")
          .select("deet_id")
          .eq("user_id", user.id)
          .in("deet_id", deetIds);
        userLikes = (res2.data ?? []).map((l) => ({ deet_id: l.deet_id }));
      } else {
        userLikes = [];
      }
    } else {
      userLikes = (resLikes.data ?? []) as typeof userLikes;
    }

    for (const like of userLikes) {
      const entry = result.get(like.deet_id);
      if (entry) {
        entry.liked = true;
        entry.myReactionType = canonicalDeetReactionType(like.reaction_type);
      }
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to comment.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  // PRIMARY OPERATION: insert the comment
  const insertPayload: Record<string, unknown> = { deet_id: deetId, user_id: user.id, body: trimmed };
  if (parentId) insertPayload.parent_id = parentId;
  if (attachments?.imageUrl) insertPayload.image_url = attachments.imageUrl;
  if (attachments?.attachmentUrl) insertPayload.attachment_url = attachments.attachmentUrl;
  if (attachments?.attachmentName) insertPayload.attachment_name = attachments.attachmentName;

  // Try with all columns; fall back progressively if columns don't exist yet
  type CommentRow = { id: string; deet_id: string; user_id: string; body: string; created_at: string; parent_id?: string | null; image_url?: string | null; attachment_url?: string | null; attachment_name?: string | null };
  let data: CommentRow | null = null;

  const res1 = await supabase.from("deet_comments").insert(insertPayload).select("id, deet_id, user_id, body, created_at, parent_id, image_url, attachment_url, attachment_name").single();
  if (res1.error && (res1.error.message.includes("parent_id") || res1.error.message.includes("image_url") || res1.error.message.includes("attachment_url") || res1.error.message.includes("attachment_name"))) {
    // Fall back to basic columns only
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
    imageUrl: data.image_url ?? null,
    attachmentUrl: data.attachment_url ?? null,
    attachmentName: data.attachment_name ?? null,
  };
}

export async function listDeetComments(deetId: string): Promise<DeetComment[]> {
  const supabase = createClient();

  // Try with all columns; fall back progressively if columns don't exist yet
  type CommentRow = { id: string; deet_id: string; user_id: string; body: string; created_at: string; parent_id?: string | null; image_url?: string | null; attachment_url?: string | null; attachment_name?: string | null };
  let data: CommentRow[] = [];
  let queryError: { message: string } | null = null;

  const fullSelect = "id, deet_id, user_id, body, created_at, parent_id, image_url, attachment_url, attachment_name";
  const res1 = await supabase
    .from("deet_comments")
    .select(fullSelect)
    .eq("deet_id", deetId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (res1.error && (res1.error.message.includes("parent_id") || res1.error.message.includes("image_url") || res1.error.message.includes("attachment_url") || res1.error.message.includes("attachment_name"))) {
    // Fall back to basic columns
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
      imageUrl: row.image_url ?? null,
      attachmentUrl: row.attachment_url ?? null,
      attachmentName: row.attachment_name ?? null,
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

/** Sync denormalized view_count with actual deet_views rows. */
export async function syncDeetViewCounts(deetIds: string[]): Promise<Record<string, number>> {
  const supabase = createClient();
  const result: Record<string, number> = {};
  if (!deetIds.length) return result;

  for (const deetId of deetIds) {
    try {
      const { count } = await supabase
        .from("deet_views")
        .select("*", { count: "exact", head: true })
        .eq("deet_id", deetId);
      const actual = count ?? 0;
      result[deetId] = actual;
      updateDenormalizedCount("deets", deetId, "view_count", actual);
    } catch {
      // deet_views table might not exist yet — skip
    }
  }

  return result;
}

// ── Shares ──────────────────────────────────────────────────────────

/**
 * Record a share for a deet. One share per user per deet (idempotent).
 * Returns { alreadyShared, total } — alreadyShared=true means the user
 * already shared this deet before (no new row was inserted).
 */
export async function recordDeetShare(deetId: string): Promise<{ alreadyShared: boolean; total: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { alreadyShared: false, total: 0 };

  try {
    // Upsert — if the user already shared, this is a no-op (ON CONFLICT DO NOTHING)
    const { error: insertErr } = await supabase
      .from("deet_shares")
      .upsert({ deet_id: deetId, user_id: user.id }, { onConflict: "deet_id,user_id", ignoreDuplicates: true });

    // Check if this user had already shared (row existed before upsert)
    const { data: userRow } = await supabase
      .from("deet_shares")
      .select("shared_at")
      .eq("deet_id", deetId)
      .eq("user_id", user.id)
      .maybeSingle();

    // Count total unique shares for this deet
    const { count } = await supabase
      .from("deet_shares")
      .select("*", { count: "exact", head: true })
      .eq("deet_id", deetId);

    const total = count ?? 1;
    updateDenormalizedCount("deets", deetId, "share_count", total);

    // If the insert had an error (duplicate), the user already shared
    const alreadyShared = !!insertErr;
    return { alreadyShared, total };
  } catch {
    // deet_shares table might not exist — fall back gracefully
    return { alreadyShared: false, total: 0 };
  }
}

/** Sync denormalized share_count with actual deet_shares rows. */
export async function syncDeetShareCounts(deetIds: string[]): Promise<Record<string, number>> {
  const supabase = createClient();
  const result: Record<string, number> = {};
  if (!deetIds.length) return result;

  for (const deetId of deetIds) {
    try {
      const { count } = await supabase
        .from("deet_shares")
        .select("*", { count: "exact", head: true })
        .eq("deet_id", deetId);
      const actual = count ?? 0;
      result[deetId] = actual;
      updateDenormalizedCount("deets", deetId, "share_count", actual);
    } catch {
      // deet_shares table might not exist yet — skip
    }
  }

  return result;
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to react.");

  // Check for existing reaction
  const { data: existing, error: selErr } = await supabase
    .from("comment_reactions")
    .select("id, reaction_type")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr && selErr.message.includes("comment_reactions")) {
    // Table may not exist yet — silently fail
    return { emoji: reactionType };
  }

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // Same emoji — toggle off
      await supabase.from("comment_reactions").delete().eq("id", existing.id);
      return { emoji: null };
    }
    // Different emoji — update
    await supabase.from("comment_reactions").update({ reaction_type: reactionType }).eq("id", existing.id);
    return { emoji: reactionType };
  }

  // No existing reaction — insert
  await supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: user.id, reaction_type: reactionType });
  return { emoji: reactionType };
}

/**
 * Fetch the current user's reactions for a batch of comment IDs.
 * Returns a map of commentId → emoji string (only for comments the user reacted to).
 */
export async function getCommentReactions(commentIds: string[]): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !commentIds.length) return {};

  try {
    const { data } = await supabase
      .from("comment_reactions")
      .select("comment_id, reaction_type")
      .eq("user_id", user.id)
      .in("comment_id", commentIds);

    const result: Record<string, string> = {};
    for (const row of data ?? []) {
      result[row.comment_id] = row.reaction_type;
    }
    return result;
  } catch {
    // Table may not exist yet
    return {};
  }
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
