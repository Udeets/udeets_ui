import { plainTextFromHtml } from "@/lib/deets/plain-text-from-html";
import { isGenericDeetTitle } from "@/lib/deets/deet-title";
import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** When body plain text starts with title, return minimal safe HTML (formatting is dropped for this edge case). */
function plainRemainderAsSafeHtml(plain: string): string {
  if (!plain) return "";
  return sanitizeDeetBodyHtml(`<p>${escapeHtmlText(plain)}</p>`);
}

/**
 * De-duplicates title echo in the body. Returns **sanitized HTML** suitable for {@link SafeDeetBody}
 * (except the rare duplicate-prefix case, which returns minimal escaped paragraphs).
 */
export function deduplicateBodyFromTitle(
  body: string | undefined | null,
  title: string | undefined | null
): string {
  if (!body) return "";
  const sanitized = sanitizeDeetBodyHtml(body);
  const plainFull = plainTextFromHtml(sanitized).replace(/\s+/g, " ").trim();
  if (!title || isGenericDeetTitle(title)) {
    return sanitized;
  }
  const plainTitle = plainTextFromHtml(title).replace(/\s+/g, " ").trim();
  if (!plainTitle) return sanitized;
  if (plainFull.startsWith(plainTitle)) {
    const remainder = plainFull.slice(plainTitle.length).trim();
    if (!remainder) return "";
    return plainRemainderAsSafeHtml(remainder);
  }
  return sanitized;
}
