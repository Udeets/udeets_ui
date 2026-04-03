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
const BUTTON_PRIMARY = "rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors duration-150";
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

type NearMeScope = "nearby" | "state" | "country" | "global";

const SCOPE_LABELS: Record<NearMeScope, string> = {
  nearby: "Nearby",
  state: "State",
  country: "Country",
  global: "Global",
};

type LocationState = {
  active: boolean;
  label: string; // e.g. "Mechanicsville, VA" or "23116"
  lat: number | null;
  lng: number | null;
  scope: NearMeScope;
};

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

function matchesLocation(h: Hub, loc: LocationState) {
  if (!loc.active) return true;
  const q = loc.label.toLowerCase();
  if (!q) return true;
  // Simple text-based matching against hub location fields
  return h.locationLabel.toLowerCase().includes(q);
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

/* ── Near Me Location Popup ────────────────────────────────────── */
function NearMePopup({
  location,
  onLocationChange,
  onClose,
  isAuthenticated,
}: {
  location: LocationState;
  onLocationChange: (loc: LocationState) => void;
  onClose: () => void;
  isAuthenticated: boolean;
}) {
  const [searchValue, setSearchValue] = useState(location.label);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = document.getElementById("nearMePinTrigger");
      if (trigger?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      onLocationChange({ active: false, label: "", lat: null, lng: null, scope: "nearby" });
    } else {
      onLocationChange({ active: true, label: trimmed, lat: null, lng: null, scope: location.scope });
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode using a free API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              "";
            const state = data.address?.state || "";
            const label = [city, state].filter(Boolean).join(", ");
            setSearchValue(label);
            onLocationChange({
              active: true,
              label,
              lat: latitude,
              lng: longitude,
              scope: location.scope,
            });
          }
        } catch {
          setSearchValue(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          onLocationChange({
            active: true,
            label: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
            lat: latitude,
            lng: longitude,
            scope: location.scope,
          });
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Location permission denied. Please allow location access in your browser settings."
            : "Could not determine your location. Please try again."
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClear = () => {
    setSearchValue("");
    onLocationChange({ active: false, label: "", lat: null, lng: null, scope: "nearby" });
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-[999999] w-[340px] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
    >
      {/* Search input */}
      <div className="px-4 pt-4 pb-3">
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wide">
          City or ZIP code
        </label>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-slate-200 bg-[#fafafa] px-3 py-2">
            <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Mechanicsville or 23116"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-gray-400"
            />
            {searchValue && (
              <button onClick={handleClear} className="ml-1 text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Go
          </button>
        </div>
      </div>

      {/* Geolocation button */}
      <div className="px-4 pb-3">
        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#111111] transition hover:bg-slate-50 disabled:opacity-50"
        >
          {geoLoading ? (
            <svg className="h-4 w-4 animate-spin text-[#0C5C57]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#0C5C57]" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          )}
          {geoLoading ? "Finding your location..." : "Use my current location"}
        </button>
        {geoError && (
          <p className="mt-1.5 text-xs text-red-500">{geoError}</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Didn't find your hub? */}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500">
          Didn&apos;t find your right hub?
        </p>
        <Link
          href={isAuthenticated ? "/create-hub" : "/auth"}
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#0C5C57] transition hover:text-[#094a46]"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Create Hub
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Hubs around you — scope selector */}
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
          Hubs around you
        </p>
        <div className="flex gap-1.5">
          {(["nearby", "state", "country", "global"] as NearMeScope[]).map((scope) => (
            <button
              key={scope}
              onClick={() => onLocationChange({ ...location, scope })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                location.scope === scope
                  ? "bg-[#0C5C57] text-white"
                  : "bg-slate-100 text-gray-500 hover:bg-slate-200 hover:text-[#111111]"
              )}
            >
              {SCOPE_LABELS[scope]}
            </button>
          ))}
        </div>
      </div>
    </div>
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
  const [locationPopupOpen, setLocationPopupOpen] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    active: false,
    label: "",
    lat: null,
    lng: null,
    scope: "nearby",
  });
  const [supabaseHubs, setSupabaseHubs] = useState<Hub[]>(() => (initialHubs ?? []).map(toDiscoverHub));
  const [supabaseLoadState, setSupabaseLoadState] = useState<SupabaseLoadState>(initialHubs && initialHubs.length > 0 ? "success" : "idle");
  const [supabaseLoadError, setSupabaseLoadError] = useState<string | null>(null);

  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [canChipLeft, setCanChipLeft] = useState(false);
  const [canChipRight, setCanChipRight] = useState(true);

  const [nearMePopupPos, setNearMePopupPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const updateNearMePopupPos = () => {
    if (typeof window === "undefined") return;
    const trigger = document.getElementById("nearMePinTrigger");
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const popupW = 340;
    const left = Math.max(8, Math.min(Math.round(r.left), window.innerWidth - popupW - 8));
    setNearMePopupPos({ left, top: Math.round(r.bottom + 8) });
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

  // keep popup positioned correctly while open
  useEffect(() => {
    if (!locationPopupOpen) return;
    const raf = window.requestAnimationFrame(() => updateNearMePopupPos());
    const onResize = () => updateNearMePopupPos();
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [locationPopupOpen]);

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

      const matchLoc = matchesLocation(h, location);
      return matchQuery && matchLoc;
    });
  }, [allHubs, query, location]);

  const categoryHubs = useMemo(() => {
    if (activeCategory === "All") return [];
    return baseFiltered.filter((h) => h.category === activeCategory);
  }, [activeCategory, baseFiltered]);

  const allFilteredHubs = useMemo(() => {
    if (activeCategory === "All") return baseFiltered;
    return categoryHubs;
  }, [activeCategory, baseFiltered, categoryHubs]);

  const isResultsMode = query.trim().length > 0 || location.active;

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <header className={cn("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-14 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName={BRAND_TEXT_STYLE} priority />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={
                searchParams.get("demo_preview") === "1"
                  ? "/create-hub?demo_preview=1"
                  : isAuthenticated
                    ? "/create-hub"
                    : ROUTE_AUTH
              }
              data-demo-target={searchParams.get("demo_preview") === "1" ? "discover-create-hub" : undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-4 py-2 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Create Hub
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-slate-100 hover:text-[#111111]"
              aria-label="Home"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" /><path d="M9 21V12h6v9" /></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Centered title + search ─────────────────────────────── */}
      <section className="bg-white px-4 pb-4 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">Discover</h1>

          <div className="mt-4 flex items-center rounded-lg border border-slate-200 bg-[#fafafa] px-3 py-2.5">
            <svg viewBox="0 0 24 24" className="mr-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hubs, communities, places..."
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

              <button
                id="nearMePinTrigger"
                onClick={() => {
                  updateNearMePopupPos();
                  setLocationPopupOpen((v) => !v);
                }}
                className={cn(
                  "flex items-center justify-center px-3 py-3 transition-colors duration-150 border-b-2",
                  location.active
                    ? "border-[#0C5C57] text-[#0C5C57]"
                    : "border-transparent text-gray-400 hover:text-[#111111]"
                )}
                aria-label="Near me"
                title="Near me"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </button>

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

      {locationPopupOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div style={{ position: "fixed", left: nearMePopupPos.left, top: nearMePopupPos.top, zIndex: 999999 }}>
            <NearMePopup
              location={location}
              onLocationChange={(loc) => setLocation(loc)}
              onClose={() => setLocationPopupOpen(false)}
              isAuthenticated={isAuthenticated}
            />
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

        {/* Active location filter indicator */}
        {location.active && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#0C5C57]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="font-medium text-[#111111]">{location.label}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-400 capitalize">{SCOPE_LABELS[location.scope]}</span>
            <button
              onClick={() => setLocation({ active: false, label: "", lat: null, lng: null, scope: "nearby" })}
              className="ml-auto text-gray-400 hover:text-gray-600 transition"
              aria-label="Clear location filter"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

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
