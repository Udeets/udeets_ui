"use client";

export const dynamic = "force-dynamic";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import { mapDeetToDashboardCard } from "@/lib/mappers/deets/map-deet-to-dashboard-card";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import { listMyMemberships, type MyMembership } from "@/lib/services/members/list-my-memberships";
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

const PAGE_BG = "bg-white";
const CARD = "rounded-[28px] border border-[#D6E8E4] bg-white shadow-[0_14px_34px_rgba(12,92,87,0.08)]";
const TEXT_DARK = "text-[#12312D]";
const TEXT_MUTED = "text-[#58706B]";
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center rounded-full bg-[#0C5C57] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#094944]";
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
    <div className="mt-3 aspect-video max-h-[280px] overflow-hidden rounded-2xl border border-slate-100">
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
        "block h-full w-full overflow-hidden rounded-[24px] bg-[#DCEDEA] shadow-[0_10px_26px_rgba(12,92,87,0.06)] transition-transform duration-200 hover:-translate-y-0.5",
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-t-[24px] bg-[#DCEDEA]">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-[#0C5C57]" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <h3 className={cn("text-[15px] font-medium leading-5", TEXT_DARK)}>Create Hub</h3>
        </div>
      </div>

      <div className="bg-[#DCEDEA] px-3.5 pb-3 pt-5">
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
        <div className="inline-flex rounded-full bg-[#ECF6F3] p-1.5 shadow-[inset_0_1px_2px_rgba(12,92,87,0.08)]">
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
                "relative rounded-full px-4 py-2 text-sm font-semibold transition",
                selectedView === tab.key
                  ? "bg-white text-[#12312D] shadow-sm"
                  : "text-[#58706B] hover:text-[#12312D]",
              )}
            >
              {tab.label}
              {tab.key === "requested" && requestedCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0C5C57] px-1 text-[10px] font-bold text-white">
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
          <div className="mt-5 rounded-[24px] bg-[#F6FBFA] px-6 py-10 text-center">
            <h3 className={cn("text-xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
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

  const [hubs, setHubs] = useState<DashboardHub[]>([]);
  const [memberships, setMemberships] = useState<MyMembership[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [hubsLoadError, setHubsLoadError] = useState<string | null>(null);
  const [myDeetsItems, setMyDeetsItems] = useState<FeedItem[]>([]);
  const [likedDeets, setLikedDeets] = useState<Set<string>>(new Set());
  const toggleLike = (deetId: string) => {
    setLikedDeets(prev => {
      const next = new Set(prev);
      if (next.has(deetId)) next.delete(deetId);
      else next.add(deetId);
      return next;
    });
  };

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
            <h1 className={cn("text-2xl font-serif font-semibold tracking-tight", TEXT_DARK)}>Loading dashboard...</h1>
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
            <h1 className={cn("text-2xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
              Redirecting to sign in...
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
            <h2 className={cn("text-2xl font-serif font-semibold tracking-tight", TEXT_DARK)}>Loading your hubs...</h2>
            <p className={cn("mt-3 text-sm leading-6 sm:text-base", TEXT_MUTED)}>
              We&apos;re organizing your dashboard now.
            </p>
          </section>
        ) : null}

        {hubsLoadError ? (
          <section className={cn(CARD, "mt-6 p-6 text-center sm:p-8")}>
            <h2 className={cn("text-2xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
              We couldn&apos;t load your dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-rose-700 sm:text-base">{hubsLoadError}</p>
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
                  <h2 className={cn("text-2xl font-serif font-semibold tracking-tight", TEXT_DARK)}>My Deets</h2>
                </div>

                <div className="relative flex items-center gap-2">
                  <div
                    className={cn(
                      "overflow-hidden rounded-full bg-[#F3FAF8] transition-all duration-300",
                      isSearchOpen ? "w-56 px-3 py-2 opacity-100 sm:w-72" : "w-0 px-0 py-0 opacity-0",
                    )}
                  >
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search posts"
                      className="w-full bg-transparent text-sm text-[#12312D] outline-none placeholder:text-[#78908B]"
                      aria-label="Search posts"
                    />
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-[#F3FAF8] text-[#12312D] transition hover:bg-[#E8F4F1]",
                      isSearchOpen && "bg-[#E8F4F1]",
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
                      "flex h-10 w-10 items-center justify-center rounded-full bg-[#F3FAF8] text-[#12312D] transition hover:bg-[#E8F4F1]",
                      isFilterMenuOpen && "bg-[#E8F4F1]",
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

                  {isFilterMenuOpen ? (
                    <div className="absolute right-0 top-12 z-10 w-48 rounded-[22px] bg-white p-2 shadow-[0_14px_34px_rgba(12,92,87,0.12)]">
                      {FEED_FILTERS.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            setSelectedFeedFilter(filter);
                            setIsFilterMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition",
                            selectedFeedFilter === filter
                              ? "bg-[#EFF7F5] font-semibold text-[#12312D]"
                              : "text-[#58706B] hover:bg-[#F6FBFA] hover:text-[#12312D]",
                          )}
                        >
                          <span>{filter}</span>
                          {selectedFeedFilter === filter ? <span className="h-2 w-2 rounded-full bg-[#0C5C57]" /> : null}
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
                      const cardContent = (
                        <>
                          <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
                              <span className="text-xs font-semibold text-white/80">{item.hubName?.charAt(0)?.toUpperCase() ?? "H"}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[#12312D]">{item.hubName || "Hub"}</p>
                                <span className="shrink-0 text-xs text-gray-400">{item.timeLabel}</span>
                              </div>
                              <p className="text-xs text-gray-400">Posted by: Hub Member</p>
                            </div>
                          </div>
                          {item.title ? <h3 className={cn("mt-3 text-base font-semibold", TEXT_DARK)}>{item.title}</h3> : null}
                          {item.body ? <p className={cn("mt-1 text-sm leading-6", TEXT_MUTED)}>{item.body}</p> : null}
                          <DashboardDeetImage src={item.previewImage || item.previewImages[0]} alt={item.title} />
                          <div className="mt-3 flex items-center gap-6 border-t border-gray-100 pt-3">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(item.id); }}
                              className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#0C5C57]"
                            >
                              <Heart
                                className="h-4 w-4"
                                fill={likedDeets.has(item.id) ? "#0C5C57" : "none"}
                                stroke={likedDeets.has(item.id) ? "#0C5C57" : "currentColor"}
                              />
                              <span>{likedDeets.has(item.id) ? 1 : 0}</span>
                              <span>Like</span>
                            </button>
                            <button type="button" className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#0C5C57]">
                              <MessageCircle className="h-4 w-4" />
                              <span>0</span>
                              <span>Comment</span>
                            </button>
                            <button type="button" className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#0C5C57]">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </>
                      );

                      return item.href ? (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200"
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                          {cardContent}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[24px] bg-[#F6FBFA] px-6 py-10 text-center">
                    <h3 className={cn("text-xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
                      No {selectedFeedFilter === "All" ? "deets" : selectedFeedFilter.toLowerCase()} yet
                    </h3>
                    <p className={cn("mx-auto mt-3 max-w-2xl text-sm leading-6 sm:text-base", TEXT_MUTED)}>
                      No matching activity is available from the hubs in this view yet. As updates are posted across
                      your hubs, they will appear here in one combined feed.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] bg-white px-5 py-4 text-left shadow-[0_8px_20px_rgba(12,92,87,0.05)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F807A]">Current view</p>
                        <p className={cn("mt-2 text-base font-semibold", TEXT_DARK)}>
                          {selectedHubView === "my-hubs" ? "My Hubs" : selectedHubView === "joined" ? "Joined Hubs" : "Requested Hubs"}
                        </p>
                        <p className={cn("mt-1 text-sm", TEXT_MUTED)}>
                          {searchQuery ? `Searching for "${searchQuery}".` : "Search and filter controls are ready here."}
                        </p>
                      </div>
                      <div className="rounded-[22px] bg-white px-5 py-4 text-left shadow-[0_8px_20px_rgba(12,92,87,0.05)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F807A]">Next step</p>
                        <p className={cn("mt-2 text-base font-semibold", TEXT_DARK)}>
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
