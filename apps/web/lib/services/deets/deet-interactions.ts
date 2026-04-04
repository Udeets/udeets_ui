import { createClient } from "@/lib/supabase/client";

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

  // Update denormalized count
  await supabase.from("deets").update({ like_count: likeCount }).eq("id", deetId);

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

  const { data, error } = await supabase
    .from("deet_comments")
    .insert({ deet_id: deetId, user_id: user.id, body: trimmed })
    .select("id, deet_id, user_id, body, created_at, profiles:user_id(full_name, avatar_url)")
    .single();

  if (error) throw new Error(`Failed to add comment: ${error.message}`);

  // Update denormalized count
  const { count } = await supabase
    .from("deet_comments")
    .select("*", { count: "exact", head: true })
    .eq("deet_id", deetId);

  await supabase.from("deets").update({ comment_count: count ?? 0 }).eq("id", deetId);

  const profile = data.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;

  return {
    id: data.id,
    deetId: data.deet_id,
    userId: data.user_id,
    body: data.body,
    createdAt: data.created_at,
    authorName: profile?.full_name ?? undefined,
    authorAvatar: profile?.avatar_url ?? undefined,
  };
}

export async function listDeetComments(deetId: string): Promise<DeetComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("deet_comments")
    .select("id, deet_id, user_id, body, created_at, profiles:user_id(full_name, avatar_url)")
    .eq("deet_id", deetId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw new Error(`Failed to load comments: ${error.message}`);

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
    return {
      id: row.id,
      deetId: row.deet_id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      authorName: profile?.full_name ?? undefined,
      authorAvatar: profile?.avatar_url ?? undefined,
    };
  });
}

// ── Views ──────────────────────────────────────────────────────────

export async function incrementDeetView(deetId: string): Promise<void> {
  const supabase = createClient();

  // Simple increment — no user tracking needed for views
  const { data } = await supabase
    .from("deets")
    .select("view_count")
    .eq("id", deetId)
    .single();

  const currentCount = data?.view_count ?? 0;
  await supabase
    .from("deets")
    .update({ view_count: currentCount + 1 })
    .eq("id", deetId);
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
