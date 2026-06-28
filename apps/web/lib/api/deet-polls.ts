import { apiFetch } from "@/lib/api/client";
import type { PollVote } from "@/lib/services/deets/poll-votes";

export async function getPollVotesApi(deetIds: string[], mineOnly = false): Promise<PollVote[]> {
  if (!deetIds.length) return [];
  const response = await apiFetch<{ votes: PollVote[] }>("/deets/polls/votes", {
    query: { ids: deetIds.join(","), mineOnly },
  });
  return response.votes ?? [];
}

export async function castPollVoteApi(deetId: string, optionIndex: number): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/deets/${encodeURIComponent(deetId)}/polls/vote`, {
    method: "POST",
    body: { optionIndex },
  });
  return Boolean(response.ok);
}

export async function togglePollMultiVoteApi(
  deetId: string,
  optionIndex: number,
  multiSelectLimit: number | null,
): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(
    `/deets/${encodeURIComponent(deetId)}/polls/vote/toggle`,
    {
      method: "POST",
      body: { optionIndex, multiSelectLimit },
    },
  );
  return Boolean(response.ok);
}

export async function removePollVoteApi(deetId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/deets/${encodeURIComponent(deetId)}/polls/vote`, {
    method: "DELETE",
  });
  return Boolean(response.ok);
}
