import type { AttachedDeetItem, PollSettings } from "../deetTypes";

/** User-selected content template in the unified composer (drives inline fields + serialization). */
export type ComposerContentKind =
  | "post"
  | "announcement"
  | "poll"
  | "event"
  | "alert"
  | "survey"
  | "payment"
  | "jobs";

export type ComposerSurveyQuestion = {
  question: string;
  options: string[];
};

export type ComposerPollExtension = {
  options: string[];
  /** UI toggle; mapped to `pollSettings.startsAt` on submit */
  startsAtEnabled: boolean;
  startsAtInput: string;
  /** UI toggle; mapped to `pollSettings.deadline` on submit */
  deadlineEnabled: boolean;
  deadlineInput: string;
  pollSettings: PollSettings;
};

export type ComposerEventExtension = {
  date: string;
  time: string;
  location: string;
};

export type ComposerAlertExtension = {
  level: "info" | "warning" | "urgent";
};

export type ComposerCheckinExtension = {
  placeName: string;
  address: string;
};

export type ComposerSurveyExtension = {
  questions: ComposerSurveyQuestion[];
};

export type ComposerPaymentExtension = {
  amount: string;
  paymentNote: string;
};

export type ComposerJobsExtension = {
  rolesAndResponsibilities: string;
  pay: string;
  kind: string;
  timings: string;
  daysPerWeek: string;
};

export type ComposerAnnouncementExtension = Record<string, never>;

/** Per-kind extra fields (title + body live at composer root). */
export type ComposerTypeExtensions = {
  /** Optional place tag (same shape as legacy check-in; serialized as a location attachment). */
  post: ComposerCheckinExtension;
  announcement: ComposerAnnouncementExtension;
  poll: ComposerPollExtension;
  event: ComposerEventExtension;
  alert: ComposerAlertExtension;
  survey: ComposerSurveyExtension;
  payment: ComposerPaymentExtension;
  jobs: ComposerJobsExtension;
};

export type ComposerTypePayload = ComposerTypeExtensions[ComposerContentKind];

export const DEFAULT_POLL_OPTIONS = ["", "", ""];

export function defaultTypePayload(kind: ComposerContentKind): ComposerTypePayload {
  switch (kind) {
    case "post":
      return { placeName: "", address: "" };
    case "announcement":
      return {} as ComposerTypePayload;
    case "poll":
      return {
        options: [...DEFAULT_POLL_OPTIONS],
        startsAtEnabled: false,
        startsAtInput: "",
        deadlineEnabled: false,
        deadlineInput: "",
        pollSettings: {
          allowAnyoneToAdd: false,
          allowMultiSelect: false,
          multiSelectLimit: null,
          allowSecretVoting: false,
          startsAt: null,
          deadline: null,
          showResults: "always",
          sortBy: "option_no",
        },
      };
    case "event":
      return { date: "", time: "", location: "" };
    case "alert":
      return { level: "warning" };
    case "survey":
      return { questions: [{ question: "", options: ["", ""] }] };
    case "payment":
      return { amount: "", paymentNote: "" };
    case "jobs":
      return {
        rolesAndResponsibilities: "",
        pay: "",
        kind: "full_time",
        timings: "",
        daysPerWeek: "",
      };
    default:
      return {};
  }
}

export type SerializedComposerAttachment = Omit<AttachedDeetItem, "id">;
