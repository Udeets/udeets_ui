"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { cn } from "../hubUtils";

type CollapsibleEngagementPanelProps = {
  open: boolean;
  children: ReactNode;
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Expands/collapses engagement content (e.g. comments) with a short motion.
 * Uses CSS grid 0fr/1fr so height follows content without measuring.
 */
export function CollapsibleEngagementPanel({ open, children }: CollapsibleEngagementPanelProps) {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  return (
    <div
      className={cn(
        "grid ease-out",
        reduceMotion
          ? "transition-[grid-template-rows] duration-200 motion-reduce:duration-0"
          : "transition-[grid-template-rows,opacity] duration-200 motion-reduce:duration-0",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        !open && "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
