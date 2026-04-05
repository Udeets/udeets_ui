"use client";

export const dynamic = "force-dynamic";

import { Calendar, Heart, Loader2, MessageCircle, Send, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import { mapDeetToDashboardCard } from "@/lib/mappers/deets/map-deet-to-dashboard-card";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import {
  toggleDeetLike,
  getDeetLikeStatus,
  addDeetComment,
  listDeetComments,
  type DeetComment,
} from "@/lib/services/deets/deet-interactions";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import { listMyMemberships, type MyMembership } from "@/lib/services/members/list-my-memberships";
import { listHubEvents } from "@/lib/services/events/list-events";
import type { HubEvent } from "@/lib/services/events/event-types";
import type { Hub as SupabaseHub } from "@/types/hub";
import { DashboardHubCard, type DashboardHubCardData } from "./components/DashboardHubCard";

type DashboardHub = DashboardHubCardData & { createdBy: string };

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
type HubView = "my-hubs" | "joined" | "requested";
type FeedFilter = "All" | "Posts" | "Notices" | "Deals" | "Announcements" | "Polls" | "Photos" | "Videos" | "News" | "Hazards" | "Alerts";
type FeedItem = {
  id: string;
  title: string;
  body: string;
  type: FeedFilter;
  hubName: string;
  hubId: string;
  timeLabel: string;
  previewImage?: string;
  previewImages: string[];
  href?: string;
};

const PAGE_BG = "bg-[var(--ud-bg-page)]";
const CARD = "rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm";
const TEXT_DARK = "text-[var(--ud-text-primary)]";
const TEXT_MUTED = "text-[var(--ud-text-secondary)]";
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:opacity-90";
const FEED_FILTERS: FeedFilter[] = ["All", "Posts", "Notices", "Deals", "Announcements", "Polls", "Photos", "Videos"];

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

/** Type-only labels that shouldn't be shown as prominent titles */
const GENERIC_TITLE_LABELS = new Set(["Deet", "Notice", "Photo", "Event", "File", "News", "Deal", "Hazard", "Alert"]);

function isGenericTitle(title: string | null | undefined): boolean {
  if (!title) return true;
  return GENERIC_TITLE_LABELS.has(title.trim());
}

function sanitizeHtmlContent(html: string): string {
  if (typeof document === "undefined") return html;
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

function deetRecordToDashboardItem(item: DeetRecord): FeedItem {
  const card = mapDeetToDashboardCard(item);

  return {
    id: card.id,
    title: card.title ?? "",
    body: card.body ?? "",
    type: card.type,
    hubName: "",
    hubId: card.hubId,
    timeLabel: formatDeetTime(card.createdAt ?? item.created_at),
    previewImage: card.previewImageUrl || undefined,
    previewImages: card.previewImageUrls,
    href: undefined,
  };
}

function DashboardDeetImage({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) return null;

  return (
    <div className="mt-3 aspect-video max-h-[280px] overflow-hidden rounded-2xl border border-[var(--ud-border-subtle)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
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
    <Link
      href="/create-hub"
      className={cn(
        "block h-full w-full overflow-hidden rounded-[24px] bg-[var(--ud-brand-light)] shadow-[0_10px_26px_rgba(12,92,87,0.06)] transition-transform duration-200 hover:-translate-y-0.5",
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-t-[24px] bg-[var(--ud-brand-light)]">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-[var(--ud-brand-primary)]" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <h3 className={cn("text-[15px] font-semibold tracking-tight leading-5", TEXT_DARK)}>Create Hub</h3>
        </div>
      </div>

      <div className="bg-[var(--ud-brand-light)] px-3.5 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[15px] leading-5 opacity-0">Create Hub</span>
          <span className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        </div>
        <div className={cn("mt-1.5 flex items-center justify-between gap-3 text-xs", TEXT_MUTED)}>
          <span>&nbsp;</span>
          <span>&nbsp;</span>
        </div>
      </div>
    </Link>
  );
}

function HubLauncher({
  selectedView,
  onSelectView,
  hubs,
  requestedCount,
}: {
  selectedView: HubView;
  onSelectView: (view: HubView) => void;
  hubs: DashboardHub[];
  requestedCount: number;
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
            </button>
          ))}
        </div>
      </div>

      {hubs.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {selectedView === "my-hubs" ? <CreateHubTile /> : null}
          {hubs.map((hub) => (
            <DashboardHubCard
              key={hub.id}
              hub={hub}
              hasUnread={false}
              isPending={selectedView === "requested"}
            />
          ))}
        </div>
      ) : (
        <>
          {selectedView === "my-hubs" ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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

function formatCommentTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function DashboardCommentSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  onSubmitComment,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmitComment: (deetId: string, body: string) => void;
}) {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = () => {
    if (commentText.trim() && !isSubmitting) {
      onSubmitComment(deetId, commentText);
      setCommentText("");
    }
  };

  return (
    <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-4 py-3">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-text-muted)]" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mb-3 text-xs italic text-[var(--ud-text-muted)]">No comments yet. Be the first!</p>
      ) : (
        <div className="mb-3 max-h-[240px] space-y-2.5 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--ud-text-primary)]">{comment.authorName || "User"}</span>
                <span className="text-xs text-[var(--ud-text-muted)]">{formatCommentTime(comment.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-[var(--ud-text-secondary)]">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isSubmitting}
          className="min-w-0 flex-1 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-2 text-sm text-[var(--ud-text-secondary)] outline-none placeholder:text-[var(--ud-text-muted)] focus:border-[var(--ud-brand-primary)] focus:ring-2 focus:ring-[var(--ud-brand-light)] disabled:opacity-75"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!commentText.trim() || isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--ud-brand-primary)] to-[#1a8a82] px-3 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
          aria-label="Send comment"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedHubView, setSelectedHubView] = useState<HubView>("my-hubs");
  const [selectedFeedFilter, setSelectedFeedFilter] = useState<FeedFilter>("All");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false);

  const [hubs, setHubs] = useState<DashboardHub[]>([]);
  const [memberships, setMemberships] = useState<MyMembership[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [hubsLoadError, setHubsLoadError] = useState<string | null>(null);
  const [myDeetsItems, setMyDeetsItems] = useState<FeedItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{ id: string; title: string; eventDate: string; hubId: string; hubName: string; href: string }>>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const eventsButtonRef = useRef<HTMLButtonElement | null>(null);

  // ── Interaction state (likes, comments, share) ──
  const [likedDeets, setLikedDeets] = useState<Set<string>>(new Set());
  const [likingDeets, setLikingDeets] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [expandedCommentDeetId, setExpandedCommentDeetId] = useState<string | null>(null);
  const [commentsByDeetId, setCommentsByDeetId] = useState<Record<string, DeetComment[]>>({});
  const [commentLoadingDeetIds, setCommentLoadingDeetIds] = useState<Set<string>>(new Set());
  const [commentSubmittingDeetId, setCommentSubmittingDeetId] = useState<string | null>(null);
  const [copiedDeetId, setCopiedDeetId] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleLike = useCallback(async (deetId: string) => {
    if (likingDeets.has(deetId)) return;
    setLikingDeets((prev) => new Set(prev).add(deetId));
    try {
      const result = await toggleDeetLike(deetId);
      setLikedDeets((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(deetId);
        else next.delete(deetId);
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

  const handleSubmitComment = useCallback(async (deetId: string, body: string) => {
    if (commentSubmittingDeetId) return;
    setCommentSubmittingDeetId(deetId);
    try {
      const newComment = await addDeetComment(deetId, body);
      setCommentsByDeetId((prev) => ({
        ...prev,
        [deetId]: [...(prev[deetId] ?? []), newComment],
      }));
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setCommentSubmittingDeetId(null);
    }
  }, [commentSubmittingDeetId]);

  const handleShareDeet = useCallback(async (deetId: string, hubHref?: string) => {
    const shareUrl = hubHref
      ? `${window.location.origin}${hubHref}?focus=${deetId}`
      : `${window.location.origin}/dashboard`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedDeetId(deetId);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopiedDeetId(null), 2000);
    } catch {
      // Silently fail
    }
  }, []);

  // Cleanup copied timeout
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
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
          setHubs(dbHubs.map(toDashboardHub));
          setMemberships(myMemberships);
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
      return m?.status === "pending";
    }),
    [hubs, membershipByHubId],
  );

  const visibleHubs = selectedHubView === "my-hubs"
    ? myHubs
    : selectedHubView === "joined"
      ? joinedHubs
      : requestedHubs;
  const relevantHubIds = useMemo(() => new Set(visibleHubs.map((hub) => hub.id)), [visibleHubs]);

  // Load upcoming events for all user's hubs
  useEffect(() => {
    if (authStatus !== "authenticated" || hubs.length === 0) {
      setUpcomingEvents([]);
      return;
    }

    let cancelled = false;

    const loadUpcomingEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const allEvents: Array<{ id: string; title: string; eventDate: string; hubId: string; hubName: string; href: string }> = [];

        // Fetch events for each hub
        const hubById = new Map(hubs.map((h) => [h.id, h]));

        for (const hub of hubs) {
          try {
            const hubEvents = await listHubEvents(hub.id);
            // Filter for future events only
            const futureEvents = hubEvents.filter((event) => event.eventDate >= today);
            allEvents.push(
              ...futureEvents.map((evt) => ({
                id: evt.id,
                title: evt.title,
                eventDate: evt.eventDate,
                hubId: hub.id,
                hubName: hub.name,
                href: `${hub.href}/events`,
              }))
            );
          } catch {
            // Silently skip hub if event fetch fails
          }
        }

        // Sort by event date and limit to 5
        const sorted = allEvents.sort((a, b) => a.eventDate.localeCompare(b.eventDate)).slice(0, 5);

        if (!cancelled) {
          setUpcomingEvents(sorted);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEvents(false);
        }
      }
    };

    void loadUpcomingEvents();

    return () => {
      cancelled = true;
    };
  }, [authStatus, hubs]);
  useEffect(() => {
    if (authStatus !== "authenticated") {
      setMyDeetsItems([]);
      return;
    }

    let cancelled = false;
    const visibleHubIds = visibleHubs.map((hub) => hub.id);
    const hubById = new Map(visibleHubs.map((hub) => [hub.id, hub]));

    const syncDeets = async () => {
      if (!visibleHubIds.length) {
        if (!cancelled) {
          setMyDeetsItems([]);
        }
        return;
      }

      try {
        const items = await listDeets({ hubIds: visibleHubIds });
        if (!cancelled) {
          setMyDeetsItems(
            items
              .map(deetRecordToDashboardItem)
              .map((item) => {
                const hub = hubById.get(item.hubId);
                return {
                  ...item,
                  hubName: hub?.name || "Hub",
                  href: hub?.href,
                };
              }),
          );
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
    }, { hubIds: visibleHubIds });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authStatus, visibleHubs]);

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
          for (const [id, status] of statusMap) {
            if (status.liked) liked.add(id);
            counts[id] = status.count;
          }
          setLikedDeets(liked);
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
    const scopedItems =
      relevantHubIds.size > 0 ? dedupedItems.filter((item) => relevantHubIds.has(item.hubId)) : dedupedItems;

    return scopedItems.filter((item) => {
      const matchesFilter = selectedFeedFilter === "All" || item.type === selectedFeedFilter;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.body, item.hubName].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [myDeetsItems, relevantHubIds, searchQuery, selectedFeedFilter]);


  if (authStatus === "checking" && searchParams.get("demo_preview") !== "1") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        <UdeetsHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
          <section className={cn(CARD, "p-6 text-center")}>
            <h1 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>Loading dashboard…</h1>
            <p className={cn("mt-3 text-sm leading-relaxed", TEXT_MUTED)}>
              We're checking your session and loading your hubs.
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
              Your session could not be found, so we're sending you to the auth page.
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
              We're organizing your dashboard now.
            </p>
          </section>
        ) : null}

        {hubsLoadError ? (
          <section className={cn(CARD, "mt-6 p-6 text-center sm:p-8")}>
            <h2 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>
              We couldn't load your dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-red-600 sm:text-base">{hubsLoadError}</p>
          </section>
        ) : null}

        {!isLoadingHubs && !hubsLoadError ? (
          <div className="mt-6 space-y-6">
            <HubLauncher
              selectedView={selectedHubView}
              onSelectView={setSelectedHubView}
              hubs={visibleHubs}
              requestedCount={requestedHubs.length}
            />

            <section className={cn(CARD, "p-4 sm:p-5")}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className={cn("text-2xl font-semibold tracking-tight", TEXT_DARK)}>My Deets</h2>
                </div>

                <div className="relative flex items-center gap-2">
                  <div
                    className={cn(
                      "overflow-hidden rounded-full bg-[var(--ud-bg-subtle)] transition-all duration-300",
                      isSearchOpen ? "w-56 px-3 py-2 opacity-100 sm:w-72" : "w-0 px-0 py-0 opacity-0",
                    )}
                  >
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search posts"
                      className="w-full bg-transparent text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)]"
                      aria-label="Search posts"
                    />
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ud-bg-subtle)] text-[var(--ud-text-primary)] transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)]",
                      isSearchOpen && "bg-[var(--ud-bg-subtle)]",
                    )}
                    onClick={() => setIsSearchOpen((current) => !current)}
                    aria-label="Toggle search"
                  >
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="6" />
                      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ud-bg-subtle)] text-[var(--ud-text-primary)] transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)]",
                      isFilterMenuOpen && "bg-[var(--ud-bg-subtle)]",
                    )}
                    onClick={() => setIsFilterMenuOpen((current) => !current)}
                    aria-label="Open filters"
                  >
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16" strokeLinecap="round" />
                      <path d="M7 12h10" strokeLinecap="round" />
                      <path d="M10 18h4" strokeLinecap="round" />
                    </svg>
                  </button>

                  <div className="relative">
                    <button
                      ref={eventsButtonRef}
                      type="button"
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ud-bg-subtle)] text-[var(--ud-text-primary)] transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)]",
                        isEventsDropdownOpen && "bg-[var(--ud-bg-subtle)]",
                      )}
                      onClick={() => setIsEventsDropdownOpen((current) => !current)}
                      aria-label="Show upcoming events"
                    >
                      <Calendar className="h-4.5 w-4.5" />
                    </button>

                    {isEventsDropdownOpen ? (
                      <div className="absolute right-0 top-12 z-10 w-64 rounded-xl bg-[var(--ud-bg-card)] shadow-lg border border-[var(--ud-border-subtle)]">
                        <div className="p-3">
                          {isLoadingEvents ? (
                            <p className="text-center text-sm text-slate-500 py-4">Loading events…</p>
                          ) : upcomingEvents.length > 0 ? (
                            <div className="space-y-2">
                              {upcomingEvents.map((event) => (
                                <Link
                                  key={event.id}
                                  href={event.href}
                                  className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-slate-50"
                                  onClick={() => setIsEventsDropdownOpen(false)}
                                >
                                  <p className="font-semibold text-[var(--ud-text-primary)] truncate">{event.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{event.hubName}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: event.eventDate.startsWith(new Date().getFullYear().toString()) ? undefined : "numeric" })}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-slate-500 py-4">No upcoming events</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {isFilterMenuOpen ? (
                    <div className="absolute right-0 top-12 z-10 w-48 rounded-xl bg-[var(--ud-bg-card)] p-2 shadow-sm border border-[var(--ud-border-subtle)]">
                      {FEED_FILTERS.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            setSelectedFeedFilter(filter);
                            setIsFilterMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150",
                            selectedFeedFilter === filter
                              ? "bg-[var(--ud-brand-light)] font-semibold text-[var(--ud-text-primary)]"
                              : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]",
                          )}
                        >
                          <span>{filter}</span>
                          {selectedFeedFilter === filter ? <span className="h-2 w-2 rounded-full bg-[var(--ud-brand-primary)]" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5">
                {filteredDeetsItems.length ? (
                  <div className="space-y-3">
                    {filteredDeetsItems.map((item) => {
                      const isLiked = likedDeets.has(item.id);
                      const isLiking = likingDeets.has(item.id);
                      const likeCount = likeCounts[item.id] ?? 0;
                      const commentCount = (commentsByDeetId[item.id] ?? []).length;
                      const isCommentsOpen = expandedCommentDeetId === item.id;

                      return (
                        <article key={item.id} className="overflow-hidden rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] transition-colors duration-150 hover:border-[var(--ud-border)]">
                          {/* Card body — clickable to navigate to hub */}
                          {item.href ? (
                            <Link href={item.href} className="block p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ud-brand-light)]">
                                  <span className="text-xs font-semibold text-[var(--ud-brand-primary)]">{item.hubName?.charAt(0)?.toUpperCase() ?? "H"}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{item.hubName || "Hub"}</p>
                                    <span className="shrink-0 text-xs text-[var(--ud-text-muted)]">{item.timeLabel}</span>
                                  </div>
                                  <p className="text-xs text-[var(--ud-text-muted)]">Posted by: Hub Member</p>
                                </div>
                              </div>
                              {item.title && !isGenericTitle(item.title) ? <h3 className={cn("mt-3 text-base font-semibold tracking-tight", TEXT_DARK)}>{item.title}</h3> : null}
                              {item.body ? <div className={cn("mt-1 text-sm leading-6", TEXT_MUTED)} dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.body) }} /> : null}
                              <DashboardDeetImage src={item.previewImage || item.previewImages[0]} alt={item.title} />
                            </Link>
                          ) : (
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ud-brand-light)]">
                                  <span className="text-xs font-semibold text-[var(--ud-brand-primary)]">{item.hubName?.charAt(0)?.toUpperCase() ?? "H"}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{item.hubName || "Hub"}</p>
                                    <span className="shrink-0 text-xs text-[var(--ud-text-muted)]">{item.timeLabel}</span>
                                  </div>
                                  <p className="text-xs text-[var(--ud-text-muted)]">Posted by: Hub Member</p>
                                </div>
                              </div>
                              {item.title && !isGenericTitle(item.title) ? <h3 className={cn("mt-3 text-base font-semibold tracking-tight", TEXT_DARK)}>{item.title}</h3> : null}
                              {item.body ? <div className={cn("mt-1 text-sm leading-6", TEXT_MUTED)} dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.body) }} /> : null}
                              <DashboardDeetImage src={item.previewImage || item.previewImages[0]} alt={item.title} />
                            </div>
                          )}

                          {/* Action bar — always outside the link */}
                          <div className="flex items-center gap-6 border-t border-[var(--ud-border-subtle)] px-4 py-3">
                            <button
                              type="button"
                              disabled={isLiking}
                              onClick={() => toggleLike(item.id)}
                              className={cn(
                                "flex items-center gap-1.5 text-sm transition-colors duration-150 hover:text-[var(--ud-brand-primary)]",
                                isLiked ? "text-[var(--ud-brand-primary)] font-medium" : "text-[var(--ud-text-muted)]"
                              )}
                            >
                              {isLiking ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Heart
                                  className="h-4 w-4 stroke-2"
                                  fill={isLiked ? "currentColor" : "none"}
                                />
                              )}
                              <span>{likeCount}</span>
                              <span>Like</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleComments(item.id)}
                              className={cn(
                                "flex items-center gap-1.5 text-sm transition-colors duration-150 hover:text-[var(--ud-brand-primary)]",
                                isCommentsOpen ? "text-[var(--ud-brand-primary)] font-medium" : "text-[var(--ud-text-muted)]"
                              )}
                            >
                              <MessageCircle className="h-4 w-4 stroke-2" />
                              <span>{commentCount}</span>
                              <span>Comment</span>
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => handleShareDeet(item.id, item.href)}
                                className="flex items-center gap-1.5 text-sm text-[var(--ud-text-muted)] transition-colors duration-150 hover:text-[var(--ud-brand-primary)]"
                              >
                                <Share2 className="h-4 w-4 stroke-2" />
                                <span>{copiedDeetId === item.id ? "Copied!" : "Share"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Inline comments section */}
                          {isCommentsOpen ? (
                            <DashboardCommentSection
                              deetId={item.id}
                              comments={commentsByDeetId[item.id] ?? []}
                              isLoading={commentLoadingDeetIds.has(item.id)}
                              isSubmitting={commentSubmittingDeetId === item.id}
                              onSubmitComment={handleSubmitComment}
                            />
                          ) : null}
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
