"use client";

import type { HubContent } from "@/lib/hub-content";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Reply,
  Search,
  Send,
  Share2,
  Smile,
  SmilePlus,
  Trash2,
  X,
} from "lucide-react";
import type { HubFeedItemAttachment } from "@/lib/hub-content";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";
import type { DeetComment, DeetViewer, DeetReactor } from "@/lib/services/deets/deet-interactions";
import { deleteDeet } from "@/lib/services/deets/delete-deet";
import { useUserProfileModal } from "@/components/UserProfileModalProvider";

function sanitizeHtmlContent(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  const scripts = div.querySelectorAll("script");
  scripts.forEach((script) => script.remove());
  const allElements = div.querySelectorAll("*");
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return div.innerHTML;
}

/* ── Deet type styling config ── */
const DEET_TYPE_CONFIG: Record<string, {
  icon: typeof Megaphone;
  label: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
}> = {
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    accent: "bg-blue-100",
  },
  notice: {
    icon: AlertTriangle,
    label: "Notice",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    accent: "bg-amber-100",
  },
  event: {
    icon: Calendar,
    label: "Event",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    accent: "bg-purple-100",
  },
  poll: {
    icon: BarChart3,
    label: "Poll",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-100",
  },
  checkin: {
    icon: MapPin,
    label: "Check-in",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    accent: "bg-rose-100",
  },
  money: {
    icon: CircleDollarSign,
    label: "Payment Request",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    accent: "bg-teal-100",
  },
  jobs: {
    icon: Briefcase,
    label: "Job Posting",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    accent: "bg-indigo-100",
  },
};

/** Resolve the deet type from kind + attachments */
function resolveDeetType(kind: string, attachments?: HubFeedItemAttachment[]): string | null {
  // Check attachments for specific types first
  if (attachments?.length) {
    for (const a of attachments) {
      if (a.type === "announcement" || a.type === "poll" || a.type === "event" || a.type === "checkin" || a.type === "money" || a.type === "jobs") {
        return a.type;
      }
    }
  }
  // Fall back to kind
  if (kind === "notice") return "notice";
  if (kind === "announcement") return "announcement";
  if (kind === "event") return "event";
  if (kind === "poll") return "poll";
  if (kind === "jobs") return "jobs";
  return null;
}

/** Type badge shown below author header */
function DeetTypeBadge({ type }: { type: string }) {
  const config = DEET_TYPE_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="px-4 pt-2">
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.accent, config.text
      )}>
        <Icon className="h-3.5 w-3.5 stroke-[2]" />
        {config.label}
      </span>
    </div>
  );
}

/** Rich content section for specific deet types */
function DeetTypeContent({ type, attachments }: { type: string; attachments?: HubFeedItemAttachment[] }) {
  const config = DEET_TYPE_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;

  const matchingAtt = attachments?.find((a) => a.type === type);

  // Notice: special highlighted section
  if (type === "notice") {
    return (
      <div className={cn("mx-4 mt-3 rounded-xl border-l-4 p-3", config.border, config.bg)}>
        <div className="flex items-start gap-2.5">
          <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", config.accent)}>
            <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          </div>
          <div className="min-w-0 flex-1">
            {matchingAtt?.title && (
              <p className={cn("text-sm font-bold", config.text)}>{matchingAtt.title}</p>
            )}
            {matchingAtt?.detail && (
              <p className="mt-0.5 text-sm text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Announcement: colored header bar with content
  if (type === "announcement") {
    return (
      <div className={cn("mx-4 mt-3 overflow-hidden rounded-xl border", config.border)}>
        <div className={cn("flex items-center gap-2 px-3 py-2", config.bg)}>
          <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          <span className={cn("text-sm font-bold", config.text)}>
            {matchingAtt?.title || "Announcement"}
          </span>
        </div>
        {matchingAtt?.detail && (
          <div className="px-3 py-2.5">
            <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
          </div>
        )}
      </div>
    );
  }

  // Poll: handled separately by PollContent component (needs state)
  if (type === "poll") return null;

  // Event: date/location card
  if (type === "event") {
    return (
      <div className={cn("mx-4 mt-3 overflow-hidden rounded-xl border", config.border)}>
        <div className={cn("flex items-center gap-2 px-3 py-2", config.bg)}>
          <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          <span className={cn("text-sm font-bold", config.text)}>
            {matchingAtt?.title || "Event"}
          </span>
        </div>
        {matchingAtt?.detail && (
          <div className="px-3 py-2.5">
            <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
          </div>
        )}
      </div>
    );
  }

  // Check-in: location display
  if (type === "checkin") {
    return (
      <div className={cn("mx-4 mt-3 overflow-hidden rounded-xl border", config.border)}>
        <div className={cn("flex items-center gap-2 px-3 py-2", config.bg)}>
          <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          <span className={cn("text-sm font-bold", config.text)}>
            {matchingAtt?.title || "Checked in"}
          </span>
        </div>
        {matchingAtt?.detail && (
          <div className="px-3 py-2.5">
            <p className="text-sm text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
          </div>
        )}
      </div>
    );
  }

  // Money / payment request
  if (type === "money") {
    return (
      <div className={cn("mx-4 mt-3 overflow-hidden rounded-xl border", config.border)}>
        <div className={cn("flex items-center gap-2 px-3 py-2", config.bg)}>
          <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          <span className={cn("text-sm font-bold", config.text)}>
            {matchingAtt?.title || "Payment Request"}
          </span>
        </div>
        {matchingAtt?.detail && (
          <div className="px-3 py-2.5">
            <p className="text-sm text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
          </div>
        )}
      </div>
    );
  }

  // Jobs: rich job listing card
  if (type === "jobs") {
    const jobMeta = matchingAtt?.meta;
    const detailParts = matchingAtt?.detail?.split(" · ").filter(Boolean) ?? [];
    return (
      <div className={cn("mx-4 mt-3 overflow-hidden rounded-xl border", config.border)}>
        <div className={cn("flex items-center gap-2 px-3 py-2", config.bg)}>
          <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          <span className={cn("text-sm font-bold", config.text)}>
            {matchingAtt?.title || "Job Posting"}
          </span>
        </div>
        <div className="px-3 py-2.5 space-y-2">
          {detailParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detailParts.map((part, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {part}
                </span>
              ))}
            </div>
          )}
          {jobMeta && (
            <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)]">{jobMeta}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/** Interactive poll component with voting */
function PollContent({ deetId, attachments }: { deetId: string; attachments?: HubFeedItemAttachment[] }) {
  const matchingAtt = attachments?.find((a) => a.type === "poll");
  const options = matchingAtt?.options ?? [];
  const parsedOptions = options.length > 0
    ? options
    : (matchingAtt?.detail?.split(" · ").filter(Boolean) ?? []);
  const allowMultiSelect = Boolean(matchingAtt?.pollSettings?.allowMultiSelect);
  const multiSelectLimit = matchingAtt?.pollSettings?.multiSelectLimit ?? null;

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteCounts, setVoteCounts] = useState<number[]>(parsedOptions.map(() => 0));

  const hasVoted = selectedIndices.size > 0;

  // Fetch existing votes on mount
  useEffect(() => {
    if (!deetId) return;
    let cancelled = false;

    (async () => {
      try {
        const { getPollVotes, getMyPollVotes } = await import("@/lib/services/deets/poll-votes");
        const [allVotes, myVotes] = await Promise.all([
          getPollVotes([deetId]),
          getMyPollVotes([deetId]),
        ]);

        if (cancelled) return;

        const counts = parsedOptions.map(() => 0);
        const deetVotes = allVotes.filter((v) => v.deetId === deetId);
        // Count unique voters for the "N voted" display.
        const uniqueVoters = new Set(deetVotes.map((v) => v.userId));
        for (const v of deetVotes) {
          if (v.optionIndex >= 0 && v.optionIndex < counts.length) {
            counts[v.optionIndex]++;
          }
        }
        setVoteCounts(counts);
        setTotalVotes(uniqueVoters.size);

        const myDeetVotes = myVotes.filter((v) => v.deetId === deetId);
        setSelectedIndices(new Set(myDeetVotes.map((v) => v.optionIndex)));
      } catch {
        // Table might not exist yet
      }
    })();

    return () => { cancelled = true; };
  }, [deetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (index: number) => {
    if (isVoting) return;

    // ── Single-select: replace any existing vote ────────────────────
    if (!allowMultiSelect) {
      if (selectedIndices.has(index)) return; // no-op: already voted for this option
      setIsVoting(true);
      const prevIndices = new Set(selectedIndices);
      const prevOnly: number | null = prevIndices.size > 0 ? [...prevIndices][0] : null;

      // Optimistic: clear prior selection, set new one.
      setSelectedIndices(new Set([index]));
      setVoteCounts((prev) => {
        const next = [...prev];
        if (prevOnly !== null && prevOnly < next.length) next[prevOnly]--;
        if (index < next.length) next[index]++;
        return next;
      });
      if (prevOnly === null) setTotalVotes((t) => t + 1);

      try {
        const { castPollVote } = await import("@/lib/services/deets/poll-votes");
        const ok = await castPollVote(deetId, index);
        if (!ok) throw new Error("cast failed");
      } catch {
        // Revert
        setSelectedIndices(prevIndices);
        setVoteCounts((prev) => {
          const next = [...prev];
          if (index < next.length) next[index]--;
          if (prevOnly !== null && prevOnly < next.length) next[prevOnly]++;
          return next;
        });
        if (prevOnly === null) setTotalVotes((t) => t - 1);
      } finally {
        setIsVoting(false);
      }
      return;
    }

    // ── Multi-select: toggle this option ────────────────────────────
    const isCurrentlySelected = selectedIndices.has(index);
    if (!isCurrentlySelected && multiSelectLimit && selectedIndices.size >= multiSelectLimit) {
      return; // hit the limit
    }
    setIsVoting(true);
    const prevIndices = new Set(selectedIndices);
    const prevWasEmpty = prevIndices.size === 0;

    const nextIndices = new Set(selectedIndices);
    if (isCurrentlySelected) nextIndices.delete(index);
    else nextIndices.add(index);

    setSelectedIndices(nextIndices);
    setVoteCounts((prev) => {
      const next = [...prev];
      if (index < next.length) next[index] += isCurrentlySelected ? -1 : 1;
      return next;
    });
    if (prevWasEmpty && nextIndices.size > 0) setTotalVotes((t) => t + 1);
    if (!prevWasEmpty && nextIndices.size === 0) setTotalVotes((t) => Math.max(0, t - 1));

    try {
      const { togglePollVote } = await import("@/lib/services/deets/poll-votes");
      const result = await togglePollVote(deetId, index);
      if (!result) throw new Error("toggle failed");
    } catch {
      // Revert
      setSelectedIndices(prevIndices);
      setVoteCounts((prev) => {
        const next = [...prev];
        if (index < next.length) next[index] += isCurrentlySelected ? 1 : -1;
        return next;
      });
      if (prevWasEmpty && nextIndices.size > 0) setTotalVotes((t) => Math.max(0, t - 1));
      if (!prevWasEmpty && nextIndices.size === 0) setTotalVotes((t) => t + 1);
    } finally {
      setIsVoting(false);
    }
  };

  if (!parsedOptions.length) return null;

  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/30">
      {/* Poll header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
          <BarChart3 className="h-5 w-5 stroke-[1.5] text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-600">Poll Opened</span>
            <span className="text-xs text-[var(--ud-text-muted)]">{totalVotes} voted</span>
            {allowMultiSelect ? (
              <span className="text-xs text-[var(--ud-text-muted)]">
                · Multi-select{multiSelectLimit ? ` (up to ${multiSelectLimit})` : ""}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-[var(--ud-text-primary)]">
            {matchingAtt?.title || "Poll"}
          </p>
        </div>
      </div>

      {/* Poll options */}
      <div className="border-t border-[var(--ud-border-subtle)] px-4 py-2">
        {parsedOptions.map((opt, i) => {
          const isSelected = selectedIndices.has(i);
          const count = voteCounts[i] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const limitHit = allowMultiSelect && multiSelectLimit
            ? !isSelected && selectedIndices.size >= multiSelectLimit
            : false;

          return (
            <button
              key={i}
              type="button"
              disabled={isVoting || limitHit}
              onClick={() => handleVote(i)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition",
                isSelected
                  ? "text-emerald-700"
                  : limitHit
                    ? "text-[var(--ud-text-muted)] opacity-50 cursor-not-allowed"
                    : "text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)]"
              )}
            >
              {/* Progress bar background */}
              {hasVoted && totalVotes > 0 && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-lg transition-all",
                    isSelected ? "bg-emerald-100" : "bg-gray-100"
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}
              {/* Selection indicator — radio for single, checkbox for multi */}
              <span className={cn(
                "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center border-2 transition",
                allowMultiSelect ? "rounded" : "rounded-full",
                isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
              )}>
                {isSelected && (
                  allowMultiSelect ? (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )
                )}
              </span>
              <span className="relative z-10 flex-1 text-left">{opt}</span>
              {hasVoted && totalVotes > 0 && (
                <span className="relative z-10 text-xs text-[var(--ud-text-muted)]">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Icon sizing ── */
const POST_ICON = "h-[18px] w-[18px] stroke-[1.5]";

/* ── Emoji reactions (inline) ── */
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/** Map emoji to human-readable label for the React button */
const EMOJI_TEXT_MAP: Record<string, string> = {
  "👍": "Liked",
  "❤️": "Loved",
  "😂": "Haha",
  "😮": "Surprised",
  "😢": "Sad",
  "🙏": "Grateful",
  "like": "Liked",
};

function EmojiReactButton({
  deetId,
  isLiked,
  isLiking,
  onToggleLike,
}: {
  deetId: string;
  isLiked: boolean;
  isLiking: boolean;
  onToggleLike?: (deetId: string, reactionType?: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        pickerRef.current && !pickerRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  const handleReactClick = () => {
    // Always show the emoji picker (whether reacted or not)
    setShowPicker((v) => !v);
  };

  const handleEmojiSelect = (emoji: string) => {
    setShowPicker(false);
    if (isLiked && selectedEmoji === emoji) {
      // Same emoji picked again — un-react
      onToggleLike?.(deetId, emoji);
      setSelectedEmoji(null);
    } else {
      // New reaction or changed emoji
      setSelectedEmoji(emoji);
      onToggleLike?.(deetId, emoji);
    }
  };

  const displayEmoji = isLiked ? (selectedEmoji || "👍") : null;

  return (
    <div className="relative flex-1">
      {/* Emoji picker popup */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute -top-12 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--ud-border)] bg-white px-2 py-1.5 shadow-lg"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiSelect(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 active:scale-95"
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
        disabled={isLiking}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]",
          isLiked
            ? "text-[var(--ud-brand-primary)] font-medium"
            : "text-[var(--ud-text-muted)]"
        )}
      >
        {isLiking ? (
          <Loader2 className={cn(POST_ICON, "animate-spin")} />
        ) : displayEmoji ? (
          <span className="text-base">{displayEmoji}</span>
        ) : (
          <SmilePlus className={POST_ICON} />
        )}
        <span>{isLiked ? (EMOJI_TEXT_MAP[selectedEmoji ?? "like"] ?? "Reacted") : "React"}</span>
      </button>
    </div>
  );
}

/* ── Sort options ── */
type SortOption = "Newest" | "Oldest";

type FeedFilterOption = "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos";

/* ── Filter pill options (pill filters) ── */
const FILTER_PILLS: Array<{ key: string; label: string }> = [
  { key: "All", label: "All posts" },
  { key: "Announcements", label: "Announcement" },
  { key: "Events", label: "Event" },
  { key: "Polls", label: "Poll" },
  { key: "Photos", label: "Photo" },
];

/* ── Reactions Modal ── */
const EMOJI_LABEL_MAP: Record<string, string> = {
  "like": "👍", "👍": "👍", "❤️": "❤️", "😂": "😂", "😮": "😮", "😢": "😢", "🙏": "🙏",
};

function ReactionsModal({
  reactors,
  isLoading,
  onClose,
}: {
  reactors: DeetReactor[];
  isLoading: boolean;
  onClose: () => void;
}) {
  const { openProfileModal } = useUserProfileModal();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Group by reaction type
  const grouped = new Map<string, DeetReactor[]>();
  for (const r of reactors) {
    const key = r.reactionType || "like";
    const existing = grouped.get(key) ?? [];
    existing.push(r);
    grouped.set(key, existing);
  }

  const filteredReactors = activeTab === "all" ? reactors : (grouped.get(activeTab) ?? []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] px-5 py-3.5">
          <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">
            {reactors.length} reaction{reactors.length !== 1 ? "s" : ""}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tabs: Total | per emoji */}
        <div className="flex items-center gap-1 border-b border-[var(--ud-border-subtle)] px-4 py-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              activeTab === "all"
                ? "bg-[var(--ud-brand-primary)]/10 text-[var(--ud-brand-primary)]"
                : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]"
            )}
          >
            Total {reactors.length}
          </button>
          {[...grouped.entries()].map(([emoji, list]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setActiveTab(emoji)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition",
                activeTab === emoji
                  ? "bg-[var(--ud-brand-primary)]/10 text-[var(--ud-brand-primary)]"
                  : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]"
              )}
            >
              <span>{EMOJI_LABEL_MAP[emoji] ?? emoji}</span>
              <span>{list.length}</span>
            </button>
          ))}
        </div>

        {/* Reactors list */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-text-muted)]" />
            </div>
          ) : filteredReactors.length > 0 ? (
            <div className="py-1">
              {filteredReactors.map((reactor) => (
                <div key={reactor.userId} className="flex items-center gap-3 px-5 py-2.5">
                  <button
                    type="button"
                    onClick={() => { onClose(); openProfileModal(reactor.userId); }}
                    aria-label={`Open ${reactor.name}'s profile`}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40"
                  >
                    <ImageWithFallback
                      src={reactor.avatar || ""}
                      sources={reactor.avatar ? [reactor.avatar] : []}
                      alt={reactor.name}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                      fallback={initials(reactor.name)}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { onClose(); openProfileModal(reactor.userId); }}
                        className="text-sm font-medium text-[var(--ud-text-primary)] transition hover:underline"
                      >
                        {reactor.name}
                      </button>
                      {reactor.role && reactor.role !== "member" && (
                        <span className="rounded-full bg-[var(--ud-brand-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                          {reactor.role === "creator" ? "Creator" : "Admin"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-lg">{EMOJI_LABEL_MAP[reactor.reactionType] ?? reactor.reactionType}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-[var(--ud-text-muted)]">No reactions yet</p>
          )}
        </div>

        {/* OK button */}
        <div className="border-t border-[var(--ud-border-subtle)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--ud-bg-subtle)] py-2.5 text-sm font-medium text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-border-subtle)]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeetsSection({
  normalizedPostSearch,
  postSearchQuery,
  onPostSearchQueryChange,
  isFeedSearchOpen,
  onToggleFeedSearch,
  isFeedFilterOpen,
  onToggleFeedFilter,
  feedFilter,
  onSelectFeedFilter,
  filteredFeedItems,
  showDemoPostedText,
  demoPostedText,
  showDemoPoll,
  demoPollVote,
  demoLiked,
  highlightedItemId,
  isDemoPreview,
  isCreatorAdmin,
  dpImageSrc,
  coverImageSrc,
  recentPhotos,
  hubName,
  hubCategory,
  hubSlug,
  userAvatarSrc,
  userName,
  currentUserId,
  onOpenComposer,
  onOpenViewer,
  onDeleteDeet,
  likedDeetIds,
  likingDeetIds,
  likeCountOverrides,
  viewCountOverrides,
  onToggleLike,
  reactorsByDeetId,
  reactionsModalDeetId,
  reactionsModalData,
  reactionsModalLoading,
  onOpenReactionsModal,
  onCloseReactionsModal,
  expandedCommentDeetId,
  commentsByDeetId,
  commentLoadingDeetIds,
  commentSubmittingDeetId,
  commentCountOverrides,
  commentError,
  onToggleComments,
  onSubmitComment,
  onEditComment,
  onDeleteComment,
  onEditDeet,
  viewersDeetId,
  viewersByDeetId,
  viewersLoading,
  onToggleViewers,
}: {
  normalizedPostSearch: string;
  postSearchQuery: string;
  onPostSearchQueryChange: (value: string) => void;
  isFeedSearchOpen: boolean;
  onToggleFeedSearch: () => void;
  isFeedFilterOpen: boolean;
  onToggleFeedFilter: () => void;
  feedFilter: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos";
  onSelectFeedFilter: (value: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos") => void;
  filteredFeedItems: HubContent["feed"];
  showDemoPostedText: boolean;
  demoPostedText: string;
  showDemoPoll: boolean;
  demoPollVote: string | null;
  demoLiked: boolean;
  highlightedItemId: string | null;
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  dpImageSrc: string;
  coverImageSrc: string;
  recentPhotos: string[];
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  userAvatarSrc?: string;
  userName?: string;
  currentUserId?: string;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string, commentContext?: { commentId: string; authorName: string; authorAvatar?: string; body: string; createdAt: string; reactedEmoji?: string | null; replies?: Array<{ id: string; authorName: string; authorAvatar?: string; body: string; createdAt: string }> }) => void;
  onDeleteDeet?: (deetId: string) => void;
  likedDeetIds?: Set<string>;
  likingDeetIds?: Set<string>;
  likeCountOverrides?: Record<string, number>;
  viewCountOverrides?: Record<string, number>;
  onToggleLike?: (deetId: string, reactionType?: string) => void;
  reactorsByDeetId?: Record<string, DeetReactor[]>;
  reactionsModalDeetId?: string | null;
  reactionsModalData?: DeetReactor[];
  reactionsModalLoading?: boolean;
  onOpenReactionsModal?: (deetId: string) => void;
  onCloseReactionsModal?: () => void;
  expandedCommentDeetId?: string | null;
  commentsByDeetId?: Record<string, DeetComment[]>;
  commentLoadingDeetIds?: Set<string>;
  commentSubmittingDeetId?: string | null;
  commentCountOverrides?: Record<string, number>;
  commentError?: string | null;
  onToggleComments?: (deetId: string) => void;
  onSubmitComment?: (deetId: string, body: string, parentId?: string, attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string }) => Promise<{ success: boolean }> | void;
  onEditComment?: (commentId: string, deetId: string, newBody: string) => Promise<{ success: boolean }> | void;
  onDeleteComment?: (commentId: string, deetId: string) => Promise<{ success: boolean }> | void;
  onEditDeet?: (item: HubContent["feed"][number]) => void;
  viewersDeetId?: string | null;
  viewersByDeetId?: Record<string, DeetViewer[]>;
  viewersLoading?: boolean;
  onToggleViewers?: (deetId: string) => void;
}) {
  const { openProfileModal } = useUserProfileModal();
  const [sortOption, setSortOption] = useState<SortOption>("Newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeFilterPill, setActiveFilterPill] = useState<string>("All");

  const [openMenuDeetId, setOpenMenuDeetId] = useState<string | null>(null);
  const [isNoticeExpanded, setIsNoticeExpanded] = useState(false);
  const [copiedDeetId, setCopiedDeetId] = useState<string | null>(null);
  const [deletingDeetId, setDeletingDeetId] = useState<string | null>(null);
  const [confirmDeleteDeetId, setConfirmDeleteDeetId] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeleteDeet = async (deetId: string) => {
    setDeletingDeetId(deetId);
    try {
      await deleteDeet(deetId);
      onDeleteDeet?.(deetId);
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setDeletingDeetId(null);
      setConfirmDeleteDeetId(null);
    }
  };

  const [shareCountOverrides, setShareCountOverrides] = useState<Record<string, number>>({});
  // Track deets the current user has already shared this session (prevents double-counting)
  const [sharedDeetIds, setSharedDeetIds] = useState<Set<string>>(new Set());

  const handleShareDeet = async (deetId: string) => {
    const shareUrl = `${window.location.origin}/hubs/${hubCategory}/${hubSlug}?focus=${deetId}`;
    // Always copy to clipboard — no native share sheet
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedDeetId(deetId);

    // Only bump the count optimistically if user hasn't already shared this deet
    const alreadySharedLocally = sharedDeetIds.has(deetId);
    if (!alreadySharedLocally) {
      setShareCountOverrides((prev) => ({ ...prev, [deetId]: (prev[deetId] ?? 0) + 1 }));
      setSharedDeetIds((prev) => new Set(prev).add(deetId));
    }

    // Persist to database (non-blocking, idempotent)
    import("@/lib/services/deets/deet-interactions").then(({ recordDeetShare }) => {
      recordDeetShare(deetId).then(({ total }) => {
        if (total > 0) {
          const item = filteredFeedItems.find((fi) => fi.id === deetId);
          const base = item?.shares ?? 0;
          setShareCountOverrides((prev) => ({ ...prev, [deetId]: total - base }));
        }
      }).catch(() => { /* swallow — optimistic count stays */ });
    }).catch(() => { /* swallow */ });
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedDeetId(null), 2000);
  };

  /* Handle sort change — route through existing feedFilter prop */
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setIsSortOpen(false);
    onSelectFeedFilter(option);
  };

  /* Handle pill filter change */
  const handlePillFilter = (key: string) => {
    setActiveFilterPill(key);
    if (key === "All") {
      onSelectFeedFilter(sortOption);
    } else {
      onSelectFeedFilter(key as FeedFilterOption);
    }
  };

  /* ── Composer card (desktop only — mobile uses FAB) ── */
  const composerCard = (
    <div className="hidden lg:block">
      <DeetComposerCard
        isDemoPreview={isDemoPreview}
        isCreatorAdmin={isCreatorAdmin}
        onOpenComposer={onOpenComposer}
      />
    </div>
  );

  /* ── Notice items (Displayed them in a separate strip above feed) ── */
  const noticeItems = filteredFeedItems.filter((item) => {
    if (item.kind !== "notice") return false;
    // Exclude items that resolve to "announcement" display type
    const resolved = resolveDeetType(item.kind, item.deetAttachments);
    return resolved !== "announcement";
  });

  return (
    <>
    <SectionShell
      title="Posts"
      description={
        normalizedPostSearch
          ? "Showing filtered updates, announcements, moments, reminders, and conversations from this hub."
          : "Updates, announcements, moments, reminders, and conversations from this hub."
      }
      actions={
        <div className="flex items-center gap-2">
          {isFeedSearchOpen ? (
            <label className="flex h-10 items-center gap-2 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 shadow-sm">
              <Search className="h-4 w-4 text-[var(--ud-text-muted)]" />
              <input
                value={postSearchQuery}
                onChange={(event) => onPostSearchQueryChange(event.target.value)}
                placeholder="Keyword, #Hashtag, @Name"
                className="w-28 min-w-0 bg-transparent text-sm text-[var(--ud-text-secondary)] outline-none placeholder:text-[var(--ud-text-muted)] sm:w-52"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={onToggleFeedSearch}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)] shadow-sm transition hover:text-[var(--ud-brand-primary)]",
              isFeedSearchOpen && "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
            )}
            aria-label="Search deets"
            title="Search"
          >
            <Search className="h-5 w-5 stroke-[1.5]" />
          </button>
        </div>
      }
    >
        <div className="w-full space-y-3">
          {composerCard}

          {/* ── Notice section (pinned notices above feed, collapsible) ── */}
          {noticeItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50">
              <button
                type="button"
                onClick={() => setIsNoticeExpanded(!isNoticeExpanded)}
                className="flex w-full items-center justify-between px-4 py-2.5 transition hover:bg-amber-100/50"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 stroke-[2] text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Notices</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{noticeItems.length}</span>
                  <ChevronDown className={cn("h-4 w-4 text-amber-500 transition-transform", isNoticeExpanded ? "rotate-0" : "-rotate-90")} />
                </div>
              </button>
              {isNoticeExpanded && (
                <div className="border-t border-amber-200">
                  {noticeItems.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(notice.id);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm border-b border-amber-100 last:border-b-0 hover:bg-amber-100/60 transition text-left"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate flex-1 text-amber-900">
                        {notice.title && notice.title !== "Notice" ? (
                          notice.title
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(notice.body).slice(0, 80) }} />
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-amber-400 -rotate-90" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Sort row + view toggles (styled) ── */}
          <div className="flex items-center justify-between py-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ud-text-primary)]"
              >
                {sortOption}
                <ChevronDown className="h-4 w-4 text-[var(--ud-text-muted)]" />
              </button>
              {isSortOpen && (
                <div className="absolute left-0 top-8 z-20 min-w-[120px] rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg">
                  {(["Newest", "Oldest"] as SortOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSortChange(option)}
                      className={cn(
                        "flex w-full items-center rounded-lg px-3 py-2 text-sm transition",
                        sortOption === option
                          ? "bg-[var(--ud-brand-light)] font-medium text-[var(--ud-brand-primary)]"
                          : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Filter pills (styled) ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" as never }}>
            {FILTER_PILLS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePillFilter(key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                  activeFilterPill === key
                    ? "bg-[var(--ud-brand-primary)] text-white shadow-sm"
                    : "border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)] hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {showDemoPostedText ? (
            <article className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
              <div className="px-4 pb-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold text-[var(--ud-text-primary)]">Featured deet</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{demoPostedText}</p>
              </div>
            </article>
          ) : null}

          {showDemoPoll ? (
            <article
              data-demo-target={isDemoPreview ? "hub-poll-section" : undefined}
              className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm"
            >
              <div className="px-4 pb-3 pt-4">
                <h3 className="text-[15px] font-semibold text-[var(--ud-text-primary)]">Free Pet Check-up in Mechanicsville</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
                  Would you attend the complimentary pet wellness check this Saturday?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    data-demo-target={isDemoPreview ? "hub-poll-yes" : undefined}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition",
                      demoPollVote === "yes" ? "bg-[var(--ud-brand-primary)] text-white" : "border border-[var(--ud-border)] text-[var(--ud-text-secondary)]"
                    )}
                  >
                    Yes
                  </button>
                  <button type="button" className="rounded-full border border-[var(--ud-border)] px-4 py-1.5 text-sm font-medium text-[var(--ud-text-muted)]">
                    Maybe
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--ud-border-subtle)] px-4 py-2.5">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-like-button" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm transition",
                    demoLiked ? "text-[var(--ud-brand-primary)] font-medium" : "text-[var(--ud-text-muted)]"
                  )}
                >
                  <SmilePlus className={POST_ICON} />
                  React
                </button>
                <span className="text-xs text-[var(--ud-text-muted)]">214 engaged</span>
              </div>
            </article>
          ) : null}

          {/* ── Feed items ── */}
          <section className="w-full space-y-3">
            {filteredFeedItems.length === 0 && !showDemoPostedText && !showDemoPoll && (
              <div className="grid min-h-[220px] w-full place-items-center rounded-xl border border-dashed border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] p-6 text-center">
                <div className="w-full">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]">
                    {feedFilter === "Events" ? <Calendar className="h-5 w-5 stroke-[1.5]" />
                      : feedFilter === "Photos" ? <Eye className="h-5 w-5 stroke-[1.5]" />
                      : feedFilter === "Polls" ? <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                      : feedFilter === "Announcements" ? <Megaphone className="h-5 w-5 stroke-[1.5]" />
                      : <Megaphone className="h-5 w-5 stroke-[1.5]" />}
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">
                    {normalizedPostSearch
                      ? "No matching deets"
                      : feedFilter === "Events"
                        ? "No events created yet"
                        : feedFilter === "Photos"
                          ? "No photos updated yet"
                          : feedFilter === "Polls"
                            ? "No polls created yet"
                            : feedFilter === "Announcements"
                              ? "No announcements yet"
                              : "This deets stream is ready"}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--ud-text-muted)]">
                    {normalizedPostSearch
                      ? "Try another keyword or filter."
                      : feedFilter === "Events"
                        ? isCreatorAdmin ? "Create your first event to get things started." : "Check back soon for upcoming events."
                        : feedFilter === "Photos"
                          ? isCreatorAdmin ? "Share your first photo with the community." : "Check back soon for shared photos."
                          : feedFilter === "Polls"
                            ? isCreatorAdmin ? "Create a poll to gather community feedback." : "Check back soon for new polls."
                            : feedFilter === "Announcements"
                              ? isCreatorAdmin ? "Post an announcement to keep everyone in the loop." : "Check back soon for announcements."
                              : isCreatorAdmin
                                ? "Kick things off with a welcome note, event reminder, or a first shared photo."
                                : "Check back soon for updates and conversations."}
                  </p>
                </div>
              </div>
            )}
            {filteredFeedItems.map((item) => (
              <div key={item.id} className="relative">
                {/* Viewers dropdown removed from here — now rendered inline near the eye icon */}

              <article
                id={item.id}
                className={cn(
                  "w-full overflow-visible rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm transition",
                  highlightedItemId === item.id && "ring-2 ring-[var(--ud-brand-primary)] ring-offset-2"
                )}
              >
                {/* ── Author header ── */}
                <div className="flex items-center gap-3 px-4 pt-4">
                  <button
                    type="button"
                    onClick={() => item.authorId && openProfileModal(item.authorId)}
                    aria-label={`Open ${item.author}'s profile`}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40"
                  >
                    <ImageWithFallback
                      src={item.authorAvatar || ""}
                      sources={item.authorAvatar ? [item.authorAvatar] : []}
                      alt={item.author}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                      fallback={initials(item.author)}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => item.authorId && openProfileModal(item.authorId)}
                        className="text-[15px] font-semibold text-[var(--ud-text-primary)] transition hover:underline"
                      >
                        {item.author}
                      </button>
                      {item.role && (
                        <span className="text-sm text-[var(--ud-text-muted)]">
                          {item.role === "creator" ? "Creator" : item.role === "admin" ? "Admin" : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--ud-text-muted)]">{item.time}</span>
                  </div>
                  {/* Three-dot menu (styled) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuDeetId(openMenuDeetId === item.id ? null : item.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-[18px] w-[18px] stroke-[1.5]" />
                    </button>
                    {openMenuDeetId === item.id && (
                      <div className="absolute right-0 top-9 z-20 min-w-[160px] rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            handleShareDeet(item.id);
                            setOpenMenuDeetId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Copy link
                        </button>
                        {(currentUserId === item.authorId || isCreatorAdmin) && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuDeetId(null);
                                if (onEditDeet) {
                                  onEditDeet(item);
                                } else {
                                  onOpenComposer(null);
                                }
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuDeetId(null);
                                setConfirmDeleteDeetId(item.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </>
                        )}
                        {currentUserId !== item.authorId && !isCreatorAdmin && (
                          <button
                            type="button"
                            onClick={() => setOpenMenuDeetId(null)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Type badge + rich content ── */}
                {(() => {
                  const deetType = resolveDeetType(item.kind, item.deetAttachments);
                  const hasRichSection = deetType && item.deetAttachments?.some((a) => a.type === deetType);

                  // Only suppress the body text when it exactly matches what the
                  // rich section is about to display (e.g. an announcement where
                  // body = attachment.detail). If the user typed their own body
                  // alongside a poll / event / etc., keep it visible.
                  const richAttachment = hasRichSection
                    ? item.deetAttachments?.find((a) => a.type === deetType)
                    : null;
                  const bodyPlain = (item.body ?? "").replace(/<[^>]*>/g, "").trim();
                  const richDetailPlain = (richAttachment?.detail ?? "").trim();
                  const richTitlePlain = (richAttachment?.title ?? "").trim();
                  const bodyIsJustRichEcho = Boolean(
                    bodyPlain &&
                    (bodyPlain === richDetailPlain || bodyPlain === richTitlePlain || bodyPlain === `${richTitlePlain} ${richDetailPlain}`.trim())
                  );
                  const shouldRenderBody = Boolean(item.body) && !bodyIsJustRichEcho;

                  return (
                    <>
                      {deetType ? <DeetTypeBadge type={deetType} /> : null}

                      {shouldRenderBody ? (
                        <div
                          className="px-4 pt-3 text-[15px] leading-relaxed text-[var(--ud-text-primary)]"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.body) }}
                        />
                      ) : null}

                      {/* Rich type content section */}
                      {deetType === "poll" ? (
                        <PollContent deetId={item.id} attachments={item.deetAttachments} />
                      ) : deetType ? (
                        <DeetTypeContent type={deetType} attachments={item.deetAttachments} />
                      ) : null}
                    </>
                  );
                })()}

                {/* ── Image / gallery ── */}
                {(() => {
                  const galleryImages = item.images?.length ? item.images : item.image ? [item.image] : [];
                  if (galleryImages.length === 0) return null;

                  const openAt = (index: number) =>
                    onOpenViewer(galleryImages, index, item.title, item.body, item.id);

                  // Single image — original hero layout (16:9, contain so small images aren't stretched).
                  if (galleryImages.length === 1) {
                    return (
                      <button
                        type="button"
                        className="mt-3 block w-full bg-[var(--ud-bg-subtle)]"
                        onClick={() => openAt(0)}
                      >
                        <div className="flex aspect-video max-h-[420px] w-full items-center justify-center overflow-hidden">
                          <ImageWithFallback
                            src={galleryImages[0]}
                            sources={galleryImages}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain"
                            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-sm text-[var(--ud-text-muted)]"
                            fallback="Image unavailable"
                            loading="lazy"
                          />
                        </div>
                      </button>
                    );
                  }

                  // Two images — side-by-side, equal halves.
                  if (galleryImages.length === 2) {
                    return (
                      <div className="mt-3 grid grid-cols-2 gap-0.5 bg-[var(--ud-bg-subtle)]">
                        {galleryImages.map((url, i) => (
                          <button
                            key={`${url}-${i}`}
                            type="button"
                            onClick={() => openAt(i)}
                            className="relative block aspect-square overflow-hidden"
                          >
                            <ImageWithFallback
                              src={url}
                              alt={`${item.title} photo ${i + 1}`}
                              className="h-full w-full object-cover"
                              fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-xs text-[var(--ud-text-muted)]"
                              fallback="Unavailable"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // Three or more — large hero on the left, two stacked tiles on the right.
                  // Any images beyond the first three show a "+N" overlay on the last tile.
                  const visible = galleryImages.slice(0, 3);
                  const extra = galleryImages.length - 3;
                  return (
                    <div className="mt-3 grid aspect-[4/3] max-h-[460px] grid-cols-2 grid-rows-2 gap-0.5 bg-[var(--ud-bg-subtle)]">
                      <button
                        type="button"
                        onClick={() => openAt(0)}
                        className="relative row-span-2 overflow-hidden"
                      >
                        <ImageWithFallback
                          src={visible[0]}
                          alt={`${item.title} photo 1`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-xs text-[var(--ud-text-muted)]"
                          fallback="Unavailable"
                          loading="lazy"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => openAt(1)}
                        className="relative overflow-hidden"
                      >
                        <ImageWithFallback
                          src={visible[1]}
                          alt={`${item.title} photo 2`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-xs text-[var(--ud-text-muted)]"
                          fallback="Unavailable"
                          loading="lazy"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => openAt(2)}
                        className="relative overflow-hidden"
                      >
                        <ImageWithFallback
                          src={visible[2]}
                          alt={`${item.title} photo 3`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-xs text-[var(--ud-text-muted)]"
                          fallback="Unavailable"
                          loading="lazy"
                        />
                        {extra > 0 ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                            +{extra}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  );
                })()}

                {/* ── Stats row: reactions · comments · shares (left) + chevron | views (right) ── */}
                <div className="relative flex items-center justify-between px-4 pt-2 pb-1">
                  <div className="flex items-center gap-3 text-xs text-[var(--ud-text-muted)]">
                    {(likeCountOverrides?.[item.id] ?? item.likes) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <SmilePlus className="h-3.5 w-3.5 stroke-[1.5]" />
                        {likeCountOverrides?.[item.id] ?? item.likes}
                      </span>
                    )}
                    {(item.comments + (commentCountOverrides?.[item.id] ?? 0)) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 stroke-[1.5]" />
                        {item.comments + (commentCountOverrides?.[item.id] ?? 0)}
                      </span>
                    )}
                    {(item.shares + (shareCountOverrides[item.id] ?? 0)) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5 stroke-[1.5]" />
                        {item.shares + (shareCountOverrides[item.id] ?? 0)}
                      </span>
                    )}
                    {/* Dropdown chevron to toggle comments (like Band) */}
                    {(item.comments + (commentCountOverrides?.[item.id] ?? 0)) > 0 && (
                      <button
                        type="button"
                        onClick={() => onToggleComments?.(item.id)}
                        className="inline-flex items-center justify-center rounded-full hover:bg-[var(--ud-bg-subtle)] transition"
                        title="Toggle comments"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedCommentDeetId === item.id && "rotate-180")} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleViewers?.(item.id)}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs transition",
                      viewersDeetId === item.id
                        ? "text-[var(--ud-brand-primary)] font-medium"
                        : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-secondary)]"
                    )}
                    title="See who viewed"
                  >
                    <Eye className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>{(viewCountOverrides?.[item.id] != null ? item.views + viewCountOverrides[item.id] : item.views)}</span>
                  </button>

                  {/* ── Viewers popover ── */}
                  {viewersDeetId === item.id && (
                    <div className="absolute bottom-full right-4 z-50 mb-1 w-56 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-lg">
                      <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] px-3 py-2">
                        <span className="text-[11px] font-semibold text-[var(--ud-text-primary)]">Viewed by</span>
                        <button
                          type="button"
                          onClick={() => onToggleViewers?.(item.id)}
                          className="text-[10px] text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {viewersLoading ? (
                          <div className="flex items-center justify-center py-3">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ud-text-muted)]" />
                          </div>
                        ) : (viewersByDeetId?.[item.id] ?? []).length > 0 ? (
                          <div className="py-1">
                            {(viewersByDeetId?.[item.id] ?? []).map((viewer) => (
                              <div key={viewer.userId} className="flex items-center gap-2 px-3 py-1.5">
                                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                                  <ImageWithFallback
                                    src={viewer.avatar || ""}
                                    sources={viewer.avatar ? [viewer.avatar] : []}
                                    alt={viewer.name}
                                    className="h-full w-full object-cover"
                                    fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[7px] font-bold text-[var(--ud-brand-primary)]"
                                    fallback={initials(viewer.name)}
                                  />
                                </div>
                                <span className="min-w-0 flex-1 truncate text-xs text-[var(--ud-text-primary)]">{viewer.name}</span>
                                <span className="shrink-0 text-[9px] text-[var(--ud-text-muted)]">
                                  {viewer.viewedAt ? new Date(viewer.viewedAt).toLocaleDateString() : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="px-3 py-3 text-center text-[11px] text-[var(--ud-text-muted)]">No views yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Action bar: React + Comment + Share ── */}
                <div className="flex items-center border-t border-[var(--ud-border-subtle)]">
                  {/* React button with emoji picker */}
                  <EmojiReactButton
                    deetId={item.id}
                    isLiked={likedDeetIds?.has(item.id) ?? false}
                    isLiking={likingDeetIds?.has(item.id) ?? false}
                    onToggleLike={onToggleLike}
                  />

                  {/* Comment button — hidden when author disabled comments on this deet */}
                  {item.allowComments === false ? (
                    <div
                      className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-[var(--ud-text-muted)] opacity-60"
                      title="The author has turned off comments on this post"
                    >
                      <MessageSquare className={POST_ICON} />
                      <span>Comments off</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleComments?.(item.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]",
                        expandedCommentDeetId === item.id
                          ? "text-[var(--ud-brand-primary)] font-medium"
                          : "text-[var(--ud-text-muted)]"
                      )}
                    >
                      <MessageSquare className={POST_ICON} />
                      <span>Comment</span>
                    </button>
                  )}

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={() => handleShareDeet(item.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]",
                      copiedDeetId === item.id
                        ? "text-[var(--ud-brand-primary)] font-medium"
                        : "text-[var(--ud-text-muted)]"
                    )}
                  >
                    <Share2 className={POST_ICON} />
                    <span>{copiedDeetId === item.id ? "Copied!" : "Share"}</span>
                  </button>
                </div>

                {/* ── Comments section (with reactor preview inside) ── */}
                {expandedCommentDeetId === item.id && (
                  <>
                  {/* ── Reactions preview row (avatars + emoji + > arrow) — only when expanded ── */}
                  {(reactorsByDeetId?.[item.id]?.length ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenReactionsModal?.(item.id)}
                      className="flex w-full items-center justify-between border-t border-[var(--ud-border-subtle)] px-4 py-2 hover:bg-[var(--ud-bg-subtle)] transition"
                    >
                      <div className="flex items-center">
                        {/* Overlapping avatars with emoji badges */}
                        <div className="flex items-center -space-x-2">
                          {(reactorsByDeetId?.[item.id] ?? []).slice(0, 5).map((reactor, idx) => (
                            <div key={reactor.userId} className="relative" style={{ zIndex: 5 - idx }}>
                              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-[var(--ud-bg-card)] bg-[var(--ud-brand-light)]">
                                <ImageWithFallback
                                  src={reactor.avatar || ""}
                                  sources={reactor.avatar ? [reactor.avatar] : []}
                                  alt={reactor.name}
                                  className="h-full w-full object-cover"
                                  fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[9px] font-bold text-[var(--ud-brand-primary)]"
                                  fallback={initials(reactor.name)}
                                />
                              </div>
                              {/* Emoji badge */}
                              {reactor.reactionType && reactor.reactionType !== "like" && (
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs leading-none shadow-sm">
                                  {reactor.reactionType}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--ud-text-muted)]" />
                    </button>
                  )}
                  <DeetCommentsSection
                    deetId={item.id}
                    comments={commentsByDeetId?.[item.id] ?? []}
                    isLoading={commentLoadingDeetIds?.has(item.id) ?? false}
                    isSubmitting={commentSubmittingDeetId === item.id}
                    error={commentError}
                    currentUserId={currentUserId}
                    onSubmitComment={onSubmitComment}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    onOpenViewer={(images, index, comment) => {
                      if (comment) {
                        // Comment image — pass comment context so sidebar shows this comment's data
                        const clientReaction = (comment as DeetComment & { _clientReaction?: string | null })._clientReaction ?? null;
                        onOpenViewer(images, index, "", "", undefined, {
                          commentId: comment.id,
                          authorName: comment.authorName ?? "User",
                          authorAvatar: comment.authorAvatar,
                          body: comment.body,
                          createdAt: comment.createdAt,
                          reactedEmoji: clientReaction,
                          replies: comment.replies?.map(r => ({
                            id: r.id,
                            authorName: r.authorName ?? "User",
                            authorAvatar: r.authorAvatar,
                            body: r.body,
                            createdAt: r.createdAt,
                          })),
                        });
                      } else {
                        onOpenViewer(images, index, "", "");
                      }
                    }}
                    userAvatarSrc={userAvatarSrc}
                    userName={userName}
                  />
                  </>
                )}

              </article>
              </div>
            ))}
          </section>
        </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDeleteDeetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">Delete post?</h3>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              This action cannot be undone. The post and all its comments will be permanently removed.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteDeetId(null)}
                disabled={!!deletingDeetId}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDeet(confirmDeleteDeetId)}
                disabled={!!deletingDeetId}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingDeetId === confirmDeleteDeetId && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionShell>

    {/* ── Mobile FAB — opens composer (inline) ── */}
    {isCreatorAdmin && (
      <button
        type="button"
        onClick={() => onOpenComposer()}
        className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
        style={{ backgroundColor: "var(--ud-brand-primary)" }}
        aria-label="Create post"
      >
        <Pencil className="h-6 w-6 text-white" />
      </button>
    )}

    {/* ── Reactions modal (blurred BG overlay) ── */}
    {reactionsModalDeetId && (
      <ReactionsModal
        reactors={reactionsModalData ?? []}
        isLoading={reactionsModalLoading ?? false}
        onClose={() => onCloseReactionsModal?.()}
      />
    )}
    </>
  );
}

/* ── Comments panel (inline) ── */

/** Relative time helper */
function commentTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Single comment row — used for both top-level and replies */
function CommentRow({
  comment,
  deetId,
  isOwn,
  isNested,
  editingCommentId,
  editText,
  confirmDeleteId,
  menuOpenCommentId,
  reactedEmoji,
  onSetReactedEmoji,
  onSetEditText,
  onStartEdit,
  onSaveEdit,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelEdit,
  onToggleMenu,
  onReply,
  onOpenViewer,
  menuRef,
  editInputRef,
}: {
  comment: DeetComment;
  deetId: string;
  isOwn: boolean;
  isNested: boolean;
  editingCommentId: string | null;
  editText: string;
  confirmDeleteId: string | null;
  menuOpenCommentId: string | null;
  reactedEmoji: string | null;
  onSetReactedEmoji: (commentId: string, emoji: string | null) => void;
  onSetEditText: (v: string) => void;
  onStartEdit: (c: DeetComment) => void;
  onSaveEdit: () => void;
  onStartDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onCancelEdit: () => void;
  onToggleMenu: (id: string) => void;
  onReply?: (commentId: string, authorName: string) => void;
  onOpenViewer?: (images: string[], index: number, comment?: DeetComment) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  editInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isEditing = editingCommentId === comment.id;
  const isConfirmingDelete = confirmDeleteId === comment.id;
  const avatarSize = isNested ? "h-7 w-7" : "h-9 w-9";
  const [showReactPicker, setShowReactPicker] = useState(false);
  const { openProfileModal } = useUserProfileModal();

  return (
    <div className="group relative flex items-start gap-2.5 py-3">
      <button
        type="button"
        onClick={() => comment.userId && openProfileModal(comment.userId)}
        aria-label={`Open ${comment.authorName ?? "user"}'s profile`}
        className={cn("relative shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40", avatarSize)}
      >
        <ImageWithFallback
          src={comment.authorAvatar || ""}
          sources={comment.authorAvatar ? [comment.authorAvatar] : []}
          alt={comment.authorName ?? "User"}
          className="h-full w-full object-cover"
          fallbackClassName={cn("grid h-full w-full place-items-center bg-[var(--ud-brand-light)] font-bold text-[var(--ud-brand-primary)]", isNested ? "text-[8px]" : "text-[10px]")}
          fallback={initials(comment.authorName ?? "User")}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--ud-text-primary)]">{comment.authorName ?? "User"}</span>
          {/* Three-dot menu for own comments */}
          {isOwn && !isEditing && !isConfirmingDelete && (
            <div className="relative ml-auto" ref={menuOpenCommentId === comment.id ? menuRef : undefined}>
              <button
                type="button"
                onClick={() => onToggleMenu(comment.id)}
                className="invisible rounded-full p-0.5 text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] group-hover:visible"
                title="More options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpenCommentId === comment.id && (
                <div className="absolute right-0 top-6 z-20 min-w-[120px] rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] py-1 shadow-lg">
                  <button type="button" onClick={() => onStartEdit(comment)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)]">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => onStartDelete(comment.id)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 flex items-center gap-1.5">
            <input
              ref={editInputRef}
              value={editText}
              onChange={(e) => onSetEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); onSaveEdit(); }
                if (e.key === "Escape") onCancelEdit();
              }}
              className="h-7 flex-1 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-2.5 text-xs text-[var(--ud-text-primary)] outline-none focus:border-[var(--ud-brand-primary)]"
            />
            <button type="button" onClick={onSaveEdit} disabled={!editText.trim()} className="rounded-lg bg-[var(--ud-brand-primary)] px-2 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-50">Save</button>
            <button type="button" onClick={onCancelEdit} className="rounded-lg px-2 py-1 text-[11px] text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]">Cancel</button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-red-500">Delete?</span>
            <button type="button" onClick={() => onConfirmDelete(comment.id)} className="rounded-lg bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-red-600">Yes</button>
            <button type="button" onClick={onCancelDelete} className="rounded-lg px-2 py-0.5 text-[11px] text-[var(--ud-text-muted)]">No</button>
          </div>
        ) : (
          <>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{comment.body}</p>
            {/* Comment image — thumbnail ~2"×3" (constrained via inline style for reliability) */}
            {comment.imageUrl && (
              <button
                type="button"
                onClick={() => onOpenViewer?.([comment.imageUrl!], 0, comment)}
                className="mt-1.5 block overflow-hidden rounded-lg border border-[var(--ud-border-subtle)] transition hover:opacity-90"
                style={{ width: 180, height: 120 }}
              >
                <img src={comment.imageUrl} alt="Comment image" style={{ width: 180, height: 120, objectFit: "cover" }} loading="lazy" />
              </button>
            )}
            {/* Comment file attachment */}
            {comment.attachmentUrl && (
              <a
                href={comment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-2.5 py-1.5 text-xs text-[var(--ud-brand-primary)] hover:bg-[var(--ud-bg-card)] transition"
              >
                <Paperclip className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="max-w-[180px] truncate">{comment.attachmentName || "Attachment"}</span>
              </a>
            )}
          </>
        )}

        {/* Actions row: timestamp · React · Reply */}
        {!isEditing && !isConfirmingDelete && (
          <div className="relative mt-1 flex items-center gap-2 text-[11px] text-[var(--ud-text-muted)]">
            <span>{comment.createdAt ? commentTimeAgo(comment.createdAt) : ""}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowReactPicker((v) => !v)}
              className={cn("font-medium transition", reactedEmoji ? "text-[var(--ud-brand-primary)]" : "hover:text-[var(--ud-text-secondary)]")}
            >
              {reactedEmoji ? <span className="mr-0.5 text-sm">{reactedEmoji}</span> : <Smile className="mr-0.5 inline h-3 w-3 stroke-[1.5]" />}
              {reactedEmoji ? (EMOJI_TEXT_MAP[reactedEmoji] ?? "Reacted") : "React"}
            </button>
            {/* Inline emoji picker for comment react */}
            {showReactPicker && (
              <div className="absolute bottom-full left-8 z-30 mb-1 flex items-center gap-0.5 rounded-full border border-[var(--ud-border)] bg-white px-1.5 py-1 shadow-lg">
                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      // Tap same emoji = un-react; tap different = change reaction
                      onSetReactedEmoji(comment.id, reactedEmoji === emoji ? null : emoji);
                      setShowReactPicker(false);
                    }}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-transform hover:scale-125 active:scale-95",
                      reactedEmoji === emoji && "bg-[var(--ud-brand-light)] ring-1 ring-[var(--ud-brand-primary)]",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
                {/* Explicit un-react button when already reacted */}
                {reactedEmoji && (
                  <button
                    type="button"
                    onClick={() => { onSetReactedEmoji(comment.id, null); setShowReactPicker(false); }}
                    className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs text-[var(--ud-text-muted)] transition-transform hover:scale-110 hover:bg-red-50 hover:text-red-500 active:scale-95"
                    title="Remove reaction"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            {/* Reply only on top-level comments */}
            {!isNested && onReply && (
              <>
                <span>·</span>
                <button type="button" onClick={() => onReply(comment.id, comment.authorName ?? "User")} className="font-medium hover:text-[var(--ud-text-secondary)] transition">
                  Reply
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeetCommentsSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  error,
  currentUserId,
  onSubmitComment,
  onEditComment,
  onDeleteComment,
  onOpenViewer,
  userAvatarSrc,
  userName,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string | null;
  currentUserId?: string;
  onSubmitComment?: (deetId: string, body: string, parentId?: string, attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string }) => Promise<{ success: boolean }> | void;
  onEditComment?: (commentId: string, deetId: string, newBody: string) => Promise<{ success: boolean }> | void;
  onDeleteComment?: (commentId: string, deetId: string) => Promise<{ success: boolean }> | void;
  onOpenViewer?: (images: string[], index: number, comment?: DeetComment) => void;
  userAvatarSrc?: string;
  userName?: string;
}) {
  const [commentText, setCommentText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpenCommentId, setMenuOpenCommentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Comment-level reactions — persisted to DB via comment_reactions table
  const [commentReactions, setCommentReactions] = useState<Record<string, string | null>>({});

  // Load existing reactions from DB whenever comments change
  useEffect(() => {
    const allIds = comments.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]);
    if (!allIds.length || !currentUserId) return;
    let cancelled = false;
    import("@/lib/services/deets/deet-interactions").then(({ getCommentReactions }) => {
      getCommentReactions(allIds).then((map) => {
        if (cancelled) return;
        setCommentReactions((prev) => {
          const next = { ...prev };
          for (const id of allIds) {
            // Only overwrite if we haven't set a local optimistic value OR
            // if the key doesn't exist in prev (first load)
            if (!(id in prev)) {
              next[id] = map[id] ?? null;
            }
          }
          return next;
        });
      }).catch(() => {});
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length, currentUserId]);

  const handleSetCommentReaction = useCallback((commentId: string, emoji: string | null) => {
    // Capture the previous emoji BEFORE updating state (needed for un-react DB call)
    const prevEmoji = commentReactions[commentId] ?? null;

    // Optimistic local update
    setCommentReactions((prev) => ({ ...prev, [commentId]: emoji }));

    // Persist to DB (non-blocking)
    const emojiToSend = emoji ?? prevEmoji; // for un-react, send the old emoji to toggle it off
    if (emojiToSend) {
      import("@/lib/services/deets/deet-interactions").then(({ toggleCommentReaction }) => {
        toggleCommentReaction(commentId, emojiToSend).then((result) => {
          // Reconcile with server state
          setCommentReactions((prev) => ({ ...prev, [commentId]: result.emoji }));
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [commentReactions]);

  // Attachment state
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; name: string } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenCommentId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenCommentId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenCommentId]);

  useEffect(() => { if (editingCommentId) editInputRef.current?.focus(); }, [editingCommentId]);

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if ((!trimmed && !pendingImage && !pendingFile) || isSubmitting || uploadingMedia) return;
    setLocalError(null);

    // Upload pending media first
    let attachments: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string } | undefined;
    if (pendingImage || pendingFile) {
      setUploadingMedia(true);
      try {
        const { uploadCommentImage, uploadCommentFile } = await import("@/lib/services/deets/upload-comment-media");
        if (pendingImage) {
          const uploaded = await uploadCommentImage(pendingImage.file);
          attachments = { ...attachments, imageUrl: uploaded.url };
        }
        if (pendingFile) {
          const uploaded = await uploadCommentFile(pendingFile.file);
          attachments = { ...attachments, attachmentUrl: uploaded.url, attachmentName: uploaded.name };
        }
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to upload. Try again.");
        setUploadingMedia(false);
        return;
      }
      setUploadingMedia(false);
    }

    const bodyText = trimmed || (pendingImage ? "📷" : pendingFile ? "📎" : "");
    const result = await onSubmitComment?.(deetId, bodyText, replyToId ?? undefined, attachments);
    if (result && result.success) {
      setCommentText("");
      setReplyToId(null);
      setReplyToName("");
      setPendingImage(null);
      setPendingFile(null);
    } else if (result && !result.success) {
      setLocalError("Couldn't post. Tap send to retry.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    const result = await onEditComment?.(editingCommentId, deetId, trimmed);
    if (result && result.success) { setEditingCommentId(null); setEditText(""); }
    else if (result && !result.success) setLocalError("Couldn't save edit. Try again.");
  };

  const handleDelete = async (commentId: string) => {
    const result = await onDeleteComment?.(commentId, deetId);
    if (result && result.success) setConfirmDeleteId(null);
    else if (result && !result.success) setLocalError("Couldn't delete. Try again.");
  };

  const startReply = (commentId: string, authorName: string) => {
    setReplyToId(commentId);
    setReplyToName(authorName);
    inputRef.current?.focus();
  };

  const cancelReply = () => { setReplyToId(null); setReplyToName(""); };

  const startEdit = (comment: DeetComment) => { setEditingCommentId(comment.id); setEditText(comment.body); setMenuOpenCommentId(null); };
  const startDelete = (commentId: string) => { setConfirmDeleteId(commentId); setMenuOpenCommentId(null); };
  const cancelEdit = () => { setEditingCommentId(null); setEditText(""); };

  const displayError = localError || error;

  const commonRowProps = {
    deetId,
    editingCommentId,
    editText,
    confirmDeleteId,
    menuOpenCommentId,
    onSetReactedEmoji: handleSetCommentReaction,
    onSetEditText: setEditText,
    onStartEdit: startEdit,
    onSaveEdit: handleSaveEdit,
    onStartDelete: startDelete,
    onConfirmDelete: handleDelete,
    onCancelDelete: () => setConfirmDeleteId(null),
    onCancelEdit: cancelEdit,
    onToggleMenu: (id: string) => setMenuOpenCommentId((prev) => (prev === id ? null : id)),
    onOpenViewer: onOpenViewer
      ? (images: string[], index: number, comment?: DeetComment) => {
          if (comment) {
            // Enrich the comment with the current reaction before passing up
            const enrichedComment = Object.assign({}, comment, { _clientReaction: commentReactions[comment.id] ?? null });
            onOpenViewer(images, index, enrichedComment);
          } else {
            onOpenViewer(images, index);
          }
        }
      : undefined,
    menuRef,
    editInputRef,
  };

  const addEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setLocalError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setLocalError("Image must be 5 MB or smaller."); return; }
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
    setPendingFile(null); // Only one attachment at a time
    e.target.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setLocalError("File must be 10 MB or smaller."); return; }
    setPendingFile({ file, name: file.name });
    setPendingImage(null); // Only one attachment at a time
    e.target.value = "";
  };

  return (
    <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50">
      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-text-muted)]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="px-4">
          {comments.map((comment, idx) => (
            <div key={comment.id}>
              {/* Separator line between top-level comments */}
              {idx > 0 && <div className="border-t border-[var(--ud-border-subtle)]" />}
              {/* Top-level comment */}
              <CommentRow
                comment={comment}
                isOwn={!!(currentUserId && comment.userId === currentUserId)}
                isNested={false}
                reactedEmoji={commentReactions[comment.id] ?? null}
                onReply={startReply}
                {...commonRowProps}
              />
              {/* Nested replies (one level) — indented to align with parent text start */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-[46px]">
                  {comment.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      isOwn={!!(currentUserId && reply.userId === currentUserId)}
                      isNested={true}
                      reactedEmoji={commentReactions[reply.id] ?? null}
                      {...commonRowProps}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-center text-xs text-[var(--ud-text-muted)]">No comments yet</p>
      )}

      {/* Error banner */}
      {displayError && (
        <p className="px-4 py-2 text-center text-xs font-medium text-red-500">{displayError}</p>
      )}

      {/* Reply-to indicator */}
      {replyToId && (
        <div className="flex items-center gap-2 border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-4 py-1.5">
          <Reply className="h-3.5 w-3.5 text-[var(--ud-text-muted)]" />
          <span className="text-xs text-[var(--ud-text-muted)]">Replying to <strong className="text-[var(--ud-text-secondary)]">{replyToName}</strong></span>
          <button type="button" onClick={cancelReply} className="ml-auto text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Comment input with emoji, photo, attachment */}
      <div className="relative border-t border-[var(--ud-border-subtle)] px-4 py-2.5">
        {/* Hidden file inputs */}
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

        {/* Attachment preview strip */}
        {(pendingImage || pendingFile) && (
          <div className="mb-2 flex items-center gap-2">
            {pendingImage && (
              <div className="relative inline-flex overflow-hidden rounded-lg border border-[var(--ud-border-subtle)]">
                <img src={pendingImage.preview} alt="Preview" className="h-16 w-auto object-cover" />
                <button
                  type="button"
                  onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {pendingFile && (
              <div className="relative inline-flex items-center gap-1.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-2.5 py-2 text-xs text-[var(--ud-text-secondary)]">
                <Paperclip className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="max-w-[150px] truncate">{pendingFile.name}</span>
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="ml-1 text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
            <ImageWithFallback
              src={userAvatarSrc || ""}
              sources={userAvatarSrc ? [userAvatarSrc] : []}
              alt={userName || "You"}
              className="h-full w-full object-cover"
              fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]"
              fallback={initials(userName || "You")}
            />
          </div>
          <div className="relative flex flex-1 items-center gap-1 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] pl-3.5 pr-1">
            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                if (e.key === "Escape" && replyToId) cancelReply();
              }}
              placeholder={replyToId ? `Reply to ${replyToName}...` : "Write a comment..."}
              className="h-9 flex-1 bg-transparent text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)]"
            />
            {/* Inline action icons — wired to file inputs */}
            <button type="button" title="Add photo" onClick={() => photoInputRef.current?.click()} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] transition">
              <ImageIcon className="h-4 w-4 stroke-[1.5]" />
            </button>
            <button type="button" title="Attach file" onClick={() => fileInputRef.current?.click()} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] transition">
              <Paperclip className="h-4 w-4 stroke-[1.5]" />
            </button>
            <button
              type="button"
              title="Add emoji"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] transition"
            >
              <Smile className="h-4 w-4 stroke-[1.5]" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(isSubmitting || uploadingMedia) || (!commentText.trim() && !pendingImage && !pendingFile)}
            title="Send comment"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              (commentText.trim() || pendingImage || pendingFile)
                ? "bg-[var(--ud-brand-primary)] text-white hover:opacity-90"
                : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]"
            )}
          >
            {(isSubmitting || uploadingMedia) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {/* Quick emoji picker for comment */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-12 z-30 mb-1 flex items-center gap-1 rounded-full border border-[var(--ud-border)] bg-white px-2 py-1.5 shadow-lg">
            {["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
