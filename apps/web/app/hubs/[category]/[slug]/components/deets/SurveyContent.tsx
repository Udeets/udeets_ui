"use client";

import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HubFeedItemAttachment } from "@/lib/hub-content";
import { FeedPostBody } from "@/components/deets/FeedPostBody";
import { cn } from "../hubUtils";
import { parseSurveyAttachmentQuestions, surveyOptionsFingerprint } from "./surveyFeedParse";
import type { SurveyResponse } from "@/lib/services/deets/survey-responses";
import {
  UDEETS_SURVEY_RESPONSE_UPDATED_EVENT,
  deleteMySurveyResponses,
  getMySurveyResponses,
  submitSurveyResponses,
} from "@/lib/services/deets/survey-responses";

type SubmittedPayload = {
  fingerprint: string;
  answers: number[];
  submittedAt: string;
};

function payloadFromRows(
  rows: SurveyResponse[],
  deetId: string,
  expectedFingerprint: string,
  questionCount: number,
): SubmittedPayload | null {
  const mine = rows.filter((r) => r.deetId === deetId && r.fingerprint === expectedFingerprint);
  if (mine.length !== questionCount || questionCount === 0) return null;
  const byQ = [...mine].sort((a, b) => a.questionIndex - b.questionIndex);
  for (let i = 0; i < questionCount; i++) {
    if (byQ[i].questionIndex !== i) return null;
  }
  const answers = byQ.map((r) => r.optionIndex);
  const submittedAt = byQ.reduce((m, r) => (r.createdAt > m ? r.createdAt : m), byQ[0].createdAt);
  return { fingerprint: expectedFingerprint, answers, submittedAt };
}

export function SurveyContent({
  deetId,
  attachments,
  bodyHtml,
}: {
  deetId: string;
  /** Reserved for future optimistic UI; auth is resolved via Supabase `getUser`. */
  currentUserId?: string | null;
  attachments?: HubFeedItemAttachment[];
  bodyHtml?: string | undefined;
}) {
  const matchingAtt = attachments?.find((a) => a.type === "survey");
  const optionsKey = (matchingAtt?.options ?? []).join("\u0001");
  const questions = useMemo(
    () => parseSurveyAttachmentQuestions(matchingAtt?.options ?? []),
    [optionsKey],
  );
  const fingerprint = useMemo(() => surveyOptionsFingerprint(matchingAtt?.options ?? []), [optionsKey]);
  const showRichBody = Boolean(bodyHtml?.trim());

  const [selections, setSelections] = useState<number[]>(() => questions.map(() => -1));
  const [submitted, setSubmitted] = useState<SubmittedPayload | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [canRespond, setCanRespond] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadSurveyState = useCallback(async () => {
    if (!deetId) return;
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCanRespond(Boolean(user));

      const rows = user ? await getMySurveyResponses([deetId]) : [];
      const payload = payloadFromRows(rows, deetId, fingerprint, questions.length);
      setSubmitted(payload);
      if (payload?.answers && payload.answers.length === questions.length) {
        setSelections([...payload.answers]);
      } else {
        setSelections(questions.map(() => -1));
      }
    } catch {
      setCanRespond(false);
      setSubmitted(null);
      setSelections(questions.map(() => -1));
    } finally {
      setLoading(false);
    }
  }, [deetId, fingerprint, questions]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadSurveyState();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSurveyState]);

  useEffect(() => {
    if (typeof window === "undefined" || !deetId) return;
    const onSync = (ev: Event) => {
      const detail = (ev as CustomEvent<{ deetId: string }>).detail;
      if (detail?.deetId !== deetId) return;
      void loadSurveyState();
    };
    window.addEventListener(UDEETS_SURVEY_RESPONSE_UPDATED_EVENT, onSync);
    return () => window.removeEventListener(UDEETS_SURVEY_RESPONSE_UPDATED_EVENT, onSync);
  }, [deetId, loadSurveyState]);

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q, i) => selections[i] >= 0 && selections[i] < q.choices.length),
    [questions, selections],
  );

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!canRespond) {
      setSubmitError("Please sign in to submit your responses.");
      return;
    }
    if (!allAnswered) {
      setSubmitError("Please answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await submitSurveyResponses(deetId, fingerprint, [...selections]);
      if (!ok) {
        setSubmitError("Could not save responses. Check your connection and try again.");
        return;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UDEETS_SURVEY_RESPONSE_UPDATED_EVENT, { detail: { deetId } }));
      }
      await loadSurveyState();
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeAnswer = async () => {
    setSubmitError(null);
    if (!canRespond) return;
    setSubmitting(true);
    try {
      const ok = await deleteMySurveyResponses(deetId);
      if (!ok) {
        setSubmitError("Could not clear responses. Try again.");
        return;
      }
      setSubmitted(null);
      setSelections(questions.map(() => -1));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UDEETS_SURVEY_RESPONSE_UPDATED_EVENT, { detail: { deetId } }));
      }
      await loadSurveyState();
    } finally {
      setSubmitting(false);
    }
  };

  if (!questions.length) {
    return (
      <div className="space-y-2">
        {matchingAtt?.detail ? (
          <p className="text-xs font-medium text-[var(--ud-text-muted)]">{matchingAtt.detail}</p>
        ) : null}
        {showRichBody ? (
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className="text-[15px] leading-relaxed text-[var(--ud-text-primary)] pt-1" />
        ) : (
          <p className="text-sm text-[var(--ud-text-muted)]">No questions on this survey yet.</p>
        )}
      </div>
    );
  }

  const isComplete = Boolean(submitted && submitted.fingerprint === fingerprint);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] py-8 text-sm text-[var(--ud-text-secondary)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-brand-primary)]" aria-hidden />
        Loading survey…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
        <div className="flex items-start gap-3 border-b border-[var(--ud-border-subtle)] bg-violet-50/60 px-3 py-3 dark:bg-violet-950/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
            <ClipboardList className="h-5 w-5 stroke-[1.5]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-800 dark:text-violet-200/90">Survey</p>
            {matchingAtt?.detail ? (
              <p className="mt-0.5 text-sm text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
            ) : (
              <p className="mt-0.5 text-sm text-[var(--ud-text-secondary)]">
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        {!canRespond ? (
          <div className="border-t border-amber-200/80 bg-amber-50/80 px-3 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">Sign in to respond</p>
            <p className="mt-1 text-xs leading-snug text-amber-900/90 dark:text-amber-200/85">
              Your answers are saved to this hub once you&apos;re signed in, so the organizer can see aggregated results.
            </p>
          </div>
        ) : null}

        <div className="space-y-4 px-3 py-4">
          {isComplete ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/25">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">You&apos;re all set</p>
                  <p className="mt-0.5 text-xs leading-snug text-emerald-800/90 dark:text-emerald-200/80">
                    Responses are saved to this hub. You can update them any time with &quot;Change my answers&quot; below.
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40 p-3">
                {questions.map((q, qi) => {
                  const idx = submitted!.answers[qi];
                  const label = idx >= 0 && idx < q.choices.length ? q.choices[idx] : "—";
                  return (
                    <li key={qi} className="text-sm">
                      <p className="font-medium text-[var(--ud-text-primary)]">{q.question}</p>
                      <p className="mt-0.5 text-[var(--ud-text-secondary)]">{label}</p>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={submitting || !canRespond}
                onClick={() => void handleChangeAnswer()}
                className="text-xs font-medium text-[var(--ud-brand-primary)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Change my answers
              </button>
            </div>
          ) : (
            <>
              <ol className="space-y-5">
                {questions.map((q, qi) => {
                  const groupName = `survey-${deetId}-q-${qi}`;
                  const disabled = !canRespond || submitting;
                  return (
                    <li key={qi}>
                      <fieldset className="min-w-0" disabled={disabled}>
                        <legend
                          id={`${groupName}-legend`}
                          className="mb-2 text-sm font-semibold text-[var(--ud-text-primary)]"
                        >
                          <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-900/60 dark:text-violet-100">
                            {qi + 1}
                          </span>
                          {q.question}
                        </legend>
                        {q.choices.length === 0 ? (
                          <p className="text-xs text-[var(--ud-text-muted)]">No answer choices for this question.</p>
                        ) : (
                          <div
                            className="mt-2 flex flex-col gap-2"
                            role="radiogroup"
                            aria-labelledby={`${groupName}-legend`}
                          >
                            {q.choices.map((choice, ci) => {
                              const selected = selections[qi] === ci;
                              return (
                                <label
                                  key={ci}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                                    disabled && "cursor-not-allowed opacity-60",
                                    selected
                                      ? "border-violet-400 bg-violet-50/90 dark:border-violet-700 dark:bg-violet-950/35"
                                      : "border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] hover:border-[var(--ud-border)]",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    className="h-4 w-4 shrink-0 accent-[var(--ud-brand-primary)]"
                                    name={groupName}
                                    checked={selected}
                                    disabled={disabled}
                                    onChange={() =>
                                      setSelections((prev) => {
                                        const next = [...prev];
                                        next[qi] = ci;
                                        return next;
                                      })
                                    }
                                  />
                                  <span className="min-w-0 flex-1 text-[var(--ud-text-primary)]">{choice}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </fieldset>
                    </li>
                  );
                })}
              </ol>

              {submitError ? (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {submitError}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-[var(--ud-border-subtle)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-snug text-[var(--ud-text-muted)]">
                  One submission per signed-in member. If the survey is edited, you may be asked to answer again.
                </p>
                <button
                  type="button"
                  disabled={!allAnswered || submitting || !canRespond}
                  onClick={() => void handleSubmit()}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    "Submit responses"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showRichBody && !isComplete ? (
        <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className="text-[15px] leading-relaxed text-[var(--ud-text-primary)] px-0.5 pt-1" />
      ) : showRichBody && isComplete ? (
        <details className="rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/30 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-[var(--ud-text-secondary)]">More from author</summary>
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]" />
        </details>
      ) : null}
    </div>
  );
}
