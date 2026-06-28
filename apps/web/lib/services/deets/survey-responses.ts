import {
  deleteMySurveyResponsesApi,
  getMySurveyResponsesApi,
  submitSurveyResponsesApi,
} from "@/lib/api/deet-surveys";

/** Fired on `window` after survey responses change so mounted {@link SurveyContent} can refetch. */
export const UDEETS_SURVEY_RESPONSE_UPDATED_EVENT = "udeets-survey-response-updated";

export interface SurveyResponse {
  deetId: string;
  userId: string;
  questionIndex: number;
  optionIndex: number;
  fingerprint: string;
  createdAt: string;
}

/** Current user's survey answer rows for the given deets. */
export async function getMySurveyResponses(deetIds: string[]): Promise<SurveyResponse[]> {
  try {
    return await getMySurveyResponsesApi(deetIds);
  } catch (error) {
    console.error("[survey-responses] fetch mine error:", error);
    return [];
  }
}

/**
 * Replace this user's answers for the deet. Caller must pass one index per question in order.
 */
export async function submitSurveyResponses(
  deetId: string,
  fingerprint: string,
  answers: number[],
): Promise<boolean> {
  try {
    return await submitSurveyResponsesApi(deetId, fingerprint, answers);
  } catch (error) {
    console.error("[survey-responses] submit error:", error);
    return false;
  }
}

/** Remove all of this user's answers for a survey (e.g. "change my answers"). */
export async function deleteMySurveyResponses(deetId: string): Promise<boolean> {
  try {
    return await deleteMySurveyResponsesApi(deetId);
  } catch (error) {
    console.error("[survey-responses] delete error:", error);
    return false;
  }
}
