export type DeetFontSize = "small" | "medium" | "large";
export type ComposerChildFlow = "photo" | "emoji" | "settings" | "quit_confirm";

export type AttachedDeetItem = {
  id: string;
  type: string;
  title: string;
  detail?: string;
  meta?: string;
  previews?: string[];
};

export type DeetFormattingState = {
  fontSize: DeetFontSize;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textColor: string;
};

export type DeetSettingsState = {
  noticeEnabled: boolean;
  commentsEnabled: boolean;
};
