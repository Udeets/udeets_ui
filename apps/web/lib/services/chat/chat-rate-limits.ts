/** Sliding window for POST /api/chat/rooms/:roomId/messages (per user per room). */
export const CHAT_MESSAGE_SEND_WINDOW_MS = 60_000;
export const CHAT_MESSAGE_SEND_MAX = 45;

/** Sliding window for POST /api/chat/rooms/:roomId/typing (per user per room). */
export const CHAT_TYPING_WINDOW_MS = 60_000;
export const CHAT_TYPING_MAX = 60;

/** POST reports (per user per room). */
export const CHAT_REPORT_WINDOW_MS = 60_000;
export const CHAT_REPORT_MAX = 12;

/** POST moderation actions (per actor per room). */
export const CHAT_MODERATION_WINDOW_MS = 60_000;
export const CHAT_MODERATION_MAX = 80;

/** Attachment prepare / complete (per user per room). */
export const CHAT_ATTACHMENT_MUTATION_WINDOW_MS = 60_000;
export const CHAT_ATTACHMENT_PREPARE_MAX = 25;
export const CHAT_ATTACHMENT_COMPLETE_MAX = 25;

/** Signed download URL minting (per user per room). */
export const CHAT_ATTACHMENT_DOWNLOAD_WINDOW_MS = 60_000;
export const CHAT_ATTACHMENT_DOWNLOAD_MAX = 40;
