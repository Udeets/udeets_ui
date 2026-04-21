import { createClient } from "@/lib/supabase/client";

export interface PollVote {
  deetId: string;
  userId: string;
  optionIndex: number;
}

/** Get all votes for a set of deet IDs */
export async function getPollVotes(deetIds: string[]): Promise<PollVote[]> {
  if (!deetIds.length) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("poll_votes")
    .select("deet_id, user_id, option_index")
    .in("deet_id", deetIds);

  if (error) {
    console.error("[poll-votes] fetch error:", error);
    return [];
  }

  return (data ?? []).map((row: { deet_id: string; user_id: string; option_index: number }) => ({
    deetId: row.deet_id,
    userId: row.user_id,
    optionIndex: row.option_index,
  }));
}

/** Get current user's votes for a set of deet IDs */
export async function getMyPollVotes(deetIds: string[]): Promise<PollVote[]> {
  if (!deetIds.length) return [];
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("poll_votes")
    .select("deet_id, user_id, option_index")
    .eq("user_id", user.id)
    .in("deet_id", deetIds);

  if (error) {
    console.error("[poll-votes] fetch my votes error:", error);
    return [];
  }

  return (data ?? []).map((row: { deet_id: string; user_id: string; option_index: number }) => ({
    deetId: row.deet_id,
    userId: row.user_id,
    optionIndex: row.option_index,
  }));
}

/** Cast a vote (single-select: removes existing votes first) */
export async function castPollVote(deetId: string, optionIndex: number): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error: deleteError } = await supabase
    .from("poll_votes")
    .delete()
    .eq("deet_id", deetId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[poll-votes] delete before cast error:", deleteError);
    return false;
  }

  const { error } = await supabase
    .from("poll_votes")
    .insert({ deet_id: deetId, user_id: user.id, option_index: optionIndex });

  if (error) {
    console.error("[poll-votes] cast error:", error);
    return false;
  }

  return true;
}

type PollVoteRow = { id: string; option_index: number; created_at: string };

/**
 * Multi-select: tap an option to add it; tap again to remove. Enforces `multiSelectLimit` (null = unlimited).
 */
export async function togglePollMultiVote(
  deetId: string,
  optionIndex: number,
  multiSelectLimit: number | null,
): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: rows, error: fetchError } = await supabase
    .from("poll_votes")
    .select("id, option_index, created_at")
    .eq("deet_id", deetId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("[poll-votes] toggle fetch error:", fetchError);
    return false;
  }

  const mine = (rows ?? []) as PollVoteRow[];
  const hit = mine.find((r) => r.option_index === optionIndex);
  if (hit) {
    const { error } = await supabase.from("poll_votes").delete().eq("id", hit.id);
    if (error) {
      console.error("[poll-votes] toggle remove error:", error);
      return false;
    }
    return true;
  }

  const limit = multiSelectLimit == null ? Number.POSITIVE_INFINITY : Math.max(1, multiSelectLimit);
  if (mine.length >= limit) {
    const oldest = mine[0];
    if (oldest?.id) {
      const { error: evictError } = await supabase.from("poll_votes").delete().eq("id", oldest.id);
      if (evictError) {
        console.error("[poll-votes] toggle evict error:", evictError);
        return false;
      }
    }
  }

  const { error } = await supabase
    .from("poll_votes")
    .insert({ deet_id: deetId, user_id: user.id, option_index: optionIndex });

  if (error) {
    console.error("[poll-votes] toggle insert error:", error);
    return false;
  }

  return true;
}

/** Remove all user's votes for a poll */
export async function removePollVote(deetId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("poll_votes")
    .delete()
    .eq("deet_id", deetId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[poll-votes] remove error:", error);
    return false;
  }

  return true;
}
