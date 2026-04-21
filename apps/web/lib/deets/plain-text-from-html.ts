/**
 * Convert stored deet body (may contain legacy HTML from the composer) to plain text.
 * Isomorphic: safe on server and client (no DOM).
 */
export function plainTextFromHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let s = html.replace(/\r\n/g, "\n");

  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, "\n");
  s = s.replace(/<(p|div|h[1-6]|tr|blockquote|section|article)[^>]*>/gi, "");

  s = s.replace(/<[^>]+>/g, "");

  s = decodeBasicEntities(s);
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function decodeBasicEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#(\d+);/g, (_, num: string) => {
      const code = parseInt(num, 10);
      if (Number.isNaN(code) || code < 1 || code > 0x10ffff) return _;
      try {
        return String.fromCodePoint(code);
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = parseInt(hex, 16);
      if (Number.isNaN(code) || code < 1 || code > 0x10ffff) return _;
      try {
        return String.fromCodePoint(code);
      } catch {
        return _;
      }
    });
}
