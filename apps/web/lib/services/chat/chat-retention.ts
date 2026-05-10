/** Allowed `chat_rooms.retention_days` values; `null` = indefinite (default). */
export const CHAT_RETENTION_DAY_OPTIONS = [null, 30, 90, 365] as const;

export type ChatRetentionDays = (typeof CHAT_RETENTION_DAY_OPTIONS)[number];

export function isAllowedChatRetentionDays(v: unknown): v is ChatRetentionDays {
  return v === null || v === 30 || v === 90 || v === 365;
}
