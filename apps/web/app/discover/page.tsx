"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  visibility: "Public";
  description: string;
  href: string;
  image: string;
  tags: Array<"trending" | "popular" | "nearby">;
};

const HUBS: Hub[] = [
  // Religious Places (2)
  {
    id: "hcv",
    name: "Hindu Center of Virginia",
    category: "Religious Places",
    locationLabel: "Richmond, VA",
    distanceMi: 6.3,
    membersLabel: "2.4k members",
    visibility: "Public",
    description: "Temple updates and community programs.",
    href: "/hubs/religious-places/hindu-center-of-virginia",
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/2880b7b2f6-b59f40132dab39335beb.png",
    tags: ["trending", "popular"],
  },
  {
    id: "church",
    name: "St. Mary’s Church",
    category: "Religious Places",
    locationLabel: "Henrico, VA",
    distanceMi: 4.9,
    membersLabel: "1.2k members",
    visibility: "Public",
    description: "Sunday gatherings and outreach events.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/d1f3c6baf4-21c9cb8caca33f271ab0.png",
    tags: ["nearby"],
  },

  // Communities (2)
  {
    id: "rks",
    name: "Richmond Kannada Sangha",
    category: "Communities",
    locationLabel: "Richmond, VA",
    distanceMi: 4.1,
    membersLabel: "1.8k members",
    visibility: "Public",
    description: "Cultural programs and youth activities.",
    href: "/hubs/communities/richmond-kannada-sangha",
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/6161d2c3b7-3c6965f323d6edea2512.png",
    tags: ["trending", "nearby"],
  },
  {
    id: "collective",
    name: "Creative Collective",
    category: "Communities",
    locationLabel: "Arts District",
    distanceMi: 2.6,
    membersLabel: "956 members",
    visibility: "Public",
    description: "Local artists, meetups, and workshops.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/d318afeb68-88a63ff0fdcc9a1ac5f5.png",
    tags: ["popular", "nearby"],
  },

  // Restaurants (2)
  {
    id: "desi",
    name: "Desi Bites",
    category: "Restaurants",
    locationLabel: "Glen Allen, VA",
    distanceMi: 8.7,
    membersLabel: "956 members",
    visibility: "Public",
    description: "Menu drops and local foodie deals.",
    href: "/hubs/restaurants/desi-bites",
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/dd5237788d-a2806fa2793acbf9b817.png",
    tags: ["trending", "popular"],
  },
  {
    id: "brew",
    name: "Brew & Connect",
    category: "Restaurants",
    locationLabel: "Downtown RVA",
    distanceMi: 1.0,
    membersLabel: "2.3k members",
    visibility: "Public",
    description: "Coffee hub for remote workers.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/81ad6b86a6-70df23259b2b89f8f284.png",
    tags: ["nearby", "popular"],
  },

  // Fitness (2)
  {
    id: "fitlife",
    name: "FitLife Studio",
    category: "Fitness",
    locationLabel: "Midtown RVA",
    distanceMi: 2.1,
    membersLabel: "1.8k members",
    visibility: "Public",
    description: "Classes, challenges, and wellness updates.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/bf887cb790-11bd34339f2e3b268c5b.png",
    tags: ["trending", "nearby"],
  },
  {
    id: "zen",
    name: "Zen Studio",
    category: "Fitness",
    locationLabel: "Richmond, VA",
    distanceMi: 0.7,
    membersLabel: "1.5k members",
    visibility: "Public",
    description: "Yoga and mindfulness community.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/9e623e8724-0c686b198fbd369decf5.png",
    tags: ["popular", "nearby"],
  },

  // Pet Clubs (2)
  {
    id: "pet1",
    name: "Pet Paradise",
    category: "Pet Clubs",
    locationLabel: "Richmond, VA",
    distanceMi: 1.8,
    membersLabel: "3.8k members",
    visibility: "Public",
    description: "Pet meetups and community events.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/83c9c2db99-1bad194d665e27da06ec.png",
    tags: ["popular", "nearby"],
  },
  {
    id: "pet2",
    name: "Paw Pals Club",
    category: "Pet Clubs",
    locationLabel: "Glen Allen, VA",
    distanceMi: 5.0,
    membersLabel: "1.1k members",
    visibility: "Public",
    description: "Weekend walks and pet socials.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/2b6233915f-16cd8c0c81469eabd0f4.png",
    tags: ["trending"],
  },

  // HOA’s (2)
  {
    id: "hoa1",
    name: "Henrico HOA Updates",
    category: "HOA’s",
    locationLabel: "Henrico, VA",
    distanceMi: 3.5,
    membersLabel: "780 members",
    visibility: "Public",
    description: "Neighborhood updates and notices.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/204e9104e0-9382721196f9e9198af9.png",
    tags: ["nearby"],
  },
  {
    id: "hoa2",
    name: "Riverside HOA",
    category: "HOA’s",
    locationLabel: "Richmond, VA",
    distanceMi: 1.3,
    membersLabel: "620 members",
    visibility: "Public",
    description: "Community alerts and meetings.",
    href: ROUTE_AUTH,
    image:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/204e9104e0-9382721196f9e9198af9.png",
    tags: ["popular", "nearby"],
  },
];

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
    <svg viewBox="0 0 20 20" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronRight(props: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
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

function HubCard({ hub }: { hub: Hub }) {
  return (
    <Link
      href={hub.href}
      className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition overflow-hidden min-w-[280px] sm:min-w-[320px]"
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

function CarouselSection({
  title,
  hubs,
}: {
  title: string;
  hubs: Hub[];
}) {
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
          <LightArrowButton
            dir="left"
            ariaLabel={`${title} scroll left`}
            onClick={() => scrollBy(-420)}
          />
          <LightArrowButton
            dir="right"
            ariaLabel={`${title} scroll right`}
            onClick={() => scrollBy(420)}
          />
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

  // Chips scroll + arrows
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

  // close nearMe dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const dropdown = document.getElementById("nearMeDropdownChip");
      const trigger = document.getElementById("nearMeTriggerChip");
      if (!dropdown || !trigger) return;
      if (!dropdown.contains(target) && !trigger.contains(target)) {
        setNearMeOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Base filter: query + nearMe always apply
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
      {/* HEADER */}
      <header className={cn("sticky top-0 z-50", HEADER_FOOTER_GRADIENT)}>
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">
          <Link href={ROUTE_HOME} className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
            </div>
            <span className="text-white text-2xl font-extrabold">uDeets</span>
          </Link>

          <Link
            href={ROUTE_HOME}
            className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition"
          >
            Home
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className={cn(HEADER_FOOTER_GRADIENT, "text-center py-20 px-6")}>
        <h1 className="text-white text-5xl sm:text-6xl font-extrabold">Discover Hubs</h1>
        <p className="text-white/90 mt-4 text-lg sm:text-xl">
          Explore communities, business and places near you
        </p>

        {/* Search */}
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

        {/* Create Hub */}
        <div className="mt-8">
          <Link
            href={ROUTE_AUTH}
            className="inline-block bg-white/20 border border-white/25 text-white px-7 py-3.5 rounded-xl font-extrabold text-lg hover:bg-white/30 transition"
          >
            Create Hub
          </Link>
        </div>
      </section>

      {/* CATEGORY CHIPS */}
      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-3">
            {/* chips */}
            <div
              ref={chipsRef}
              className="flex items-center gap-3 overflow-x-auto pb-2 flex-1"
              style={{ scrollbarWidth: "none" as any }}
            >
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

              {/* Near me dropdown chip */}
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
                  <div
                    id="nearMeDropdownChip"
                    className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
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

            {/* arrow buttons at end of chip row */}
            <div className="hidden md:flex items-center gap-2">
              <LightArrowButton
                dir="left"
                ariaLabel="Scroll categories left"
                onClick={() => scrollChipsBy(-420)}
                disabled={!canChipLeft}
              />
              <LightArrowButton
                dir="right"
                ariaLabel="Scroll categories right"
                onClick={() => scrollChipsBy(420)}
                disabled={!canChipRight}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
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

      {/* FOOTER */}
      <footer className={cn(HEADER_FOOTER_GRADIENT, "py-6 text-center text-white")}>
        © uDeets. All rights reserved.
      </footer>
    </div>
  );
}