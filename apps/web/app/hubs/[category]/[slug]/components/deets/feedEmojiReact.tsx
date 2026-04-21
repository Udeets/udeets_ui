"use client";

import { canonicalDeetReactionType } from "@/lib/services/deets/deet-interactions";
import { Loader2, SmilePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../hubUtils";

export const POST_ICON = "h-[18px] w-[18px] stroke-[1.5]";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const EMOJI_TEXT_MAP: Record<string, string> = {
  "👍": "Liked",
  "❤️": "Loved",
  "😂": "Haha",
  "😮": "Surprised",
  "😢": "Sad",
  "🙏": "Grateful",
  like: "Liked",
};

function reactionAriaLabel(emoji: string): string {
  return EMOJI_TEXT_MAP[emoji] ?? EMOJI_TEXT_MAP[canonicalDeetReactionType(emoji)] ?? `React with ${emoji}`;
}

export function EmojiReactButton({
  deetId,
  isLiked,
  isLiking,
  onToggleLike,
  /** Canonical emoji from server / parent; keeps picker remove/change logic correct after refresh. */
  syncedReaction,
  triggerClassName,
  /** When false, reactions are disabled for this post (deet settings). */
  interactionsEnabled = true,
}: {
  deetId: string;
  isLiked: boolean;
  isLiking: boolean;
  onToggleLike?: (deetId: string, reactionType?: string) => void;
  syncedReaction?: string | null;
  triggerClassName?: string;
  interactionsEnabled?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- keep picker emoji in sync with server/parent */
  useEffect(() => {
    if (!isLiked) {
      setSelectedEmoji(null);
      return;
    }
    if (isLiking) return;
    const fromParent =
      syncedReaction != null && syncedReaction !== "" ? canonicalDeetReactionType(syncedReaction) : "👍";
    setSelectedEmoji(fromParent);
  }, [isLiked, isLiking, syncedReaction]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [showPicker]);

  useEffect(() => {
    if (!showPicker) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setShowPicker(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showPicker]);

  /** Tap / click / Enter: open or close the emoji picker so every reaction is one tap away. */
  const handleReactClick = () => {
    if (!interactionsEnabled) return;
    setShowPicker((v) => !v);
  };

  const serverCanon =
    syncedReaction != null && syncedReaction !== "" ? canonicalDeetReactionType(syncedReaction) : null;

  const handleEmojiSelect = (emoji: string) => {
    setShowPicker(false);
    const incoming = canonicalDeetReactionType(emoji);
    const currentCanon = canonicalDeetReactionType(
      (isLiking ? selectedEmoji : null) ?? serverCanon ?? selectedEmoji ?? undefined,
    );
    if (isLiked && currentCanon === incoming) {
      onToggleLike?.(deetId, emoji);
      return;
    }
    setSelectedEmoji(emoji);
    onToggleLike?.(deetId, emoji);
  };

  const displayEmoji = !isLiked
    ? null
    : isLiking
      ? (selectedEmoji ?? serverCanon ?? "👍")
      : (serverCanon ?? selectedEmoji ?? "👍");
  const labelEmoji = !isLiked
    ? undefined
    : isLiking
      ? (selectedEmoji ?? syncedReaction ?? undefined)
      : (syncedReaction ?? selectedEmoji ?? undefined);
  const reactionVerb = isLiked ? (EMOJI_TEXT_MAP[canonicalDeetReactionType(labelEmoji)] ?? "Reacted") : "React";

  return (
    <div className="relative flex-1">
      {showPicker && (
        <div
          ref={pickerRef}
          role="listbox"
          aria-label="Choose a reaction"
          className="absolute -top-12 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--ud-border)] bg-white px-2 py-1.5 shadow-lg"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected={Boolean(
                isLiked && displayEmoji && canonicalDeetReactionType(displayEmoji) === canonicalDeetReactionType(emoji),
              )}
              aria-label={reactionAriaLabel(emoji)}
              onClick={() => handleEmojiSelect(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleReactClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleReactClick();
          }
        }}
        disabled={isLiking || !interactionsEnabled}
        title={!interactionsEnabled ? "Reactions are turned off for this post" : undefined}
        aria-expanded={showPicker}
        aria-haspopup="listbox"
        style={{ touchAction: "manipulation" }}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]",
          isLiked ? "font-semibold text-[var(--ud-brand-primary)]" : "text-[var(--ud-text-muted)]",
          !interactionsEnabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          triggerClassName,
        )}
      >
        {isLiking ? (
          <Loader2 className={cn(POST_ICON, "animate-spin")} aria-hidden />
        ) : displayEmoji ? (
          <span className="text-base" aria-hidden>
            {displayEmoji}
          </span>
        ) : (
          <SmilePlus className={POST_ICON} aria-hidden />
        )}
        <span>{reactionVerb}</span>
      </button>
    </div>
  );
}
