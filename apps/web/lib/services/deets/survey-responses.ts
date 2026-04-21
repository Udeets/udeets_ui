import { createClient } from "@/lib/supabase/client";

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

type Row = {
  deet_id: string;
  user_id: string;
  question_index: number;
  option_index: number;
  fingerprint: string;
  created_at: string;
};

function mapRow(row: Row): SurveyResponse {
  return {
    deetId: row.deet_id,
    userId: row.user_id,
    questionIndex: row.question_index,
    optionIndex: row.option_index,
    fingerprint: row.fingerprint,
    createdAt: row.created_at,
  };
}

/** Current user's survey answer rows for the given deets. */
export async function getMySurveyResponses(deetIds: string[]): Promise<SurveyResponse[]> {
  if (!deetIds.length) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("survey_responses")
    .select("deet_id, user_id, question_index, option_index, fingerprint, created_at")
    .eq("user_id", user.id)
    .in("deet_id", deetIds);

  if (error) {
    console.error("[survey-responses] fetch mine error:", error);
    return [];
  }

  return (data ?? []).map((r: Row) => mapRow(r));
}

/**
 * Replace this user's answers for the deet. Caller must pass one index per question in order.
 */
export async function submitSurveyResponses(
  deetId: string,
  fingerprint: string,
  answers: number[],
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error: delErr } = await supabase.from("survey_responses").delete().eq("deet_id", deetId).eq("user_id", user.id);

  if (delErr) {
    console.error("[survey-responses] delete before submit:", delErr);
    return false;
  }

  const rows = answers.map((optionIndex, questionIndex) => ({
    deet_id: deetId,
    user_id: user.id,
    question_index: questionIndex,
    option_index: optionIndex,
    fingerprint,
  }));

  const { error: insErr } = await supabase.from("survey_responses").insert(rows);

  if (insErr) {
    console.error("[survey-responses] insert error:", insErr);
    return false;
  }

  return true;
}

/** Remove all of this user's answers for a survey (e.g. "change my answers"). */
export async function deleteMySurveyResponses(deetId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("survey_responses").delete().eq("deet_id", deetId).eq("user_id", user.id);

  if (error) {
    console.error("[survey-responses] delete error:", error);
    return false;
  }

  return true;
}
