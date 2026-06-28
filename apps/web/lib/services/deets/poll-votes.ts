import {
  castPollVoteApi,
  getPollVotesApi,
  removePollVoteApi,
  togglePollMultiVoteApi,
} from "@/lib/api/deet-polls";

export interface PollVote {
  deetId: string;
  userId: string;
  optionIndex: number;
}

/** Get all votes for a set of deet IDs */
export async function getPollVotes(deetIds: string[]): Promise<PollVote[]> {
  try {
    return await getPollVotesApi(deetIds, false);
  } catch (error) {
    console.error("[poll-votes] fetch error:", error);
    return [];
  }
}

/** Get current user's votes for a set of deet IDs */
export async function getMyPollVotes(deetIds: string[]): Promise<PollVote[]> {
  try {
    return await getPollVotesApi(deetIds, true);
  } catch (error) {
    console.error("[poll-votes] fetch my votes error:", error);
    return [];
  }
}

/**
 * Cast a vote on a single-select poll. Deletes ALL of the user's existing
 * votes for this deet, then inserts the new one. Runs the delete and insert
 * sequentially so we never end up with two rows for the same user on the
 * same poll (which is what caused the "both options stay selected" bug).
 */
export async function castPollVote(deetId: string, optionIndex: number): Promise<boolean> {
  try {
    return await castPollVoteApi(deetId, optionIndex);
  } catch (error) {
    console.error("[poll-votes] cast error:", error);
    return false;
  }
}

/**
 * Multi-select: tap an option to add it; tap again to remove. Enforces `multiSelectLimit` (null = unlimited).
 */
export async function togglePollMultiVote(
  deetId: string,
  optionIndex: number,
  multiSelectLimit: number | null,
): Promise<boolean> {
  try {
    return await togglePollMultiVoteApi(deetId, optionIndex, multiSelectLimit);
  } catch (error) {
    console.error("[poll-votes] toggle error:", error);
    return false;
  }
}

/** Remove all user's votes for a poll */
export async function removePollVote(deetId: string): Promise<boolean> {
  try {
    return await removePollVoteApi(deetId);
  } catch (error) {
    console.error("[poll-votes] remove error:", error);
    return false;
  }
}
