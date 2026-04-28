"use client";

import type { DeetComment } from "@/lib/services/deets/deet-interactions";
import { plainTextFromHtml } from "@/lib/deets/plain-text-from-html";
import { ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { ImageWithFallback, initials } from "../hubUtils";

const PREVIEW_TOP_LEVEL = 2;
const BODY_PREVIEW_MAX = 80;

function stripBodyPreview(body: string): string {
  const t = plainTextFromHtml(body).replace(/\s+/g, " ").trim();
  if (!t.length) return "…";
  if (t.length <= BODY_PREVIEW_MAX) return t;
  return `${t.slice(0, BODY_PREVIEW_MAX - 1)}…`;
}

/**
 * Instagram-style inline preview: last few top-level comments + “View all” + add prompt.
 * Full thread opens via `onViewAll` / `onAddComment`.
 */
export function DeetCommentsPreviewStrip({
  comments,
  isLoading,
  totalCount,
  onViewAll,
  onAddComment,
  canAddNewComments = true,
}: {
  comments: DeetComment[];
  isLoading: boolean;
  totalCount: number;
  onViewAll: () => void;
  onAddComment?: () => void;
  /** When false, show a note instead of “Add a comment…”; preview rows / View all still open the thread. */
  canAddNewComments?: boolean;
}) {
  const latest = comments.slice(-PREVIEW_TOP_LEVEL);
  const showViewAll =
    totalCount > latest.length || (totalCount > 0 && comments.length === 0 && !isLoading);

  return (
    <div className="px-3 pb-3 pt-2.5">
      {isLoading && totalCount > 0 ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--ud-bg-card)]/60 px-2.5 py-2 text-[13px] text-[var(--ud-text-muted)]">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-80" aria-hidden />
          <span>Loading comments…</span>
        </div>
      ) : null}

      <div className="space-y-1">
        {!isLoading &&
          latest.map((c) => {
            const name = c.authorName ?? "Member";
            const label = initials(name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={onViewAll}
                className="flex w-full min-w-0 items-start gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--ud-bg-card)]/80 active:bg-[var(--ud-bg-card)]"
              >
                <span className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] ring-1 ring-[var(--ud-border-subtle)] ring-inset">
                  <ImageWithFallback
                    src={c.authorAvatar || ""}
                    sources={c.authorAvatar ? [c.authorAvatar] : []}
                    alt={name}
                    className="h-full w-full object-cover"
                    fallbackClassName="flex h-full w-full items-center justify-center bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]"
                    fallback={label}
                  />
                </span>
                <span className="min-w-0 flex-1 pt-0.5 leading-snug">
                  <span className="text-[13px] text-[var(--ud-text-primary)]">
                    <span className="font-semibold">{name}</span>
                    <span className="font-normal text-[var(--ud-text-secondary)]">
                      {" "}
                      {stripBodyPreview(c.body)}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
      </div>

      {showViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-1 flex w-full items-center gap-0.5 rounded-lg px-2 py-2 text-left text-[13px] font-semibold text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-card)]/80 hover:text-[var(--ud-brand-primary)] active:bg-[var(--ud-bg-card)]"
        >
          <span className="min-w-0 flex-1">
            {totalCount > 0
              ? `View all ${totalCount} comment${totalCount === 1 ? "" : "s"}`
              : "View comments"}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        </button>
      ) : null}

      {canAddNewComments && onAddComment ? (
        <button
          type="button"
          onClick={onAddComment}
          className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/40 px-3 py-2.5 text-left text-[13px] text-[var(--ud-text-muted)] transition hover:border-[var(--ud-brand-primary)]/35 hover:bg-[var(--ud-bg-card)]/90 hover:text-[var(--ud-text-secondary)] active:scale-[0.99] motion-reduce:active:scale-100"
        >
          <MessageCircle className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          <span>Add a comment…</span>
        </button>
      ) : !canAddNewComments ? (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[12px] leading-relaxed text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-card)]/80 hover:text-[var(--ud-text-secondary)]"
        >
          Comments are turned off for this post — tap to view thread.
        </button>
      ) : null}
    </div>
  );
}
