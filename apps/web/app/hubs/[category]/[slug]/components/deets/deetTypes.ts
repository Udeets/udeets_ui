export type DeetFontSize = "small" | "medium" | "large";
export type ComposerChildFlow = "photo" | "emoji" | "settings" | "quit_confirm" | "event" | "checkin" | "announcement" | "notice" | "poll" | "money" | "alert" | "survey" | "payment" | "jobs";

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

export type DeetPostType = "post" | "notice" | "news" | "deal" | "hazard" | "alert" | "jobs";

export type DeetSettingsState = {
  noticeEnabled: boolean;
  commentsEnabled: boolean;
  postType: DeetPostType;
};
