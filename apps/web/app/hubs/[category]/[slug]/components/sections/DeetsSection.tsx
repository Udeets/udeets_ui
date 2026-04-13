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
import { useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";
import type { DeetComment, DeetViewer, DeetReactor } from "@/lib/services/deets/deet-interactions";
import { deleteDeet } from "@/lib/services/deets/delete-deet";

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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteCounts, setVoteCounts] = useState<number[]>(parsedOptions.map(() => 0));

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

        // Count votes per option
        const counts = parsedOptions.map(() => 0);
        let total = 0;
        const deetVotes = allVotes.filter((v) => v.deetId === deetId);
        // Count unique users (not individual option_index entries for multi-select)
        const uniqueVoters = new Set(deetVotes.map((v) => v.userId));
        total = uniqueVoters.size;
        for (const v of deetVotes) {
          if (v.optionIndex >= 0 && v.optionIndex < counts.length) {
            counts[v.optionIndex]++;
          }
        }
        setVoteCounts(counts);
        setTotalVotes(total);

        // Set user's selection
        const myDeetVotes = myVotes.filter((v) => v.deetId === deetId);
        if (myDeetVotes.length > 0) {
          setSelectedIndex(myDeetVotes[0].optionIndex);
        }
      } catch {
        // Table might not exist yet
      }
    })();

    return () => { cancelled = true; };
  }, [deetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (index: number) => {
    if (isVoting) return;
    setIsVoting(true);

    const prevIndex = selectedIndex;
    // Optimistic update
    setSelectedIndex(index);
    setVoteCounts((prev) => {
      const next = [...prev];
      if (prevIndex !== null && prevIndex < next.length) next[prevIndex]--;
      if (index < next.length) next[index]++;
      return next;
    });
    if (prevIndex === null) setTotalVotes((t) => t + 1);

    try {
      const { castPollVote } = await import("@/lib/services/deets/poll-votes");
      const success = await castPollVote(deetId, index);
      if (!success) {
        // Revert
        setSelectedIndex(prevIndex);
        setVoteCounts((prev) => {
          const next = [...prev];
          if (index < next.length) next[index]--;
          if (prevIndex !== null && prevIndex < next.length) next[prevIndex]++;
          return next;
        });
        if (prevIndex === null) setTotalVotes((t) => t - 1);
      }
    } catch {
      // Revert on error
      setSelectedIndex(prevIndex);
      setVoteCounts((prev) => {
        const next = [...prev];
        if (index < next.length) next[index]--;
        if (prevIndex !== null && prevIndex < next.length) next[prevIndex]++;
        return next;
      });
      if (prevIndex === null) setTotalVotes((t) => t - 1);
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
          </div>
          <p className="mt-0.5 text-sm font-semibold text-[var(--ud-text-primary)]">
            {matchingAtt?.title || "Poll"}
          </p>
        </div>
      </div>

      {/* Poll options */}
      <div className="border-t border-[var(--ud-border-subtle)] px-4 py-2">
        {parsedOptions.map((opt, i) => {
          const isSelected = selectedIndex === i;
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
                isSelected
                  ? "text-emerald-700"
                  : "text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)]"
              )}
            >
              {/* Progress bar background */}
              {selectedIndex !== null && totalVotes > 0 && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-lg transition-all",
                    isSelected ? "bg-emerald-100" : "bg-gray-100"
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}
              {/* Radio circle */}
              <span className={cn(
                "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
              )}>
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="relative z-10 flex-1 text-left">{opt}</span>
              {/* Vote count shown after voting */}
              {selectedIndex !== null && totalVotes > 0 && (
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
    if (isLiked) {
      // If already reacted, un-react (pass current emoji so toggleDeetLike detects same reaction)
      onToggleLike?.(deetId, selectedEmoji || "like");
      setSelectedEmoji(null);
    } else {
      // Show emoji picker
      setShowPicker((v) => !v);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowPicker(false);
    onToggleLike?.(deetId, emoji);
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
        <span>{isLiked ? "Reacted" : "React"}</span>
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
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                    <ImageWithFallback
                      src={reactor.avatar || ""}
                      sources={reactor.avatar ? [reactor.avatar] : []}
                      alt={reactor.name}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                      fallback={initials(reactor.name)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--ud-text-primary)]">{reactor.name}</span>
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
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string) => void;
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
  onSubmitComment?: (deetId: string, body: string, parentId?: string) => Promise<{ success: boolean }> | void;
  onEditComment?: (commentId: string, deetId: string, newBody: string) => Promise<{ success: boolean }> | void;
  onDeleteComment?: (commentId: string, deetId: string) => Promise<{ success: boolean }> | void;
  viewersDeetId?: string | null;
  viewersByDeetId?: Record<string, DeetViewer[]>;
  viewersLoading?: boolean;
  onToggleViewers?: (deetId: string) => void;
}) {
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

  const handleShareDeet = async (deetId: string) => {
    const shareUrl = `${window.location.origin}/hubs/${hubCategory}/${hubSlug}?focus=${deetId}`;
    // Use native share on mobile when available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: hubName, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback for older browsers / insecure contexts
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
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                    <ImageWithFallback
                      src={item.authorAvatar || ""}
                      sources={item.authorAvatar ? [item.authorAvatar] : []}
                      alt={item.author}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                      fallback={initials(item.author)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-[var(--ud-text-primary)]">{item.author}</span>
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
                                onOpenComposer(null);
                                // TODO: open composer in edit mode with this deet's data
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

                  return (
                    <>
                      {deetType ? <DeetTypeBadge type={deetType} /> : null}

                      {/* Body content — skip if rich section will render the same info */}
                      {item.body && !hasRichSection ? (
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
                {item.image ? (
                  <button
                    type="button"
                    className="mt-3 block w-full bg-[var(--ud-bg-subtle)]"
                    onClick={() =>
                      onOpenViewer(
                        item.images?.length ? item.images : [item.image!],
                        0,
                        item.title,
                        item.body,
                        item.id
                      )
                    }
                  >
                    <div className="aspect-video max-h-[320px] w-full overflow-hidden">
                      <ImageWithFallback
                        src={item.image}
                        sources={item.images?.length ? item.images : [item.image]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-sm text-[var(--ud-text-muted)]"
                        fallback="Image unavailable"
                        loading="lazy"
                      />
                    </div>
                  </button>
                ) : null}

                {/* ── Stats row: reactions · comments (left) | views (right) ── */}
                <div className="relative flex items-center justify-between px-4 pt-2 pb-1">
                  <div className="flex items-center gap-3 text-xs text-[var(--ud-text-muted)]">
                    {(likeCountOverrides?.[item.id] ?? item.likes) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <SmilePlus className="h-3.5 w-3.5 stroke-[1.5]" />
                        {likeCountOverrides?.[item.id] ?? item.likes}
                      </span>
                    )}
                    {(item.comments + (commentCountOverrides?.[item.id] ?? 0)) > 0 && (
                      <button
                        type="button"
                        onClick={() => onToggleComments?.(item.id)}
                        className="inline-flex items-center gap-1 hover:text-[var(--ud-text-secondary)] transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5 stroke-[1.5]" />
                        {item.comments + (commentCountOverrides?.[item.id] ?? 0)}
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

                  {/* Comment button */}
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

                {/* ── Reactions preview row (avatars + emoji + > arrow) ── */}
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
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] leading-none shadow-sm">
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

                {/* ── Comments section ── */}
                {expandedCommentDeetId === item.id && (
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
                    userAvatarSrc={userAvatarSrc}
                    userName={userName}
                  />
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
  onSetEditText,
  onStartEdit,
  onSaveEdit,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelEdit,
  onToggleMenu,
  onReply,
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
  onSetEditText: (v: string) => void;
  onStartEdit: (c: DeetComment) => void;
  onSaveEdit: () => void;
  onStartDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onCancelEdit: () => void;
  onToggleMenu: (id: string) => void;
  onReply?: (commentId: string, authorName: string) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  editInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isEditing = editingCommentId === comment.id;
  const isConfirmingDelete = confirmDeleteId === comment.id;
  const avatarSize = isNested ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className="group relative flex items-start gap-2.5 py-2.5">
      <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]", avatarSize)}>
        <ImageWithFallback
          src={comment.authorAvatar || ""}
          sources={comment.authorAvatar ? [comment.authorAvatar] : []}
          alt={comment.authorName ?? "User"}
          className="h-full w-full object-cover"
          fallbackClassName={cn("grid h-full w-full place-items-center bg-[var(--ud-brand-light)] font-bold text-[var(--ud-brand-primary)]", isNested ? "text-[8px]" : "text-[10px]")}
          fallback={initials(comment.authorName ?? "User")}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold text-[var(--ud-text-primary)]", isNested ? "text-xs" : "text-sm")}>{comment.authorName ?? "User"}</span>
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
          <p className={cn("mt-0.5 leading-relaxed text-[var(--ud-text-secondary)]", isNested ? "text-xs" : "text-sm")}>{comment.body}</p>
        )}

        {/* Actions row: timestamp · React · Reply */}
        {!isEditing && !isConfirmingDelete && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--ud-text-muted)]">
            <span>{comment.createdAt ? commentTimeAgo(comment.createdAt) : ""}</span>
            <span>·</span>
            <button type="button" className="font-medium hover:text-[var(--ud-text-secondary)] transition">
              <Smile className="mr-0.5 inline h-3 w-3 stroke-[1.5]" /> React
            </button>
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
  userAvatarSrc,
  userName,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string | null;
  currentUserId?: string;
  onSubmitComment?: (deetId: string, body: string, parentId?: string) => Promise<{ success: boolean }> | void;
  onEditComment?: (commentId: string, deetId: string, newBody: string) => Promise<{ success: boolean }> | void;
  onDeleteComment?: (commentId: string, deetId: string) => Promise<{ success: boolean }> | void;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (!trimmed || isSubmitting) return;
    setLocalError(null);
    const result = await onSubmitComment?.(deetId, trimmed, replyToId ?? undefined);
    if (result && result.success) {
      setCommentText("");
      setReplyToId(null);
      setReplyToName("");
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
    onSetEditText: setEditText,
    onStartEdit: startEdit,
    onSaveEdit: handleSaveEdit,
    onStartDelete: startDelete,
    onConfirmDelete: handleDelete,
    onCancelDelete: () => setConfirmDeleteId(null),
    onCancelEdit: cancelEdit,
    onToggleMenu: (id: string) => setMenuOpenCommentId((prev) => (prev === id ? null : id)),
    menuRef,
    editInputRef,
  };

  const addEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
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
          {comments.map((comment) => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <CommentRow
                comment={comment}
                isOwn={!!(currentUserId && comment.userId === currentUserId)}
                isNested={false}
                onReply={startReply}
                {...commonRowProps}
              />
              {/* Nested replies (one level) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 border-l-2 border-[var(--ud-border-subtle)] pl-3">
                  {comment.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      isOwn={!!(currentUserId && reply.userId === currentUserId)}
                      isNested={true}
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
            {/* Inline action icons */}
            <button type="button" title="Add photo" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] transition">
              <ImageIcon className="h-4 w-4 stroke-[1.5]" />
            </button>
            <button type="button" title="Attach file" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] transition">
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
            disabled={isSubmitting || !commentText.trim()}
            title="Send comment"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              commentText.trim()
                ? "bg-[var(--ud-brand-primary)] text-white hover:opacity-90"
                : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]"
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
