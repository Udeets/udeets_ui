import type { HubPollSettingsPersisted } from "@/lib/hub-content";

function coerceBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

/**
 * Poll settings are stored on the poll attachment as JSON. Keys may be camelCase
 * or snake_case depending on client version; booleans may rarely be stringified.
 */
export function normalizePollSettings(raw: unknown): HubPollSettingsPersisted | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  const deadlineRaw = r.deadline ?? r.deadline_at;
  const deadline =
    typeof deadlineRaw === "string" && deadlineRaw.trim() ? deadlineRaw.trim() : null;

  const multiRaw = r.multiSelectLimit ?? r.multi_select_limit;
  let multiSelectLimit: number | null | undefined;
  if (multiRaw === null || multiRaw === undefined || multiRaw === "") multiSelectLimit = null;
  else if (typeof multiRaw === "number" && Number.isFinite(multiRaw)) multiSelectLimit = multiRaw;
  else if (typeof multiRaw === "string" && multiRaw.trim()) {
    const n = Number(multiRaw);
    multiSelectLimit = Number.isFinite(n) ? n : undefined;
  } else multiSelectLimit = undefined;

  return {
    allowAnyoneToAdd: coerceBool(r.allowAnyoneToAdd ?? r.allow_anyone_to_add),
    allowMultiSelect: coerceBool(r.allowMultiSelect ?? r.allow_multi_select),
    multiSelectLimit,
    allowSecretVoting: coerceBool(r.allowSecretVoting ?? r.allow_secret_voting),
    deadline,
    showResults:
      typeof r.showResults === "string"
        ? (r.showResults as HubPollSettingsPersisted["showResults"])
        : typeof r.show_results === "string"
          ? (r.show_results as HubPollSettingsPersisted["showResults"])
          : undefined,
    sortBy:
      typeof r.sortBy === "string"
        ? (r.sortBy as HubPollSettingsPersisted["sortBy"])
        : typeof r.sort_by === "string"
          ? (r.sort_by as HubPollSettingsPersisted["sortBy"])
          : undefined,
  };
}

/** True when `deadline` is a valid instant in the past (poll voting closed). */
export function isPollDeadlinePassed(deadline: string | null | undefined): boolean {
  if (!deadline || typeof deadline !== "string" || !deadline.trim()) return false;
  const t = new Date(deadline.trim()).getTime();
  if (Number.isNaN(t)) return false;
  return t <= Date.now();
}
