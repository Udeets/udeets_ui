/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Pull the real hub records (with local images + Public/Private)
import { HUBS as HUBS_SOURCE } from "@/lib/hubs";

const HEADER_FOOTER_GRADIENT = "bg-gradient-to-br from-teal-500 to-cyan-500";
const PAGE_BG = "bg-gradient-to-br from-slate-50 to-blue-50";

const ROUTE_HOME = "/";
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

  // ✅ Discover now supports both
  visibility: "Public" | "Private";

  description: string;
  href: string;
  image: string;

  tags: Array<"trending" | "popular" | "nearby">;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
        "h-10 w-10 rounded-full border border-gray-200 bg-white/80 backdrop-blur",
        "text-gray-400 hover:text-gray-600 hover:bg-white transition shadow-sm",
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

/**
 * ✅ Convert lib category slugs → Discover labels
 */
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
    case "hoas":
      return "HOA’s";
    default:
      return "Communities";
  }
}

/**
 * ✅ For now: force the 3 main hubs to use local hub-images (even if someone forgets)
 * If heroImage is already local, we keep it.
 */
function ensureLocalForTop3(h: { id: string; heroImage: string }) {
  if (h.heroImage?.startsWith("/hub-images/")) return h.heroImage;

  if (h.id === "hcv") return "/hub-images/hindu-center-of-virginia1.jpg";
  if (h.id === "desi") return "/hub-images/desi-bites1.jpg";
  if (h.id === "rks") return "/hub-images/richmond-kannada-sangha-gh1.jpg";

  return h.heroImage;
}

/**
 * ✅ Discover HUBS comes from hubs.ts (single source of truth)
 */
const HUBS: Hub[] = HUBS_SOURCE.map((h) => ({
  id: h.id,
  name: h.name,
  category: toDiscoverCategory(h.category),
  locationLabel: h.locationLabel,
  distanceMi: h.distanceMi,
  membersLabel: h.membersLabel,

  // ✅ show correct badge (RKS will be Private)
  visibility: h.visibility,

  description: h.description,

  // ✅ route always goes to the hub intro page
  href: `/hubs/${h.category}/${h.slug}`,

  // ✅ hero image comes from hubs.ts, forced local for top3
  image: ensureLocalForTop3({ id: h.id, heroImage: h.heroImage }),

  tags: h.tags,
}));

function HubCard({ hub }: { hub: Hub }) {
  return (
    <Link
      href={hub.href}
      className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition overflow-hidden w-[280px] sm:w-[320px] flex-shrink-0"
    >
      <img src={hub.image} alt={hub.name} className="h-44 w-full object-cover" loading="lazy" />
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-semibold">
            {hub.visibility}
          </span>
          <span className="text-xs text-gray-500">{hub.membersLabel}</span>
        </div>

        <h3 className="text-lg font-extrabold mt-3 text-gray-900">{hub.name}</h3>
        <p className="text-gray-600 mt-2 text-sm">{hub.description}</p>

        <div className="text-xs text-gray-500 mt-4 flex justify-between">
          <span>{hub.locationLabel}</span>
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
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>

        <div className="flex items-center gap-2">
          <LightArrowButton dir="left" ariaLabel={`${title} scroll left`} onClick={() => scrollBy(-420)} />
          <LightArrowButton dir="right" ariaLabel={`${title} scroll right`} onClick={() => scrollBy(420)} />
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-6 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" as any }}
      >
        {hubs.map((h) => (
          <HubCard key={h.id} hub={h} />
        ))}
      </div>
    </section>
  );
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [nearMe, setNearMe] = useState<NearMeOption>("Any");
  const [nearMeOpen, setNearMeOpen] = useState(false);

  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [canChipLeft, setCanChipLeft] = useState(false);
  const [canChipRight, setCanChipRight] = useState(true);

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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const dropdown = document.getElementById("nearMeDropdownChip");
      const trigger = document.getElementById("nearMeTriggerChip");
      if (!dropdown || !trigger) return;
      if (!dropdown.contains(target) && !trigger.contains(target)) setNearMeOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <header className={cn("sticky top-0 z-50", HEADER_FOOTER_GRADIENT)}>
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">
          <Link href={ROUTE_HOME} className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
            </div>
            <span className="text-white text-2xl font-extrabold">uDeets</span>
          </Link>

          <Link href={ROUTE_HOME} className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition">
            Home
          </Link>
        </div>
      </header>

      <section className={cn(HEADER_FOOTER_GRADIENT, "text-center py-20 px-6")}>
        <h1 className="text-white text-5xl sm:text-6xl font-extrabold">Discover Hubs</h1>
        <p className="text-white/90 mt-4 text-lg sm:text-xl">Explore communities, business and places near you</p>

        <div className="mt-10 max-w-3xl mx-auto bg-white rounded-2xl shadow-xl flex items-center px-4 py-3">
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
            className="flex-1 outline-none text-gray-700 text-lg"
          />
        </div>

        <div className="mt-8">
          <Link
            href={ROUTE_AUTH}
            className="inline-block bg-white/20 border border-white/25 text-white px-7 py-3.5 rounded-xl font-extrabold text-lg hover:bg-white/30 transition"
          >
            Create Hub
          </Link>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div ref={chipsRef} className="flex items-center gap-3 overflow-x-auto pb-2 flex-1" style={{ scrollbarWidth: "none" as any }}>
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "px-6 py-3 rounded-full border font-semibold transition whitespace-nowrap",
                  activeCategory === "All"
                    ? cn("text-white border-transparent", HEADER_FOOTER_GRADIENT)
                    : "bg-slate-50 text-gray-700 border-gray-200 hover:border-teal-400"
                )}
              >
                All
              </button>

              <div className="relative">
                <button
                  id="nearMeTriggerChip"
                  onClick={() => setNearMeOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full border font-semibold transition whitespace-nowrap",
                    nearMe !== "Any"
                      ? cn("text-white border-transparent", HEADER_FOOTER_GRADIENT)
                      : "bg-slate-50 text-gray-700 border-gray-200 hover:border-teal-400"
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

                {nearMeOpen && (
                  <div id="nearMeDropdownChip" className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
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
                  </div>
                )}
              </div>

              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "px-6 py-3 rounded-full border font-semibold transition whitespace-nowrap",
                    activeCategory === c
                      ? cn("text-white border-transparent", HEADER_FOOTER_GRADIENT)
                      : "bg-slate-50 text-gray-700 border-gray-200 hover:border-teal-400"
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

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {activeCategory !== "All" ? (
          <CarouselSection title={activeCategory} hubs={categoryHubs} />
        ) : (
          <>
            <CarouselSection title="Trending" hubs={trending} />
            <CarouselSection title="Popular" hubs={popular} />
            <CarouselSection title="Near You" hubs={nearby} />
          </>
        )}
      </main>

      <footer className={cn(HEADER_FOOTER_GRADIENT, "py-6 text-center text-white")}>
        © uDeets. All rights reserved.
      </footer>
    </div>
  );
}