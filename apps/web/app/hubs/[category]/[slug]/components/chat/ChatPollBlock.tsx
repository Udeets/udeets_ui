"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";

import { chatApiGetPollByMessage, chatApiVotePoll } from "@/lib/chat/chat-browser-api";
import type { ChatPollDetailDto } from "@/lib/services/chat/get-chat-poll-by-message";
import { cn } from "../hubUtils";
import { ChatSafeText } from "./ChatSafeText";

function formatPollLocalInstant(raw: string): string {
  const t = new Date(raw.trim()).getTime();
  if (Number.isNaN(t)) return raw.trim();
  return new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Message poll — same card + option rows as feed {@link PollContent}, plus a voting-rules panel (chat has no body description). */
export function ChatPollBlock({
  roomId,
  messageId,
  pollTick,
}: {
  roomId: string;
  messageId: string;
  pollTick: number;
}) {
  const [poll, setPoll] = useState<ChatPollDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { poll: p } = await chatApiGetPollByMessage(roomId, messageId);
        if (!cancelled) setPoll(p);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Could not load poll");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, messageId, pollTick]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-[var(--ud-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading poll…
      </div>
    );
  }
  if (err || !poll) {
    return <p className="text-sm text-[var(--ud-danger)]">{err ?? "Poll unavailable"}</p>;
  }

  const closed = poll.closesAt != null && new Date(poll.closesAt).getTime() < Date.now();
  const mySet = new Set(poll.mySelectedOptionIds ?? []);
  const hasAnyMine = mySet.size > 0;

  const vote = async (optionId: string) => {
    if (closed || voting) return;
    setVoting(optionId);
    try {
      await chatApiVotePoll(roomId, poll.pollId, optionId);
      const { poll: fresh } = await chatApiGetPollByMessage(roomId, messageId);
      setPoll(fresh);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/30">
      <div className="flex gap-3 px-4 pb-2 pt-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
          <BarChart3 className="h-5 w-5 stroke-[1.5] text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ud-text-muted)]">Poll</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-[var(--ud-text-primary)]">
            <ChatSafeText text={poll.question} />
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--ud-text-muted)]">
            <span>
              <span className="font-semibold tabular-nums text-[var(--ud-text-secondary)]">{poll.totalVotes}</span> voted
            </span>
            {poll.allowMultiple ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--ud-text-muted)]">· Multi-select</span>
            ) : null}
            {closed ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                · Ended
              </span>
            ) : null}
          </div>
          {closed ? (
            <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              This poll has ended. Voting is closed.
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/35 px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ud-text-muted)]">Voting rules</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <li className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/70 px-2.5 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Choice mode</span>
            <span className="text-xs font-medium leading-snug text-[var(--ud-text-primary)]">
              {poll.allowMultiple ? "Multi-select — pick all that apply" : "Single choice — pick one"}
            </span>
          </li>
          <li className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/70 px-2.5 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Privacy</span>
            <span className="text-xs font-medium leading-snug text-[var(--ud-text-primary)]">
              {poll.anonymousVoting ? "Secret voting — identities hidden from members" : "Standard — visible to moderators"}
            </span>
          </li>
          {poll.closesAt ? (
            <li className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/70 px-2.5 py-2 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
                {closed ? "Closed" : "Closes"}
              </span>
              <span className="text-xs font-medium leading-snug text-[var(--ud-text-primary)]">
                {formatPollLocalInstant(poll.closesAt)}
              </span>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="border-t border-[var(--ud-border-subtle)] px-4 py-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ud-text-muted)]">Options</p>
        {poll.options.map((o, idx) => {
          const isSelected = mySet.has(o.id);
          const count = o.voteCount;
          const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;

          return (
            <button
              key={o.id}
              type="button"
              disabled={closed || voting !== null}
              onClick={() => void vote(o.id)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition",
                isSelected ? "text-emerald-800 dark:text-emerald-200" : "text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)]",
              )}
            >
              {hasAnyMine && poll.totalVotes > 0 && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-l-lg transition-[width]"
                  style={{ width: `${pct}%` }}
                >
                  <div
                    className={cn(
                      "h-full w-full",
                      isSelected ? "bg-emerald-100 dark:bg-emerald-900/45" : "bg-gray-100 dark:bg-zinc-700/90",
                    )}
                  />
                </div>
              )}
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] text-xs font-semibold text-[var(--ud-text-muted)]">
                {idx + 1}
              </span>
              <span
                className={cn(
                  "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center border-2 transition",
                  poll.allowMultiple ? "rounded-sm" : "rounded-full",
                  isSelected ? "border-emerald-500 bg-emerald-500" : "border-[var(--ud-border)] dark:border-zinc-500",
                )}
              >
                {isSelected ? (
                  poll.allowMultiple ? (
                    <span className="text-[10px] font-bold leading-none text-white" aria-hidden>
                      ✓
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                  )
                ) : null}
              </span>
              <span className="relative z-10 min-w-0 flex-1 text-left">
                <ChatSafeText text={o.label} />
              </span>
              {hasAnyMine && poll.totalVotes > 0 && (
                <span className="relative z-10 text-xs text-[var(--ud-text-muted)]">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
