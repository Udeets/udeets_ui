"use client";

import { Briefcase, Loader2, MapPin, Newspaper, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MockAppShell, { cardClass } from "@/components/mock-app-shell";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import { listMyMemberships } from "@/lib/services/members/list-my-memberships";
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

function resolveCategory(deet: DeetRecord): LocalFilter | null {
  const kind = deet.kind?.toLowerCase() || "";
  if (kind === "deals") return "deals";
  if (kind === "news") return "news";
  // Future: if (kind === "jobs") return "jobs";
  return null;
}

export default function LocalPageClient() {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LocalFilter>("all");
  const [hubMap, setHubMap] = useState<Map<string, { name: string; href: string }>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadLocal() {
      try {
        const memberships = await listMyMemberships();
        const hubIds = memberships.map((m) => m.hubId);

        if (!hubIds.length) {
          if (!cancelled) { setItems([]); setIsLoading(false); }
          return;
        }

        const hubs = await listHubs();
        const hMap = new Map<string, { name: string; href: string }>();
        for (const hub of hubs) {
          hMap.set(hub.id, { name: hub.name, href: `/hubs/${hub.category}/${hub.slug}` });
        }
        if (!cancelled) setHubMap(hMap);

        const allDeets = await listDeets({ hubIds, limit: 200 });

        const localKinds = new Set(["Deals", "News"]);
        const localDeets = allDeets.filter((d) => localKinds.has(d.kind));

        if (!cancelled) {
          setItems(
            localDeets.map((d) => {
              const hubInfo = hMap.get(d.hub_id);
              const category = resolveCategory(d) || "news";
              return {
                id: d.id,
                title: d.title || "Untitled",
                body: d.body || "",
                source: d.author_name || "Hub member",
                hubName: hubInfo?.name || "Hub",
                hubHref: hubInfo?.href || "/dashboard",
                kind: d.kind,
                category,
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
            <p className="text-xs text-[var(--ud-text-muted)]">Deals, news, and more from your communities</p>
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
        ) : activeFilter === "jobs" ? (
          /* Jobs — coming soon */
          <article className={cardClass("p-6 text-center")}>
            <div className="flex justify-center">
              <Briefcase className="h-10 w-10 text-[var(--ud-text-muted)]" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-[var(--ud-text-primary)]">Local Jobs coming soon</h2>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              We&apos;re building a local jobs feed from community hubs and local employers. Stay tuned!
            </p>
          </article>
        ) : filtered.length > 0 ? (
          filtered.map((item) => {
            const badge = CATEGORY_BADGE[item.category] || CATEGORY_BADGE.news;
            const cleanBody = item.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            const genericTitles = new Set(["Deet", "News", "Deal", "Photo", "Notice"]);
            const hasOriginalTitle = !!(item.title && !genericTitles.has(item.title));
            const displayTitle = hasOriginalTitle ? item.title : (cleanBody.slice(0, 80) || badge.label);

            return (
              <article key={item.id} className={cardClass("overflow-hidden")}>
                {item.imageUrl ? (
                  <div className="h-40 w-full bg-[var(--ud-bg-subtle)]">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <Link
                      href={item.hubHref}
                      className="text-xs font-medium text-[var(--ud-brand-primary)] hover:underline"
                    >
                      {item.hubName}
                    </Link>
                    <span className="text-xs text-[var(--ud-text-muted)]">{item.time}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-[var(--ud-text-primary)] line-clamp-2">{displayTitle}</h2>
                  {hasOriginalTitle && cleanBody ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--ud-text-secondary)] line-clamp-3">{cleanBody}</p>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <article className={cardClass("p-6 text-center")}>
            <div className="flex justify-center">
              <MapPin className="h-10 w-10 text-[var(--ud-text-muted)]" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-[var(--ud-text-primary)]">
              {activeFilter === "deals" ? "No deals yet" : activeFilter === "news" ? "No local news yet" : "Nothing here yet"}
            </h2>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              {activeFilter === "deals"
                ? "Deals from your community hubs will appear here when they're posted."
                : activeFilter === "news"
                  ? "News updates from your hubs will appear here."
                  : "Local deals, news, and updates from your communities will show up here."}
            </p>
          </article>
        )}
      </div>
    </MockAppShell>
  );
}
