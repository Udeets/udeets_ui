"use client";

import { cn } from "../hubUtils";

/** Plain text only — React escapes HTML entities; newlines preserved. */
export function ChatSafeText({ text, className }: { text: string; className?: string }) {
  return <span className={cn("whitespace-pre-wrap break-words", className)}>{text}</span>;
}
