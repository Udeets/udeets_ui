/**
 * Max number of answers one voter may select in a multi-select poll.
 * Cannot exceed the number of poll options (hub polls allow up to 10 options).
 */
export function maxPollMultiSelectAnswers(filledOptionCount: number): number {
  return Math.max(2, Math.min(10, filledOptionCount));
}

/** Clamp stored multi-select limit so it never exceeds the number of poll answers. */
export function clampPollMultiSelectLimit(
  limit: number | null | undefined,
  filledOptionCount: number,
): number | null {
  if (limit == null) return null;
  const cap = maxPollMultiSelectAnswers(filledOptionCount);
  return Math.min(limit, cap);
}
