import sanitizeHtml from "sanitize-html";

/**
 * Allowlist aligned with the contentEditable composer (execCommand: bold/italic/underline/fontSize/foreColor).
 * Images, iframes, SVG, forms, etc. are never allowed.
 *
 * Uses `sanitize-html` (htmlparser2 + postcss for styles) instead of `isomorphic-dompurify` so the same code runs
 * on the Next.js server without pulling in `jsdom` / `html-encoding-sniffer` (ESM/CJS issues under Turbopack).
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "span",
  "div",
  "font",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    font: ["color", "face", "size", "style"],
    p: ["style"],
    span: ["style"],
    div: ["style"],
    li: ["style"],
    blockquote: ["style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto"],
  },
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  // Inline styles from the composer: color / size / weight / decoration only (no url(), expression, etc.).
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+/, /^rgba\(\s*\d+/],
      "font-size": [/^\d+(?:px|pt|em|%)$/i, /^(?:xx-small|x-small|small|medium|large|x-large|xx-large)$/i],
      "font-weight": [/^(?:bold|normal|\d{3})$/i],
      "font-style": [/^(?:italic|normal)$/i],
      "text-decoration": [/^(?:underline|none|line-through|overline)$/i],
    },
  },
  transformTags: {
    a: (tagName, attribs) => {
      const href = (attribs.href ?? "").trim();
      if (!href || !/^(?:https?:\/\/|mailto:)/i.test(href)) {
        delete attribs.href;
      }
      if (attribs.target === "_blank") {
        attribs.rel = "noopener noreferrer";
      }
      return { tagName, attribs };
    },
  },
};

/** Sanitize rich deet body HTML for storage and for rendering (call on both write and read). */
export function sanitizeDeetBodyHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  return sanitizeHtml(dirty.trim(), SANITIZE_OPTIONS).trim();
}
