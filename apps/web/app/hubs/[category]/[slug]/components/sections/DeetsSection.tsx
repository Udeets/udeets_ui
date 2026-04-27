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
  MapPin,
  Megaphone,
  MessageSquare,
  Pencil,
  Search,
  SmilePlus,
  X,
} from "lucide-react";
import type { HubFeedItemAttachment } from "@/lib/hub-content";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { resolveDeetType } from "../deets/feedDeetTypeBlocks";
import { POST_ICON } from "../deets/feedEmojiReact";
import { DeetCommentsSection } from "../deets/DeetCommentsSection";
import { HubFeedCard } from "../deets/HubFeedCard";
import { CommentThreadSheet } from "../deets/CommentThreadSheet";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { OpenComposerArg } from "../../hooks/useDeetComposer";
import type { DeetComment, DeetViewer, DeetReactor } from "@/lib/services/deets/deet-interactions";
import { deleteDeet } from "@/lib/services/deets/delete-deet";
import { plainTextFromHtml } from "@/lib/deets/plain-text-from-html";
import { useUserProfileModal } from "@/components/UserProfileModalProvider";

/* ── Sort options ── */
type SortOption = "Newest" | "Oldest";

type FeedFilterOption = "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos";

const COMMENT_SHEET_THRESHOLD = 8;

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
  const groupedSummary = [...grouped.entries()]
    .map(([emoji, list]) => ({ emoji, count: list.length }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const filteredReactors = activeTab === "all" ? reactors : (grouped.get(activeTab) ?? []);

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">
              {reactors.length} reaction{reactors.length !== 1 ? "s" : ""}
            </h3>
          </div>
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
                    onClick={() => {
                      onClose();
                      openProfileModal(reactor.userId);
                    }}
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
                        onClick={() => {
                          onClose();
                          openProfileModal(reactor.userId);
                        }}
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
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--ud-bg-subtle)] px-2 py-0.5 text-sm font-semibold text-[var(--ud-text-primary)]"
                    title={`${reactor.name} reacted with ${EMOJI_LABEL_MAP[reactor.reactionType] ?? reactor.reactionType}`}
                    aria-label={`${reactor.name} reaction`}
                  >
                    {EMOJI_LABEL_MAP[reactor.reactionType] ?? reactor.reactionType}
                  </span>
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
  canCreateDeets,
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
  myReactionsByDeetId,
  likingDeetIds,
  likeCountOverrides,
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
  canCreateDeets: boolean;
  dpImageSrc: string;
  coverImageSrc: string;
  recentPhotos: string[];
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  userAvatarSrc?: string;
  userName?: string;
  currentUserId?: string;
  onOpenComposer: (arg?: OpenComposerArg) => void;
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string, commentContext?: { commentId: string; authorName: string; authorAvatar?: string; body: string; createdAt: string; reactedEmoji?: string | null; replies?: Array<{ id: string; authorName: string; authorAvatar?: string; body: string; createdAt: string }> }) => void;
  onDeleteDeet?: (deetId: string) => void;
  likedDeetIds?: Set<string>;
  myReactionsByDeetId?: Record<string, string>;
  likingDeetIds?: Set<string>;
  likeCountOverrides?: Record<string, number>;
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

  const [shareOrigin, setShareOrigin] = useState("");
  useEffect(() => {
    setShareOrigin(window.location.origin);
  }, []);

  const flashCopied = useCallback((deetId: string) => {
    setCopiedDeetId(deetId);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedDeetId(null), 2000);
  }, []);

  const recordShareOnly = useCallback((deetId: string) => {
    void import("@/lib/services/deets/deet-interactions").then(({ recordDeetShare }) => {
      void recordDeetShare(deetId);
    });
  }, []);

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
        canCreateDeets={canCreateDeets}
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

  const [commentSheetMobile, setCommentSheetMobile] = useState(false);
  const [focusComposerDeetId, setFocusComposerDeetId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const fn = () => setCommentSheetMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!expandedCommentDeetId) setFocusComposerDeetId(null);
  }, [expandedCommentDeetId]);

  const handleToggleCommentsFor = (itemId: string) => {
    const willOpen = expandedCommentDeetId !== itemId;
    onToggleComments?.(itemId);
    if (willOpen) setFocusComposerDeetId(itemId);
    else setFocusComposerDeetId(null);
  };

  const buildCommentsSection = (
    deetId: string,
    layout: "inline" | "sheet",
    opts?: { autoFocusComposer?: boolean; allowNewComments?: boolean },
  ) => (
    <DeetCommentsSection
      layout={layout}
      deetId={deetId}
      autoFocusComposer={opts?.autoFocusComposer ?? false}
      onAutoFocusConsumed={() => setFocusComposerDeetId(null)}
      allowNewComments={opts?.allowNewComments !== false}
      comments={commentsByDeetId?.[deetId] ?? []}
      isLoading={commentLoadingDeetIds?.has(deetId) ?? false}
      isSubmitting={commentSubmittingDeetId === deetId}
      error={commentError}
      currentUserId={currentUserId}
      onSubmitComment={onSubmitComment}
      onEditComment={onEditComment}
      onDeleteComment={onDeleteComment}
      onOpenViewer={(images, index, comment) => {
        if (comment) {
          const clientReaction =
            (comment as DeetComment & { _clientReaction?: string | null })._clientReaction ?? null;
          onOpenViewer(images, index, "", "", undefined, {
            commentId: comment.id,
            authorName: comment.authorName ?? "User",
            authorAvatar: comment.authorAvatar,
            body: comment.body,
            createdAt: comment.createdAt,
            reactedEmoji: clientReaction,
            replies: comment.replies?.map((r) => ({
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
  );

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
                          (() => {
                            const preview = plainTextFromHtml(notice.body);
                            const short = preview.slice(0, 80);
                            return short + (preview.length > 80 ? "…" : "");
                          })()
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
                        ? canCreateDeets ? "Create your first event to get things started." : "Check back soon for upcoming events."
                        : feedFilter === "Photos"
                          ? canCreateDeets ? "Share your first photo with the community." : "Check back soon for shared photos."
                          : feedFilter === "Polls"
                            ? canCreateDeets ? "Create a poll to gather community feedback." : "Check back soon for new polls."
                            : feedFilter === "Announcements"
                              ? canCreateDeets ? "Post an announcement to keep everyone in the loop." : "Check back soon for announcements."
                              : canCreateDeets
                                ? "Kick things off with a welcome note, event reminder, or a first shared photo."
                                : "Check back soon for updates and conversations."}
                  </p>
                </div>
              </div>
            )}
            {filteredFeedItems.map((item) => {
              const commentCountForItem = item.comments + (commentCountOverrides?.[item.id] ?? 0);
              const loadedCommentsLen = commentsByDeetId?.[item.id]?.length ?? 0;
              const useCommentSheet =
                commentSheetMobile &&
                expandedCommentDeetId === item.id &&
                (commentCountForItem >= COMMENT_SHEET_THRESHOLD ||
                  loadedCommentsLen >= COMMENT_SHEET_THRESHOLD);

              return (
                <div key={item.id} className="relative">
                  <HubFeedCard
                    item={item}
                    highlighted={highlightedItemId === item.id}
                    menuOpen={openMenuDeetId === item.id}
                    onToggleMenu={() => {
                      if (viewersDeetId === item.id) onToggleViewers?.(item.id);
                      setOpenMenuDeetId(openMenuDeetId === item.id ? null : item.id);
                    }}
                    currentUserId={currentUserId}
                    isCreatorAdmin={isCreatorAdmin}
                    onOpenComposer={onOpenComposer}
                    onConfirmDelete={setConfirmDeleteDeetId}
                    onRecordShare={recordShareOnly}
                    shareUrl={`${shareOrigin}/hubs/${hubCategory}/${hubSlug}?focus=${item.id}`}
                    onOpenViewer={(images, index, title, body, focusId) =>
                      onOpenViewer(images, index, title, body, focusId)
                    }
                    likeCount={likeCountOverrides?.[item.id] ?? item.likes}
                    commentCount={item.comments + (commentCountOverrides?.[item.id] ?? 0)}
                    expandedComments={expandedCommentDeetId === item.id}
                    onToggleComments={() => handleToggleCommentsFor(item.id)}
                    canSeeViewers={Boolean(
                      currentUserId && (currentUserId === item.authorId || isCreatorAdmin),
                    )}
                    viewersOpen={viewersDeetId === item.id}
                    viewersLoading={viewersLoading}
                    viewers={viewersByDeetId?.[item.id] ?? []}
                    onToggleViewers={() => onToggleViewers?.(item.id)}
                    copied={copiedDeetId === item.id}
                    onCopied={() => flashCopied(item.id)}
                    onToggleLike={onToggleLike}
                    myReactionType={myReactionsByDeetId?.[item.id] ?? null}
                    isLiked={likedDeetIds?.has(item.id) ?? false}
                    isLiking={likingDeetIds?.has(item.id) ?? false}
                    onOpenReactionsSummary={() => onOpenReactionsModal?.(item.id)}
                    reactors={reactorsByDeetId?.[item.id] ?? []}
                    commentsSlot={
                      expandedCommentDeetId === item.id && !useCommentSheet
                        ? buildCommentsSection(item.id, "inline", {
                            autoFocusComposer: focusComposerDeetId === item.id,
                            allowNewComments: item.deetOptions?.commentsEnabled !== false,
                          })
                        : null
                    }
                  />
                </div>
              );
            })}
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
    {canCreateDeets && (
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

    {expandedCommentDeetId &&
      commentSheetMobile &&
      (() => {
        const sheetId = expandedCommentDeetId;
        const post = filteredFeedItems.find((i) => i.id === sheetId);
        if (!post) return null;
        const cc = post.comments + (commentCountOverrides?.[sheetId] ?? 0);
        const loadedLen = commentsByDeetId?.[sheetId]?.length ?? 0;
        if (cc < COMMENT_SHEET_THRESHOLD && loadedLen < COMMENT_SHEET_THRESHOLD) return null;
        return (
          <CommentThreadSheet key={sheetId} title="Comments" onClose={() => handleToggleCommentsFor(sheetId)}>
            {buildCommentsSection(sheetId, "sheet", {
              autoFocusComposer: focusComposerDeetId === sheetId,
              allowNewComments: post.deetOptions?.commentsEnabled !== false,
            })}
          </CommentThreadSheet>
        );
      })()}

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
