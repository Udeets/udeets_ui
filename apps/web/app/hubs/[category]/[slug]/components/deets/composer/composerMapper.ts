import type { DeetKind } from "@/lib/services/deets/deet-types";
import type { DeetSettingsState } from "../deetTypes";
import type {
  ComposerContentKind,
  ComposerTypePayload,
  SerializedComposerAttachment,
} from "./composerTypes";
import { format24hAs12hLabel, normalizeEventTimeTo24h } from "./composerTimeFormat";

export type ComposerMapperInput = {
  composerKind: ComposerContentKind;
  /** Primary heading (poll question, event name, job title, etc.) */
  composerTitle: string;
  bodyHtml: string;
  deetSettings: DeetSettingsState;
  typePayload: ComposerTypePayload;
};

export type ComposerMapperResult = {
  resolvedTitle: string;
  rawBody: string;
  resolvedKind: DeetKind;
  structuredAttachments: SerializedComposerAttachment[];
  /** Event row bridge — same shape as previous HubClient submit branch */
  eventBridge: {
    title: string;
    description: string | undefined;
    eventDate: string;
    startTime: string | undefined;
    location: string | undefined;
  } | null;
};

function stripHtmlToPlain(html: string, maxLen: number): string {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, maxLen);
}

function resolvedKindFromComposer(kind: ComposerContentKind, hasPhotos: boolean): DeetKind {
  switch (kind) {
    case "notice":
      return "Notices";
    case "post":
      return hasPhotos ? "Photos" : "Posts";
    case "alert":
      return "Alerts";
    case "jobs":
      return "Jobs";
    case "announcement":
    case "poll":
    case "event":
    case "survey":
    case "payment":
      return "Posts";
    default:
      return "Posts";
  }
}

function fallbackTitleFromComposer(kind: ComposerContentKind, hasPhotos: boolean): string {
  switch (kind) {
    case "notice":
      return "Notice";
    case "post":
      return hasPhotos ? "Photo" : "Deet";
    case "alert":
      return "Alert";
    case "jobs":
      return "Job";
    default:
      return "Deet";
  }
}

function buildDeetOptionsAttachment(settings: DeetSettingsState): SerializedComposerAttachment {
  return {
    type: "deet_options",
    title: "",
    meta: JSON.stringify({
      v: 1,
      commentsEnabled: settings.commentsEnabled,
      reactionsEnabled: settings.reactionsEnabled,
      pinToTop: settings.pinToTop,
      publishTiming: settings.publishTiming,
      scheduledAt: settings.scheduledAt,
      audience: settings.audience,
    }),
  };
}

function buildStructuredAttachment(input: ComposerMapperInput): SerializedComposerAttachment | null {
  const title = input.composerTitle.trim();
  const bodyPlain = stripHtmlToPlain(input.bodyHtml, 20000);

  switch (input.composerKind) {
    case "post": {
      const place = input.typePayload as import("./composerTypes").ComposerCheckinExtension;
      const name = place.placeName.trim();
      if (!name) return null;
      return { type: "checkin", title: `📍 ${name}`, detail: place.address.trim() || undefined };
    }
    case "announcement":
      if (!title && !bodyPlain) return null;
      return { type: "announcement", title: title || "Announcement", detail: bodyPlain || undefined };
    case "notice":
      if (!title && !bodyPlain) return null;
      return { type: "notice", title: title || "Notice", detail: bodyPlain || undefined };
    case "poll": {
      const p = input.typePayload as import("./composerTypes").ComposerPollExtension;
      const validOptions = p.options.map((o) => o.trim()).filter(Boolean);
      if (!title || validOptions.length < 2) return null;
      const pollSettings = {
        ...p.pollSettings,
        deadline: p.deadlineEnabled && p.deadlineInput ? p.deadlineInput : null,
        multiSelectLimit: p.pollSettings.allowMultiSelect ? p.pollSettings.multiSelectLimit : null,
      };
      return {
        type: "poll",
        title,
        detail: validOptions.join(" · "),
        options: validOptions,
        pollSettings,
      };
    }
    case "event": {
      const e = input.typePayload as import("./composerTypes").ComposerEventExtension;
      if (!title || !e.date) return null;
      const time24 = normalizeEventTimeTo24h(e.time);
      const timeLabel = time24 ? format24hAs12hLabel(time24) : "";
      const detail = `${e.date}${timeLabel ? ` at ${timeLabel}` : ""}${e.location ? ` · ${e.location}` : ""}`;
      return {
        type: "event",
        title,
        detail,
        eventData: { date: e.date, time: time24, location: e.location },
      };
    }
    case "alert": {
      const a = input.typePayload as import("./composerTypes").ComposerAlertExtension;
      if (!title) return null;
      const detail = bodyPlain ? `[${a.level.toUpperCase()}] ${bodyPlain}` : `[${a.level.toUpperCase()}]`;
      return { type: "alert", title, detail };
    }
    case "survey": {
      const s = input.typePayload as import("./composerTypes").ComposerSurveyExtension;
      const validQuestions = s.questions.filter(
        (q) => q.question.trim() && q.options.filter((o) => o.trim()).length >= 2
      );
      if (!title || validQuestions.length < 1) return null;
      return {
        type: "survey",
        title,
        detail: `${validQuestions.length} question${validQuestions.length > 1 ? "s" : ""}`,
        options: validQuestions.map(
          (q) => `${q.question}: ${q.options.filter((o) => o.trim()).join(", ")}`
        ),
      };
    }
    case "payment": {
      const pay = input.typePayload as import("./composerTypes").ComposerPaymentExtension;
      if (!title || !pay.amount.trim()) return null;
      return {
        type: "payment",
        title,
        detail: `$${pay.amount}${pay.paymentNote.trim() ? ` — ${pay.paymentNote.trim()}` : ""}`,
      };
    }
    case "jobs": {
      const j = input.typePayload as import("./composerTypes").ComposerJobsExtension;
      if (!title) return null;
      const kindLabel =
        (
          {
            full_time: "Full-Time",
            part_time: "Part-Time",
            contract: "Contract",
            freelance: "Freelance",
            internship: "Internship",
          } as Record<string, string>
        )[j.kind] ?? j.kind;
      const detail = `${kindLabel}${j.pay ? ` · ${j.pay}` : ""}${j.timings ? ` · ${j.timings}` : ""}${j.daysPerWeek ? ` · ${j.daysPerWeek} days/wk` : ""}`;
      return {
        type: "jobs",
        title,
        detail,
        meta: j.rolesAndResponsibilities.trim() || undefined,
        jobData: {
          jobTitle: title,
          rolesAndResponsibilities: j.rolesAndResponsibilities.trim(),
          pay: j.pay.trim(),
          kind: j.kind,
          timings: j.timings.trim(),
          daysPerWeek: j.daysPerWeek.trim(),
        },
      };
    }
    default:
      return null;
  }
}

/**
 * Builds title, body, kind, and structured attachment list for createDeet.
 * Preserves the same attachment shapes as the pre-unified attachDeetItem + submit flow.
 */
export function mapComposerStateToSubmitParts(
  input: ComposerMapperInput,
  options: { hasPhotos: boolean }
): ComposerMapperResult {
  const structured = buildStructuredAttachment(input);
  const structuredAttachments: SerializedComposerAttachment[] = [
    ...(structured ? [structured] : []),
    buildDeetOptionsAttachment(input.deetSettings),
  ];

  const resolvedKind = resolvedKindFromComposer(input.composerKind, options.hasPhotos);
  const fallbackTitle = fallbackTitleFromComposer(input.composerKind, options.hasPhotos);

  const trimmedHtml = input.bodyHtml.trim();
  const titleTrim = input.composerTitle.trim();

  // Prefer the explicit title field whenever it is set so post titles (and other headings)
  // are not overwritten by the body preview.
  let contentForTitle = titleTrim || trimmedHtml;
  if (structured && !contentForTitle) {
    contentForTitle = structured.title;
  }

  const resolvedTitle = contentForTitle
    ? stripHtmlToPlain(contentForTitle, 100)
    : structured?.title?.slice(0, 100) || fallbackTitle;

  let rawBody = trimmedHtml;
  if (!rawBody && structured) {
    const titleUsedFromAttachment = !trimmedHtml && structured.title;
    const parts: string[] = [];
    if (structured.title && structured.title !== titleUsedFromAttachment) {
      parts.push(`<strong>${structured.title}</strong>`);
    }
    if (structured.detail) parts.push(structured.detail);
    rawBody = parts.join("<br/>");
  }

  let eventBridge: ComposerMapperResult["eventBridge"] = null;
  if (structured?.type === "event" && "eventData" in structured && structured.eventData) {
    eventBridge = {
      title: structured.title,
      description: rawBody || undefined,
      eventDate: structured.eventData.date,
      startTime: structured.eventData.time || undefined,
      location: structured.eventData.location || undefined,
    };
  }

  return {
    resolvedTitle,
    rawBody,
    resolvedKind,
    structuredAttachments,
    eventBridge,
  };
}
