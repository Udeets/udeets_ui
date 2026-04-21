"use client";

import type { DeetReactor } from "@/lib/services/deets/deet-interactions";

export type ReactionSummaryProps = {
  likeCount: number;
  commentCount: number;
  /** Kept for API compatibility with the feed; summary row stays text-only (Instagram-style). */
  reactors?: DeetReactor[];
  isLiked?: boolean;
  currentUserId?: string;
  onOpenReactionsModal?: () => void;
  onToggleComments: () => void;
};

/**
 * Minimal engagement line: counts + short labels (Reaction / Reactions, Comment / Comments).
 * Full reactor list and reaction types stay in the reactions modal / action row.
 */
export function ReactionSummary({
  likeCount,
  commentCount,
  onOpenReactionsModal,
  onToggleComments,
}: ReactionSummaryProps) {
  const showReactions = likeCount > 0;
  const showComments = commentCount > 0;
  if (!showReactions && !showComments) return null;

  const reactionsLabel = likeCount === 1 ? "Reaction" : "Reactions";
  const commentsLabel = commentCount === 1 ? "Comment" : "Comments";
  const reactionsAria = showReactions
    ? `${likeCount} ${reactionsLabel}. Open list of people who reacted.`
    : "";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px] sm:px-4">
      {showReactions ? (
        <button
          type="button"
          onClick={() => onOpenReactionsModal?.()}
          className="rounded-md py-0.5 text-left text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-text-primary)] motion-reduce:transition-none"
          aria-label={reactionsAria}
        >
          <span className="font-semibold tabular-nums text-[var(--ud-text-primary)]">{likeCount}</span>
          <span> {reactionsLabel}</span>
        </button>
      ) : null}

      {showReactions && showComments ? (
        <span className="text-[var(--ud-text-muted)]" aria-hidden>
          ·
        </span>
      ) : null}

      {showComments ? (
        <button
          type="button"
          onClick={onToggleComments}
          className="rounded-md py-0.5 text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-text-primary)] motion-reduce:transition-none"
        >
          <span className="font-semibold tabular-nums text-[var(--ud-text-primary)]">{commentCount}</span>
          <span> {commentsLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
