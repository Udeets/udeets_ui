"use client";

import type { HubContent } from "@/lib/hub-content";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  Eye,
  Loader2,
  List,
  LayoutGrid,
  MapPin,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Pencil,
  Search,
  Send,
  Share2,
  SmilePlus,
  Trash2,
} from "lucide-react";
import type { HubFeedItemAttachment } from "@/lib/hub-content";
import { useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";
import type { DeetComment } from "@/lib/services/deets/deet-interactions";
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
  likeCount,
  onToggleLike,
}: {
  deetId: string;
  isLiked: boolean;
  isLiking: boolean;
  likeCount: number;
  onToggleLike?: (deetId: string) => void;
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
      // If already reacted, un-react
      onToggleLike?.(deetId);
      setSelectedEmoji(null);
    } else {
      // Show emoji picker
      setShowPicker((v) => !v);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowPicker(false);
    if (!isLiked) {
      onToggleLike?.(deetId);
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
        <span>{isLiked ? "Reacted" : "React"}</span>
        {likeCount > 0 && (
          <span className="text-xs">({likeCount})</span>
        )}
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
  expandedCommentDeetId,
  commentsByDeetId,
  commentLoadingDeetIds,
  commentSubmittingDeetId,
  commentCountOverrides,
  commentError,
  onToggleComments,
  onSubmitComment,
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
  onToggleLike?: (deetId: string) => void;
  expandedCommentDeetId?: string | null;
  commentsByDeetId?: Record<string, DeetComment[]>;
  commentLoadingDeetIds?: Set<string>;
  commentSubmittingDeetId?: string | null;
  commentCountOverrides?: Record<string, number>;
  commentError?: string | null;
  onToggleComments?: (deetId: string) => void;
  onSubmitComment?: (deetId: string, body: string) => Promise<{ success: boolean }> | void;
}) {
  const [sortOption, setSortOption] = useState<SortOption>("Newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeFilterPill, setActiveFilterPill] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
      {filteredFeedItems.length === 0 && !showDemoPostedText && !showDemoPoll ? (
        <div className="w-full space-y-3">
          {composerCard}
          <div className="grid min-h-[280px] w-full place-items-center rounded-xl border border-dashed border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] p-6 text-center">
            <div className="w-full">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]">
                <Megaphone className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
                {normalizedPostSearch ? "No matching deets" : "This deets stream is ready"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--ud-text-muted)]">
                {normalizedPostSearch
                  ? "Try another keyword or filter."
                  : isCreatorAdmin
                    ? "Kick things off with a welcome note, event reminder, or a first shared photo."
                    : "Check back soon for updates and conversations."}
              </p>
            </div>
          </div>
        </div>
      ) : (
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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
                  viewMode === "list" ? "text-[var(--ud-text-primary)]" : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-secondary)]"
                )}
                aria-label="List view"
              >
                <List className="h-[18px] w-[18px] stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
                  viewMode === "grid" ? "text-[var(--ud-text-primary)]" : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-secondary)]"
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-[18px] w-[18px] stroke-[1.5]" />
              </button>
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
            {filteredFeedItems.map((item) => (
              <article
                id={item.id}
                key={item.id}
                className={cn(
                  "w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm transition",
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
                    <div className="aspect-video max-h-[320px] w-full">
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

                {/* ── Views count (Displayed this below content, above action bar) ── */}
                <div className="flex justify-end px-4 pt-2">
                  <div className="inline-flex items-center gap-1 text-xs text-[var(--ud-text-muted)]">
                    <Eye className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>{(viewCountOverrides?.[item.id] != null ? item.views + viewCountOverrides[item.id] : item.views)}</span>
                  </div>
                </div>

                {/* ── Action bar: React + Comment + Share ── */}
                <div className="flex items-center border-t border-[var(--ud-border-subtle)] mt-1">
                  {/* React button with emoji picker */}
                  <EmojiReactButton
                    deetId={item.id}
                    isLiked={likedDeetIds?.has(item.id) ?? false}
                    isLiking={likingDeetIds?.has(item.id) ?? false}
                    likeCount={likeCountOverrides?.[item.id] ?? item.likes}
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
                    {(item.comments + (commentCountOverrides?.[item.id] ?? 0)) > 0 && (
                      <span className="text-xs">({item.comments + (commentCountOverrides?.[item.id] ?? 0)})</span>
                    )}
                  </button>

                  {/* Share button — native share on mobile, clipboard copy on desktop */}
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

                {/* ── Comments section ── */}
                {expandedCommentDeetId === item.id && (
                  <DeetCommentsSection
                    deetId={item.id}
                    comments={commentsByDeetId?.[item.id] ?? []}
                    isLoading={commentLoadingDeetIds?.has(item.id) ?? false}
                    isSubmitting={commentSubmittingDeetId === item.id}
                    error={commentError}
                    onSubmitComment={onSubmitComment}
                    userAvatarSrc={userAvatarSrc}
                    userName={userName}
                  />
                )}
              </article>
            ))}
          </section>
        </div>
      )}

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
    </>
  );
}

/* ── Comments panel (inline) ── */
function DeetCommentsSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  error,
  onSubmitComment,
  userAvatarSrc,
  userName,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onSubmitComment?: (deetId: string, body: string) => Promise<{ success: boolean }> | void;
  userAvatarSrc?: string;
  userName?: string;
}) {
  const [commentText, setCommentText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    setLocalError(null);
    // Optimistically keep the text until we know it succeeded
    const result = await onSubmitComment?.(deetId, trimmed);
    if (result && result.success) {
      setCommentText("");
    } else if (result && !result.success) {
      setLocalError("Couldn't post. Tap send to retry.");
    }
  };

  const displayError = localError || error;

  return (
    <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50">
      {/* Existing comments */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-text-muted)]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-0 divide-y divide-[var(--ud-border-subtle)]">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5 px-4 py-3">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                <ImageWithFallback
                  src={comment.authorAvatar || ""}
                  sources={comment.authorAvatar ? [comment.authorAvatar] : []}
                  alt={comment.authorName ?? "User"}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]"
                  fallback={initials(comment.authorName ?? "User")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[var(--ud-text-primary)]">{comment.authorName ?? "User"}</span>
                  <span className="text-[11px] text-[var(--ud-text-muted)]">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{comment.body}</p>
              </div>
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

      {/* Comment input */}
      <div className="flex items-center gap-2 border-t border-[var(--ud-border-subtle)] px-4 py-2.5">
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
        <input
          ref={inputRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Write a comment..."
          className="h-9 flex-1 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3.5 text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)] focus:border-[var(--ud-brand-primary)]"
        />
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
    </div>
  );
}
