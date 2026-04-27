"use client";

export const dynamic = "force-dynamic";

import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Loader2, MessageSquare, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import { useUserProfileModal } from "@/components/UserProfileModalProvider";
import { mapDeetToDashboardCard } from "@/lib/mappers/deets/map-deet-to-dashboard-card";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import type { DeetAttachment, DeetRecord } from "@/lib/services/deets/deet-types";
import {
  toggleDeetLike,
  getDeetLikeStatus,
  addDeetComment,
  listDeetComments,
  listDeetReactors,
  editDeetComment,
  deleteDeetComment,
  syncDeetCommentCounts,
  type DeetComment,
  type DeetReactor,
} from "@/lib/services/deets/deet-interactions";
import { SafeDeetBody } from "@/components/deets/SafeDeetBody";
import { DeetCommentsSection } from "@/app/hubs/[category]/[slug]/components/deets/DeetCommentsSection";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import { listMyMemberships, type MyMembership } from "@/lib/services/members/list-my-memberships";
import type { Hub as SupabaseHub } from "@/types/hub";
import { DashboardHubCard, type DashboardHubCardData } from "./components/DashboardHubCard";
import { isGenericDeetTitle } from "@/lib/deets/deet-title";
import { DeetSharePopover } from "@/components/deets/DeetSharePopover";
import { FeedPostBody } from "@/components/deets/FeedPostBody";
import { FeedMedia } from "@/app/hubs/[category]/[slug]/components/deets/FeedMedia";
import { CollapsibleEngagementPanel } from "@/app/hubs/[category]/[slug]/components/deets/CollapsibleEngagementPanel";
import type {
  HubFeedDeetOptions,
  HubFeedItemAttachment,
  HubFeedItemKind,
  HubJobDataPersisted,
  HubPollSettingsPersisted,
} from "@/lib/hub-content";
import { resolveHubFeedItemKind } from "@/app/hubs/[category]/[slug]/components/deets/map-deet-to-hub-feed-item";
import {
  DeetTypeContent,
  DeetTypeKindChip,
  getStructuredHeadlineForFeed,
  PollContent,
  resolveDeetType,
  StructuredDescriptionShell,
} from "@/app/hubs/[category]/[slug]/components/deets/feedDeetTypeBlocks";
import { EmojiReactButton, POST_ICON } from "@/app/hubs/[category]/[slug]/components/deets/feedEmojiReact";
import { ReactionSummary } from "@/app/hubs/[category]/[slug]/components/deets/ReactionSummary";
import { feedKindMeta, ImageWithFallback, initials } from "@/app/hubs/[category]/[slug]/components/hubUtils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type DashboardHub = DashboardHubCardData & { createdBy: string };

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
type HubView = "my-hubs" | "joined" | "requested";
type FeedFilter = "All" | "Posts" | "Notices" | "Deals" | "Announcements" | "Polls" | "Photos" | "Videos" | "News" | "Hazards" | "Alerts" | "Jobs";
type FeedAttachment = {
  type: string;
  title?: string;
  detail?: string;
  options?: string[];
  previews?: string[];
  eventData?: { date?: string | null; time?: string | null; location?: string | null };
  pollSettings?: HubPollSettingsPersisted;
  jobData?: HubJobDataPersisted;
  meta?: string;
};

type FeedItem = {
  id: string;
  title: string;
  body: string;
  kind: string;
  type: FeedFilter;
  /** Normalized hub feed kind — same pipeline as hub cards for chips and `resolveDeetType`. */
  feedKind: HubFeedItemKind;
  hubName: string;
  hubId: string;
  authorName: string;
  authorId?: string;
  authorAvatar?: string;
  timeLabel: string;
  previewImage?: string;
  previewImages: string[];
  href?: string;
  attachments: FeedAttachment[];
  deetOptions?: HubFeedDeetOptions;
  /** Total comments from `deets.comment_count` (accurate before the thread is fetched). */
  commentCount: number;
};

const PAGE_BG = "bg-[var(--ud-bg-page)]";
const CARD = "rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm";
const TEXT_DARK = "text-[var(--ud-text-primary)]";
const TEXT_MUTED = "text-[var(--ud-text-secondary)]";
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:opacity-90";
const FEED_FILTERS: FeedFilter[] = ["All", "Posts", "Notices", "Announcements", "Polls", "Photos", "Videos"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePublicSrc(src?: string | null) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function memberCountLabel(hub: SupabaseHub) {
  const galleryCount = Array.isArray(hub.gallery_image_urls) ? hub.gallery_image_urls.length : 0;
  const count = Math.max(1, galleryCount + 1);
  return `${count} ${count === 1 ? "Member" : "Members"}`;
}

function visibilityLabel(): "Public" | "Private" {
  return "Public";
}

function formatDeetTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(createdAt).toLocaleDateString();
}

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";
}

/** All rows in the threaded list (top-level + replies). */
function totalCommentsInTree(comments: DeetComment[] | undefined): number {
  if (!comments?.length) return 0;
  return comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
}

function deetRecordToDashboardItem(item: DeetRecord): FeedItem {
  const card = mapDeetToDashboardCard(item);
  const feedKind = resolveHubFeedItemKind(card, item);

  // Normalize attachments to FeedAttachment shape
  const attachments: FeedAttachment[] = (item.attachments ?? []).map((a) => {
    const raw = a as DeetAttachment;
    const row: FeedAttachment = {
      type: a.type,
      title: a.title || undefined,
      detail: a.detail || undefined,
      options: raw.options as string[] | undefined,
      previews: a.previews || undefined,
      meta: typeof raw.meta === "string" ? raw.meta : undefined,
      eventData:
        a.type === "event" && raw.eventData && typeof raw.eventData === "object"
          ? (raw.eventData as FeedAttachment["eventData"])
          : undefined,
    };
    if (a.type === "poll" && raw.pollSettings && typeof raw.pollSettings === "object") {
      row.pollSettings = raw.pollSettings as HubPollSettingsPersisted;
    }
    if (a.type === "jobs" && raw.jobData && typeof raw.jobData === "object") {
      row.jobData = raw.jobData as HubJobDataPersisted;
    }
    return row;
  });

  const deetOptions = parseDashboardDeetOptionsMeta(item.attachments);

  return {
    id: card.id,
    title: card.title ?? "",
    body: card.body ?? "",
    kind: item.kind,
    type: card.type,
    feedKind,
    hubName: "",
    hubId: card.hubId,
    authorName: item.author_name || "Hub member",
    authorId: item.created_by || undefined,
    timeLabel: formatDeetTime(card.createdAt ?? item.created_at),
    previewImage: card.previewImageUrl || undefined,
    previewImages: card.previewImageUrls,
    href: undefined,
    attachments,
    deetOptions,
    commentCount: item.comment_count ?? 0,
  };
}

function parseDashboardDeetOptionsMeta(
  attachments: DeetRecord["attachments"] | undefined,
): HubFeedDeetOptions | undefined {
  if (!Array.isArray(attachments)) return undefined;
  const raw = attachments.find((a) => a?.type === "deet_options");
  const metaStr = typeof raw?.meta === "string" ? raw.meta.trim() : "";
  if (!metaStr) return undefined;
  try {
    const parsed = JSON.parse(metaStr) as Record<string, unknown>;
    const out: HubFeedDeetOptions = {};
    if (typeof parsed.commentsEnabled === "boolean") out.commentsEnabled = parsed.commentsEnabled;
    if (typeof parsed.reactionsEnabled === "boolean") out.reactionsEnabled = parsed.reactionsEnabled;
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

function dashboardDeetGalleryUrls(item: FeedItem): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of item.previewImages ?? []) {
    const t = u?.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  const primary = item.previewImage?.trim();
  if (primary && !seen.has(primary)) {
    out.unshift(primary);
  }
  return out;
}

function dashboardMediaFeedKind(feedKind: HubFeedItemKind): HubFeedItemKind | undefined {
  if (feedKind === "photo") return "photo";
  return undefined;
}

function feedAttachmentsToHubShape(att: FeedAttachment[]): HubFeedItemAttachment[] {
  return att
    .filter((a) => a && typeof a.type === "string" && a.type && a.type !== "deet_options")
    .map((a) => ({
      type: a.type,
      title: a.title,
      detail: a.detail,
      options: a.options,
      previews: a.previews,
      meta: a.meta,
      eventData: a.eventData,
      pollSettings: a.pollSettings,
      jobData: a.jobData,
    }));
}

function toDashboardHub(hub: SupabaseHub): DashboardHub {
  return {
    id: hub.id,
    name: hub.name,
    dpImage: normalizePublicSrc(hub.dp_image_url || hub.cover_image_url),
    coverImage: normalizePublicSrc(hub.cover_image_url || hub.dp_image_url),
    href: `/hubs/${hub.category}/${hub.slug}`,
    membersLabel: memberCountLabel(hub),
    visibilityLabel: visibilityLabel(),
    createdBy: hub.created_by,
  };
}

function CreateHubTile() {
  return (
    <Link href="/create-hub" className="flex flex-col items-center gap-1.5">
      <div className="flex aspect-square w-full items-center justify-center rounded-[22%] bg-[var(--ud-brand-light)] shadow-[0_2px_0_0_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-[var(--ud-brand-primary)]" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </div>
      <span className={cn("w-full truncate text-center text-[12px] font-medium leading-tight", TEXT_DARK)}>
        Create Hub
      </span>
    </Link>
  );
}

function HubLauncher({
  selectedView,
  onSelectView,
  hubs,
  requestedCount,
  joinedDot = false,
  acceptedHubIds,
  onAcceptedClick,
}: {
  selectedView: HubView;
  onSelectView: (view: HubView) => void;
  hubs: DashboardHub[];
  requestedCount: number;
  joinedDot?: boolean;
  acceptedHubIds?: Set<string>;
  onAcceptedClick?: (hub: DashboardHubCardData) => void;
}) {
  const emptyMessages: Record<HubView, { title: string; description: string; ctaLabel: string; ctaHref: string }> = {
    "my-hubs": {
      title: "No hubs to manage yet",
      description: "Create your first hub to make this launcher feel like home.",
      ctaLabel: "Create Hub",
      ctaHref: "/create-hub",
    },
    joined: {
      title: "No joined hubs yet",
      description: "Discover hubs to join and they will appear here for quick access.",
      ctaLabel: "Discover Hubs",
      ctaHref: "/discover",
    },
    requested: {
      title: "No pending requests",
      description: "When you request to join a private hub, it will show up here until the admin approves.",
      ctaLabel: "Discover Hubs",
      ctaHref: "/discover",
    },
  };

  const empty = emptyMessages[selectedView];

  return (
    <section className={cn(CARD, "p-4 sm:p-5")}>
      <div className="flex justify-start">
        <div className="inline-flex rounded-full bg-[var(--ud-brand-light)] p-1.5 shadow-[inset_0_1px_2px_rgba(12,92,87,0.08)]">
          {(
            [
              { key: "my-hubs" as HubView, label: "My Hubs" },
              { key: "joined" as HubView, label: "Joined" },
              { key: "requested" as HubView, label: "Requested" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectView(tab.key)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150",
                selectedView === tab.key
                  ? "bg-[var(--ud-bg-card)] text-[var(--ud-text-primary)] shadow-sm"
                  : "text-[var(--ud-text-secondary)] hover:text-[var(--ud-text-primary)]",
              )}
            >
              {tab.label}
              {tab.key === "requested" && requestedCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--ud-brand-primary)] px-1 text-[10px] font-bold text-white">
                  {requestedCount}
                </span>
              ) : null}
              {tab.key === "joined" && joinedDot ? (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#FF3B30] ring-2 ring-white" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {hubs.length ? (
        <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {selectedView === "my-hubs" ? <CreateHubTile /> : null}
          {hubs.map((hub) => {
            const isAccepted = selectedView === "requested" && (acceptedHubIds?.has(hub.id) ?? false);
            return (
              <DashboardHubCard
                key={hub.id}
                hub={hub}
                hasUnread={false}
                isPending={selectedView === "requested" && !isAccepted}
                isAccepted={isAccepted}
                onAcceptedClick={onAcceptedClick}
              />
            );
          })}
        </div>
      ) : (
        <>
          {selectedView === "my-hubs" ? (
            <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              <CreateHubTile />
            </div>
          ) : null}
          <div className="mt-5 rounded-[24px] bg-[var(--ud-brand-light)] px-6 py-10 text-center">
            <h3 className={cn("text-xl font-semibold tracking-tight", TEXT_DARK)}>
              {empty.title}
            </h3>
            <p className={cn("mx-auto mt-3 max-w-xl text-sm leading-6 sm:text-base", TEXT_MUTED)}>
              {empty.description}
            </p>
            <div className="mt-6">
              <Link href={empty.ctaHref} className={PRIMARY_BUTTON}>
                {empty.ctaLabel}
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Who Reacted popup ── */
function ReactorsPopup({
  deetId,
  onClose,
}: {
  deetId: string;
  onClose: () => void;
}) {
  const { openProfileModal } = useUserProfileModal();
  const [reactors, setReactors] = useState<DeetReactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const popupRef = useRef<HTMLDivElement | null>(null);
  const emojiLabelMap: Record<string, string> = {
    like: "👍",
    "👍": "👍",
    "❤️": "❤️",
    "😂": "😂",
    "😮": "😮",
    "😢": "😢",
    "🙏": "🙏",
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listDeetReactors(deetId);
        if (!cancelled) setReactors(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [deetId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const grouped = new Map<string, DeetReactor[]>();
  for (const r of reactors) {
    const key = r.reactionType || "like";
    const existing = grouped.get(key) ?? [];
    existing.push(r);
    grouped.set(key, existing);
  }
  const filteredReactors = activeTab === "all" ? reactors : (grouped.get(activeTab) ?? []);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={popupRef}
        className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] px-5 py-3.5">
          <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">
            {reactors.length} reaction{reactors.length !== 1 ? "s" : ""}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-[var(--ud-border-subtle)] px-4 py-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              activeTab === "all"
                ? "bg-[var(--ud-brand-primary)]/10 text-[var(--ud-brand-primary)]"
                : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]",
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
                  : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]",
              )}
            >
              <span>{emojiLabelMap[emoji] ?? emoji}</span>
              <span>{list.length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-brand-primary)]" />
          </div>
        ) : filteredReactors.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No reactions yet</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
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
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--ud-bg-subtle)] px-2 py-0.5 text-sm font-semibold text-[var(--ud-text-primary)]"
                  title={`${reactor.name} reacted with ${emojiLabelMap[reactor.reactionType] ?? reactor.reactionType}`}
                  aria-label={`${reactor.name} reaction`}
                >
                  {emojiLabelMap[reactor.reactionType] ?? reactor.reactionType}
                </span>
              </div>
            ))}
          </div>
        )}

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

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openProfileModal } = useUserProfileModal();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedHubView, setSelectedHubView] = useState<HubView>("my-hubs");
  const [selectedFeedFilter, setSelectedFeedFilter] = useState<FeedFilter>("All");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const myPostsToolbarRef = useRef<HTMLDivElement>(null);

  const [hubs, setHubs] = useState<DashboardHub[]>([]);
  const [memberships, setMemberships] = useState<MyMembership[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [hubsLoadError, setHubsLoadError] = useState<string | null>(null);
  const [myDeetsItems, setMyDeetsItems] = useState<FeedItem[]>([]);

  // ── Join-request acceptance celebration ──
  const [newlyAcceptedHub, setNewlyAcceptedHub] = useState<{ id: string; name: string; href: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [joinedDot, setJoinedDot] = useState(false);
  const celebratedIdsRef = useRef<Set<string>>(new Set());
  // Track hub IDs whose requests were recently accepted (shown with dot in Requested tab)
  const [acceptedHubIds, setAcceptedHubIds] = useState<Set<string>>(new Set());

  // ── Handle ?tab=joined URL param (from bell notification link) ──
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "joined") {
      setSelectedHubView("joined");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isFilterMenuOpen && !isSearchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = myPostsToolbarRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setIsFilterMenuOpen(false);
      setIsSearchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isFilterMenuOpen, isSearchOpen]);

  useEffect(() => {
    if (!isFilterMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFilterMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFilterMenuOpen]);

  // ── Interaction state (likes, comments, share) ──
  const [likedDeets, setLikedDeets] = useState<Set<string>>(new Set());
  const [myDeetReactions, setMyDeetReactions] = useState<Record<string, string>>({});
  const [likingDeets, setLikingDeets] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  /** True counts from `deet_comments` — `deets.comment_count` is often stale until healed (same as hub feed). */
  const [healedCommentCounts, setHealedCommentCounts] = useState<Record<string, number>>({});
  const [expandedCommentDeetId, setExpandedCommentDeetId] = useState<string | null>(null);
  const [commentsByDeetId, setCommentsByDeetId] = useState<Record<string, DeetComment[]>>({});
  const [commentLoadingDeetIds, setCommentLoadingDeetIds] = useState<Set<string>>(new Set());
  const [commentSubmittingDeetId, setCommentSubmittingDeetId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [copiedDeetId, setCopiedDeetId] = useState<string | null>(null);
  const [reactorsDeetId, setReactorsDeetId] = useState<string | null>(null);
  const [feedGallery, setFeedGallery] = useState<{
    urls: string[];
    index: number;
    deetId: string;
    displayTitle: string;
    body: string;
    hubHref?: string;
  } | null>(null);
  const [imageViewerComposerFooterVisible, setImageViewerComposerFooterVisible] = useState(false);
  const [viewerShareCopied, setViewerShareCopied] = useState(false);
  const viewerShareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("");
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState("");
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useBodyScrollLock(Boolean(feedGallery));

  useEffect(() => {
    if (!feedGallery) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFeedGallery(null);
        return;
      }
      if (e.key === "ArrowLeft") {
        setFeedGallery((g) =>
          g && g.urls.length > 1
            ? { ...g, index: (g.index + g.urls.length - 1) % g.urls.length }
            : g,
        );
      }
      if (e.key === "ArrowRight") {
        setFeedGallery((g) =>
          g && g.urls.length > 1 ? { ...g, index: (g.index + 1) % g.urls.length } : g,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedGallery]);

  useEffect(() => {
    if (!feedGallery) {
      setImageViewerComposerFooterVisible(false);
      setCommentError(null);
    }
  }, [feedGallery]);

  useEffect(() => {
    if (!feedGallery?.deetId) return;
    const deetId = feedGallery.deetId;
    if (commentsByDeetId[deetId] !== undefined) return;

    let cancelled = false;
    setCommentLoadingDeetIds((prev) => new Set(prev).add(deetId));
    void listDeetComments(deetId)
      .then((comments) => {
        if (!cancelled) {
          setCommentsByDeetId((prev) => ({ ...prev, [deetId]: comments }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCommentsByDeetId((prev) => ({ ...prev, [deetId]: [] }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCommentLoadingDeetIds((prev) => {
            const next = new Set(prev);
            next.delete(deetId);
            return next;
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [feedGallery, commentsByDeetId]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !currentUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        const meta = user.user_metadata ?? {};
        const fallbackName =
          (meta.full_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "You";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setCurrentUserDisplayName(profile?.full_name?.trim() || fallbackName);
        setCurrentUserAvatarUrl(profile?.avatar_url ?? (meta.avatar_url as string) ?? "");
      } catch {
        if (!cancelled) {
          setCurrentUserDisplayName("You");
          setCurrentUserAvatarUrl("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, currentUserId]);

  const toggleLike = useCallback(async (deetId: string, reactionType?: string) => {
    if (likingDeets.has(deetId)) return;
    setLikingDeets((prev) => new Set(prev).add(deetId));
    try {
      const result = await toggleDeetLike(deetId, reactionType ?? "like");
      setLikedDeets((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(deetId);
        else next.delete(deetId);
        return next;
      });
      setMyDeetReactions((prev) => {
        const next = { ...prev };
        if (result.liked && result.myReactionType) next[deetId] = result.myReactionType;
        else delete next[deetId];
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [deetId]: result.likeCount }));
    } catch {
      // Silently fail
    } finally {
      setLikingDeets((prev) => {
        const next = new Set(prev);
        next.delete(deetId);
        return next;
      });
    }
  }, [likingDeets]);

  const handleToggleComments = useCallback(async (deetId: string) => {
    if (expandedCommentDeetId === deetId) {
      setExpandedCommentDeetId(null);
    } else {
      setExpandedCommentDeetId(deetId);
      if (!commentsByDeetId[deetId] && !commentLoadingDeetIds.has(deetId)) {
        setCommentLoadingDeetIds((prev) => new Set(prev).add(deetId));
        try {
          const comments = await listDeetComments(deetId);
          setCommentsByDeetId((prev) => ({ ...prev, [deetId]: comments }));
        } catch (error) {
          console.error("Failed to load comments:", error);
        } finally {
          setCommentLoadingDeetIds((prev) => {
            const next = new Set(prev);
            next.delete(deetId);
            return next;
          });
        }
      }
    }
  }, [expandedCommentDeetId, commentsByDeetId, commentLoadingDeetIds]);

  const handleSubmitComment = useCallback(
    async (
      deetId: string,
      body: string,
      parentId?: string,
      attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string },
    ): Promise<{ success: boolean }> => {
      if (commentSubmittingDeetId) return { success: false };
      setCommentSubmittingDeetId(deetId);
      setCommentError(null);
      try {
        const newComment = await addDeetComment(deetId, body, parentId, attachments);
        setCommentsByDeetId((prev) => {
          const existing = prev[deetId] ?? [];
          if (parentId) {
            return {
              ...prev,
              [deetId]: existing.map((c) =>
                c.id === parentId ? { ...c, replies: [...(c.replies ?? []), newComment] } : c,
              ),
            };
          }
          return { ...prev, [deetId]: [...existing, { ...newComment, replies: [] }] };
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to submit comment:", error);
        setCommentError("Could not post comment. Please try again.");
        return { success: false };
      } finally {
        setCommentSubmittingDeetId(null);
      }
    },
    [commentSubmittingDeetId],
  );

  const handleEditComment = useCallback(
    async (commentId: string, deetId: string, newBody: string): Promise<{ success: boolean }> => {
      setCommentError(null);
      try {
        await editDeetComment(commentId, newBody);
        setCommentsByDeetId((prev) => {
          const existing = prev[deetId] ?? [];
          const mapTree = (comments: DeetComment[]): DeetComment[] =>
            comments.map((c) => {
              if (c.id === commentId) return { ...c, body: newBody.trim() };
              if (c.replies?.length) return { ...c, replies: mapTree(c.replies) };
              return c;
            });
          return { ...prev, [deetId]: mapTree(existing) };
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to edit comment:", error);
        setCommentError("Could not edit comment. Please try again.");
        return { success: false };
      }
    },
    [],
  );

  const handleDeleteComment = useCallback(async (commentId: string, deetId: string): Promise<{ success: boolean }> => {
    setCommentError(null);
    try {
      await deleteDeetComment(commentId, deetId);
      setCommentsByDeetId((prev) => {
        const existing = prev[deetId] ?? [];
        const removeFromTree = (comments: DeetComment[]): DeetComment[] =>
          comments
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: c.replies?.length ? removeFromTree(c.replies) : c.replies,
            }));
        return { ...prev, [deetId]: removeFromTree(existing) };
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setCommentError("Could not delete comment. Please try again.");
      return { success: false };
    }
  }, []);

  const flashViewerShareCopied = useCallback(() => {
    setViewerShareCopied(true);
    if (viewerShareCopiedTimeoutRef.current) clearTimeout(viewerShareCopiedTimeoutRef.current);
    viewerShareCopiedTimeoutRef.current = setTimeout(() => setViewerShareCopied(false), 2000);
  }, []);

  // Cleanup copied timeout
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (viewerShareCopiedTimeoutRef.current) clearTimeout(viewerShareCopiedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await getCurrentSession();

        if (cancelled) return;

        if (session) {
          setCurrentUserId(session.user.id);
          setAuthStatus("authenticated");
          return;
        }

        setCurrentUserId(null);
        setAuthStatus("unauthenticated");
        router.replace("/auth");
      } catch {
        if (cancelled) return;
        setCurrentUserId(null);
        setAuthStatus("unauthenticated");
        router.replace("/auth");
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setHubs([]);
      setIsLoadingHubs(authStatus === "checking");
      return;
    }

    let cancelled = false;

    async function loadDashboardHubs() {
      setIsLoadingHubs(true);
      setHubsLoadError(null);

      try {
        const [dbHubs, myMemberships] = await Promise.all([
          listHubs(),
          listMyMemberships(),
        ]);
        if (!cancelled) {
          const dashHubs = dbHubs.map(toDashboardHub);
          setHubs(dashHubs);
          setMemberships(myMemberships);

          // ── Track recently accepted memberships (show in Requested tab with dot) ──
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const recentlyAcceptedIds = new Set<string>();
          for (const m of myMemberships) {
            if (
              m.status === "active" &&
              m.role !== "creator" &&
              m.joinedAt &&
              new Date(m.joinedAt).getTime() > fiveMinutesAgo &&
              !celebratedIdsRef.current.has(m.hubId)
            ) {
              recentlyAcceptedIds.add(m.hubId);
            }
          }
          if (recentlyAcceptedIds.size > 0) {
            setAcceptedHubIds(recentlyAcceptedIds);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setHubs([]);
          setMemberships([]);
          setHubsLoadError(error instanceof Error ? error.message : "Hubs could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHubs(false);
        }
      }
    }

    void loadDashboardHubs();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // ── Real-time: detect when a pending request is accepted ──
  useEffect(() => {
    if (authStatus !== "authenticated" || !currentUserId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabaseRef: any = null;

    (async () => {
      const { createClient: createSupa } = await import("@/lib/supabase/client");
      supabaseRef = createSupa();

      channel = supabaseRef
        .channel(`dashboard-membership-${currentUserId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "hub_members", filter: `user_id=eq.${currentUserId}` },
          async (payload: { new: { hub_id: string; status: string; user_id: string }; old: { status?: string } }) => {
            const row = payload.new;
            if (row.status !== "active") return;
            // A membership was just approved — refetch to update lists
            try {
              const [dbHubs, myMemberships] = await Promise.all([
                listHubs(),
                listMyMemberships(),
              ]);
              setHubs(dbHubs.map(toDashboardHub));
              setMemberships(myMemberships);

              // Mark hub as accepted — user will see dot on Requested tab
              if (!celebratedIdsRef.current.has(row.hub_id)) {
                setAcceptedHubIds((prev) => new Set(prev).add(row.hub_id));
              }
            } catch (err) {
              console.error("[membership-acceptance]", err);
            }
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel && supabaseRef) {
        void supabaseRef.removeChannel(channel);
      }
    };
  }, [authStatus, currentUserId]);

  const membershipByHubId = useMemo(() => {
    const map = new Map<string, MyMembership>();
    for (const m of memberships) map.set(m.hubId, m);
    return map;
  }, [memberships]);

  const myHubs = useMemo(
    () => hubs.filter((hub) => {
      const m = membershipByHubId.get(hub.id);
      return m?.role === "creator" && m.status === "active";
    }),
    [hubs, membershipByHubId],
  );

  const joinedHubs = useMemo(
    () => hubs.filter((hub) => {
      const m = membershipByHubId.get(hub.id);
      return m && (m.role === "admin" || m.role === "member") && m.status === "active";
    }),
    [hubs, membershipByHubId],
  );

  const requestedHubs = useMemo(
    () => hubs.filter((hub) => {
      const m = membershipByHubId.get(hub.id);
      // Show pending requests AND recently accepted hubs that haven't been celebrated
      return m?.status === "pending" || acceptedHubIds.has(hub.id);
    }),
    [hubs, membershipByHubId, acceptedHubIds],
  );

  // Handler: when user clicks an accepted hub card in the Requested section
  const handleAcceptedHubClick = async (hub: DashboardHubCardData) => {
    celebratedIdsRef.current.add(hub.id);
    setNewlyAcceptedHub({ id: hub.id, name: hub.name, href: hub.href });
    // Fire confetti
    setTimeout(async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        const confettiColors = ["#0C5C57", "#A9D1CA", "#E3F1EF", "#ffffff", "#1a8a82", "#FFD700", "#FFC107"];
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, colors: confettiColors });
        setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.3, y: 0.5 }, colors: confettiColors }), 150);
        setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.7, y: 0.5 }, colors: confettiColors }), 300);
        setTimeout(() => confetti({ particleCount: 40, spread: 120, origin: { x: 0.5, y: 0.4 }, colors: confettiColors }), 500);
      } catch { /* confetti import failed, skip */ }
      setShowCelebration(true);
    }, 100);
  };

  const visibleHubs = selectedHubView === "my-hubs"
    ? myHubs
    : selectedHubView === "joined"
      ? joinedHubs
      : requestedHubs;
  /* All hubs the user is a member of — used for the posts feed.
     Uses membership hub IDs (same source as alerts page) so posts and
     notifications stay in sync. */
  const allMemberHubIds = useMemo(
    () => memberships.map((m) => m.hubId),
    [memberships],
  );

  const allActiveHubs = useMemo(() => {
    const memberSet = new Set(allMemberHubIds);
    return hubs.filter((hub) => memberSet.has(hub.id));
  }, [hubs, allMemberHubIds]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setMyDeetsItems([]);
      return;
    }

    let cancelled = false;
    const allHubIds = allActiveHubs.map((hub) => hub.id);
    const hubById = new Map(allActiveHubs.map((hub) => [hub.id, hub]));

    const syncDeets = async () => {
      if (!allHubIds.length) {
        if (!cancelled) {
          setMyDeetsItems([]);
        }
        return;
      }

      try {
        const items = await listDeets({ hubIds: allHubIds });
        if (cancelled) return;

        const feedItems = items
          .map(deetRecordToDashboardItem)
          .map((item) => {
            const hub = hubById.get(item.hubId);
            // Deep-link every deet card to the specific post on the hub's
            // Posts tab. Without ?tab=Posts the hub would open on About and
            // the ?focus scroll-to-deet logic would silently miss.
            const href = hub?.href ? `${hub.href}?tab=Posts&focus=${item.id}` : undefined;
            return {
              ...item,
              hubName: hub?.name || "Hub",
              href,
            };
          });

        // Fetch author avatars in the same pass
        const authorIds = [...new Set(feedItems.map((i) => i.authorId).filter(Boolean))] as string[];
        if (authorIds.length) {
          try {
            const { createClient: createSupa } = await import("@/lib/supabase/client");
            const supabase = createSupa();
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, avatar_url")
              .in("id", authorIds);

            if (!cancelled && profiles?.length) {
              const avatarMap = new Map(
                profiles
                  .filter((p: { avatar_url: string | null }) => p.avatar_url)
                  .map((p: { id: string; avatar_url: string }) => [p.id, p.avatar_url])
              );
              for (const item of feedItems) {
                if (item.authorId && avatarMap.has(item.authorId)) {
                  item.authorAvatar = avatarMap.get(item.authorId);
                }
              }
            }
          } catch {
            // Avatars are non-critical
          }
        }

        if (!cancelled) {
          setMyDeetsItems(feedItems);
        }
      } catch {
        if (!cancelled) {
          setMyDeetsItems([]);
        }
      }
    };

    void syncDeets();
    const unsubscribe = subscribeToDeets(() => {
      void syncDeets();
    }, { hubIds: allHubIds });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authStatus, allActiveHubs]);

  const myDeetsIdsKey = useMemo(
    () => [...new Set(myDeetsItems.map((item) => item.id).filter(Boolean))].sort().join(","),
    [myDeetsItems],
  );

  useEffect(() => {
    if (!myDeetsIdsKey) {
      setHealedCommentCounts({});
      return;
    }
    const deetIds = myDeetsIdsKey.split(",").filter(Boolean);
    let cancelled = false;

    void syncDeetCommentCounts(deetIds)
      .then((counts) => {
        if (cancelled) return;
        const next: Record<string, number> = {};
        for (const id of deetIds) {
          next[id] = counts[id] ?? 0;
        }
        setHealedCommentCounts(next);
      })
      .catch(() => {
        /* keep prior counts on failure */
      });

    return () => {
      cancelled = true;
    };
  }, [myDeetsIdsKey]);

  // Fetch like statuses when deets items change
  useEffect(() => {
    const deetIds = myDeetsItems.map((item) => item.id).filter(Boolean);
    if (!deetIds.length) return;

    let cancelled = false;

    async function fetchLikeStatus() {
      try {
        const statusMap = await getDeetLikeStatus(deetIds);
        if (!cancelled) {
          const liked = new Set<string>();
          const counts: Record<string, number> = {};
          const reactions: Record<string, string> = {};
          for (const [id, status] of statusMap) {
            if (status.liked) {
              liked.add(id);
              reactions[id] = status.myReactionType ?? "👍";
            }
            counts[id] = status.count;
          }
          setLikedDeets(liked);
          setMyDeetReactions(reactions);
          setLikeCounts(counts);
        }
      } catch {
        // Silently fail
      }
    }

    void fetchLikeStatus();
    return () => { cancelled = true; };
  }, [myDeetsItems]);

  const filteredDeetsItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const dedupedItems = myDeetsItems.filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);
    const scopedItems = dedupedItems;

    return scopedItems.filter((item) => {
      const matchesFilter = selectedFeedFilter === "All" || item.type === selectedFeedFilter;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.body, item.hubName].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [myDeetsItems, searchQuery, selectedFeedFilter]);

  const viewerFeedItem = feedGallery
    ? myDeetsItems.find((i) => i.id === feedGallery.deetId) ?? null
    : null;
  const viewerCommentsEnabled = viewerFeedItem?.deetOptions?.commentsEnabled !== false;
  const viewerReactionsEnabled = viewerFeedItem?.deetOptions?.reactionsEnabled !== false;


  if (authStatus === "checking" && searchParams.get("demo_preview") !== "1") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        <UdeetsHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
          <section className={cn(CARD, "p-6 text-center")}>
            <h1 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>Loading dashboard…</h1>
            <p className={cn("mt-3 text-sm leading-relaxed", TEXT_MUTED)}>
              We&apos;re checking your session and loading your hubs.
            </p>
          </section>
        </main>
        <UdeetsFooter />
        <UdeetsBottomNav activeNav="home" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" && searchParams.get("demo_preview") !== "1") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        <UdeetsHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
          <section className={cn(CARD, "p-6 text-center")}>
            <h1 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>
              Redirecting to sign in…
            </h1>
            <p className={cn("mt-3 text-sm leading-relaxed", TEXT_MUTED)}>
              Your session could not be found, so we&apos;re sending you to the auth page.
            </p>
          </section>
        </main>
        <UdeetsFooter />
        <UdeetsBottomNav activeNav="home" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <UdeetsHeader />

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
        {isLoadingHubs ? (
          <section className={cn(CARD, "mt-6 p-6 text-center sm:p-8")}>
            <h2 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>Loading your hubs…</h2>
            <p className={cn("mt-3 text-sm leading-6 sm:text-base", TEXT_MUTED)}>
              We&apos;re organizing your dashboard now.
            </p>
          </section>
        ) : null}

        {hubsLoadError ? (
          <section className={cn(CARD, "mt-6 p-6 text-center sm:p-8")}>
            <h2 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>
              We couldn&apos;t load your dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-red-600 sm:text-base">{hubsLoadError}</p>
          </section>
        ) : null}

        {!isLoadingHubs && !hubsLoadError ? (
          <div className="mt-6 space-y-6">
            <HubLauncher
              selectedView={selectedHubView}
              onSelectView={(view) => {
                setSelectedHubView(view);
                if (view === "joined") setJoinedDot(false);
              }}
              hubs={visibleHubs}
              requestedCount={requestedHubs.length}
              joinedDot={joinedDot}
              acceptedHubIds={acceptedHubIds}
              onAcceptedClick={handleAcceptedHubClick}
            />

            <section className={cn(CARD, "p-4 sm:p-5")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <h2 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>My Posts</h2>

                <div
                  ref={myPostsToolbarRef}
                  className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2"
                >
                  <div className="relative w-full sm:min-w-[11rem] sm:max-w-[min(100%,16rem)] sm:flex-1">
                    <button
                      type="button"
                      aria-expanded={isFilterMenuOpen}
                      aria-haspopup="listbox"
                      onClick={() => setIsFilterMenuOpen((current) => !current)}
                      className={cn(
                        "flex h-10 w-full items-center justify-between gap-2 rounded-full border bg-[var(--ud-bg-card)] px-4 text-left text-sm font-medium text-[var(--ud-text-primary)] shadow-sm transition",
                        isFilterMenuOpen
                          ? "border-[var(--ud-border-focus)] ring-2 ring-[var(--ud-brand-light)]"
                          : "border-[var(--ud-border)] hover:border-[var(--ud-border-focus)]",
                      )}
                    >
                      <span className="min-w-0 truncate">{selectedFeedFilter}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[var(--ud-text-muted)] transition-transform duration-200",
                          isFilterMenuOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    {isFilterMenuOpen ? (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(50vh,280px)] overflow-y-auto rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg sm:left-0 sm:right-auto sm:min-w-[12rem]"
                        role="listbox"
                        aria-label="Post type filter"
                      >
                        {FEED_FILTERS.map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            role="option"
                            aria-selected={selectedFeedFilter === filter}
                            onClick={() => {
                              setSelectedFeedFilter(filter);
                              setIsFilterMenuOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition",
                              selectedFeedFilter === filter
                                ? "bg-[var(--ud-brand-light)] font-medium text-[var(--ud-brand-primary)]"
                                : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]",
                            )}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <div
                      className={cn(
                        "overflow-hidden rounded-full border border-transparent bg-[var(--ud-bg-subtle)] transition-all duration-300 ease-out",
                        isSearchOpen ? "min-w-0 flex-1 border-[var(--ud-border)] px-3 py-2 opacity-100 sm:max-w-72 sm:flex-initial" : "w-0 border-0 px-0 py-0 opacity-0",
                      )}
                    >
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search posts…"
                        className="w-full min-w-0 bg-transparent text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)]"
                        aria-label="Search posts"
                      />
                    </div>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)] shadow-sm transition hover:border-[var(--ud-border-focus)] hover:text-[var(--ud-brand-primary)]",
                        isSearchOpen && "border-[var(--ud-border-focus)] text-[var(--ud-brand-primary)]",
                      )}
                      onClick={() => setIsSearchOpen((current) => !current)}
                      aria-label={isSearchOpen ? "Close search" : "Search posts"}
                    >
                      <Search className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {filteredDeetsItems.length ? (
                  <div className="space-y-3">
                    {filteredDeetsItems.map((item) => {
                      const isLiked = likedDeets.has(item.id);
                      const isLiking = likingDeets.has(item.id);
                      const likeCount = likeCounts[item.id] ?? 0;
                      const commentsEnabled = item.deetOptions?.commentsEnabled !== false;
                      const reactionsEnabled = item.deetOptions?.reactionsEnabled !== false;
                      const commentCount = Math.max(
                        item.commentCount,
                        healedCommentCounts[item.id] ?? 0,
                        totalCommentsInTree(commentsByDeetId[item.id]),
                      );
                      const isCommentsOpen = expandedCommentDeetId === item.id;

                      const hubAtt = feedAttachmentsToHubShape(item.attachments);
                      const deetType = resolveDeetType(item.feedKind, hubAtt);
                      const hasRichSection = Boolean(deetType && hubAtt.some((a) => a.type === deetType));
                      const showStructuredRichBody = Boolean(hasRichSection && deetType && deetType !== "poll");
                      const structuredHeadline = deetType
                        ? getStructuredHeadlineForFeed(deetType, hubAtt, item.title)
                        : null;
                      const headline =
                        structuredHeadline ||
                        (item.title?.trim() && !isGenericDeetTitle(item.title) ? item.title.trim() : null);
                      const isPlainFeedPost = deetType === null;
                      const kindMeta = feedKindMeta(item.feedKind);

                      const authorRow = (
                        <div className="flex items-center gap-3 px-4 pt-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (item.authorId) openProfileModal(item.authorId);
                            }}
                            aria-label={`Open ${item.authorName}'s profile`}
                            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40"
                          >
                            <ImageWithFallback
                              src={item.authorAvatar || ""}
                              sources={item.authorAvatar ? [item.authorAvatar] : []}
                              alt=""
                              className="h-full w-full object-cover"
                              fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                              fallback={initials(item.authorName)}
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (item.authorId) openProfileModal(item.authorId);
                                }}
                                className="text-[15px] font-semibold text-[var(--ud-text-primary)] transition hover:underline"
                              >
                                {item.authorName}
                              </button>
                              {item.hubName ? (
                                <span className="text-xs text-[var(--ud-text-muted)]">in {item.hubName}</span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                              <span className="text-xs text-[var(--ud-text-muted)]">{item.timeLabel}</span>
                              <span className="select-none text-xs text-[var(--ud-text-muted)]/70" aria-hidden>
                                ·
                              </span>
                              {deetType ? (
                                <DeetTypeKindChip type={deetType} />
                              ) : (
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                    kindMeta.badgeClass,
                                  )}
                                >
                                  {kindMeta.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <article
                          key={item.id}
                          className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm transition-colors duration-150 hover:border-[var(--ud-border)]"
                        >
                          {item.href ? (
                            <Link href={item.href} className="block">
                              {authorRow}
                            </Link>
                          ) : (
                            authorRow
                          )}

                          {headline ? (
                            <h3 className="px-4 pt-3 text-[15px] font-semibold leading-snug tracking-tight text-[var(--ud-text-primary)]">
                              {headline}
                            </h3>
                          ) : null}

                          {item.body && !hasRichSection ? (
                            isPlainFeedPost ? (
                              <StructuredDescriptionShell type="post" className={headline ? "mt-2" : "mt-3"}>
                                <FeedPostBody
                                  body={item.body}
                                  title={item.title}
                                  dedupeBodyAgainstTitle={false}
                                  className="text-[15px] leading-relaxed text-[var(--ud-text-primary)]"
                                />
                              </StructuredDescriptionShell>
                            ) : (
                              <FeedPostBody
                                body={item.body}
                                title={item.title}
                                dedupeBodyAgainstTitle
                                className={cn(
                                  "px-4 text-[15px] leading-relaxed text-[var(--ud-text-primary)]",
                                  headline ? "pt-2" : "pt-3",
                                )}
                              />
                            )
                          ) : null}

                          {deetType === "poll" ? (
                            <PollContent deetId={item.id} attachments={hubAtt} />
                          ) : deetType ? (
                            <DeetTypeContent
                              type={deetType}
                              attachments={hubAtt}
                              bodyHtml={showStructuredRichBody ? item.body : undefined}
                              deetId={item.id}
                              currentUserId={currentUserId}
                            />
                          ) : null}

                          {(() => {
                            const urls = dashboardDeetGalleryUrls(item);
                            if (!urls.length) return null;
                            return (
                              <FeedMedia
                                imageUrls={urls}
                                alt={item.title}
                                feedKind={dashboardMediaFeedKind(item.feedKind)}
                                sizesVariant={urls.length > 1 ? "mosaic" : "hero"}
                                onOpen={(index) =>
                                  setFeedGallery({
                                    urls,
                                    index,
                                    deetId: item.id,
                                    displayTitle: headline || item.title?.trim() || "Photo",
                                    body: item.body,
                                    hubHref: item.href,
                                  })
                                }
                              />
                            );
                          })()}

                          {/* Engagement — match hub feed card (summary row + action row) */}
                          {(() => {
                            const showEngagementSummary = likeCount > 0 || commentCount > 0;
                            const shareUrl =
                              typeof window !== "undefined"
                                ? item.href
                                  ? `${window.location.origin}${item.href}?focus=${item.id}`
                                  : `${window.location.origin}/dashboard`
                                : "";
                            const flashShareCopied = () => {
                              setCopiedDeetId(item.id);
                              if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
                              copiedTimeoutRef.current = setTimeout(() => setCopiedDeetId(null), 2000);
                            };
                            return (
                              <div className="border-t border-[var(--ud-border-subtle)]">
                                {showEngagementSummary ? (
                                  <ReactionSummary
                                    likeCount={likeCount}
                                    commentCount={commentCount}
                                    isLiked={isLiked}
                                    currentUserId={currentUserId ?? undefined}
                                    onOpenReactionsModal={() => setReactorsDeetId(item.id)}
                                    onToggleComments={() => void handleToggleComments(item.id)}
                                    commentsInteractive={commentsEnabled}
                                  />
                                ) : null}
                                <div
                                  className={cn(
                                    "flex gap-1 px-1 py-1 sm:px-2",
                                    showEngagementSummary && "bg-[var(--ud-bg-subtle)]/30",
                                  )}
                                >
                                  <div className="min-w-0 flex-1 rounded-lg motion-reduce:active:scale-100">
                                    <EmojiReactButton
                                      deetId={item.id}
                                      isLiked={isLiked}
                                      isLiking={isLiking}
                                      onToggleLike={toggleLike}
                                      syncedReaction={myDeetReactions[item.id] ?? null}
                                      interactionsEnabled={reactionsEnabled}
                                      triggerClassName="max-sm:min-h-[44px] rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!commentsEnabled) return;
                                      void handleToggleComments(item.id);
                                    }}
                                    disabled={!commentsEnabled}
                                    title={!commentsEnabled ? "Comments are turned off for this post" : undefined}
                                    aria-expanded={isCommentsOpen}
                                    className={cn(
                                      "flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors motion-reduce:transition-none sm:min-h-0 sm:py-2.5",
                                      isCommentsOpen
                                        ? "font-semibold text-[var(--ud-brand-primary)]"
                                        : "text-[var(--ud-text-muted)]",
                                      commentsEnabled
                                        ? "hover:bg-[var(--ud-bg-subtle)] active:scale-[0.98] motion-reduce:active:scale-100"
                                        : "cursor-not-allowed opacity-50",
                                    )}
                                  >
                                    <MessageSquare className={POST_ICON} />
                                    <span>Comment</span>
                                  </button>
                                  <DeetSharePopover
                                    shareUrl={shareUrl}
                                    title={(item.title ?? "").trim() || "Post"}
                                    deetId={item.id}
                                    onCopySuccess={flashShareCopied}
                                    copied={copiedDeetId === item.id}
                                    triggerClassName="max-sm:min-h-[44px] rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Inline comments — same component and collapse behavior as hub feed */}
                          <CollapsibleEngagementPanel open={isCommentsOpen}>
                            <DeetCommentsSection
                              layout="inline"
                              deetId={item.id}
                              comments={commentsByDeetId[item.id] ?? []}
                              isLoading={commentLoadingDeetIds.has(item.id)}
                              isSubmitting={commentSubmittingDeetId === item.id}
                              error={commentError}
                              currentUserId={currentUserId ?? undefined}
                              onSubmitComment={handleSubmitComment}
                              onEditComment={handleEditComment}
                              onDeleteComment={handleDeleteComment}
                              allowNewComments={commentsEnabled}
                              onOpenViewer={(images, index) => {
                                if (!images.length) return;
                                setFeedGallery({
                                  urls: images,
                                  index,
                                  deetId: item.id,
                                  displayTitle: headline || item.title?.trim() || "Photo",
                                  body: item.body,
                                  hubHref: item.href,
                                });
                              }}
                              userAvatarSrc={currentUserAvatarUrl || undefined}
                              userName={currentUserDisplayName || "You"}
                            />
                          </CollapsibleEngagementPanel>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[var(--ud-bg-subtle)] px-6 py-10 text-center border border-[var(--ud-border-subtle)]">
                    <h3 className={cn("text-xl font-semibold tracking-tight", TEXT_DARK)}>
                      No {selectedFeedFilter === "All" ? "deets" : selectedFeedFilter.toLowerCase()} yet
                    </h3>
                    <p className={cn("mx-auto mt-3 max-w-2xl text-sm leading-6 sm:text-base", TEXT_MUTED)}>
                      No matching activity is available from the hubs in this view yet. As updates are posted across
                      your hubs, they will appear here in one combined feed.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-[var(--ud-bg-card)] px-5 py-4 text-left shadow-sm border border-[var(--ud-border-subtle)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-secondary)]">Current view</p>
                        <p className={cn("mt-2 text-base font-semibold tracking-tight", TEXT_DARK)}>
                          {selectedHubView === "my-hubs" ? "My Hubs" : selectedHubView === "joined" ? "Joined Hubs" : "Requested Hubs"}
                        </p>
                        <p className={cn("mt-1 text-sm", TEXT_MUTED)}>
                          {searchQuery ? `Searching for "${searchQuery}".` : "Search and filter controls are ready here."}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--ud-bg-card)] px-5 py-4 text-left shadow-sm border border-[var(--ud-border-subtle)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-secondary)]">Next step</p>
                        <p className={cn("mt-2 text-base font-semibold tracking-tight", TEXT_DARK)}>
                          {selectedFeedFilter === "All" ? "Browse all activity" : `Filtered by ${selectedFeedFilter}`}
                        </p>
                        <p className={cn("mt-1 text-sm", TEXT_MUTED)}>
                          Switch views or post a new deet from a hub to populate this feed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </main>

      <UdeetsFooter />
      <UdeetsBottomNav activeNav="home" />

      {/* Who reacted popup */}
      {reactorsDeetId && (
        <ReactorsPopup deetId={reactorsDeetId} onClose={() => setReactorsDeetId(null)} />
      )}

      {/* Feed image viewer — same split layout as hub (image + title/body + react / comment / share + comments) */}
      {feedGallery ? (
        <div
          className="fixed inset-0 z-[130] flex min-h-0 min-w-0 flex-col overflow-x-hidden bg-black/90 lg:flex-row"
          role="dialog"
          aria-modal="true"
          aria-label="Post photo viewer"
        >
          <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-4 lg:min-h-0 lg:flex-1 lg:p-6">
            <button
              type="button"
              onClick={() => setFeedGallery(null)}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 lg:right-6 lg:top-6"
              aria-label="Close"
            >
              <X className="h-5 w-5 stroke-[1.8]" />
            </button>

            {feedGallery.urls.length > 1 ? (
              <div className="absolute left-4 top-4 z-20 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white lg:left-6 lg:top-6">
                {feedGallery.index + 1} / {feedGallery.urls.length}
              </div>
            ) : null}

            {feedGallery.urls.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedGallery((g) =>
                      g && g.urls.length > 1
                        ? { ...g, index: (g.index + g.urls.length - 1) % g.urls.length }
                        : g,
                    );
                  }}
                  className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 lg:left-6"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedGallery((g) =>
                      g && g.urls.length > 1 ? { ...g, index: (g.index + 1) % g.urls.length } : g,
                    );
                  }}
                  className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 lg:right-6"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 stroke-[1.8]" />
                </button>
              </>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={feedGallery.urls[feedGallery.index]}
              alt=""
              className="h-auto max-h-[85vh] w-auto max-w-full rounded-2xl object-contain lg:max-h-[85vh] lg:rounded-3xl"
            />
          </div>

          <div
            className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-t-2xl bg-[var(--ud-bg-card)] p-4 lg:h-full lg:min-h-0 lg:w-[360px] lg:max-w-[360px] lg:shrink-0 lg:grow-0 lg:flex-none lg:self-stretch lg:rounded-none lg:border-l lg:border-white/20 lg:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {(() => {
                const fi = viewerFeedItem;
                if (!fi) {
                  return (
                    <>
                      <h3 className="shrink-0 text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">
                        {feedGallery.displayTitle}
                      </h3>
                      {feedGallery.body?.trim() ? (
                        <SafeDeetBody
                          source={feedGallery.body}
                          className="mt-1 shrink-0 text-sm text-[var(--ud-text-secondary)] lg:mt-2"
                        />
                      ) : (
                        <p className="mt-1 shrink-0 text-sm text-[var(--ud-text-secondary)] lg:mt-2">
                          {feedGallery.hubHref ? "From one of your hubs." : "Shared post."}
                        </p>
                      )}
                    </>
                  );
                }
                const hubAtt = feedAttachmentsToHubShape(fi.attachments);
                const deetType = resolveDeetType(fi.feedKind, hubAtt);
                const hasRichSection = Boolean(deetType && hubAtt.some((a) => a.type === deetType));
                const showStructuredRichBody = Boolean(hasRichSection && deetType && deetType !== "poll");
                const structuredHeadline = deetType
                  ? getStructuredHeadlineForFeed(deetType, hubAtt, fi.title)
                  : null;
                const headline =
                  structuredHeadline ||
                  (fi.title?.trim() && !isGenericDeetTitle(fi.title) ? fi.title.trim() : null);
                const isPlainFeedPost = deetType === null;
                const hasTextBlock = Boolean(headline || (fi.body && !hasRichSection) || deetType);
                const typeBlockSpacing = headline || (fi.body && !hasRichSection) ? "mt-3" : "mt-1";

                return (
                  <div
                    className={cn(
                      "min-h-0 max-h-[42vh] shrink-0 overflow-y-auto pr-1 lg:max-h-[min(60vh,520px)] lg:pr-0",
                      hasTextBlock && "min-h-[80px]",
                    )}
                  >
                    {headline ? (
                      <h3 className="text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">{headline}</h3>
                    ) : null}
                    {fi.body && !hasRichSection ? (
                      isPlainFeedPost ? (
                        <StructuredDescriptionShell type="post" className={headline ? "mt-2" : "mt-3"}>
                          <FeedPostBody
                            body={fi.body}
                            title={fi.title}
                            dedupeBodyAgainstTitle={false}
                            className="text-sm leading-relaxed text-[var(--ud-text-secondary)]"
                          />
                        </StructuredDescriptionShell>
                      ) : (
                        <FeedPostBody
                          body={fi.body}
                          title={fi.title}
                          dedupeBodyAgainstTitle
                          className={cn(
                            "text-sm leading-relaxed text-[var(--ud-text-secondary)]",
                            headline ? "mt-2" : "mt-3",
                          )}
                        />
                      )
                    ) : null}
                    {deetType === "poll" ? (
                      <div className={typeBlockSpacing}>
                        <PollContent deetId={fi.id} attachments={hubAtt} />
                      </div>
                    ) : deetType ? (
                      <div className={typeBlockSpacing}>
                        <DeetTypeContent
                          type={deetType}
                          attachments={hubAtt}
                          bodyHtml={showStructuredRichBody ? fi.body : undefined}
                          deetId={fi.id}
                          currentUserId={currentUserId}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--ud-text-muted)] lg:mt-4">
                <button
                  type="button"
                  onClick={() => setReactorsDeetId(feedGallery.deetId)}
                  className="rounded-md py-0.5 text-left text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-text-primary)] motion-reduce:transition-none"
                  aria-label={`${likeCounts[feedGallery.deetId] ?? 0} reactions. Open list.`}
                >
                  <span className="font-semibold tabular-nums text-[var(--ud-text-primary)]">
                    {likeCounts[feedGallery.deetId] ?? 0}
                  </span>
                  <span>
                    {" "}
                    {(likeCounts[feedGallery.deetId] ?? 0) === 1 ? "Reaction" : "Reactions"}
                  </span>
                </button>
              </div>

              <div className="mt-3 flex shrink-0 gap-1 border-t border-[var(--ud-border)] pt-3 sm:gap-2 lg:mt-4 lg:pt-4">
                <div className="min-w-0 flex-1 rounded-lg motion-reduce:active:scale-100">
                  <EmojiReactButton
                    deetId={feedGallery.deetId}
                    isLiked={likedDeets.has(feedGallery.deetId)}
                    isLiking={likingDeets.has(feedGallery.deetId)}
                    onToggleLike={toggleLike}
                    syncedReaction={myDeetReactions[feedGallery.deetId] ?? null}
                    interactionsEnabled={viewerReactionsEnabled}
                    triggerClassName="max-sm:min-h-[44px] w-full rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
                  />
                </div>
                <button
                  type="button"
                  disabled={!viewerCommentsEnabled}
                  title={!viewerCommentsEnabled ? "Comments are turned off for this post" : undefined}
                  aria-expanded={imageViewerComposerFooterVisible}
                  onClick={() => {
                    if (!viewerCommentsEnabled) return;
                    setImageViewerComposerFooterVisible((open) => !open);
                  }}
                  className={cn(
                    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors motion-reduce:transition-none sm:min-h-0 sm:py-2.5 active:scale-[0.98] motion-reduce:active:scale-100",
                    imageViewerComposerFooterVisible
                      ? "font-semibold text-[var(--ud-brand-primary)]"
                      : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]",
                    !viewerCommentsEnabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <MessageSquare className={POST_ICON} />
                  <span>Comment</span>
                </button>
                <DeetSharePopover
                  shareUrl={
                    typeof window !== "undefined"
                      ? feedGallery.hubHref
                        ? `${window.location.origin}${feedGallery.hubHref}?focus=${feedGallery.deetId}`
                        : `${window.location.origin}/dashboard`
                      : ""
                  }
                  title={feedGallery.displayTitle}
                  deetId={feedGallery.deetId}
                  onCopySuccess={flashViewerShareCopied}
                  copied={viewerShareCopied}
                  triggerClassName="max-sm:min-h-[44px] rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
                />
              </div>

              <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                <div className="flex shrink-0 items-baseline justify-between gap-2 px-0.5">
                  <p className="font-medium text-[var(--ud-text-secondary)]">Comments</p>
                  <span className="text-xs tabular-nums text-[var(--ud-text-muted)]">
                    {(() => {
                      const loaded = commentsByDeetId[feedGallery.deetId];
                      const fromDeet = myDeetsItems.find((i) => i.id === feedGallery.deetId)?.commentCount ?? 0;
                      const healed = healedCommentCounts[feedGallery.deetId] ?? 0;
                      const n = Math.max(fromDeet, healed, totalCommentsInTree(loaded));
                      return (
                        <>
                          {n} {n === 1 ? "Comment" : "Comments"}
                        </>
                      );
                    })()}
                  </span>
                </div>
                <DeetCommentsSection
                  key={feedGallery.deetId}
                  layout="embedded"
                  deetId={feedGallery.deetId}
                  comments={commentsByDeetId[feedGallery.deetId] ?? []}
                  isLoading={commentLoadingDeetIds.has(feedGallery.deetId)}
                  isSubmitting={commentSubmittingDeetId === feedGallery.deetId}
                  error={commentError}
                  currentUserId={currentUserId ?? undefined}
                  onSubmitComment={handleSubmitComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  showComposerFooter={imageViewerComposerFooterVisible}
                  onRequestComposerFooter={() => setImageViewerComposerFooterVisible(true)}
                  onDismissComposerFooter={() => setImageViewerComposerFooterVisible(false)}
                  autoFocusComposer={imageViewerComposerFooterVisible}
                  allowNewComments={viewerCommentsEnabled}
                  onOpenViewer={(images, index) => {
                    setFeedGallery((g) =>
                      g
                        ? {
                            ...g,
                            urls: images.length ? images : g.urls,
                            index,
                          }
                        : g,
                    );
                  }}
                  userAvatarSrc={currentUserAvatarUrl || undefined}
                  userName={currentUserDisplayName || "You"}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Celebration modal — shown when a join request is accepted */}
      {showCelebration && newlyAcceptedHub ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm animate-[scaleIn_300ms_ease-out] rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F1EF]">
              <CheckCircle className="h-8 w-8 text-[#0C5C57]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Congratulations!</h2>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-[#0C5C57]">{newlyAcceptedHub.name}</span> accepted your join request
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={newlyAcceptedHub.href}
                onClick={() => {
                  // Remove from accepted set so it moves to joined
                  setAcceptedHubIds((prev) => { const next = new Set(prev); next.delete(newlyAcceptedHub.id); return next; });
                  setShowCelebration(false);
                  setNewlyAcceptedHub(null);
                }}
                className="rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a4e4a]"
              >
                View Hub
              </Link>
              <button
                type="button"
                onClick={() => {
                  // Remove from accepted set so it moves to joined
                  setAcceptedHubIds((prev) => { const next = new Set(prev); next.delete(newlyAcceptedHub.id); return next; });
                  setShowCelebration(false);
                  setNewlyAcceptedHub(null);
                  setSelectedHubView("joined");
                }}
                className="text-sm font-medium text-gray-500 transition hover:text-gray-700"
              >
                Stay on Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
