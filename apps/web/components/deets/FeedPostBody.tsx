"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { SafeDeetBody } from "@/components/deets/SafeDeetBody";
import { deduplicateBodyFromTitle } from "@/lib/deets/deduplicate-body-from-title";
import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const COLLAPSED_MAX_PX = 132;

/** Collapsible feed body (rich or plain) with gradient fade when clipped. */
export function FeedPostBody({
  body,
  title,
  className,
  /** When false, the body is shown as-is (sanitized only). Use for structured posts where title and body are independent fields. */
  dedupeBodyAgainstTitle = true,
}: {
  body: string;
  title: string;
  className?: string;
  dedupeBodyAgainstTitle?: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const source = dedupeBodyAgainstTitle
    ? deduplicateBodyFromTitle(body, title)
    : sanitizeDeetBodyHtml(body || "");

  useLayoutEffect(() => {
    if (!source.trim()) {
      setExpanded(false);
      setOverflowing(false);
      return;
    }
    const el = outerRef.current;
    if (!el) return;
    if (expanded) {
      el.style.maxHeight = "none";
      requestAnimationFrame(() => {
        setOverflowing(el.scrollHeight > COLLAPSED_MAX_PX + 2);
      });
      return;
    }
    el.style.maxHeight = `${COLLAPSED_MAX_PX}px`;
    requestAnimationFrame(() => {
      const o = el.scrollHeight > el.clientHeight + 2;
      setOverflowing(o);
      if (!o) el.style.maxHeight = "none";
    });
  }, [source, expanded]);

  if (!source.trim()) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={outerRef}
        className={cn(
          "relative overflow-hidden transition-[max-height] duration-200 motion-reduce:transition-none",
          !expanded && overflowing && "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-10 after:bg-gradient-to-t after:from-[var(--ud-bg-card)] after:to-transparent"
        )}
      >
        <SafeDeetBody source={source} />
      </div>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "See less" : "See more"}
        </button>
      ) : null}
    </div>
  );
}
