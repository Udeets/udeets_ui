"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import { UDEETS_LOGO_SRC } from "@/lib/branding";
import { formatDeetTime, getAllStoredDeets, subscribeToStoredDeets, type StoredDeet } from "@/lib/deets-store";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { listHubs } from "@/services/hubs/listHubs";
import type { Hub as SupabaseHub } from "@/types/hub";
import { DashboardHubCard, type DashboardHubCardData } from "./components/DashboardHubCard";

type DashboardHub = DashboardHubCardData & { createdBy: string };

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
type HubView = "my-hubs" | "following";
type FeedFilter = "All" | "Posts" | "Notices" | "Deals" | "Announcements" | "Polls" | "Photos" | "Videos";
type FeedItem = {
  id: string;
  title: string;
  body: string;
  type: FeedFilter;
  hubName: string;
  timeLabel: string;
  previewImage?: string;
  href?: string;
};

const PAGE_BG = "bg-[#E3F1EF]";
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
  if (!src) return UDEETS_LOGO_SRC;
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

function storedDeetToDashboardItem(item: StoredDeet): FeedItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    type: item.kind === "Notices" ? "Notices" : item.kind === "Photos" ? "Photos" : "Posts",
    hubName: item.hubName,
    timeLabel: formatDeetTime(item.createdAt),
    previewImage: item.previewImage || undefined,
    href: item.hubHref,
  };
}

function DashboardDeetImage({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-[20px] bg-[#E3F1EF]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-56 w-full object-cover"
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
  onInvite,
  copiedInviteHubId,
}: {
  selectedView: HubView;
  onSelectView: (view: HubView) => void;
  hubs: DashboardHub[];
  onInvite: (hub: DashboardHubCardData) => void;
  copiedInviteHubId: string | null;
}) {
  return (
    <section className={cn(CARD, "p-4 sm:p-5")}>
      <div className="flex justify-start">
        <div className="inline-flex rounded-full bg-[#ECF6F3] p-1.5 shadow-[inset_0_1px_2px_rgba(12,92,87,0.08)]">
          <button
            type="button"
            onClick={() => onSelectView("my-hubs")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedView === "my-hubs" ? "bg-white text-[#12312D] shadow-sm" : "text-[#58706B] hover:text-[#12312D]",
            )}
          >
            My Hubs
          </button>
          <button
            type="button"
            onClick={() => onSelectView("following")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedView === "following" ? "bg-white text-[#12312D] shadow-sm" : "text-[#58706B] hover:text-[#12312D]",
            )}
          >
            Following
          </button>
        </div>
      </div>

      {hubs.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          <CreateHubTile />
          {hubs.map((hub) => (
            <DashboardHubCard key={hub.id} hub={hub} onInvite={onInvite} copiedInviteHubId={copiedInviteHubId} />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          <CreateHubTile />
        </div>
      )}

      {!hubs.length ? (
        <div className="mt-5 rounded-[24px] bg-[#F6FBFA] px-6 py-10 text-center">
          <h3 className={cn("text-xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
            {selectedView === "my-hubs" ? "No hubs to manage yet" : "No followed hubs yet"}
          </h3>
          <p className={cn("mx-auto mt-3 max-w-xl text-sm leading-6 sm:text-base", TEXT_MUTED)}>
            {selectedView === "my-hubs"
              ? "Create your first hub to make this launcher feel like home."
              : "Discover hubs to follow and they will appear here for quick switching."}
          </p>
          <div className="mt-6">
            <Link href={selectedView === "my-hubs" ? "/create-hub" : "/discover"} className={PRIMARY_BUTTON}>
              {selectedView === "my-hubs" ? "Create Hub" : "Discover Hubs"}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedHubView, setSelectedHubView] = useState<HubView>("my-hubs");
  const [selectedFeedFilter, setSelectedFeedFilter] = useState<FeedFilter>("All");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [copiedInviteHubId, setCopiedInviteHubId] = useState<string | null>(null);
  const [hubs, setHubs] = useState<DashboardHub[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [hubsLoadError, setHubsLoadError] = useState<string | null>(null);
  const [myDeetsItems, setMyDeetsItems] = useState<FeedItem[]>([]);

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
    const syncDeets = () => {
      setMyDeetsItems(getAllStoredDeets().map(storedDeetToDashboardItem));
    };

    syncDeets();
    return subscribeToStoredDeets(() => syncDeets());
  }, []);

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
        const dbHubs = await listHubs();
        if (!cancelled) {
          setHubs(dbHubs.map(toDashboardHub));
        }
      } catch (error) {
        if (!cancelled) {
          setHubs([]);
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

  const myHubs = useMemo(
    () => hubs.filter((hub) => Boolean(currentUserId && hub.createdBy === currentUserId)),
    [currentUserId, hubs],
  );
  const followingHubs = useMemo(
    () => hubs.filter((hub) => !currentUserId || hub.createdBy !== currentUserId),
    [currentUserId, hubs],
  );
  const visibleHubs = selectedHubView === "my-hubs" ? myHubs : followingHubs;
  const filteredDeetsItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return myDeetsItems.filter((item) => {
      const matchesFilter = selectedFeedFilter === "All" || item.type === selectedFeedFilter;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.body, item.hubName].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [myDeetsItems, searchQuery, selectedFeedFilter]);

  useEffect(() => {
    if (!copiedInviteHubId) return;

    const timer = window.setTimeout(() => setCopiedInviteHubId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedInviteHubId]);

  const handleInvite = async (hub: DashboardHubCardData) => {
    try {
      const shareUrl =
        typeof window === "undefined" ? hub.href : new URL(hub.href, window.location.origin).toString();
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInviteHubId(hub.id);
    } catch {
      setCopiedInviteHubId(null);
    }
  };

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
              onInvite={handleInvite}
              copiedInviteHubId={copiedInviteHubId}
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
                    {filteredDeetsItems.map((item) =>
                      item.href ? (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="block rounded-[24px] bg-[#F6FBFA] p-5 transition hover:bg-[#EFF7F5]"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F807A]">{item.type}</p>
                          <h3 className={cn("mt-2 text-lg font-semibold", TEXT_DARK)}>{item.title}</h3>
                          <p className={cn("mt-2 text-sm leading-6", TEXT_MUTED)}>{item.body}</p>
                          <DashboardDeetImage src={item.previewImage} alt={item.title} />
                        </Link>
                      ) : (
                        <article key={item.id} className="rounded-[24px] bg-[#F6FBFA] p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F807A]">{item.type}</p>
                          <h3 className={cn("mt-2 text-lg font-semibold", TEXT_DARK)}>{item.title}</h3>
                          <p className={cn("mt-2 text-sm leading-6", TEXT_MUTED)}>{item.body}</p>
                          <DashboardDeetImage src={item.previewImage} alt={item.title} />
                        </article>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="rounded-[24px] bg-[#F6FBFA] px-6 py-10 text-center">
                    <h3 className={cn("text-xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
                      No {selectedFeedFilter === "All" ? "deets" : selectedFeedFilter.toLowerCase()} yet
                    </h3>
                    <p className={cn("mx-auto mt-3 max-w-2xl text-sm leading-6 sm:text-base", TEXT_MUTED)}>
                      Aggregated hub activity is not fully wired on this dashboard yet, so this section is ready for
                      posts, notices, deals, announcements, polls, photos, and videos as those content streams become
                      available.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] bg-white px-5 py-4 text-left shadow-[0_8px_20px_rgba(12,92,87,0.05)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F807A]">Current view</p>
                        <p className={cn("mt-2 text-base font-semibold", TEXT_DARK)}>
                          {selectedHubView === "my-hubs" ? "My Hubs" : "Following"}
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
                          This space will populate as richer hub-level feed data becomes available.
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
