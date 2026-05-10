export type ChatPushPreviewMode = "full" | "sender_only" | "generic";

export type MergedNotificationPreferences = {
  push_new_posts: boolean;
  weekly_digest: boolean;
  event_reminders: boolean;
  chat_push_preview: ChatPushPreviewMode;
};

const DEFAULTS: MergedNotificationPreferences = {
  push_new_posts: true,
  weekly_digest: true,
  event_reminders: false,
  chat_push_preview: "full",
};

function isPreviewMode(v: unknown): v is ChatPushPreviewMode {
  return v === "full" || v === "sender_only" || v === "generic";
}

/** Merges `profiles.notification_preferences` JSON with safe defaults (forward-compatible). */
export function mergeNotificationPreferences(raw: unknown): MergedNotificationPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULTS };
  }
  const o = raw as Record<string, unknown>;
  return {
    push_new_posts: o.push_new_posts === false ? false : true,
    weekly_digest: o.weekly_digest === false ? false : true,
    event_reminders: o.event_reminders === true,
    chat_push_preview: isPreviewMode(o.chat_push_preview) ? o.chat_push_preview : DEFAULTS.chat_push_preview,
  };
}
