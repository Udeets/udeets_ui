import { apiFetch } from "@/lib/api/client";
import type { SurveyResponse } from "@/lib/services/deets/survey-responses";

export async function getMySurveyResponsesApi(deetIds: string[]): Promise<SurveyResponse[]> {
  if (!deetIds.length) return [];
  const response = await apiFetch<{ responses: SurveyResponse[] }>("/deets/surveys/responses", {
    query: { ids: deetIds.join(",") },
  });
  return response.responses ?? [];
}

export async function submitSurveyResponsesApi(
  deetId: string,
  fingerprint: string,
  answers: number[],
): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(
    `/deets/${encodeURIComponent(deetId)}/surveys/responses`,
    {
      method: "PUT",
      body: { fingerprint, answers },
    },
  );
  return Boolean(response.ok);
}

export async function deleteMySurveyResponsesApi(deetId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(
    `/deets/${encodeURIComponent(deetId)}/surveys/responses`,
    {
      method: "DELETE",
    },
  );
  return Boolean(response.ok);
}
