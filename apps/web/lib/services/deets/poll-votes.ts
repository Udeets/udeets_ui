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

  // Remove existing votes for this poll (single-select behavior)
  await supabase
    .from("poll_votes")
    .delete()
    .eq("deet_id", deetId)
    .eq("user_id", user.id);

  // Insert new vote
  const { error } = await supabase
    .from("poll_votes")
    .insert({ deet_id: deetId, user_id: user.id, option_index: optionIndex });

  if (error) {
    console.error("[poll-votes] cast error:", error);
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
