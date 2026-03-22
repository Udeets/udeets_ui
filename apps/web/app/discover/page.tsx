/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HUBS as HUBS_SOURCE } from "@/lib/hubs";
import { useMockAuth } from "@/lib/mock-auth";

const HEADER_BG = "bg-white border-b border-slate-200/60";
const FOOTER_BG = "bg-[#0C5C57]";
const PAGE_BG = "bg-[#E3F1EF]";
const SECTION_MINT_BG = "bg-[#E3F1EF]";
const HERO_ACCENT_BG = SECTION_MINT_BG;
const NAV_TEXT = "text-[#111111]";
const LOGO_TEXT = "text-[#111111]";
const BRAND_TEXT_STYLE = `truncate text-xl font-serif font-semibold tracking-tight ${LOGO_TEXT} sm:text-2xl`;
const DISPLAY_HEADING = "font-serif font-semibold tracking-tight text-[#111111]";
const FILTER_TEXT = "font-serif font-semibold tracking-tight";
const ACTION_TEXT = "font-serif font-semibold tracking-tight text-[#111111]";
const BUTTON_PRIMARY = "rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-serif font-semibold tracking-tight text-white hover:bg-[#094a46]";
const ACTIVE_CHIP = "bg-[#0C5C57] text-white border-transparent";

const ROUTE_AUTH = "/auth";

type Category =
  | "All"
  | "Religious Places"
  | "Communities"
  | "Restaurants"
  | "Fitness"
  | "Pet Clubs"
  | "HOA’s";

const CATEGORIES: Category[] = [
  "All",
  "Religious Places",
  "Communities",
  "Restaurants",
  "Fitness",
  "Pet Clubs",
  "HOA’s",
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
      return "HOA’s";
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

const HUBS: Hub[] = HUBS_SOURCE.map((h) => ({
  id: h.id,
  name: h.name,
  category: toDiscoverCategory(h.category),
  locationLabel: h.locationLabel,
  distanceMi: h.distanceMi,
  membersLabel: h.membersLabel,
  visibility: (h.visibility as "Public" | "Private") ?? "Public",
  description: h.description,
  href: `/hubs/${h.category}/${h.slug}`,
  image: normalizePublicSrc(h.dpImage || h.heroImage),
  tags: h.tags,
}));

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

function HubCard({ hub }: { hub: Hub }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={hub.href}
      // ✅ FIX: force identical card width + no flex expansion
      className="w-[min(320px,calc(100vw-2rem))] flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:border-slate-300 sm:w-[320px]"
    >
      {hub.image && !imageFailed ? (
        <img
          src={hub.image}
          alt={hub.name}
          className="h-44 w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="grid h-44 w-full place-items-center bg-[#A9D1CA]/35 text-center">
          <span className="px-4 text-sm font-semibold text-[#0C5C57]">Image Coming Soon</span>
        </div>
      )}
      <div className="min-w-0 p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs bg-[#E3F1EF] text-slate-700 px-3 py-1 rounded-full font-semibold">
            {hub.visibility}
          </span>
          <span className="text-xs text-gray-500">{hub.membersLabel}</span>
        </div>

        <h3 className={cn("mt-3 break-words text-lg", DISPLAY_HEADING)}>{hub.name}</h3>
        <p className="mt-2 break-words text-sm text-gray-600">{hub.description}</p>

        <div className="text-xs text-gray-500 mt-4 flex justify-between">
          <span className="min-w-0 break-words">{hub.locationLabel}</span>
          <span>{hub.distanceMi.toFixed(1)} mi</span>
        </div>
      </div>
    </Link>
  );
}

function CarouselSection({ title, hubs }: { title: string; hubs: Hub[] }) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h2 className={cn("text-2xl sm:text-3xl", DISPLAY_HEADING)}>{title}</h2>

        <div className="hidden items-center gap-2 sm:flex">
          <LightArrowButton dir="left" ariaLabel={`${title} scroll left`} onClick={() => scrollBy(-420)} />
          <LightArrowButton dir="right" ariaLabel={`${title} scroll right`} onClick={() => scrollBy(420)} />
        </div>
      </div>

      <div ref={rowRef} className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {hubs.map((h) => (
          <HubCard key={h.id} hub={h} />
        ))}
      </div>
    </section>
  );
}

export default function DiscoverPage() {
  const { homeHref } = useMockAuth();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [nearMe, setNearMe] = useState<NearMeOption>("Any");
  const [nearMeOpen, setNearMeOpen] = useState(false);

  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [canChipLeft, setCanChipLeft] = useState(false);
  const [canChipRight, setCanChipRight] = useState(true);

  // ✅ Portal positioning for dropdown
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

  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HUBS.filter((h) => {
      const matchQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.locationLabel.toLowerCase().includes(q) ||
        h.membersLabel.toLowerCase().includes(q);

      const matchNear = matchesNearMe(h, nearMe);
      return matchQuery && matchNear;
    });
  }, [query, nearMe]);

  const categoryHubs = useMemo(() => {
    if (activeCategory === "All") return [];
    return baseFiltered.filter((h) => h.category === activeCategory);
  }, [activeCategory, baseFiltered]);

  const trending = useMemo(() => {
    if (activeCategory !== "All") return [];
    return baseFiltered.filter((h) => h.tags.includes("trending"));
  }, [activeCategory, baseFiltered]);

  const popular = useMemo(() => {
    if (activeCategory !== "All") return [];
    return baseFiltered.filter((h) => h.tags.includes("popular"));
  }, [activeCategory, baseFiltered]);

  const nearby = useMemo(() => {
    if (activeCategory !== "All") return [];
    return baseFiltered.filter((h) => h.tags.includes("nearby"));
  }, [activeCategory, baseFiltered]);

  // ✅ RESULTS MODE:
  // If user types OR selects near-me filter, show only one section "Results"
  const isResultsMode = query.trim().length > 0 || nearMe !== "Any";

  const resultsHubs = useMemo(() => {
    if (activeCategory === "All") return baseFiltered;
    return categoryHubs;
  }, [activeCategory, baseFiltered, categoryHubs]);

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <header className={cn("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="relative h-10 w-10">
              <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
            </div>
            <span className={BRAND_TEXT_STYLE}>uDeets</span>
          </Link>

          <Link href={homeHref} className={cn("rounded-full px-4 py-2 text-sm transition hover:bg-slate-100 sm:px-5 sm:py-2.5", NAV_TEXT, ACTION_TEXT)}>
            Home
          </Link>
        </div>
      </header>

      <section className={cn("px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-10", HERO_ACCENT_BG)}>
        <div className="mx-auto max-w-7xl">
          <h1 className={cn("text-3xl sm:text-5xl lg:text-6xl", DISPLAY_HEADING)}>Discover Hubs</h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg lg:text-xl">Explore communities, business and places near you</p>

          <div className="mx-auto mt-10 flex w-full max-w-3xl items-center rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
            <div className="mr-2 text-gray-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-4.3-4.3" />
                <circle cx="11" cy="11" r="7" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hubs, places, communities..."
              className="min-w-0 flex-1 text-base text-gray-700 outline-none sm:text-lg"
            />
          </div>

          <div className="mt-8">
            <Link
              href={ROUTE_AUTH}
              className={cn("inline-block transition", BUTTON_PRIMARY)}
            >
              Create Hub
            </Link>
          </div>
        </div>
      </section>

      <section className="py-6 relative z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div
              ref={chipsRef}
              className="flex items-center gap-3 overflow-x-auto pb-2 flex-1"
              style={{ scrollbarWidth: "none" }}
            >
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  `px-6 py-3 rounded-full border transition whitespace-nowrap ${FILTER_TEXT}`,
                  activeCategory === "All"
                    ? ACTIVE_CHIP
                    : "bg-slate-50 text-gray-700 border-gray-200 hover:border-slate-300"
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
                    `flex items-center gap-2 px-6 py-3 rounded-full border transition whitespace-nowrap ${FILTER_TEXT}`,
                    nearMe !== "Any"
                      ? ACTIVE_CHIP
                      : "bg-slate-50 text-gray-700 border-gray-200 hover:border-slate-300"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Near me</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    `px-6 py-3 rounded-full border transition whitespace-nowrap ${FILTER_TEXT}`,
                    activeCategory === c
                      ? ACTIVE_CHIP
                      : "bg-slate-50 text-gray-700 border-gray-200 hover:border-slate-300"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <LightArrowButton dir="left" ariaLabel="Scroll categories left" onClick={() => scrollChipsBy(-420)} disabled={!canChipLeft} />
              <LightArrowButton dir="right" ariaLabel="Scroll categories right" onClick={() => scrollChipsBy(420)} disabled={!canChipRight} />
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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        {isResultsMode ? (
          <CarouselSection
            title="Results"
            hubs={resultsHubs}
          />
        ) : activeCategory !== "All" ? (
          <CarouselSection title={activeCategory} hubs={categoryHubs} />
        ) : (
          <>
            <CarouselSection title="Trending" hubs={trending} />
            <CarouselSection title="Popular" hubs={popular} />
            <CarouselSection title="Near You" hubs={nearby} />
          </>
        )}
      </main>

      <footer className={cn(FOOTER_BG, "py-6 text-white")}>
        <div className="flex w-full items-center justify-between px-4 text-sm sm:px-6 sm:text-base lg:px-10">
          <p>© uDeets. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
