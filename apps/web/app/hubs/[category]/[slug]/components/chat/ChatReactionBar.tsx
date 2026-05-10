"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";

import { normalizeChatReactionEmoji } from "@/lib/services/chat/chat-reaction-emoji";
import { ComposerEmojiPicker } from "../deets/ComposerEmojiPicker";
import { REACTION_EMOJIS } from "../deets/feedEmojiReact";
import { cn } from "../hubUtils";

const MENU_Z = 210;

type ChatReactionBarProps = {
  disabled?: boolean;
  onReact: (emoji: string) => void | Promise<void>;
};

/**
 * WhatsApp-style reactions: tap smile to open a quick strip, then optional full emoji grid.
 */
export function ChatReactionBar({ disabled, onReact }: ChatReactionBarProps) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [box, setBox] = useState<{ left: number; width: number; bottom: number } | null>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(320, Math.max(220, window.innerWidth - 16));
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - w - 8));
    const bottom = window.innerHeight - r.top + 6;
    setBox({ left, width: w, bottom });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      queueMicrotask(() => setBox(null));
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition, showMore]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      const n = ev.target as Node;
      if (triggerRef.current?.contains(n)) return;
      if (panelRef.current?.contains(n)) return;
      setOpen(false);
      setShowMore(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setShowMore(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = async (raw: string) => {
    const normalized = normalizeChatReactionEmoji(raw);
    if (!normalized) return;
    setOpen(false);
    setShowMore(false);
    await onReact(normalized);
  };

  const panel =
    open && box && mounted ? (
      <div
        ref={panelRef}
        id={listId}
        role="dialog"
        aria-label="Choose a reaction"
        style={{
          position: "fixed",
          left: box.left,
          bottom: box.bottom,
          width: box.width,
          zIndex: MENU_Z,
        }}
        className={cn(
          "rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-xl",
          showMore && "flex max-h-[min(70vh,380px)] flex-col",
        )}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-0.5 border-b border-[var(--ud-border-subtle)] px-2 py-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition hover:bg-[var(--ud-bg-subtle)] active:scale-95"
              aria-label={`React with ${emoji}`}
              onClick={() => void pick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        {!showMore ? (
          <div className="px-2 py-1.5">
            <button
              type="button"
              disabled={disabled}
              className="w-full rounded-lg py-2 text-center text-xs font-medium text-[var(--ud-brand-primary)] hover:bg-[var(--ud-brand-light)]/40"
              onClick={() => setShowMore(true)}
            >
              More emojis…
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-[var(--ud-border-subtle)] px-2 py-1">
              <button
                type="button"
                className="text-xs font-medium text-[var(--ud-brand-primary)] hover:underline"
                onClick={() => setShowMore(false)}
              >
                ← Quick reactions
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              <ComposerEmojiPicker
                onPick={(emoji: string) => {
                  void pick(emoji);
                }}
              />
            </div>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className="relative inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (disabled) return;
          setShowMore(false);
          setOpen((o) => !o);
        }}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] text-[var(--ud-text-muted)] transition hover:border-[var(--ud-border-focus)] hover:text-[var(--ud-brand-primary)]",
          disabled && "pointer-events-none opacity-40",
        )}
        title="Add reaction"
        aria-label="Add reaction"
      >
        <SmilePlus className="h-4 w-4" aria-hidden />
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
