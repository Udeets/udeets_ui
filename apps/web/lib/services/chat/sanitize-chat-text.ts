import sanitizeHtml from "sanitize-html";

const MAX_CHAT_BODY = 8000;

/** Strip HTML / tags; safe for plain-text chat bodies (no trusted HTML). */
export function sanitizeChatPlainText(raw: string, maxLen = MAX_CHAT_BODY): string {
  if (typeof raw !== "string") return "";
  const stripped = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
  });
  const oneLine = stripped.replace(/\r\n/g, "\n").trim();
  return oneLine.length > maxLen ? oneLine.slice(0, maxLen) : oneLine;
}
