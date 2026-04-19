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

/**
 * Cast a vote on a single-select poll. Deletes ALL of the user's existing
 * votes for this deet, then inserts the new one. Runs the delete and insert
 * sequentially so we never end up with two rows for the same user on the
 * same poll (which is what caused the "both options stay selected" bug).
 */
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
    console.error("[poll-votes] clear-before-cast error:", deleteError);
    // Don't insert a new row if the cleanup failed — that's exactly how
    // duplicate votes stacked up previously.
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

/**
 * Toggle a vote on a multi-select poll. If the user already voted on this
 * option, removes it. Otherwise inserts it. Relies on the unique constraint
 * (deet_id, user_id, option_index) to prevent double-insert on the server.
 */
export async function togglePollVote(deetId: string, optionIndex: number): Promise<{ active: boolean } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing, error: lookupError } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("deet_id", deetId)
    .eq("user_id", user.id)
    .eq("option_index", optionIndex)
    .maybeSingle();

  if (lookupError) {
    console.error("[poll-votes] toggle lookup error:", lookupError);
    return null;
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("poll_votes")
      .delete()
      .eq("id", existing.id);
    if (delErr) {
      console.error("[poll-votes] toggle delete error:", delErr);
      return null;
    }
    return { active: false };
  }

  const { error: insErr } = await supabase
    .from("poll_votes")
    .insert({ deet_id: deetId, user_id: user.id, option_index: optionIndex });
  if (insErr) {
    console.error("[poll-votes] toggle insert error:", insErr);
    return null;
  }
  return { active: true };
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
