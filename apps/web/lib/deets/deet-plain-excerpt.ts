import { plainTextFromHtml } from "@/lib/deets/plain-text-from-html";
import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";

/** Plain lowercase string for search / snippets (no HTML noise). */
export function plainExcerptForSearch(htmlOrText: string | undefined | null): string {
  return plainTextFromHtml(sanitizeDeetBodyHtml(htmlOrText ?? "")).toLowerCase();
}
