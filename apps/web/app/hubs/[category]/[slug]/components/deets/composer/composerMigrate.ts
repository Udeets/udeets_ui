import type {
  ComposerCheckinExtension,
  ComposerContentKind,
  ComposerEventExtension,
  ComposerJobsExtension,
  ComposerPaymentExtension,
  ComposerPollExtension,
  ComposerSurveyExtension,
  ComposerTypePayload,
} from "./composerTypes";
import { DEFAULT_POLL_OPTIONS, defaultTypePayload } from "./composerTypes";
import { format24hAs12hLabel, normalizeEventTimeTo24h } from "./composerTimeFormat";

function ensurePollOptionSlots(options: string[], min = 2, max = 10): string[] {
  const next = [...options];
  while (next.length < min) next.push("");
  return next.slice(0, max);
}

/** When switching composer template, carry over fields that map cleanly to the new shape. */
export function migrateComposerTypePayload(
  fromKind: ComposerContentKind,
  toKind: ComposerContentKind,
  current: ComposerTypePayload,
): ComposerTypePayload {
  if (fromKind === toKind) return current;

  const base = defaultTypePayload(toKind);

  if (fromKind === "poll" && toKind === "survey") {
    const p = current as ComposerPollExtension;
    const filled = p.options.map((o) => o.trim()).filter(Boolean);
    const opts = filled.length >= 2 ? filled : ["", ""];
    return {
      questions: [{ question: "", options: [...opts] }],
    } as ComposerTypePayload;
  }

  if (fromKind === "survey" && toKind === "poll") {
    const s = current as ComposerSurveyExtension;
    const q0 = s.questions[0];
    const raw = q0?.options?.length ? q0.options : [...DEFAULT_POLL_OPTIONS];
    const opts = ensurePollOptionSlots(raw.map((o) => o.trim() || ""));
    return { ...(base as ComposerPollExtension), options: opts } as ComposerTypePayload;
  }

  if (fromKind === "event" && toKind === "post") {
    const e = current as ComposerEventExtension;
    const t24 = normalizeEventTimeTo24h(e.time);
    const timeLabel = t24 ? format24hAs12hLabel(t24) : "";
    const when = [e.date, timeLabel].filter((x) => x.trim()).join(" · ");
    const c: ComposerCheckinExtension = {
      placeName: e.location.trim() || "Event",
      address: when || e.location.trim(),
    };
    return c as ComposerTypePayload;
  }

  if (fromKind === "post" && toKind === "event") {
    const c = current as ComposerCheckinExtension;
    const e: ComposerEventExtension = {
      date: "",
      time: "",
      location: [c.placeName, c.address].filter((x) => x.trim()).join(" — "),
    };
    return e as ComposerTypePayload;
  }

  if (fromKind === "payment" && toKind === "jobs") {
    const p = current as ComposerPaymentExtension;
    const j = base as ComposerJobsExtension;
    return {
      ...j,
      pay: p.amount.trim() || j.pay,
      rolesAndResponsibilities: p.paymentNote.trim() || j.rolesAndResponsibilities,
    } as ComposerTypePayload;
  }

  if (fromKind === "jobs" && toKind === "payment") {
    const j = current as ComposerJobsExtension;
    const p = base as ComposerPaymentExtension;
    return {
      ...p,
      amount: j.pay.trim() || p.amount,
      paymentNote: j.rolesAndResponsibilities.trim() || p.paymentNote,
    } as ComposerTypePayload;
  }

  if (fromKind === "announcement" && toKind === "notice") {
    return base;
  }

  if (fromKind === "notice" && toKind === "announcement") {
    return base;
  }

  return base;
}
