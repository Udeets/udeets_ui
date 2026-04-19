"use client";

import { cn } from "../hubUtils";
import type { ComposerChildFlow } from "./deetTypes";

/**
 * The inline composer card on the Posts tab. Previously rendered a full
 * quick-action icon row (photo / emoji / announcement / poll / …) underneath
 * the input — but those same actions are already available inside the
 * CreateDeetModal, so the inline row was pure duplication. Now this is a
 * clean one-tap-to-open input: click it, the full composer modal opens,
 * and every action lives there.
 */
export function DeetComposerCard({
  isDemoPreview,
  isCreatorAdmin,
  onOpenComposer,
}: {
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
      <div
        data-demo-target={isDemoPreview ? "hub-composer-section" : undefined}
        className="px-4 py-3"
      >
        <button
          type="button"
          data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
          disabled={!isCreatorAdmin}
          onClick={() => onOpenComposer()}
          className={cn(
            "h-10 w-full rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-4 text-left text-sm text-[var(--ud-text-muted)] transition",
            isCreatorAdmin
              ? "hover:border-[var(--ud-border-focus)] hover:bg-[var(--ud-bg-input)]"
              : "cursor-not-allowed opacity-60"
          )}
        >
          What&apos;s on your mind?
        </button>
      </div>
    </div>
  );
}
