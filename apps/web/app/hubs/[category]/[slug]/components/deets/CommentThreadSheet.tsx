"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";

type CommentThreadSheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function CommentThreadSheet({ title, onClose, children }: CommentThreadSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useLayoutEffect(() => {
    const ta = panelRef.current?.querySelector<HTMLTextAreaElement>("textarea");
    ta?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] motion-reduce:backdrop-blur-none"
        aria-label="Close comments"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(85dvh,720px)] w-full flex-col rounded-t-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-center pt-2 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-[var(--ud-border-subtle)]" />
        </div>
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--ud-border-subtle)] px-4 py-3">
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ud-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
            aria-label="Close"
          >
            <X className="h-5 w-5 stroke-[1.5]" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
