import { Fragment, useMemo, type ReactNode } from "react";
import { plainTextFromHtml } from "@/lib/deets/plain-text-from-html";
import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";

function trimTrailingUrlJunk(url: string): string {
  let u = url;
  while (u.length > 0 && /[),.;:!?'"\]}>]+$/.test(u.slice(-1))) {
    u = u.slice(0, -1);
  }
  return u;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const RICH_MARKUP_RE = /<\s*[a-z][\s\S]*?>/i;

function LinkifiedPlain({ text, className }: { text: string; className?: string }) {
  const nodes = useMemo(() => {
    const out: ReactNode[] = [];
    const re = /\b(https?:\/\/[^\s]+)/gi;
    let lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      if (start > lastIndex) {
        out.push(text.slice(lastIndex, start));
      }
      const raw = m[0];
      const trimmed = trimTrailingUrlJunk(raw);
      if (isSafeHttpUrl(trimmed)) {
        out.push(
          <a
            key={`${start}-${trimmed.slice(0, 32)}`}
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[var(--ud-brand-primary)] underline decoration-[var(--ud-brand-primary)]/40 underline-offset-2 hover:decoration-[var(--ud-brand-primary)]"
          >
            {trimmed}
          </a>
        );
        if (raw.length > trimmed.length) {
          out.push(raw.slice(trimmed.length));
        }
      } else {
        out.push(raw);
      }
      lastIndex = start + raw.length;
    }
    if (lastIndex < text.length) {
      out.push(text.slice(lastIndex));
    }
    if (out.length === 0) {
      out.push(text);
    }
    return out;
  }, [text]);

  return (
    <div className={className} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
}

const RICH_BODY_DECORATION =
  "[&_a]:text-[var(--ud-brand-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--ud-border)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--ud-text-secondary)]";

/**
 * Renders sanitized rich HTML from the composer when present; otherwise plain text with URL linkify.
 */
export function SafeDeetBody({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const sanitized = useMemo(() => sanitizeDeetBodyHtml(source), [source]);
  const hasRichMarkup = useMemo(() => RICH_MARKUP_RE.test(sanitized), [sanitized]);

  if (!sanitized) {
    return null;
  }

  if (hasRichMarkup) {
    return (
      <div
        className={["deet-rich-body", RICH_BODY_DECORATION, className].filter(Boolean).join(" ")}
        style={{ wordBreak: "break-word" }}
        // eslint-disable-next-line react/no-danger -- sanitized with allowlist (same pipeline as persistence)
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  const plain = plainTextFromHtml(sanitized);
  return <LinkifiedPlain text={plain} className={className} />;
}
