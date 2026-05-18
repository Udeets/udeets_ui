"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";

import type { ReactNode } from "react";

import { BUTTON_PRIMARY, INPUT_CLASS, cn } from "../hubUtils";

export function ChatComposer({
  disabled,
  sending,
  muted,
  banned,
  onSend,
  onTypingPhase,
  /** Shown in the composer row (e.g. file attach) so it sits with the message field, not the thread header. */
  attachControl,
  /** File queued to send with the next Send (caption optional in the text field). */
  pendingAttachment,
  onClearPendingAttachment,
}: {
  disabled?: boolean;
  sending: boolean;
  muted?: boolean;
  banned?: boolean;
  onSend: (text: string) => Promise<void> | void;
  /** REST typing indicator; failures are ignored. */
  onTypingPhase?: (phase: "started" | "stopped") => void;
  attachControl?: ReactNode;
  pendingAttachment?: { file: File; previewUrl: string } | null;
  onClearPendingAttachment?: () => void;
}) {
  const [text, setText] = useState("");
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStoppedIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedSentRef = useRef(false);

  const notifyStopped = useCallback(() => {
    if (!startedSentRef.current) return;
    startedSentRef.current = false;
    onTypingPhase?.("stopped");
  }, [onTypingPhase]);

  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      if (typingStoppedIdleRef.current) clearTimeout(typingStoppedIdleRef.current);
      notifyStopped();
    };
  }, [notifyStopped]);

  const scheduleTypingStoppedIdle = useCallback(() => {
    if (!onTypingPhase || muted || banned || disabled) return;
    if (typingStoppedIdleRef.current) clearTimeout(typingStoppedIdleRef.current);
    typingStoppedIdleRef.current = setTimeout(() => {
      typingStoppedIdleRef.current = null;
      notifyStopped();
    }, 2500);
  }, [onTypingPhase, muted, banned, disabled, notifyStopped]);

  const scheduleTypingStarted = useCallback(() => {
    if (!onTypingPhase || muted || banned || disabled) return;
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    scheduleTypingStoppedIdle();
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
      if (!startedSentRef.current) {
        startedSentRef.current = true;
        onTypingPhase("started");
      }
    }, 4000);
  }, [onTypingPhase, muted, banned, disabled, scheduleTypingStoppedIdle]);

  const submit = useCallback(async () => {
    const t = text.trim();
    const hasPending = Boolean(pendingAttachment);
    if ((!t && !hasPending) || sending || disabled || muted || banned) return;
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    if (typingStoppedIdleRef.current) {
      clearTimeout(typingStoppedIdleRef.current);
      typingStoppedIdleRef.current = null;
    }
    notifyStopped();
    setText("");
    await onSend(t);
  }, [text, sending, disabled, muted, banned, onSend, notifyStopped, pendingAttachment]);

  const blocked = Boolean(muted || banned);

  return (
    <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-3">
      {blocked ? (
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          {banned ? "You are banned from this chat room." : "You are muted and cannot send messages here."}
        </p>
      ) : null}
      {pendingAttachment ? (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingAttachment.previewUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-xs font-medium text-[var(--ud-text-primary)]">{pendingAttachment.file.name}</p>
            <p className="mt-0.5 text-[11px] text-[var(--ud-text-muted)]">Add a caption below, then Send (caption optional).</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-card)] hover:text-[var(--ud-text-primary)]"
            onClick={() => onClearPendingAttachment?.()}
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {attachControl ? <div className="flex h-10 shrink-0 items-center">{attachControl}</div> : null}
        <label htmlFor="hub-chat-composer" className="sr-only">
          Message
        </label>
        <textarea
          id="hub-chat-composer"
          rows={1}
          maxLength={8000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim()) scheduleTypingStarted();
          }}
          onBlur={() => {
            if (typingDebounceRef.current) {
              clearTimeout(typingDebounceRef.current);
              typingDebounceRef.current = null;
            }
            if (typingStoppedIdleRef.current) {
              clearTimeout(typingStoppedIdleRef.current);
              typingStoppedIdleRef.current = null;
            }
            notifyStopped();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={disabled || sending || blocked}
          placeholder={blocked ? "" : pendingAttachment ? "Add a caption (optional)…" : "Write a message…"}
          className={cn(INPUT_CLASS, "h-10 min-h-10 min-w-0 flex-1 resize-none overflow-hidden py-0 leading-normal")}
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={disabled || sending || (!text.trim() && !pendingAttachment) || blocked}
          className={cn(BUTTON_PRIMARY, "inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-1.5 px-4")}
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Send
        </button>
      </div>
    </div>
  );
}
