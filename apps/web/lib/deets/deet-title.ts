/** Type-only labels that shouldn't be shown as prominent titles */
export const GENERIC_DEET_TITLE_LABELS = new Set([
  "Deet",
  "Notice",
  "Announcement",
  "Photo",
  "Event",
  "File",
  "News",
  "Deal",
  "Hazard",
  "Alert",
  "Poll",
  "Jobs",
  "Survey",
  "Fundraiser",
  "Job Posting",
  "Payment Request",
]);

export function isGenericDeetTitle(title: string | null | undefined): boolean {
  if (!title) return true;
  return GENERIC_DEET_TITLE_LABELS.has(title.trim());
}
