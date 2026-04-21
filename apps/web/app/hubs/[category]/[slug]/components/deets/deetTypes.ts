import type { DeetVisibility } from "@/lib/services/deets/deet-types";

export type DeetFontSize = "small" | "medium" | "large";
export type ComposerChildFlow =
  | "photo"
  | "post"
  | "emoji"
  | "settings"
  | "quit_confirm"
  | "event"
  | "announcement"
  | "notice"
  | "poll"
  | "money"
  | "alert"
  | "survey"
  | "payment"
  | "jobs";

export type PollSettings = {
  allowAnyoneToAdd?: boolean;
  allowMultiSelect?: boolean;
  multiSelectLimit?: number | null;
  allowSecretVoting?: boolean;
  deadline?: string | null;
  showResults?: "always" | "after_voting" | "after_closed" | "private";
  sortBy?: "option_no" | "votes";
};

export type AttachedDeetItem = {
  id: string;
  type: string;
  title: string;
  detail?: string;
  meta?: string;
  previews?: string[];
  files?: File[];
  options?: string[];
  pollSettings?: PollSettings;
  eventData?: { date: string; time: string; location: string };
  jobData?: {
    jobTitle: string;
    rolesAndResponsibilities: string;
    pay: string;
    kind: string;
    timings: string;
    daysPerWeek: string;
  };
};

export type DeetFormattingState = {
  fontSize: DeetFontSize;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textColor: string;
};

/** Composer-side defaults for how a deet behaves (stored on submit in a `deet_options` attachment). */
export type LocalFeedTag = "news" | "hazard" | "deal" | "jobs";

export type DeetSettingsState = {
  commentsEnabled: boolean;
  reactionsEnabled: boolean;
  pinToTop: boolean;
  publishTiming: "now" | "scheduled";
  /** `datetime-local` value or ISO string when `publishTiming` is `scheduled` */
  scheduledAt: string;
  audience: DeetVisibility;
  /** When writing a general post, optional tag so the deet also surfaces on the platform Local feed. */
  localFeedTag?: LocalFeedTag | null;
};

export const INITIAL_DEET_SETTINGS: DeetSettingsState = {
  commentsEnabled: true,
  reactionsEnabled: true,
  pinToTop: false,
  publishTiming: "now",
  scheduledAt: "",
  audience: "hub_default",
  localFeedTag: null,
};
