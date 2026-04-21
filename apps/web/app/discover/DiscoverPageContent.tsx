/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";

import { isUdeetsLogoSrc } from "@/lib/branding";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import type { Hub as SupabaseHub } from "@/types/hub";

const PAGE_BG = "bg-[var(--ud-bg-page)]";

const ROUTE_AUTH = "/auth";

/* ── Category definitions with icons & colors ───────────────────── */

type CategoryDef = {
  slug: string;        // used for filtering — matches hub.category
  label: string;       // display name
  emoji: string;       // shown inside the round icon
  color: string;       // bg color of the round icon
};

const CATEGORY_DEFS: CategoryDef[] = [
  { slug: "communities",      label: "Community",        emoji: "🏘️", color: "#E0F2FE" },
  { slug: "restaurants",      label: "Restaurant",       emoji: "🍽️", color: "#FEF3C7" },
  { slug: "hoa",              label: "HOA",              emoji: "🏡", color: "#D1FAE5" },
  { slug: "religious-places", label: "Religious",        emoji: "🛕", color: "#FCE7F3" },
  { slug: "fitness",          label: "Fitness",          emoji: "💪", color: "#FEE2E2" },
  { slug: "pet-clubs",        label: "Pet Club",         emoji: "🐾", color: "#EDE9FE" },
  { slug: "pta",              label: "School / PTA",     emoji: "🎒", color: "#DBEAFE" },
  { slug: "health-wellness",  label: "Health",           emoji: "🧘", color: "#CCFBF1" },
  { slug: "home-services",    label: "Home Services",    emoji: "🔧", color: "#FEF9C3" },
  { slug: "retail",           label: "Retail",           emoji: "🛍️", color: "#FFE4E6" },
  { slug: "events",           label: "Events",           emoji: "🎉", color: "#E0E7FF" },
];

type DisplayCategory = "All" | string;

type Hub = {
  id: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  categoryEmoji: string;
  locationLabel: string;
  distanceMi: number;
  memberCount: number;
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

function categoryDefFor(slug: string): CategoryDef | undefined {
  return CATEGORY_DEFS.find((c) => c.slug === slug);
}

function categoryLabelFor(slug: string): string {
  return categoryDefFor(slug)?.label ?? "Community";
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

function toDiscoverHub(hub: SupabaseHub, memberCount?: number): Hub {
  const imageSrc = hub.dp_image_url || hub.cover_image_url || undefined;
  const vis = (hub.visibility ?? "public").toString().toLowerCase();
  const count = memberCount ?? 0;
  const catDef = categoryDefFor(hub.category);

  return {
    id: hub.id,
    name: hub.name,
    categorySlug: hub.category,
    categoryLabel: categoryLabelFor(hub.category),
    categoryEmoji: catDef?.emoji ?? "🏘️",
    locationLabel: locationLabelFor(hub),
    distanceMi: 0,
    memberCount: count,
    membersLabel: count === 0 ? "New hub" : `${count} Member${count !== 1 ? "s" : ""}`,
    visibility: vis === "private" ? "Private" : "Public",
    description: hub.description || "A new uDeets hub is getting set up.",
    href: `/hubs/${hub.category}/${hub.slug}`,
    image: normalizePublicSrc(imageSrc),
    tags: [],
  };
}

/* ── Chevron icons ───────────────────────────────────────────────── */

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

/* ── Hub list item ───────────────────────────────────────────────── */

function HubListItem({ hub }: { hub: Hub }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLogo = isUdeetsLogoSrc(hub.image);

  return (
    <Link
      href={hub.href}
      className="flex items-start gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)] sm:gap-5 sm:px-3 sm:py-4"
    >
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

      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--ud-text-primary)]">
          {hub.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500">
          {hub.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-gray-400">
          {/* Visibility badge */}
          <span className="inline-flex items-center gap-1">
            {hub.visibility === "Private" ? (
              <svg className="h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            ) : (
              <svg className="h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10" /></svg>
            )}
            <span>{hub.visibility}</span>
          </span>
          <span>·</span>
          {/* Category */}
          <span className="inline-flex items-center gap-1">
            <span className="text-[11px]">{hub.categoryEmoji}</span>
            <span>{hub.categoryLabel}</span>
          </span>
          <span>·</span>
          {/* Member count */}
          <span className="inline-flex items-center gap-1">
            <svg className="h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <span>{hub.membersLabel}</span>
          </span>
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

/* ── Hub list grid ───────────────────────────────────────────────── */

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

/* ── Category icon pill ──────────────────────────────────────────── */

function CategoryIcon({
  def,
  isActive,
  onClick,
}: {
  def: CategoryDef;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 py-2 transition-transform duration-150 hover:scale-105"
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-all duration-150",
          isActive
            ? "ring-2 ring-[var(--ud-brand-primary)] ring-offset-2 shadow-md"
            : "shadow-sm"
        )}
        style={{ backgroundColor: def.color }}
      >
        {def.emoji}
      </div>
      <span
        className={cn(
          "text-[11px] font-medium leading-tight text-center line-clamp-1",
          isActive ? "text-[var(--ud-brand-primary)] font-semibold" : "text-[var(--ud-text-secondary)]"
        )}
      >
        {def.label}
      </span>
    </button>
  );
}

/* ── Main page component ─────────────────────────────────────────── */

export default function DiscoverPageContent({ initialHubs }: { initialHubs?: any[] }) {
  const searchParams = useSearchParams();
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<DisplayCategory>("All");
  const [supabaseHubs, setSupabaseHubs] = useState<Hub[]>(() =>
    (initialHubs ?? []).map((h: any) => toDiscoverHub(h, h._memberCount ?? undefined))
  );
  const [supabaseLoadState, setSupabaseLoadState] = useState<SupabaseLoadState>(initialHubs && initialHubs.length > 0 ? "success" : "idle");
  const [supabaseLoadError, setSupabaseLoadError] = useState<string | null>(null);

  // Category strip scrolling
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollArrows = () => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    updateScrollArrows();

    const onScroll = () => updateScrollArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => updateScrollArrows();
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollStripBy = (delta: number) => {
    stripRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Auth & hub loading
  useEffect(() => {
    let cancelled = false;

    getCurrentSession()
      .then(async (session) => {
        if (cancelled) return;
        setIsAuthenticated(Boolean(session));

        if (session) {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            // Same scope as public discover: include hubs you created (do not exclude `created_by`).
            // A previous `.neq(created_by, user)` caused SSR to show your hub then client refresh hid it.
            const { data, error } = await supabase
              .from("hubs")
              .select("*")
              .order("created_at", { ascending: false });
            if (!cancelled && data && !error) {
              // Fetch active member counts for all discovered hubs
              const hubIds = data.map((h) => h.id);
              const countMap = new Map<string, number>();
              if (hubIds.length > 0) {
                const { data: memberRows } = await supabase
                  .from("hub_members")
                  .select("hub_id")
                  .in("hub_id", hubIds)
                  .eq("status", "active");
                for (const row of memberRows ?? []) {
                  countMap.set(row.hub_id, (countMap.get(row.hub_id) ?? 0) + 1);
                }
              }
              setSupabaseHubs(data.map((h) => toDiscoverHub(h, countMap.get(h.id))));
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

    return () => { cancelled = true; };
  }, []);

  // Filtering
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

  const allFilteredHubs = useMemo(() => {
    if (activeCategory === "All") return baseFiltered;
    return baseFiltered.filter((h) => h.categorySlug === activeCategory);
  }, [activeCategory, baseFiltered]);

  const createHubHref = isDemoPreview
    ? "/create-hub?demo_preview=1"
    : isAuthenticated
      ? "/create-hub"
      : ROUTE_AUTH;

  return (
    <div className={cn("flex min-h-screen flex-col", PAGE_BG)}>
      <UdeetsHeader />

      <div className="flex flex-1 flex-col">
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

      {/* ── Category strip with round icons ─────────────────────── */}
      <section className="border-b border-[var(--ud-border)] bg-[var(--ud-bg-card)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <div className="relative flex items-center">
            {/* Left scroll arrow */}
            {canScrollLeft ? (
              <button
                type="button"
                aria-label="Scroll categories left"
                onClick={() => scrollStripBy(-200)}
                className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-muted)] shadow-sm transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
            ) : null}

            {/* Scrollable category strip */}
            <div
              ref={stripRef}
              className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto px-1 py-1"
              style={{ scrollbarWidth: "none" }}
            >
              {/* "All" pill */}
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 py-2 transition-transform duration-150 hover:scale-105"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-all duration-150",
                    activeCategory === "All"
                      ? "ring-2 ring-[var(--ud-brand-primary)] ring-offset-2 shadow-md"
                      : "shadow-sm"
                  )}
                  style={{ backgroundColor: "#E3F1EF" }}
                >
                  🌐
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight",
                    activeCategory === "All" ? "text-[var(--ud-brand-primary)] font-semibold" : "text-[var(--ud-text-secondary)]"
                  )}
                >
                  All
                </span>
              </button>

              {/* Location pill */}
              <Link
                href="/discover/location"
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 py-2 transition-transform duration-150 hover:scale-105"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm"
                  style={{ backgroundColor: "#F0FDF4" }}
                >
                  📍
                </div>
                <span className="text-[11px] font-medium leading-tight text-[var(--ud-text-secondary)]">
                  Near Me
                </span>
              </Link>

              {/* Category icons */}
              {CATEGORY_DEFS.map((def) => (
                <CategoryIcon
                  key={def.slug}
                  def={def}
                  isActive={activeCategory === def.slug}
                  onClick={() => setActiveCategory(def.slug)}
                />
              ))}
            </div>

            {/* Right scroll arrow */}
            {canScrollRight ? (
              <button
                type="button"
                aria-label="Scroll categories right"
                onClick={() => scrollStripBy(200)}
                className="z-10 ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-muted)] shadow-sm transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            ) : null}

            {/* Create Hub — sticky at the visible end */}
            <div className="shrink-0 border-l border-[var(--ud-border-subtle)] pl-2 ml-1">
              <Link
                href={createHubHref}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 py-2 transition-transform duration-150 hover:scale-105"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold leading-tight text-[var(--ud-brand-primary)]">
                  Create Hub
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hub list ─────────────────────────────────────────────── */}
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
      </div>

      <UdeetsFooter />
    </div>
  );
}
