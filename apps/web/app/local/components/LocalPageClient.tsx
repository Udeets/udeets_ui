"use client";

import { AlertTriangle, Briefcase, Calendar, Loader2, MapPin, Newspaper, ShieldAlert, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MockAppShell, { cardClass } from "@/components/mock-app-shell";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import type { DeetRecord } from "@/lib/services/deets/deet-types";

type LocalFilter = "all" | "deals" | "news" | "jobs";

interface LocalItem {
  id: string;
  title: string;
  body: string;
  source: string;
  hubName: string;
  hubHref: string;
  kind: string;
  category: LocalFilter;
  tags: string[];
  time: string;
  imageUrl: string | null;
}

const FILTER_CHIPS: Array<{ key: LocalFilter; label: string; icon: typeof Tag }> = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "deals", label: "Deals", icon: Tag },
  { key: "news", label: "News", icon: Newspaper },
  { key: "jobs", label: "Jobs", icon: Briefcase },
];

const CATEGORY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  deals: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Deal" },
  news: { bg: "bg-blue-100", text: "text-blue-700", label: "News" },
  jobs: { bg: "bg-purple-100", text: "text-purple-700", label: "Job" },
};

/* ── Tag badge configs for news sub-categories ── */
const NEWS_TAG_BADGE: Record<string, { bg: string; text: string; icon: typeof AlertTriangle; label: string }> = {
  alerts: { bg: "bg-amber-100", text: "text-amber-700", icon: ShieldAlert, label: "Alert" },
  burglary: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle, label: "Burglary" },
  events: { bg: "bg-violet-100", text: "text-violet-700", icon: Calendar, label: "Event" },
};

function formatLocalTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Extract price from deal body HTML, e.g. "<b>$12.99</b>" → "$12.99" */
function extractPrice(html: string): string | null {
  const match = html.match(/\$[\d,]+(?:\.\d{2})?(?:\/\w+)?/);
  return match ? match[0] : null;
}

/** Extract "was" / "Reg." price */
function extractOriginalPrice(html: string): string | null {
  const regMatch = html.match(/(?:Reg\.|Was|was)\s*\$[\d,]+(?:\.\d{2})?/i);
  if (regMatch) {
    const price = regMatch[0].match(/\$[\d,]+(?:\.\d{2})?/);
    return price ? price[0] : null;
  }
  return null;
}

/** Strip HTML tags */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse tags from a tag string like "news+alerts+burglary" */
function parseTags(tagStr: string): string[] {
  return tagStr.split("+").map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function resolveCategory(deet: DeetRecord): LocalFilter | null {
  const kind = deet.kind?.toLowerCase() || "";
  if (kind === "deals") return "deals";
  if (kind === "news" || kind === "alerts") return "news";
  if (kind === "jobs") return "jobs";
  return null;
}

/* ── Flipp-style Deal Card ── */
function DealCard({ item }: { item: LocalItem }) {
  const price = extractPrice(item.body);
  const originalPrice = extractOriginalPrice(item.body);
  const cleanBody = stripHtml(item.body);
  // Remove the price portion from clean body for the description
  const descriptionText = cleanBody
    .replace(/\$[\d,]+(?:\.\d{2})?(?:\/\w+)?/g, "")
    .replace(/\(Reg\.[^)]*\)/gi, "")
    .replace(/\(Was[^)]*\)/gi, "")
    .replace(/\s*—\s*/g, " — ")
    .replace(/^\s*—?\s*/, "")
    .trim();

  return (
    <article className={cardClass("overflow-hidden border-l-4 border-l-emerald-500")}>
      <div className="p-4">
        {/* Store name + time */}
        <div className="flex items-center justify-between">
          <Link href={item.hubHref} className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
              {item.hubName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-emerald-700">{item.hubName}</span>
          </Link>
          <span className="text-[11px] text-[var(--ud-text-muted)]">{item.time}</span>
        </div>

        {/* Product title */}
        <h3 className="mt-2.5 text-[15px] font-bold leading-snug text-[var(--ud-text-primary)]">{item.title}</h3>

        {/* Price block — Flipp style */}
        {price ? (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{price}</span>
            {originalPrice ? (
              <span className="text-sm text-[var(--ud-text-muted)] line-through">{originalPrice}</span>
            ) : null}
          </div>
        ) : null}

        {/* Deal details */}
        {descriptionText ? (
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ud-text-secondary)] line-clamp-2">{descriptionText}</p>
        ) : null}

        {/* Deal badge */}
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <Tag className="h-3 w-3" />
            Deal
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── News Card with tag badges ── */
function NewsCard({ item }: { item: LocalItem }) {
  const cleanBody = stripHtml(item.body);
  const subTags = item.tags.filter((t) => t !== "news");

  return (
    <article className={cardClass("overflow-hidden")}>
      {item.imageUrl ? (
        <div className="h-40 w-full bg-[var(--ud-bg-subtle)]">
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <div className="p-4">
        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
            <Newspaper className="h-3 w-3" />
            News
          </span>
          {subTags.map((tag) => {
            const meta = NEWS_TAG_BADGE[tag];
            if (!meta) return null;
            const TagIcon = meta.icon;
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${meta.bg} ${meta.text} ring-current/20`}
              >
                <TagIcon className="h-3 w-3" />
                {meta.label}
              </span>
            );
          })}
          <span className="ml-auto text-[11px] text-[var(--ud-text-muted)]">{item.time}</span>
        </div>

        {/* Source */}
        <Link href={item.hubHref} className="mt-2 block text-xs font-medium text-[var(--ud-brand-primary)] hover:underline">
          {item.hubName}
        </Link>

        {/* Title + body */}
        <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-[var(--ud-text-primary)] line-clamp-2">{item.title}</h3>
        {cleanBody ? (
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ud-text-secondary)] line-clamp-2">{cleanBody}</p>
        ) : null}
      </div>
    </article>
  );
}

/* ── Job Card ── */
function JobCard({ item }: { item: LocalItem }) {
  const cleanBody = stripHtml(item.body);
  const price = extractPrice(item.body);

  return (
    <article className={cardClass("overflow-hidden border-l-4 border-l-purple-500")}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Link href={item.hubHref} className="text-xs font-semibold text-purple-700 hover:underline">{item.hubName}</Link>
          <span className="text-[11px] text-[var(--ud-text-muted)]">{item.time}</span>
        </div>
        <h3 className="mt-2 text-[15px] font-bold leading-snug text-[var(--ud-text-primary)]">{item.title}</h3>
        {price ? <p className="mt-1 text-sm font-semibold text-purple-600">{price}</p> : null}
        {cleanBody ? (
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ud-text-secondary)] line-clamp-2">{cleanBody}</p>
        ) : null}
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-200">
            <Briefcase className="h-3 w-3" />
            Job
          </span>
        </div>
      </div>
    </article>
  );
}

export default function LocalPageClient() {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LocalFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadLocal() {
      try {
        // Local is a platform-wide feed of deals / news / jobs / alerts
        // pulled from every hub, whether the viewer is a member or not.
        // That's the whole point of "local" — surfacing community signals
        // beyond the user's current subscriptions.
        const hubs = await listHubs();
        const hMap = new Map<string, { name: string; href: string }>();
        for (const hub of hubs) {
          hMap.set(hub.id, { name: hub.name, href: `/hubs/${hub.category}/${hub.slug}` });
        }

        const localKinds = ["Deals", "News", "Jobs", "Alerts", "Hazards"];
        const localDeets = await listDeets({ kinds: localKinds, limit: 200 });

        if (!cancelled) {
          setItems(
            localDeets.map((d) => {
              const hubInfo = hMap.get(d.hub_id);
              const category = resolveCategory(d) || "news";
              // Parse tags from title prefix pattern or kind
              let tags: string[] = ["news"];
              if (category === "deals") {
                tags = ["deals"];
              } else if (category === "jobs") {
                tags = ["jobs"];
              } else {
                // For news, check if kind is "Alerts" to add alert tag
                if (d.kind === "Alerts") {
                  tags = ["news", "alerts"];
                }
                // Also check body or title for clues about sub-tags
                const lowerTitle = (d.title || "").toLowerCase();
                const lowerBody = (d.body || "").toLowerCase();
                if (lowerTitle.includes("burglar") || lowerBody.includes("burglar") || lowerBody.includes("break-in") || lowerBody.includes("theft")) {
                  if (!tags.includes("burglary")) tags.push("burglary");
                }
                if (lowerTitle.includes("meetup") || lowerTitle.includes("event") || lowerTitle.includes("kicks off") || lowerBody.includes("restaurant week") || lowerBody.includes("community meetup")) {
                  if (!tags.includes("events")) tags.push("events");
                }
              }

              // Route every Local click through the hub's /join page with
              // the deet id attached. The join page handles:
              //  - already a member → forward to /hubs/…?tab=Posts&focus=<deet>
              //  - public hub, not a member → auto-join then forward
              //  - private hub, not a member → request to join + show pending
              // This gives us one click handler that's correct for every
              // membership + visibility combination, and it's also how the
              // Local feed respects private hubs: the full post body only
              // renders after approval.
              const hubHref = hubInfo?.href
                ? `${hubInfo.href}/join?deet=${encodeURIComponent(d.id)}`
                : "/dashboard";

              return {
                id: d.id,
                title: d.title || "Untitled",
                body: d.body || "",
                source: d.author_name || "Hub member",
                hubName: hubInfo?.name || "Hub",
                hubHref,
                kind: d.kind,
                category,
                tags,
                time: formatLocalTime(d.created_at),
                imageUrl: d.preview_image_url || null,
              };
            })
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load local feed:", err);
        if (!cancelled) { setItems([]); setIsLoading(false); }
      }
    }

    void loadLocal();

    const unsubscribe = subscribeToDeets(() => {
      void loadLocal();
    });

    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.category === activeFilter);
  }, [items, activeFilter]);

  return (
    <MockAppShell activeNav="local">
      {/* Header */}
      <section className="mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ud-brand-primary)]/10">
            <MapPin className="h-5 w-5 text-[var(--ud-brand-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Local</h1>
            <p className="text-xs text-[var(--ud-text-muted)]">Deals, news, jobs &amp; more from your communities</p>
          </div>
        </div>
      </section>

      {/* Filter chips */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTER_CHIPS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === key
                ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-primary)] text-white"
                : "border-[var(--ud-border)] bg-[var(--ud-bg)] text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--ud-brand-primary)]" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((item) => {
            if (item.category === "deals") return <DealCard key={item.id} item={item} />;
            if (item.category === "jobs") return <JobCard key={item.id} item={item} />;
            return <NewsCard key={item.id} item={item} />;
          })
        ) : (
          <article className={cardClass("p-6 text-center")}>
            <div className="flex justify-center">
              {activeFilter === "deals" ? (
                <Tag className="h-10 w-10 text-[var(--ud-text-muted)]" />
              ) : activeFilter === "jobs" ? (
                <Briefcase className="h-10 w-10 text-[var(--ud-text-muted)]" />
              ) : activeFilter === "news" ? (
                <Newspaper className="h-10 w-10 text-[var(--ud-text-muted)]" />
              ) : (
                <MapPin className="h-10 w-10 text-[var(--ud-text-muted)]" />
              )}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-[var(--ud-text-primary)]">
              {activeFilter === "deals" ? "No deals yet" : activeFilter === "news" ? "No local news yet" : activeFilter === "jobs" ? "No local jobs yet" : "Nothing here yet"}
            </h2>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              {activeFilter === "deals"
                ? "Deals from your community hubs will appear here when they're posted."
                : activeFilter === "news"
                  ? "News updates from your hubs will appear here."
                  : activeFilter === "jobs"
                    ? "Job postings from your hubs will appear here."
                    : "Local deals, news, and updates from your communities will show up here."}
            </p>
          </article>
        )}
      </div>
    </MockAppShell>
  );
}
