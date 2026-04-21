/** One survey question as stored on the `survey` attachment `options` array (`"Q: a, b, c"`). */
export type ParsedSurveyQuestion = { question: string; choices: string[] };

export function parseSurveyAttachmentQuestions(options: string[] | undefined): ParsedSurveyQuestion[] {
  if (!options?.length) return [];
  const out: ParsedSurveyQuestion[] = [];
  for (const line of options) {
    const s = typeof line === "string" ? line : "";
    const colon = s.indexOf(": ");
    const question = colon >= 0 ? s.slice(0, colon).trim() : s.trim();
    const rest = colon >= 0 ? s.slice(colon + 2).trim() : "";
    const choices = rest ? rest.split(", ").map((o) => o.trim()).filter(Boolean) : [];
    if (question || choices.length) {
      out.push({ question: question || "Question", choices });
    }
  }
  return out;
}

export function surveyOptionsFingerprint(options: string[]): string {
  return options.join("\u0001");
}
