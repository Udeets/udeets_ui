/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import { isUdeetsLogoSrc } from "@/lib/branding";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import type { Hub as SupabaseHub } from "@/types/hub";

const HEADER_BG = "bg-white border-b border-slate-200/60";
const FOOTER_BG = "bg-[#0C5C57]";
const PAGE_BG = "bg-[#fafafa]";
const NAV_TEXT = "text-[#111111]";
const BRAND_TEXT_STYLE = "text-xl sm:text-2xl";
const DISPLAY_HEADING = "font-semibold tracking-tight text-[#111111]";
const FILTER_TEXT = "font-medium";
const ACTION_TEXT = "font-medium text-[#111111]";
const BUTTON_PRIMARY = "rounded-full bg-[#0C5C57] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#094a46] transition-colors duration-150";
const ACTIVE_CHIP = "bg-[#0C5C57] text-white border-transparent";

const ROUTE_AUTH = "/auth";

type Category =
  | "All"
  | "Religious Places"
  | "Communities"
  | "Restaurants"
  | "Fitness"
  | "Pet Clubs"
  | "HOA's";

const CATEGORIES: Category[] = [
  "All",
  "Religious Places",
  "Communities",
  "Restaurants",
  "Fitness",
  "Pet Clubs",
  "HOA's",
];

type NearMeOption =
  | "Any"
  | "1 mile"
  | "3 miles"
  | "5 miles"
  | "10 miles"
  | "Richmond";

const NEAR_ME_OPTIONS: NearMeOption[] = [
  "Any",
  "1 mile",
  "3 miles",
  "5 miles",
  "10 miles",
  "Richmond",
];

type Hub = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  locationLabel: string;
  distanceMi: number;
  membersLabel: string;
  visibility: "Public" | "Private";
  description: string;
  href: string;
  image: string;
  tags: Array<"trending" | "popular" | "nearby">;
};

type SupabaseLoadState = "idle" | "loading" | "success" | "error";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toDiscoverCategory(category: string): Exclude<Category, "All"> {
  switch (category) {
    case "religious-places":
      return "Religious Places";
    case "communities":
      return "Communities";
    case "restaurants":
      return "Restaurants";
    case "fitness":
      return "Fitness";
    case "pet-clubs":
      return "Pet Clubs";
    case "hoa":
      return "HOA's";
    default:
      return "Communities";
  }
}

function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function locationLabelFor(hub: SupabaseHub) {
  return [hub.city, hub.state, hub.country].filter(Boolean).join(", ") || "";
}

function toDiscoverHub(hub: SupabaseHub): Hub {
  const imageSrc = hub.dp_image_url || hub.cover_image_url || undefined;
  const vis = (hub.visibility ?? "public").toString().toLowerCase();

  return {
    id: hub.id,
    name: hub.name,
    category: toDiscoverCategory(hub.category),
    locationLabel: locationLabelFor(hub),
    distanceMi: 0,
    membersLabel: "New hub",
    visibility: vis === "private" ? "Private" : "Public",
    description: hub.description || "A new uDeets hub is getting set up.",
    href: `/hubs/${hub.category}/${hub.slug}`,
    image: normalizePublicSrc(imageSrc),
    tags: [],
  };
}

function matchesNearMe(h: Hub, nearMe: NearMeOption) {
  if (nearMe === "Any") return true;
  if (nearMe === "Richmond") return h.locationLabel.toLowerCase().includes("richmond");

  const limit =
    nearMe === "1 mile"
      ? 1
      : nearMe === "3 miles"
      ? 3
      : nearMe === "5 miles"
      ? 5
      : 10;

  return h.distanceMi <= limit;
}

function IconChevronLeft(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronRight(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7.5 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LightArrowButton({
  dir,
  onClick,
  disabled,
  className,
  ariaLabel,
}: {
  dir: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-10 w-10 rounded-full border border-slate-200 bg-white",
        "text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition shadow-sm",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      {dir === "left" ? (
        <IconChevronLeft className="h-5 w-5 mx-auto" />
      ) : (
        <IconChevronRight className="h-5 w-5 mx-auto" />
      )}
    </button>
  );
}

/* ── Band-app style hub list item ───────────────────────────────── */
function HubListItem({ hub }: { hub: Hub }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLogo = isUdeetsLogoSrc(hub.image);

  return (
    <Link
      href={hub.href}
      className="flex items-start gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-white sm:gap-5 sm:px-3 sm:py-4"
    >
      {/* Square thumbnail */}
      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg sm:h-[88px] sm:w-[88px]">
        {hub.image && !imageFailed ? (
          <img
            src={hub.image}
            alt={hub.name}
            className={cn("h-full w-full", isLogo ? "object-contain bg-white" : "object-cover")}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
            <span className="text-2xl font-semibold text-white/70">{hub.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Hub info */}
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="truncate text-[15px] font-semibold tracking-tight text-[#111111]">
          {hub.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500">
          {hub.description}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-400">
          <span>{hub.membersLabel}</span>
          {hub.locationLabel ? (
            <>
              <span>·</span>
              <span className="truncate">{hub.locationLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/* ── Hub list grid (2 cols on desktop, 1 col on mobile) ─────────── */
function HubListSection({ hubs }: { hubs: Hub[] }) {
  return (
    <section className="py-4">
      {hubs.length ? (
        <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 md:grid-cols-2 md:gap-x-6 md:divide-y-0">
          {hubs.map((h) => (
            <div key={h.id} className="border-b border-slate-100 last:border-b-0 md:border-b-0">
              <HubListItem hub={h} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white px-8 py-12 text-center">
          <p className="text-base font-medium text-[#111111]">No hubs yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Create the first hub to see it appear here.
          </p>
        </div>
      )}
    </section>
  );
}

export default function DiscoverPageContent({ initialHubs }: { initialHubs?: any[] }) {
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [nearMe, setNearMe] = useState<NearMeOption>("Any");
  const [nearMeOpen, setNearMeOpen] = useState(false);
  const [supabaseHubs, setSupabaseHubs] = useState<Hub[]>(() => (initialHubs ?? []).map(toDiscoverHub));
  const [supabaseLoadState, setSupabaseLoadState] = useState<SupabaseLoadState>(initialHubs && initialHubs.length > 0 ? "success" : "idle");
  const [supabaseLoadError, setSupabaseLoadError] = useState<string | null>(null);

  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [canChipLeft, setCanChipLeft] = useState(false);
  const [canChipRight, setCanChipRight] = useState(true);

  const [nearMePos, setNearMePos] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 176,
  });

  const updateNearMePos = () => {
    if (typeof window === "undefined") return;
    const trigger = document.getElementById("nearMeTriggerChip");
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const width = Math.max(176, Math.round(r.width));
    const left = Math.max(8, Math.min(Math.round(r.left), window.innerWidth - width - 8));
    setNearMePos({
      left,
      top: Math.round(r.bottom + 8),
      width,
    });
  };

  const updateChipArrows = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanChipLeft(el.scrollLeft > 2);
    setCanChipRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    updateChipArrows();

    const onScroll = () => updateChipArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => updateChipArrows();
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollChipsBy = (delta: number) => {
    const el = chipsRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  // close on outside click
  useEffect(() => {
    const closeIfOutside = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const trigger = document.getElementById("nearMeTriggerChip");
      const dropdown = document.getElementById("nearMeDropdownPortal");

      if (trigger && trigger.contains(target)) return;
      if (dropdown && dropdown.contains(target)) return;

      setNearMeOpen(false);
    };

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
    };
  }, []);

  // keep dropdown positioned correctly while open
  useEffect(() => {
    if (!nearMeOpen) return;

    const raf = window.requestAnimationFrame(() => updateNearMePos());

    const onWinScroll = () => updateNearMePos();
    const onResize = () => updateNearMePos();

    window.addEventListener("scroll", onWinScroll, true);
    window.addEventListener("resize", onResize);

    const chipsEl = chipsRef.current;
    const onChipsScroll = () => updateNearMePos();
    chipsEl?.addEventListener("scroll", onChipsScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onWinScroll, true);
      window.removeEventListener("resize", onResize);
      chipsEl?.removeEventListener("scroll", onChipsScroll);
    };
  }, [nearMeOpen]);

  // Check auth state and refetch hubs with user token so user's own hubs appear (#21)
  useEffect(() => {
    let cancelled = false;

    getCurrentSession()
      .then(async (session) => {
        if (cancelled) return;
        setIsAuthenticated(Boolean(session));

        // If authenticated, refetch hubs with the user's token to include user's own hubs
        if (session) {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data, error } = await supabase
              .from("hubs")
              .select("*")
              .neq("created_by", session.user.id)
              .order("created_at", { ascending: false });
            if (!cancelled && data && !error) {
              setSupabaseHubs(data.map(toDiscoverHub));
              setSupabaseLoadState("success");
            }
          } catch {
            // Silently fall back to server-fetched hubs
          }
        }
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const allHubs = useMemo(() => supabaseHubs, [supabaseHubs]);

  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allHubs.filter((h) => {
      const matchQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.locationLabel.toLowerCase().includes(q) ||
        h.membersLabel.toLowerCase().includes(q);

      const matchNear = matchesNearMe(h, nearMe);
      return matchQuery && matchNear;
    });
  }, [allHubs, query, nearMe]);

  const categoryHubs = useMemo(() => {
    if (activeCategory === "All") return [];
    return baseFiltered.filter((h) => h.category === activeCategory);
  }, [activeCategory, baseFiltered]);

  const allFilteredHubs = useMemo(() => {
    if (activeCategory === "All") return baseFiltered;
    return categoryHubs;
  }, [activeCategory, baseFiltered, categoryHubs]);

  const isResultsMode = query.trim().length > 0 || nearMe !== "Any";

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <header className={cn("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName={BRAND_TEXT_STYLE} priority />
          </Link>

          <Link href={isAuthenticated ? "/dashboard" : "/"} className={cn("rounded-full px-4 py-2 text-sm transition hover:bg-slate-100 sm:px-5 sm:py-2.5", NAV_TEXT, ACTION_TEXT)}>
            Home
          </Link>
        </div>
      </header>

      {/* ── Compact header with search ────────────────────────────── */}
      <section className="bg-white px-4 pb-4 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">Discover</h1>
            <Link
              href={
                searchParams.get("demo_preview") === "1"
                  ? "/create-hub?demo_preview=1"
                  : isAuthenticated
                    ? "/create-hub"
                    : ROUTE_AUTH
              }
              data-demo-target={searchParams.get("demo_preview") === "1" ? "discover-create-hub" : undefined}
              className={cn("transition", BUTTON_PRIMARY)}
            >
              Create Hub
            </Link>
          </div>

          <div className="mt-5 flex items-center rounded-lg border border-slate-200 bg-[#fafafa] px-3 py-2.5">
            <svg viewBox="0 0 24 24" className="mr-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Bands, Pages, and Posts"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* ── Tab-style category filters ──────────────────────────── */}
      <section className="border-b border-slate-200 bg-white relative z-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <div className="flex items-center">
            <div
              ref={chipsRef}
              className="flex items-center gap-0 overflow-x-auto flex-1"
              style={{ scrollbarWidth: "none" }}
            >
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "px-4 py-3 text-sm whitespace-nowrap transition-colors duration-150 border-b-2",
                  FILTER_TEXT,
                  activeCategory === "All"
                    ? "border-[#0C5C57] text-[#0C5C57]"
                    : "border-transparent text-gray-500 hover:text-[#111111]"
                )}
              >
                All
              </button>

              <div className="relative">
                <button
                  id="nearMeTriggerChip"
                  onClick={() => {
                    updateNearMePos();
                    setNearMeOpen((v) => !v);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-colors duration-150 border-b-2",
                    FILTER_TEXT,
                    nearMe !== "Any"
                      ? "border-[#0C5C57] text-[#0C5C57]"
                      : "border-transparent text-gray-500 hover:text-[#111111]"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Near me</span>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "px-4 py-3 text-sm whitespace-nowrap transition-colors duration-150 border-b-2",
                    FILTER_TEXT,
                    activeCategory === c
                      ? "border-[#0C5C57] text-[#0C5C57]"
                      : "border-transparent text-gray-500 hover:text-[#111111]"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {nearMeOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="nearMeDropdownPortal"
            className="fixed z-[999999] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            style={{ left: nearMePos.left, top: nearMePos.top, width: nearMePos.width }}
          >
            {NEAR_ME_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setNearMe(opt);
                  setNearMeOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {opt}
              </button>
            ))}
          </div>,
          document.body
        )}

      <main className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-10">
        {supabaseLoadState === "loading" ? (
          <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm text-slate-500">
            Loading hubs...
          </div>
        ) : null}

        {supabaseLoadState === "error" ? (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {supabaseLoadError ?? "Could not load hubs."}
          </div>
        ) : null}

        {/* Browse by Location link (like Band app) */}
        {nearMe === "Any" && activeCategory === "All" && !query.trim() ? (
          <button
            type="button"
            onClick={() => {
              updateNearMePos();
              setNearMeOpen((v) => !v);
            }}
            className="mb-2 flex w-full items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#111111] transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#0C5C57]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Browse by Location
            <IconChevronRight className="ml-auto h-4 w-4 text-gray-400" />
          </button>
        ) : null}

        <HubListSection hubs={allFilteredHubs} />
      </main>

      <footer className="border-t border-slate-100 bg-white py-6">
        <div className="mx-auto max-w-4xl px-4 text-xs text-gray-400 sm:px-6 lg:px-10">
          uDeets © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
