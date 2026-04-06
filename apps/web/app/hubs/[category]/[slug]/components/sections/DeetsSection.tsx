"use client";

import type { HubContent } from "@/lib/hub-content";
import {
  AlertTriangle,
  BarChart3,
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
  Search,
  Send,
  Share2,
  SmilePlus,
} from "lucide-react";
import type { HubFeedItemAttachment } from "@/lib/hub-content";
import { useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";
import type { DeetComment } from "@/lib/services/deets/deet-interactions";

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
};

/** Resolve the deet type from kind + attachments */
function resolveDeetType(kind: string, attachments?: HubFeedItemAttachment[]): string | null {
  // Check attachments for specific types first
  if (attachments?.length) {
    for (const a of attachments) {
      if (a.type === "announcement" || a.type === "poll" || a.type === "event" || a.type === "checkin" || a.type === "money") {
        return a.type;
      }
    }
  }
  // Fall back to kind
  if (kind === "notice") return "notice";
  if (kind === "announcement") return "announcement";
  if (kind === "event") return "event";
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

  // Poll: options list
  if (type === "poll") {
    const options = matchingAtt?.options ?? [];
    return (
      <div className={cn("mx-4 mt-3 overflow-hidden rounded-xl border", config.border)}>
        <div className={cn("flex items-center gap-2 px-3 py-2", config.bg)}>
          <Icon className={cn("h-4 w-4 stroke-[2]", config.text)} />
          <span className={cn("text-sm font-bold", config.text)}>
            {matchingAtt?.title || "Poll"}
          </span>
        </div>
        {options.length > 0 && (
          <div className="divide-y divide-[var(--ud-border-subtle)] px-3">
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-center gap-2 py-2.5 text-sm text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  config.border, config.text
                )}>
                  {i + 1}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )}
        {matchingAtt?.detail && !options.length && (
          <div className="px-3 py-2.5">
            <p className="text-sm text-[var(--ud-text-secondary)]">{matchingAtt.detail}</p>
          </div>
        )}
      </div>
    );
  }

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

  return null;
}

/* ── Icon sizing ── */
const POST_ICON = "h-[18px] w-[18px] stroke-[1.5]";

/* ── Sort options ── */
type SortOption = "Newest" | "Oldest";

type FeedFilterOption = "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos";

/* ── Filter pill options (matches Band) ── */
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
  onOpenComposer,
  onOpenViewer,
  likedDeetIds,
  likingDeetIds,
  likeCountOverrides,
  onToggleLike,
  expandedCommentDeetId,
  commentsByDeetId,
  commentLoadingDeetIds,
  commentSubmittingDeetId,
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
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string) => void;
  likedDeetIds?: Set<string>;
  likingDeetIds?: Set<string>;
  likeCountOverrides?: Record<string, number>;
  onToggleLike?: (deetId: string) => void;
  expandedCommentDeetId?: string | null;
  commentsByDeetId?: Record<string, DeetComment[]>;
  commentLoadingDeetIds?: Set<string>;
  commentSubmittingDeetId?: string | null;
  onToggleComments?: (deetId: string) => void;
  onSubmitComment?: (deetId: string, body: string) => void;
}) {
  const [sortOption, setSortOption] = useState<SortOption>("Newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeFilterPill, setActiveFilterPill] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [openMenuDeetId, setOpenMenuDeetId] = useState<string | null>(null);

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

  /* ── Composer card (shared between empty & populated states) ── */
  const composerCard = (
    <DeetComposerCard
      isDemoPreview={isDemoPreview}
      isCreatorAdmin={isCreatorAdmin}
      onOpenComposer={onOpenComposer}
    />
  );

  /* ── Notice items (Band shows them in a separate strip above feed) ── */
  const noticeItems = filteredFeedItems.filter((item) => item.kind === "notice");

  return (
    <SectionShell
      title="Deets"
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

          {/* ── Notice section (pinned notices above feed) ── */}
          {noticeItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ud-border-subtle)]">
                <span className="text-sm font-bold text-[var(--ud-text-primary)]">Notice</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--ud-brand-primary)] px-1.5 text-[10px] font-bold text-white">{noticeItems.length}</span>
                  <ChevronDown className="h-4 w-4 text-[var(--ud-text-muted)] -rotate-90" />
                </div>
              </div>
              {noticeItems.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(notice.id);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm border-b border-[var(--ud-border-subtle)] last:border-b-0 hover:bg-[var(--ud-bg-subtle)] transition text-left"
                >
                  <span className="truncate flex-1 text-[var(--ud-text-secondary)]">
                    {notice.title && notice.title !== "Notice" ? (
                      notice.title
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(notice.body).slice(0, 80) }} />
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)] -rotate-90" />
                </button>
              ))}
            </div>
          )}

          {/* ── Sort row + view toggles (Band style) ── */}
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

          {/* ── Filter pills (Band style) ── */}
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
                  {/* Three-dot menu (Band style) */}
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
                      <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/hubs/${hubCategory}/${hubSlug}?focus=${item.id}`;
                            navigator.clipboard.writeText(shareUrl).catch(() => {});
                            setOpenMenuDeetId(null);
                          }}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenMenuDeetId(null)}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                        >
                          Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Type badge ── */}
                {(() => {
                  const deetType = resolveDeetType(item.kind, item.deetAttachments);
                  return deetType ? <DeetTypeBadge type={deetType} /> : null;
                })()}

                {/* ── Body content ── */}
                {item.body ? (
                  <div
                    className="px-4 pt-3 text-[15px] leading-relaxed text-[var(--ud-text-primary)]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.body) }}
                  />
                ) : null}

                {/* ── Rich type content section ── */}
                {(() => {
                  const deetType = resolveDeetType(item.kind, item.deetAttachments);
                  return deetType ? <DeetTypeContent type={deetType} attachments={item.deetAttachments} /> : null;
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

                {/* ── Views count (Band shows this below content, above action bar) ── */}
                <div className="flex justify-end px-4 pt-2">
                  <div className="inline-flex items-center gap-1 text-xs text-[var(--ud-text-muted)]">
                    <Eye className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>{item.views}</span>
                  </div>
                </div>

                {/* ── Action bar: React + Comment + Share ── */}
                <div className="flex items-center border-t border-[var(--ud-border-subtle)] mt-1">
                  {/* React button */}
                  <button
                    type="button"
                    onClick={() => onToggleLike?.(item.id)}
                    disabled={likingDeetIds?.has(item.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]",
                      likedDeetIds?.has(item.id)
                        ? "text-[var(--ud-brand-primary)] font-medium"
                        : "text-[var(--ud-text-muted)]"
                    )}
                  >
                    {likingDeetIds?.has(item.id) ? (
                      <Loader2 className={cn(POST_ICON, "animate-spin")} />
                    ) : (
                      <SmilePlus className={POST_ICON} />
                    )}
                    <span>React</span>
                    {(likeCountOverrides?.[item.id] ?? item.likes) > 0 && (
                      <span className="text-xs">({likeCountOverrides?.[item.id] ?? item.likes})</span>
                    )}
                  </button>

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
                    {item.comments > 0 && (
                      <span className="text-xs">({item.comments})</span>
                    )}
                  </button>

                  {/* Share button — copies post URL to clipboard */}
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/hubs/${hubCategory}/${hubSlug}?focus=${item.id}`;
                      navigator.clipboard.writeText(shareUrl).catch(() => {});
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-[var(--ud-text-muted)] transition-colors hover:bg-[var(--ud-bg-subtle)]"
                  >
                    <Share2 className={POST_ICON} />
                    <span>Share</span>
                  </button>
                </div>

                {/* ── Comments section ── */}
                {expandedCommentDeetId === item.id && (
                  <DeetCommentsSection
                    deetId={item.id}
                    comments={commentsByDeetId?.[item.id] ?? []}
                    isLoading={commentLoadingDeetIds?.has(item.id) ?? false}
                    isSubmitting={commentSubmittingDeetId === item.id}
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
    </SectionShell>
  );
}

/* ── Comments panel (Band-style inline) ── */
function DeetCommentsSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  onSubmitComment,
  userAvatarSrc,
  userName,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmitComment?: (deetId: string, body: string) => void;
  userAvatarSrc?: string;
  userName?: string;
}) {
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    onSubmitComment?.(deetId, trimmed);
    setCommentText("");
  };

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
