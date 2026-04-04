/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";

import { isUdeetsLogoSrc } from "@/lib/branding";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import type { Hub as SupabaseHub } from "@/types/hub";

const HEADER_BG = "bg-[var(--ud-bg-card)] border-b border-[var(--ud-border-subtle)]";
const PAGE_BG = "bg-[var(--ud-bg-page)]";
const BRAND_TEXT_STYLE = "text-xl sm:text-2xl";
const FILTER_TEXT = "font-medium";

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
        "h-10 w-10 rounded-full border border-[var(--ud-border)] bg-white",
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

/* ── Hub list item ───────────────────────────────────────────────── */
function HubListItem({ hub }: { hub: Hub }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLogo = isUdeetsLogoSrc(hub.image);

  return (
    <Link
      href={hub.href}
      className="flex items-start gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)] sm:gap-5 sm:px-3 sm:py-4"
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
            <span className="text-2xl font-semibold text-white/70">{hub.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Hub info */}
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--ud-text-primary)]">
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
        <div className="grid grid-cols-1 gap-0 divide-y divide-[var(--ud-border-subtle)] md:grid-cols-2 md:gap-x-6 md:divide-y-0">
          {hubs.map((h) => (
            <div key={h.id} className="border-b border-[var(--ud-border-subtle)] last:border-b-0 md:border-b-0">
              <HubListItem hub={h} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--ud-bg-card)] px-8 py-12 text-center">
          <p className="text-base font-medium text-[var(--ud-text-primary)]">No hubs yet</p>
          <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
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
  const [supabaseHubs, setSupabaseHubs] = useState<Hub[]>(() => (initialHubs ?? []).map(toDiscoverHub));
  const [supabaseLoadState, setSupabaseLoadState] = useState<SupabaseLoadState>(initialHubs && initialHubs.length > 0 ? "success" : "idle");
  const [supabaseLoadError, setSupabaseLoadError] = useState<string | null>(null);

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
      return (
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.locationLabel.toLowerCase().includes(q) ||
        h.membersLabel.toLowerCase().includes(q)
      );
    });
  }, [allHubs, query]);

  const categoryHubs = useMemo(() => {
    if (activeCategory === "All") return [];
    return baseFiltered.filter((h) => h.category === activeCategory);
  }, [activeCategory, baseFiltered]);

  const allFilteredHubs = useMemo(() => {
    if (activeCategory === "All") return baseFiltered;
    return categoryHubs;
  }, [activeCategory, baseFiltered, categoryHubs]);

  const isResultsMode = query.trim().length > 0;

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <header className={cn("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-14 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName={BRAND_TEXT_STYLE} priority />
          </Link>

          <div className="flex items-center gap-1.5">
            <Link
              href={
                searchParams.get("demo_preview") === "1"
                  ? "/create-hub?demo_preview=1"
                  : isAuthenticated
                    ? "/create-hub"
                    : ROUTE_AUTH
              }
              data-demo-target={searchParams.get("demo_preview") === "1" ? "discover-create-hub" : undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-2 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Create Hub
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              aria-label="Home"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Centered title + search ─────────────────────────────── */}
      <section className="bg-[var(--ud-bg-card)] px-4 pb-4 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-3xl">Discover</h1>

          <div className="mt-4 flex items-center rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-3 py-2.5">
            <svg viewBox="0 0 24 24" className="mr-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hubs, communities, places..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* ── Tab-style category filters ──────────────────────────── */}
      <section className="border-b border-[var(--ud-border)] bg-[var(--ud-bg-card)] relative z-40">
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
                    ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                    : "border-transparent text-gray-500 hover:text-[var(--ud-text-primary)]"
                )}
              >
                All
              </button>

              <Link
                href="/discover/location"
                className="flex items-center justify-center px-3 py-3 transition-colors duration-150 border-b-2 border-transparent text-gray-400 hover:text-[var(--ud-text-primary)]"
                aria-label="Near me"
                title="Near me"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </Link>

              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "px-4 py-3 text-sm whitespace-nowrap transition-colors duration-150 border-b-2",
                    FILTER_TEXT,
                    activeCategory === c
                      ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                      : "border-transparent text-gray-500 hover:text-[var(--ud-text-primary)]"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

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

        <HubListSection hubs={allFilteredHubs} />
      </main>

      <footer className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] py-6">
        <div className="mx-auto max-w-4xl px-4 text-xs text-[var(--ud-text-muted)] sm:px-6 lg:px-10">
          uDeets © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
