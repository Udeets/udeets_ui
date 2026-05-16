"use client";

import { cn } from "../../components/hubUtils";

/** Fixed height for blurred placeholder area — keep in sync with LockedSectionPreview */
export const LOCKED_PLACEHOLDER_HEIGHT_CLASS = "h-[15rem]";

export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-[var(--ud-bg-subtle)]", className)} aria-hidden />;
}

/** Single standard skeleton used behind every locked hub tab (matches Events layout). */
export function StandardLockedPlaceholder() {
  return (
    <div className="flex h-full flex-col justify-center space-y-3 p-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full gap-3 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50 p-4"
        >
          <SkeletonBar className="h-16 w-16 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBar className="h-3 w-2/3" />
            <SkeletonBar className="h-2 w-1/3" />
            <SkeletonBar className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use StandardLockedPlaceholder */
export const EventsPlaceholderList = StandardLockedPlaceholder;
export const MembersPlaceholderGrid = StandardLockedPlaceholder;
export const PostsPlaceholderList = StandardLockedPlaceholder;
export const PhotosPlaceholderGrid = StandardLockedPlaceholder;
export const ChatPlaceholderList = StandardLockedPlaceholder;
