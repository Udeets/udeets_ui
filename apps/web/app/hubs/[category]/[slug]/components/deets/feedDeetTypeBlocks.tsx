"use client";

import {
  AlignLeft,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  MapPin,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import type { HubFeedItemAttachment } from "@/lib/hub-content";
import { FeedPostBody } from "@/components/deets/FeedPostBody";
import { isGenericDeetTitle } from "@/lib/deets/deet-title";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../hubUtils";
import { SurveyContent } from "./SurveyContent";

/* ── Deet type styling config ── */
const DEET_TYPE_CONFIG: Record<
  string,
  {
    icon: typeof Megaphone;
    label: string;
    bg: string;
    text: string;
    border: string;
    accent: string;
    /** Left accent on description block (Tailwind border-l color). */
    rail: string;
  }
> = {
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    accent: "bg-blue-100",
    rail: "border-l-blue-500",
  },
  notice: {
    icon: AlertTriangle,
    label: "Notice",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    accent: "bg-amber-100",
    rail: "border-l-amber-500",
  },
  event: {
    icon: Calendar,
    label: "Event",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    accent: "bg-purple-100",
    rail: "border-l-purple-500",
  },
  poll: {
    icon: BarChart3,
    label: "Poll",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-100",
    rail: "border-l-emerald-500",
  },
  checkin: {
    icon: MapPin,
    label: "Check-in",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    accent: "bg-rose-100",
    rail: "border-l-rose-500",
  },
  money: {
    icon: CircleDollarSign,
    label: "Payment Request",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    accent: "bg-teal-100",
    rail: "border-l-teal-500",
  },
  jobs: {
    icon: Briefcase,
    label: "Job Posting",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    accent: "bg-indigo-100",
    rail: "border-l-indigo-500",
  },
  survey: {
    icon: ClipboardList,
    label: "Survey",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    accent: "bg-violet-100",
    rail: "border-l-violet-500",
  },
  payment: {
    icon: CircleDollarSign,
    label: "Fundraiser",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    accent: "bg-teal-100",
    rail: "border-l-teal-600",
  },
  alert: {
    icon: ShieldAlert,
    label: "Alert",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
    accent: "bg-rose-100",
    rail: "border-l-rose-600",
  },
  /** General hub post — description block only (chip uses feed kind, not {@link DeetTypeKindChip}). */
  post: {
    icon: AlignLeft,
    label: "Post",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    accent: "bg-slate-100",
    rail: "border-l-slate-400",
  },
};

/** Resolve the deet type from kind + attachments */
export function resolveDeetType(kind: string, attachments?: HubFeedItemAttachment[]): string | null {
  if (attachments?.length) {
    // Prefer explicit structured types (stable regardless of attachment array order).
    if (attachments.some((a) => a.type === "jobs")) return "jobs";
    if (attachments.some((a) => a.type === "poll")) return "poll";
    if (attachments.some((a) => a.type === "announcement")) return "announcement";
    if (attachments.some((a) => a.type === "notice")) return "notice";
    if (attachments.some((a) => a.type === "event")) return "event";
    if (attachments.some((a) => a.type === "survey")) return "survey";
    if (attachments.some((a) => a.type === "payment")) return "payment";
    if (attachments.some((a) => a.type === "alert")) return "alert";
    for (const a of attachments) {
      if (a.type === "checkin" || a.type === "money") {
        return a.type;
      }
    }
  }
  if (kind === "notice") return "notice";
  if (kind === "announcement") return "announcement";
  if (kind === "event") return "event";
  if (kind === "poll") return "poll";
  if (kind === "jobs") return "jobs";
  if (kind === "survey") return "survey";
  if (kind === "payment") return "payment";
  if (kind === "alert") return "alert";
  return null;
}

/** Main headline for the card — type chip lives in the metadata row next to time. */
export function getStructuredHeadlineForFeed(
  type: string,
  attachments: HubFeedItemAttachment[] | undefined,
  feedTitleFallback: string | undefined,
): string | null {
  const config = DEET_TYPE_CONFIG[type];
  const matchingAtt = attachments?.find((a) => a.type === type);
  const structuredTitle = matchingAtt?.title?.trim();
  const fromFallback = feedTitleFallback?.trim();

  const pick =
    (structuredTitle && !isGenericDeetTitle(structuredTitle) ? structuredTitle : null) ||
    (fromFallback && !isGenericDeetTitle(fromFallback) ? fromFallback : null) ||
    structuredTitle ||
    fromFallback ||
    null;

  if (!pick) return null;
  if (!config) return isGenericDeetTitle(pick) ? null : pick;
  if (isGenericDeetTitle(pick) || pick === config.label) return null;
  if (type === "checkin") {
    const cleaned = pick.replace(/^📍\s*/u, "").trim();
    return cleaned || null;
  }
  return pick;
}

/**
 * Card-level heading for polls: hide when it would only repeat the ballot question
 * (the question stays with {@link PollContent}).
 */
export function headlineForHubFeedPoll(
  structuredHeadline: string | null,
  attachments: HubFeedItemAttachment[] | undefined,
  feedTitle: string | undefined,
): string | null {
  const pollQ = attachments?.find((a) => a.type === "poll")?.title?.trim() ?? "";
  const fromStructure = structuredHeadline?.trim() ?? "";
  if (fromStructure && pollQ && fromStructure === pollQ) return null;
  if (fromStructure) return fromStructure;
  const t = feedTitle?.trim() ?? "";
  if (t && !isGenericDeetTitle(t) && (!pollQ || t !== pollQ)) return t;
  return null;
}

export function StructuredDescriptionShell({
  type,
  className,
  children,
}: {
  type: string;
  className?: string;
  children: React.ReactNode;
}) {
  const config = DEET_TYPE_CONFIG[type];
  if (!config) return <div className={cn("mx-4 mt-2 px-4", className)}>{children}</div>;
  return (
    <div
      className={cn(
        "mx-4 mt-2 rounded-r-lg rounded-l-sm border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50 py-2.5 pl-3 pr-3",
        "border-l-4",
        config.rail,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Read-only survey when `deetId` is not passed (edge / preview). */
function SurveyStaticFallback({
  matchingAtt,
  bodyHtml,
  bodyTone,
}: {
  matchingAtt: HubFeedItemAttachment | undefined;
  bodyHtml?: string;
  bodyTone: string;
}) {
  const opts = matchingAtt?.options ?? [];
  const showRichBody = Boolean(bodyHtml?.trim());
  return (
    <div className="space-y-2">
      {matchingAtt?.detail ? (
        <p className="text-xs font-medium text-[var(--ud-text-muted)]">{matchingAtt.detail}</p>
      ) : null}
      {opts.length > 0 ? (
        <ul className="space-y-2">
          {opts.map((line, i) => {
            const s = typeof line === "string" ? line : "";
            const colon = s.indexOf(": ");
            const q = colon >= 0 ? s.slice(0, colon).trim() : s.trim();
            const rest = colon >= 0 ? s.slice(colon + 2).trim() : "";
            const choices = rest ? rest.split(", ").map((o) => o.trim()).filter(Boolean) : [];
            return (
              <li key={i} className="text-sm">
                <p className="font-semibold text-[var(--ud-text-primary)]">{q || `Question ${i + 1}`}</p>
                {choices.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-[var(--ud-text-secondary)]">
                    {choices.map((c, j) => (
                      <li key={j}>{c}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {showRichBody ? (
        <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={cn(bodyTone, "pt-1")} />
      ) : null}
    </div>
  );
}

/** Compact post-type pill (shown beside timestamp, like feed kind on normal posts). */
export function DeetTypeKindChip({ type }: { type: string }) {
  const config = DEET_TYPE_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight",
        config.bg,
        config.text,
        config.border,
      )}
    >
      <Icon className="h-3 w-3 shrink-0 stroke-[2]" aria-hidden />
      <span className="truncate">{config.label}</span>
    </span>
  );
}

export function DeetTypeContent({
  type,
  attachments,
  bodyHtml,
  deetId,
  currentUserId,
}: {
  type: string;
  attachments?: HubFeedItemAttachment[];
  /** Rich HTML description — headline and type chip render on the card shell. */
  bodyHtml?: string;
  /** Required for interactive survey (and future structured types). */
  deetId?: string;
  currentUserId?: string | null;
}) {
  const config = DEET_TYPE_CONFIG[type];
  if (!config) return null;

  const matchingAtt = attachments?.find((a) => a.type === type);
  const bodyTone = "text-[15px] leading-relaxed text-[var(--ud-text-primary)]";
  const secondaryTone = "text-sm leading-relaxed text-[var(--ud-text-secondary)]";

  if (type === "notice") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {showRichBody ? (
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={bodyTone} />
        ) : matchingAtt?.detail ? (
          <p className={secondaryTone}>{matchingAtt.detail}</p>
        ) : null}
      </StructuredDescriptionShell>
    );
  }

  if (type === "announcement") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {showRichBody ? (
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={bodyTone} />
        ) : matchingAtt?.detail ? (
          <p className={secondaryTone}>{matchingAtt.detail}</p>
        ) : null}
      </StructuredDescriptionShell>
    );
  }

  if (type === "survey") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {deetId ? (
          <SurveyContent deetId={deetId} currentUserId={currentUserId} attachments={attachments} bodyHtml={bodyHtml} />
        ) : (
          <SurveyStaticFallback matchingAtt={matchingAtt} bodyHtml={bodyHtml} bodyTone={bodyTone} />
        )}
      </StructuredDescriptionShell>
    );
  }

  if (type === "payment") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        <div className="space-y-2">
          {matchingAtt?.detail ? (
            <p className="text-sm font-semibold text-[var(--ud-text-primary)]">{matchingAtt.detail}</p>
          ) : null}
          {showRichBody ? (
            <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={bodyTone} />
          ) : null}
        </div>
      </StructuredDescriptionShell>
    );
  }

  if (type === "alert") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {!showRichBody && matchingAtt?.detail ? <p className={secondaryTone}>{matchingAtt.detail}</p> : null}
        {showRichBody ? (
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={bodyTone} />
        ) : null}
      </StructuredDescriptionShell>
    );
  }

  if (type === "poll") return null;

  if (type === "event") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {matchingAtt?.detail ? <p className={secondaryTone}>{matchingAtt.detail}</p> : null}
        {showRichBody ? (
          <FeedPostBody
            body={bodyHtml!}
            title=""
            dedupeBodyAgainstTitle={false}
            className={cn(bodyTone, matchingAtt?.detail && "pt-2")}
          />
        ) : null}
      </StructuredDescriptionShell>
    );
  }

  if (type === "checkin") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {matchingAtt?.detail && !showRichBody ? <p className={secondaryTone}>{matchingAtt.detail}</p> : null}
        {showRichBody ? (
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={bodyTone} />
        ) : null}
      </StructuredDescriptionShell>
    );
  }

  if (type === "money") {
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        {matchingAtt?.detail && !showRichBody ? <p className={secondaryTone}>{matchingAtt.detail}</p> : null}
        {showRichBody ? (
          <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={bodyTone} />
        ) : null}
      </StructuredDescriptionShell>
    );
  }

  if (type === "jobs") {
    const jobMeta = matchingAtt?.meta;
    const detailParts = matchingAtt?.detail?.split(" · ").filter(Boolean) ?? [];
    const showRichBody = Boolean(bodyHtml?.trim());
    return (
      <StructuredDescriptionShell type={type}>
        <div className="space-y-2">
          {detailParts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detailParts.map((part, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                >
                  {part}
                </span>
              ))}
            </div>
          ) : null}
          {jobMeta ? <p className={secondaryTone}>{jobMeta}</p> : null}
          {showRichBody ? (
            <FeedPostBody body={bodyHtml!} title="" dedupeBodyAgainstTitle={false} className={cn(bodyTone, "pt-1")} />
          ) : null}
        </div>
      </StructuredDescriptionShell>
    );
  }

  return null;
}

/** Fired on `window` after a poll vote is saved so every mounted {@link PollContent} for that deet refetches. */
export const UDEETS_POLL_VOTE_UPDATED_EVENT = "udeets-poll-vote-updated";

export function PollContent({
  deetId,
  attachments,
  className,
}: {
  deetId: string;
  attachments?: HubFeedItemAttachment[];
  /** Merges onto the outer poll card (e.g. spacing when a description sits above). */
  className?: string;
}) {
  const matchingAtt = attachments?.find((a) => a.type === "poll");
  const options = matchingAtt?.options ?? [];
  const parsedOptions =
    options.length > 0 ? options : (matchingAtt?.detail?.split(" · ").filter(Boolean) ?? []);
  const parsedOptionsKey = parsedOptions.join("\u0001");
  const allowMultiSelect = Boolean(matchingAtt?.pollSettings?.allowMultiSelect);
  const multiSelectLimit =
    matchingAtt?.pollSettings?.multiSelectLimit === undefined || matchingAtt?.pollSettings?.multiSelectLimit === null
      ? null
      : matchingAtt.pollSettings.multiSelectLimit;

  const parsedOptionsRef = useRef(parsedOptions);
  parsedOptionsRef.current = parsedOptions;
  const allowMultiRef = useRef(allowMultiSelect);
  allowMultiRef.current = allowMultiSelect;
  const limitRef = useRef(multiSelectLimit);
  limitRef.current = multiSelectLimit;

  /** Indices the current user selected (0-based). */
  const [mySelected, setMySelected] = useState<number[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteCounts, setVoteCounts] = useState<number[]>(() => parsedOptions.map(() => 0));

  const loadPollState = useCallback(async () => {
    if (!deetId) return;
    const parsed = parsedOptionsRef.current;
    try {
      const { getPollVotes, getMyPollVotes } = await import("@/lib/services/deets/poll-votes");
      const [allVotes, myVotes] = await Promise.all([getPollVotes([deetId]), getMyPollVotes([deetId])]);

      const counts = parsed.map(() => 0);
      const deetVotes = allVotes.filter((v) => v.deetId === deetId);
      const uniqueVoters = new Set(deetVotes.map((v) => v.userId));
      const total = uniqueVoters.size;
      for (const v of deetVotes) {
        if (v.optionIndex >= 0 && v.optionIndex < counts.length) {
          counts[v.optionIndex]++;
        }
      }
      setVoteCounts(counts);
      setTotalVotes(total);

      const myDeetVotes = myVotes.filter((v) => v.deetId === deetId);
      const mine = [...new Set(myDeetVotes.map((v) => v.optionIndex))].sort((a, b) => a - b);
      setMySelected(mine);
    } catch {
      // Table might not exist yet
    }
  }, [deetId]);

  useEffect(() => {
    if (!deetId) return;
    let cancelled = false;
    void (async () => {
      await loadPollState();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [deetId, parsedOptionsKey, loadPollState]);

  useEffect(() => {
    if (typeof window === "undefined" || !deetId) return;
    const onSync = (ev: Event) => {
      const detail = (ev as CustomEvent<{ deetId: string }>).detail;
      if (detail?.deetId !== deetId) return;
      void loadPollState();
    };
    window.addEventListener(UDEETS_POLL_VOTE_UPDATED_EVENT, onSync);
    return () => window.removeEventListener(UDEETS_POLL_VOTE_UPDATED_EVENT, onSync);
  }, [deetId, loadPollState]);

  const handleVoteSingle = async (index: number) => {
    if (isVoting) return;
    setIsVoting(true);
    const prevMine = [...mySelected];
    const prevSingle = prevMine[0] ?? null;
    setMySelected([index]);
    setVoteCounts((prev) => {
      const next = [...prev];
      if (prevSingle !== null && prevSingle < next.length) next[prevSingle]--;
      if (index < next.length) next[index]++;
      return next;
    });
    if (prevSingle === null) setTotalVotes((t) => t + 1);

    try {
      const { castPollVote } = await import("@/lib/services/deets/poll-votes");
      const success = await castPollVote(deetId, index);
      if (!success) {
        setMySelected(prevMine);
        setVoteCounts((prev) => {
          const next = [...prev];
          if (index < next.length) next[index]--;
          if (prevSingle !== null && prevSingle < next.length) next[prevSingle]++;
          return next;
        });
        if (prevSingle === null) setTotalVotes((t) => t - 1);
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UDEETS_POLL_VOTE_UPDATED_EVENT, { detail: { deetId } }));
      }
    } catch {
      setMySelected(prevMine);
      setVoteCounts((prev) => {
        const next = [...prev];
        if (index < next.length) next[index]--;
        if (prevSingle !== null && prevSingle < next.length) next[prevSingle]++;
        return next;
      });
      if (prevSingle === null) setTotalVotes((t) => t - 1);
    } finally {
      setIsVoting(false);
    }
  };

  const handleVoteMulti = async (index: number) => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const { togglePollMultiVote } = await import("@/lib/services/deets/poll-votes");
      const success = await togglePollMultiVote(deetId, index, limitRef.current);
      if (success) {
        await loadPollState();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(UDEETS_POLL_VOTE_UPDATED_EVENT, { detail: { deetId } }));
        }
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleVote = (index: number) => {
    if (allowMultiRef.current) void handleVoteMulti(index);
    else void handleVoteSingle(index);
  };

  if (!parsedOptions.length) return null;

  const hasAnyMine = mySelected.length > 0;
  const question = (matchingAtt?.title || "Poll").trim() || "Poll";

  return (
    <div
      className={cn(
        "mx-4 mt-3 overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/30",
        className,
      )}
    >
      <div className="flex gap-3 px-4 pb-2 pt-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
          <BarChart3 className="h-5 w-5 stroke-[1.5] text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ud-text-muted)]">Poll</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-[var(--ud-text-primary)]">
            {question}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--ud-text-muted)]">
            <span>
              <span className="font-semibold tabular-nums text-[var(--ud-text-secondary)]">{totalVotes}</span> voted
            </span>
            {allowMultiSelect ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--ud-text-muted)]">
                · Multi-select
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--ud-border-subtle)] px-4 py-2">
        {parsedOptions.map((opt, i) => {
          const isSelected = mySelected.includes(i);
          const count = voteCounts[i] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return (
            <button
              key={i}
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(i)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition",
                isSelected ? "text-emerald-700" : "text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)]",
              )}
            >
              {hasAnyMine && totalVotes > 0 && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-l-lg transition-[width]"
                  style={{ width: `${pct}%` }}
                >
                  <div className={cn("h-full w-full", isSelected ? "bg-emerald-100" : "bg-gray-100")} />
                </div>
              )}
              <span
                className={cn(
                  "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center border-2 transition",
                  allowMultiSelect ? "rounded-sm" : "rounded-full",
                  isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300",
                )}
              >
                {isSelected ? (
                  allowMultiSelect ? (
                    <span className="text-[10px] font-bold leading-none text-white" aria-hidden>
                      ✓
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                  )
                ) : null}
              </span>
              <span className="relative z-10 flex-1 text-left">{opt}</span>
              {hasAnyMine && totalVotes > 0 && (
                <span className="relative z-10 text-xs text-[var(--ud-text-muted)]">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SurveyContent } from "./SurveyContent";
