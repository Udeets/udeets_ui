import type { HubContent, HubFeedItemKind } from "@/lib/hub-content";
import { isGenericDeetTitle } from "@/lib/deets/deet-title";
import { clampPollMultiSelectLimit } from "@/lib/deets/poll-multi-select-limit";
import { normalizePollSettings } from "@/lib/deets/normalize-poll-settings";
import { INITIAL_DEET_SETTINGS, type DeetSettingsState } from "../deetTypes";
import type {
  ComposerAlertExtension,
  ComposerContentKind,
  ComposerEventExtension,
  ComposerJobsExtension,
  ComposerPaymentExtension,
  ComposerPollExtension,
  ComposerSurveyQuestion,
  ComposerTypePayload,
} from "./composerTypes";
import { defaultTypePayload } from "./composerTypes";
import { normalizeEventTimeTo24h } from "./composerTimeFormat";
import { parseSurveyAttachmentQuestions } from "../surveyFeedParse";

const STRUCTURED_FALLBACK_TITLES = new Set(["Announcement", "Notice"]);

/** Turn stored plain `detail` into minimal HTML for the rich-text composer when `body` was empty. */
function plainDetailToComposerHtml(detail: string): string {
  const t = detail.trim();
  if (!t) return "";
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${esc}</p>`;
}

/** Merge `deet_options` from the feed row into full composer settings for edit. */
export function deetSettingsStateFromHubFeedItem(item: HubContent["feed"][number]): DeetSettingsState {
  const o = item.deetOptions;
  if (!o) return { ...INITIAL_DEET_SETTINGS };
  return {
    ...INITIAL_DEET_SETTINGS,
    ...(typeof o.commentsEnabled === "boolean" ? { commentsEnabled: o.commentsEnabled } : {}),
    ...(typeof o.reactionsEnabled === "boolean" ? { reactionsEnabled: o.reactionsEnabled } : {}),
    ...(typeof o.pinToTop === "boolean" ? { pinToTop: o.pinToTop } : {}),
    ...(o.publishTiming === "now" || o.publishTiming === "scheduled" ? { publishTiming: o.publishTiming } : {}),
    ...(typeof o.scheduledAt === "string" ? { scheduledAt: o.scheduledAt } : {}),
    ...(o.audience ? { audience: o.audience } : {}),
    ...(o.localFeedTag !== undefined ? { localFeedTag: o.localFeedTag } : {}),
  };
}

function composerKindFromStructuredAttachments(item: HubContent["feed"][number]): ComposerContentKind | null {
  const atts = item.deetAttachments;
  if (!atts?.length) return null;
  // Keep priority aligned with `resolveHubFeedItemKind` (jobs → poll → …).
  if (atts.some((a) => a.type === "jobs")) return "jobs";
  if (atts.some((a) => a.type === "poll")) return "poll";
  if (atts.some((a) => a.type === "announcement")) return "announcement";
  if (atts.some((a) => a.type === "notice")) return "notice";
  if (atts.some((a) => a.type === "event")) return "event";
  if (atts.some((a) => a.type === "survey")) return "survey";
  if (atts.some((a) => a.type === "payment")) return "payment";
  if (atts.some((a) => a.type === "alert")) return "alert";
  return null;
}

function surveyQuestionsFromAttachmentOptions(options: string[] | undefined): ComposerSurveyQuestion[] | null {
  const rows = parseSurveyAttachmentQuestions(options);
  const questions: ComposerSurveyQuestion[] = rows
    .filter((r) => r.question.trim() && r.choices.length >= 2)
    .map((r) => ({ question: r.question, options: r.choices }));
  return questions.length ? questions : null;
}

function parsePaymentFromAttachmentDetail(detail: string): Pick<ComposerPaymentExtension, "amount" | "paymentNote"> {
  const d = detail.trim();
  const m = d.match(/^\$\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[—-]\s*(.+))?$/u);
  if (!m) return { amount: "", paymentNote: "" };
  return { amount: m[1] ?? "", paymentNote: (m[2] ?? "").trim() };
}

/** Best-effort parse of `mapComposerStateToSubmitParts` event `detail` strings: `YYYY-MM-DD at time · location`. */
function parseEventDetailForComposer(detail: string): Partial<ComposerEventExtension> | null {
  const raw = detail.trim();
  if (!raw) return null;
  const withLoc = raw.match(/^(\d{4}-\d{2}-\d{2})(?:\s+at\s+(.+?))?(?:\s·\s(.+))?$/);
  if (withLoc) {
    return {
      date: withLoc[1] ?? "",
      time: normalizeEventTimeTo24h((withLoc[2] ?? "").trim()),
      location: (withLoc[3] ?? "").trim(),
    };
  }
  const dateOnly = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) return { date: dateOnly[1] ?? "", time: "", location: "" };
  return null;
}

export function hubFeedKindToComposerKind(kind: HubFeedItemKind): ComposerContentKind {
  switch (kind) {
    case "announcement":
      return "announcement";
    case "notice":
      return "notice";
    case "poll":
      return "poll";
    case "event":
      return "event";
    case "jobs":
      return "jobs";
    case "survey":
      return "survey";
    case "payment":
      return "payment";
    case "photo":
    case "file":
      return "post";
    case "alert":
    case "hazard":
      return "alert";
    case "news":
    case "deal":
      return "alert";
    default:
      return "post";
  }
}

export function hydrateComposerFromHubFeedItem(item: HubContent["feed"][number]): {
  composerKind: ComposerContentKind;
  composerTitle: string;
  composerBodyHtml: string;
  composerTypePayload: ComposerTypePayload;
  editPersistedGalleryUrls: string[];
} {
  const composerKind = composerKindFromStructuredAttachments(item) ?? hubFeedKindToComposerKind(item.kind);
  let title = item.title?.trim() ?? "";
  if (isGenericDeetTitle(title)) title = "";

  if (
    composerKind === "announcement" ||
    composerKind === "notice" ||
    composerKind === "survey" ||
    composerKind === "payment" ||
    composerKind === "alert"
  ) {
    const structured = item.deetAttachments?.find((a) => a.type === composerKind);
    const attTitle = structured?.title?.trim();
    if (attTitle && !STRUCTURED_FALLBACK_TITLES.has(attTitle) && !isGenericDeetTitle(attTitle)) {
      title = attTitle;
    }
  }

  let composerTypePayload: ComposerTypePayload = defaultTypePayload(composerKind);

  if (composerKind === "poll") {
    const poll = item.deetAttachments?.find((a) => a.type === "poll");
    const opts = poll?.options?.map((o) => o.trim()).filter(Boolean) ?? [];
    if (opts.length >= 2) {
      const base = defaultTypePayload("poll") as ComposerPollExtension;
      const padded = [...opts];
      while (padded.length < 3) padded.push("");
      const ps = normalizePollSettings(poll?.pollSettings) ?? poll?.pollSettings;
      const deadlineStr =
        typeof ps?.deadline === "string" && ps.deadline.trim() ? ps.deadline.trim() : "";
      const rawMultiLimit =
        ps?.multiSelectLimit !== undefined ? ps.multiSelectLimit : base.pollSettings.multiSelectLimit;
      composerTypePayload = {
        ...base,
        options: padded,
        deadlineEnabled: Boolean(deadlineStr),
        deadlineInput: deadlineStr,
        pollSettings: {
          ...base.pollSettings,
          allowAnyoneToAdd: ps?.allowAnyoneToAdd ?? base.pollSettings.allowAnyoneToAdd,
          allowMultiSelect: ps?.allowMultiSelect ?? base.pollSettings.allowMultiSelect,
          multiSelectLimit: clampPollMultiSelectLimit(rawMultiLimit, opts.length),
          allowSecretVoting: ps?.allowSecretVoting ?? base.pollSettings.allowSecretVoting,
          deadline: deadlineStr || null,
          showResults:
            (ps?.showResults as ComposerPollExtension["pollSettings"]["showResults"]) ??
            base.pollSettings.showResults,
          sortBy: (ps?.sortBy as ComposerPollExtension["pollSettings"]["sortBy"]) ?? base.pollSettings.sortBy,
        },
      } as ComposerTypePayload;
    }
  }

  if (composerKind === "event") {
    const evAtt = item.deetAttachments?.find((a) => a.type === "event");
    const base = defaultTypePayload("event") as ComposerEventExtension;
    if (!title && evAtt?.title?.trim() && !isGenericDeetTitle(evAtt.title)) {
      title = evAtt.title.trim();
    }
    if (evAtt?.eventData) {
      const ed = evAtt.eventData;
      composerTypePayload = {
        ...base,
        date: (ed.date ?? "").trim(),
        time: normalizeEventTimeTo24h((ed.time ?? "").trim()),
        location: (ed.location ?? "").trim(),
      } as ComposerTypePayload;
    } else if (evAtt?.detail) {
      const parsed = parseEventDetailForComposer(evAtt.detail);
      if (parsed) {
        composerTypePayload = { ...base, ...parsed } as ComposerTypePayload;
      }
    }
  }

  if (composerKind === "jobs") {
    const jobsAtt = item.deetAttachments?.find((a) => a.type === "jobs");
    const base = defaultTypePayload("jobs") as ComposerJobsExtension;
    if (!title && jobsAtt?.title?.trim() && !isGenericDeetTitle(jobsAtt.title)) {
      title = jobsAtt.title.trim();
    }
    let fromMeta: Partial<ComposerJobsExtension> | null = null;
    if (jobsAtt?.meta) {
      try {
        fromMeta = JSON.parse(jobsAtt.meta) as Partial<ComposerJobsExtension>;
      } catch {
        fromMeta = null;
      }
    }
    const jd = jobsAtt?.jobData;
    if (fromMeta || jd) {
      composerTypePayload = {
        ...base,
        rolesAndResponsibilities:
          fromMeta?.rolesAndResponsibilities ??
          jd?.rolesAndResponsibilities ??
          jobsAtt?.detail?.trim() ??
          "",
        pay: fromMeta?.pay ?? jd?.pay ?? "",
        kind: fromMeta?.kind ?? jd?.kind ?? "full_time",
        timings: fromMeta?.timings ?? jd?.timings ?? "",
        daysPerWeek: fromMeta?.daysPerWeek ?? jd?.daysPerWeek ?? "",
      } as ComposerTypePayload;
    } else if (jobsAtt?.detail) {
      composerTypePayload = { ...base, rolesAndResponsibilities: jobsAtt.detail } as ComposerTypePayload;
    }
  }

  if (composerKind === "survey") {
    const surveyAtt = item.deetAttachments?.find((a) => a.type === "survey");
    const parsed = surveyQuestionsFromAttachmentOptions(surveyAtt?.options);
    if (parsed) {
      composerTypePayload = { ...defaultTypePayload("survey"), questions: parsed } as ComposerTypePayload;
    }
  }

  if (composerKind === "payment") {
    const payAtt = item.deetAttachments?.find((a) => a.type === "payment");
    const base = defaultTypePayload("payment") as ComposerPaymentExtension;
    if (payAtt?.detail) {
      const parsed = parsePaymentFromAttachmentDetail(payAtt.detail);
      composerTypePayload = { ...base, ...parsed } as ComposerTypePayload;
    }
  }

  if (composerKind === "alert") {
    const alertAtt = item.deetAttachments?.find((a) => a.type === "alert");
    const base = defaultTypePayload("alert") as ComposerAlertExtension;
    let level: ComposerAlertExtension["level"] = "warning";
    const det = alertAtt?.detail?.trim() ?? "";
    const lm = det.match(/^\[(INFO|WARNING|URGENT)\]\s*/i);
    if (lm) {
      const L = lm[1].toLowerCase();
      if (L === "info") level = "info";
      else if (L === "urgent") level = "urgent";
      else level = "warning";
    }
    composerTypePayload = { ...base, level } as ComposerTypePayload;
  }

  if (composerKind === "post") {
    const ci = item.deetAttachments?.find((a) => a.type === "checkin");
    if (ci?.title?.trim()) {
      const base = defaultTypePayload("post");
      const place = ci.title.replace(/^📍\s*/u, "").trim();
      composerTypePayload = { ...base, placeName: place, address: (ci.detail ?? "").trim() } as ComposerTypePayload;
    }
  }

  const imgs: string[] = [...(item.images ?? [])];
  if (!imgs.length && item.image) imgs.push(item.image);
  const editPersistedGalleryUrls = imgs.filter(
    (u) => typeof u === "string" && u.trim().length > 0 && !u.startsWith("data:") && !u.startsWith("blob:"),
  );

  let composerBodyHtml = item.body?.trim() ?? "";
  if (!composerBodyHtml) {
    const structured = item.deetAttachments?.find((a) => a.type === composerKind);
    if (
      structured?.detail?.trim() &&
      (composerKind === "announcement" ||
        composerKind === "notice" ||
        composerKind === "payment" ||
        composerKind === "alert")
    ) {
      composerBodyHtml = plainDetailToComposerHtml(structured.detail);
    }
    if (!composerBodyHtml && composerKind === "jobs") {
      const jobsAtt = item.deetAttachments?.find((a) => a.type === "jobs");
      const jd = jobsAtt?.jobData?.rolesAndResponsibilities?.trim() || jobsAtt?.detail?.trim();
      if (jd) composerBodyHtml = plainDetailToComposerHtml(jd);
    }
  }

  return {
    composerKind,
    composerTitle: title,
    composerBodyHtml,
    composerTypePayload,
    editPersistedGalleryUrls,
  };
}
