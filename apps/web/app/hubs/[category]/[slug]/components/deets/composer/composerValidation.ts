import type { ComposerContentKind, ComposerTypePayload } from "./composerTypes";
import { defaultTypePayload } from "./composerTypes";
import type { DeetSettingsState } from "../deetTypes";

export function deetSettingsValidationMessage(settings: DeetSettingsState): string | null {
  if (settings.publishTiming !== "scheduled") return null;
  const raw = settings.scheduledAt?.trim() ?? "";
  if (!raw) return "Choose a date and time to schedule this deet.";
  const ms = new Date(raw).getTime();
  if (Number.isNaN(ms)) return "That schedule time is not valid.";
  if (ms < Date.now() + 45_000) return "Pick a time at least a minute from now.";
  return null;
}

export function composerHasMinimumContent(
  kind: ComposerContentKind,
  title: string,
  bodyHtml: string,
  hasPhotos: boolean,
  typePayload: ComposerTypePayload
): boolean {
  const t = title.trim();
  const body = bodyHtml.trim();

  switch (kind) {
    case "post": {
      const place = typePayload as import("./composerTypes").ComposerCheckinExtension;
      return Boolean(body || hasPhotos || place.placeName.trim());
    }
    case "announcement":
    case "notice":
      return Boolean(t || body);
    case "poll": {
      const p = typePayload as import("./composerTypes").ComposerPollExtension;
      const opts = p.options.map((o) => o.trim()).filter(Boolean);
      return Boolean(t && opts.length >= 2);
    }
    case "event": {
      const e = typePayload as import("./composerTypes").ComposerEventExtension;
      return Boolean(t && e.date);
    }
    case "alert":
      return Boolean(t);
    case "survey": {
      const s = typePayload as import("./composerTypes").ComposerSurveyExtension;
      const valid = s.questions.filter(
        (q) => q.question.trim() && q.options.filter((o) => o.trim()).length >= 2
      );
      return Boolean(t && valid.length >= 1);
    }
    case "payment": {
      const pay = typePayload as import("./composerTypes").ComposerPaymentExtension;
      return Boolean(t && pay.amount.trim());
    }
    case "jobs":
      return Boolean(t);
    default:
      return Boolean(body || hasPhotos);
  }
}

/** User-facing message when `composerHasMinimumContent` is false (for inline composer errors). */
export function composerValidationMessage(
  kind: ComposerContentKind,
  title: string,
  bodyHtml: string,
  hasPhotos: boolean,
  typePayload: ComposerTypePayload
): string {
  if (composerHasMinimumContent(kind, title, bodyHtml, hasPhotos, typePayload)) {
    return "";
  }

  const t = title.trim();
  const body = bodyHtml.trim();

  switch (kind) {
    case "post":
      return "Add something to share — text, a photo, or an optional place.";
    case "announcement":
    case "notice":
      return "Add a title or some body text for this update.";
    case "poll": {
      const p = typePayload as import("./composerTypes").ComposerPollExtension;
      const opts = p.options.map((o) => o.trim()).filter(Boolean);
      if (!t) return "Add a poll question in the title field.";
      if (opts.length < 2) return "Add at least two answer options for your poll.";
      return "Complete the required poll fields.";
    }
    case "event": {
      const e = typePayload as import("./composerTypes").ComposerEventExtension;
      if (!t) return "Add an event name in the title field.";
      if (!e.date) return "Choose an event date.";
      return "Complete the required event fields.";
    }
    case "alert":
      return "Add an alert title.";
    case "survey":
      return "Add a survey title and at least one question with two options each.";
    case "payment": {
      const pay = typePayload as import("./composerTypes").ComposerPaymentExtension;
      if (!t) return "Add a short title for this fundraiser.";
      if (!pay.amount.trim()) return "Enter a goal or amount.";
      return "Complete the fundraiser fields.";
    }
    case "jobs":
      return "Add a job title.";
    default:
      return "Add content before publishing this deet.";
  }
}

/** True when inline extension fields differ from freshly-opened defaults (for discard/dirty). */
export function composerPayloadDiffersFromDefault(kind: ComposerContentKind, payload: ComposerTypePayload): boolean {
  try {
    return JSON.stringify(payload) !== JSON.stringify(defaultTypePayload(kind));
  } catch {
    return true;
  }
}
