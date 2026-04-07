"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CirclePlus,
  Home,
  LogOut,
  Search,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import { useTheme } from "@/components/theme-provider";
import type { HubNotificationItem, HubEventItem } from "@/lib/hub-content";
import { isUdeetsLogoSrc, UDEETS_LOGO_SRC } from "@/lib/branding";
import { can } from "@/lib/roles";
import { usePlatformRole } from "@/hooks/useUserRole";
import { signOut } from "@/services/auth/signOut";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function truncateLine(value: string, max = 64) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

export type NavKey = "home" | "search" | "create" | "alerts" | "profile";

type OpenPanel = "alerts" | "events" | "profile" | null;

const HEADER_BG = "bg-[var(--ud-bg-card)] border-b border-[var(--ud-border-subtle)]";
const FOOTER_BG = "bg-[#0C5C57]";
const BOTTOM_NAV_BG = "bg-white";
const TEXT_MUTED = "text-gray-400";
const TEXT_ACTIVE = "text-[#0C5C57]";
const ICON_BASE = "h-5 w-5 stroke-[1.8]";

const PRIMARY_ITEMS = [
  { href: "/dashboard", label: "Home", key: "home" },
  { href: "/alerts", label: "Alerts", key: "alerts" },
  { href: "/events", label: "Events", key: "events" },
] as const;

const PROFILE_ITEMS = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/create-hub", label: "Create Hub", icon: CirclePlus },
];

const FILTERS = ["All", "Tagged", "New Posts", "Activity"] as const;

const EVENT_FILTERS = ["Today", "Tomorrow", "This Week", "My Hubs", "Saved"] as const;

function NavIconButton({
  active = false,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative rounded-full p-2 transition",
        active ? "bg-[#A9D1CA] text-[#0C5C57]" : "text-[var(--ud-text-secondary)] hover:bg-[#E3F1EF]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function NavIconLink({
  href,
  active = false,
  children,
  ariaLabel,
  className,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "relative rounded-full p-2 transition",
        active ? "bg-[#A9D1CA] text-[#0C5C57]" : "text-[var(--ud-text-secondary)] hover:bg-[#E3F1EF]",
        className
      )}
    >
      {children}
    </Link>
  );
}

function NotificationsPanel({ notifications }: { notifications: HubNotificationItem[] }) {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const filteredItems = notifications.filter((item) => activeFilter === "All" || item.type === activeFilter);

  return (
    <div
      data-demo-target={isDemoPreview ? "dashboard-alerts-dropdown" : undefined}
      className="absolute right-0 top-full z-[120] mt-3 w-[calc(100vw-2rem)] max-w-[360px] rounded-3xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:right-16"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">Notifications</h3>
        <button
          type="button"
          onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))}
          className="text-sm font-medium text-[#0C5C57] hover:opacity-80"
        >
          Mark all as read
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              activeFilter === filter
                ? "bg-[#A9D1CA]/55 text-[#0C5C57]"
                : "bg-[#F7FBFA] text-slate-600 hover:bg-slate-100"
            )}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            (() => {
              const imageSrc = item.hubImage || UDEETS_LOGO_SRC;
              const isLogo = isUdeetsLogoSrc(imageSrc);

              return (
                <Link
                  key={item.id}
                  href={
                    isDemoPreview
                      ? `${item.href}${item.href.includes("?") ? "&" : "?"}demo_preview=1`
                      : item.href
                  }
                  title={truncateLine(item.body, 96)}
                  data-demo-target={
                    isDemoPreview && item.title === "Free Pet Check-up in Mechanicsville"
                      ? "dashboard-alert-item"
                      : undefined
                  }
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-[#EEF7F5]",
                    readIds.has(item.id) && "opacity-55",
                  )}
                  onClick={() => setReadIds((prev) => new Set([...prev, item.id]))}
                >
                  <div className={cn("relative h-9 w-9 shrink-0 overflow-hidden", !isLogo && "rounded-full border border-slate-200 bg-[#E3F1EF]")}>
                    <Image
                      src={imageSrc}
                      alt={item.hub}
                      fill
                      className={cn(isLogo ? "object-contain" : "object-cover")}
                      sizes="36px"
                    />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ud-text-primary)]">
                    {`${item.hub} — ${item.title}`}
                  </p>
                  <span className="shrink-0 text-[11px] font-medium text-slate-500">{item.meta}</span>
                  <span className="pointer-events-none absolute left-12 top-full z-10 mt-1 max-w-[280px] rounded-full bg-[#111111] px-3 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                    {truncateLine(item.body, 78)}
                  </span>
                </Link>
              );
            })()
          ))
        ) : (
          <p className="rounded-2xl bg-[#F7FBFA] px-4 py-4 text-sm text-slate-500">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}

function EventsPanel({ events }: { events: HubEventItem[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof EVENT_FILTERS)[number]>("Today");
  const filteredGroups = events.filter((event) => {
    if (activeFilter === "Today") return event.group === "Today";
    if (activeFilter === "Tomorrow") return event.group === "Tomorrow";
    if (activeFilter === "This Week") return event.group === "This Week";
    if (activeFilter === "My Hubs") return event.badge === "My Hubs";
    return event.badge === "Saved";
  }).reduce<Record<string, HubEventItem[]>>((acc, event) => {
    acc[event.group] ||= [];
    acc[event.group].push(event);
    return acc;
  }, {});

  return (
    <div className="absolute right-0 top-full z-[120] mt-3 w-[calc(100vw-2rem)] max-w-[380px] rounded-3xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:right-16">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">Events</h3>
        <Link href="/events" className="text-sm font-medium text-[#0C5C57] hover:opacity-80">
          View all
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EVENT_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              activeFilter === filter
                ? "bg-[#A9D1CA]/55 text-[#0C5C57]"
                : "bg-[#F7FBFA] text-slate-600 hover:bg-slate-100"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {Object.keys(filteredGroups).length ? (
          Object.entries(filteredGroups).map(([groupTitle, items]) => (
            <section key={groupTitle}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {groupTitle}
              </h4>
              <div className="space-y-1.5">
                {items.map((event) => (
                  (() => {
                    const imageSrc = event.hubImage || UDEETS_LOGO_SRC;
                    const isLogo = isUdeetsLogoSrc(imageSrc);

                    return (
                      <Link
                        key={event.id}
                        href={event.href}
                        title={truncateLine(`${event.dateLabel} • ${event.time} • ${event.location}`, 96)}
                        className="group relative flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-[#EEF7F5]"
                      >
                        <div className={cn("relative h-9 w-9 shrink-0 overflow-hidden", !isLogo && "rounded-full border border-slate-200 bg-[#E3F1EF]")}>
                          <Image
                            src={imageSrc}
                            alt={event.hub}
                            fill
                            className={cn(isLogo ? "object-contain" : "object-cover")}
                            sizes="36px"
                          />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ud-text-primary)]">
                          {`${event.hub} — ${event.title}`}
                        </p>
                        <span className="shrink-0 text-[11px] font-medium text-slate-500">{event.dateLabel}</span>
                        <span className="pointer-events-none absolute left-12 top-full z-10 mt-1 max-w-[300px] rounded-full bg-[#111111] px-3 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                          {truncateLine(`${event.time} • ${event.location}`, 78)}
                        </span>
                      </Link>
                    );
                  })()
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="rounded-2xl bg-[#F7FBFA] px-4 py-4 text-sm text-slate-500">No events yet.</p>
        )}
      </div>
    </div>
  );
}

function ProfilePanel({ user, onLogout, profileData }: { user: { email?: string; user_metadata?: Record<string, unknown> } | null; onLogout: () => void; profileData?: { fullName: string | null; avatarUrl: string | null } | null }) {
  const displayName = profileData?.fullName || (user?.user_metadata?.full_name as string) || user?.email || "uDeets User";
  const displayEmail = user?.email || "";
  const avatarUrl = profileData?.avatarUrl || (user?.user_metadata?.avatar_url as string) || "";
  const { theme, toggleTheme } = useTheme();
  const { role: profilePanelRole } = usePlatformRole();
  const canAccessAdmin = can(profilePanelRole, "page:admin_panel");

  return (
    <div className="absolute right-0 top-full z-[120] mt-3 w-[calc(100vw-2rem)] max-w-[260px] overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-lg sm:w-auto sm:min-w-[220px]">
      {/* User identity card */}
      <div className="flex items-center gap-3 rounded-t-xl bg-[var(--ud-bg-subtle)] px-4 py-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm font-semibold text-white/80">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{displayName}</p>
          <p className="truncate text-xs text-gray-500">{displayEmail}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="border-t border-[var(--ud-border-subtle)] py-1">
        {PROFILE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
            >
              <Icon className="h-4 w-4 stroke-[1.8] text-gray-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin panel link (super_admin only) */}
      {canAccessAdmin ? (
        <div className="border-t border-[var(--ud-border-subtle)] py-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <Shield className="h-4 w-4 stroke-[1.8]" />
            <span>Admin Panel</span>
          </Link>
        </div>
      ) : null}

      {/* Theme toggle */}
      <div className="border-t border-[var(--ud-border-subtle)] py-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-[var(--ud-border-subtle)] py-1">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4 stroke-[1.8]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function UdeetsHeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, status, user } = useAuthSession();
  const { role: platformRole } = usePlatformRole();
  const canAccessDashboard = can(platformRole, "page:dashboard");
  const [openPanel, setOpenPanel] = useState<OpenPanel>(searchParams.get("demo_open_panel") === "alerts" ? "alerts" : null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  // Fetch profile from DB so custom name/avatar are shown (not just OAuth metadata)
  const [profileData, setProfileData] = useState<{ fullName: string | null; avatarUrl: string | null } | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    let ignore = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (!ignore && data) {
        setProfileData({ fullName: data.full_name, avatarUrl: data.avatar_url });
      }
    })();
    return () => { ignore = true; };
  }, [user?.id]);
  const resolvedAvatarUrl = profileData?.avatarUrl || (user?.user_metadata?.avatar_url as string) || "";

  // ── Live notifications & events from Supabase ──
  const [liveNotifications, setLiveNotifications] = useState<HubNotificationItem[]>([]);
  const [liveEvents, setLiveEvents] = useState<HubEventItem[]>([]);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);

  // Subscribe to deet/event changes so header refreshes when new data arrives
  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabaseRef: any = null;

    (async () => {
      const { createClient: createSupa } = await import("@/lib/supabase/client");
      supabaseRef = createSupa();
      channel = supabaseRef
        .channel("header-deets-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "deets" }, () => {
          setHeaderRefreshKey((k) => k + 1);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
          setHeaderRefreshKey((k) => k + 1);
        })
        .subscribe();
    })();

    return () => {
      if (channel && supabaseRef) {
        void supabaseRef.removeChannel(channel);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLiveNotifications([]);
      setLiveEvents([]);
      return;
    }

    let ignore = false;

    (async () => {
      try {
        const { createClient: createSupa } = await import("@/lib/supabase/client");
        const supabase = createSupa();

        // 1. Get user's hub memberships
        const { data: memberships } = await supabase
          .from("hub_members")
          .select("hub_id, role, status")
          .eq("user_id", user.id);

        const activeHubIds = (memberships ?? [])
          .filter((m: { status: string }) => m.status === "active")
          .map((m: { hub_id: string }) => m.hub_id);

        if (!activeHubIds.length || ignore) return;

        // 2. Fetch hub metadata for names, slugs, categories, images
        const { data: hubRows } = await supabase
          .from("hubs")
          .select("id, name, slug, category, dp_image_url")
          .in("id", activeHubIds);

        const hubMap = new Map(
          (hubRows ?? []).map((h: { id: string; name: string; slug: string; category: string; dp_image_url: string | null }) => [
            h.id,
            { name: h.name, slug: h.slug, category: h.category, dpImage: h.dp_image_url },
          ])
        );

        // 3. Fetch recent deets for notifications
        const { data: recentDeets } = await supabase
          .from("deets")
          .select("id, hub_id, author_name, title, body, kind, created_at")
          .in("hub_id", activeHubIds)
          .order("created_at", { ascending: false })
          .limit(30);

        if (ignore) return;

        const notifications: HubNotificationItem[] = (recentDeets ?? []).map(
          (d: { id: string; hub_id: string; author_name: string; title: string; body: string; kind: string; created_at: string }) => {
            const hub = hubMap.get(d.hub_id);
            const hubName = hub?.name ?? "Hub";
            const hubSlug = hub?.slug ?? "";
            const hubCategory = hub?.category ?? "";
            const hubImage = hub?.dpImage ?? undefined;
            const bodyText = (d.body || "").replace(/<[^>]*>/g, "").slice(0, 120);

            // Map kind to notification type
            let type: "Tagged" | "New Posts" | "Activity" = "New Posts";
            if (d.kind === "Notices" || d.kind === "Alerts") type = "Tagged";
            else if (d.kind === "Posts" || d.kind === "Photos" || d.kind === "News") type = "New Posts";
            else type = "Activity";

            // Relative time label
            const createdMs = new Date(d.created_at).getTime();
            const diffMins = Math.round((Date.now() - createdMs) / 60000);
            let meta = "Just now";
            if (diffMins >= 1440) meta = `${Math.floor(diffMins / 1440)}d`;
            else if (diffMins >= 60) meta = `${Math.floor(diffMins / 60)}h`;
            else if (diffMins >= 1) meta = `${diffMins}m`;

            return {
              id: d.id,
              title: d.title || d.author_name,
              body: bodyText || d.title || "New post",
              meta,
              hub: hubName,
              hubImage,
              type,
              category: hubCategory as import("@/lib/hubs").HubCategorySlug,
              slug: hubSlug,
              focusId: d.id,
              href: `/hubs/${hubCategory}/${hubSlug}?focus=${d.id}`,
            };
          }
        );

        // 4. Fetch events for events panel
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
        const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

        const { data: eventRows } = await supabase
          .from("events")
          .select("id, hub_id, title, description, event_date, start_time, end_time, location")
          .in("hub_id", activeHubIds)
          .gte("event_date", todayStr)
          .lte("event_date", endOfWeekStr)
          .order("event_date", { ascending: true })
          .limit(30);

        if (ignore) return;

        // Also check deets with event kind for events added via deet composer
        const { data: eventDeets } = await supabase
          .from("deets")
          .select("id, hub_id, author_name, title, body, kind, attachments, created_at")
          .in("hub_id", activeHubIds)
          .or("kind.eq.Hazards,kind.eq.Alerts")
          .order("created_at", { ascending: false })
          .limit(20);

        const eventItems: HubEventItem[] = [];

        // Map events table rows
        for (const ev of eventRows ?? []) {
          const hub = hubMap.get(ev.hub_id as string);
          if (!hub) continue;
          const evDate = ev.event_date as string;
          let group: "Today" | "Tomorrow" | "This Week" = "This Week";
          if (evDate === todayStr) group = "Today";
          else if (evDate === tomorrowStr) group = "Tomorrow";

          eventItems.push({
            id: ev.id as string,
            title: (ev.title as string) || "Event",
            hub: hub.name,
            hubImage: hub.dpImage ?? undefined,
            category: hub.category as import("@/lib/hubs").HubCategorySlug,
            slug: hub.slug,
            dateLabel: new Date(evDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            time: (ev.start_time as string) || "",
            location: (ev.location as string) || "",
            badge: "My Hubs",
            theme: "Community" as const,
            description: (ev.description as string) || "",
            focusId: ev.id as string,
            href: `/hubs/${hub.category}/${hub.slug}?focus=${ev.id}`,
            group,
          });
        }

        // Map deets with event-like attachments (events created via composer)
        for (const d of eventDeets ?? []) {
          const hub = hubMap.get(d.hub_id as string);
          if (!hub) continue;
          const attachments = Array.isArray(d.attachments) ? d.attachments : [];
          const eventAtt = attachments.find((a: { type?: string }) => a?.type === "event");
          if (!eventAtt) continue;

          const createdDate = new Date(d.created_at as string);
          const createdStr = createdDate.toISOString().split("T")[0];
          let group: "Today" | "Tomorrow" | "This Week" = "This Week";
          if (createdStr === todayStr) group = "Today";
          else if (createdStr === tomorrowStr) group = "Tomorrow";

          eventItems.push({
            id: d.id as string,
            title: (eventAtt as { title?: string }).title || (d.title as string) || "Event",
            hub: hub.name,
            hubImage: hub.dpImage ?? undefined,
            category: hub.category as import("@/lib/hubs").HubCategorySlug,
            slug: hub.slug,
            dateLabel: createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            time: (eventAtt as { detail?: string }).detail || "",
            location: "",
            badge: "My Hubs",
            theme: "Community" as const,
            description: ((d.body as string) || "").replace(/<[^>]*>/g, "").slice(0, 120),
            focusId: d.id as string,
            href: `/hubs/${hub.category}/${hub.slug}?focus=${d.id}`,
            group,
          });
        }

        if (!ignore) {
          setLiveNotifications(notifications);
          setLiveEvents(eventItems);
        }
      } catch (err) {
        console.error("[header-live-data]", err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user?.id, headerRefreshKey]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (openPanel && controlsRef.current && !controlsRef.current.contains(target)) {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openPanel]);

  const handleHome = () => {
    const homeHref = isAuthenticated ? "/dashboard" : "/";

    if (pathname === homeHref) {
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    router.push(homeHref);
  };

  const handleLogout = async () => {
    await signOut();
    setOpenPanel(null);
    router.push("/auth");
    router.refresh();
  };

  const unreadNotifications = liveNotifications.length > 0;
  const isHomeActive = isAuthenticated ? pathname === "/dashboard" : pathname === "/";
  const isDiscoverActive = pathname === "/discover";
  const isAlertsActive = pathname === "/alerts";
  const isEventsActive = pathname === "/events";

  return (
    <header className={cn("sticky top-0 z-30", HEADER_BG)}>
      <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
        <button type="button" onClick={handleHome} className="flex min-w-0 items-center gap-3">
          <UdeetsBrandLockup
            logoClassName="h-10 w-10"
            textClassName="text-2xl"
            priority
          />
        </button>

        <div ref={controlsRef} className="relative flex items-center gap-3">
          {canAccessDashboard ? (
            <nav className="hidden items-center gap-4 md:flex lg:gap-5">
              <NavIconButton
                aria-label="Home"
                active={isHomeActive}
                onClick={handleHome}
              >
                <Home className={ICON_BASE} />
              </NavIconButton>

              <NavIconLink href="/discover" ariaLabel="Discover" active={isDiscoverActive}>
                <Search className={ICON_BASE} />
              </NavIconLink>

              <NavIconButton
                aria-label="Alerts"
                active={isAlertsActive}
                onClick={() => setOpenPanel((panel) => (panel === "alerts" ? null : "alerts"))}
                data-demo-target={searchParams.get("demo_preview") === "1" ? "dashboard-header-alerts" : undefined}
              >
                <Bell className={ICON_BASE} />
                {unreadNotifications ? (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#0C5C57] ring-2 ring-white" />
                ) : null}
              </NavIconButton>

              <NavIconButton
                aria-label="Events"
                active={isEventsActive}
                onClick={() => setOpenPanel((panel) => (panel === "events" ? null : "events"))}
              >
                <Calendar className={ICON_BASE} />
              </NavIconButton>

            </nav>
          ) : null}

          <NavIconLink
            href="/discover"
            ariaLabel="Discover"
            className="border border-slate-200 md:hidden"
          >
            <Search className={ICON_BASE} />
          </NavIconLink>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setOpenPanel((panel) => (panel === "profile" ? null : "profile"))}
              aria-label="Open profile menu"
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#F7FBFA]"
            >
              {resolvedAvatarUrl ? (
                <Image
                  src={resolvedAvatarUrl}
                  alt={user?.email ? `${user.email} profile photo` : "User profile photo"}
                  fill
                  className="object-cover object-center"
                  sizes="40px"
                />
              ) : (
                <UserRound className="h-5 w-5 text-[var(--ud-text-secondary)]" />
              )}
            </button>
          ) : (
            <Link
              href="/auth"
              aria-label="Sign in"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[#E3F1EF]"
            >
              {status === "loading" ? "..." : "Sign in"}
            </Link>
          )}

          {openPanel === "alerts" ? <NotificationsPanel notifications={liveNotifications} /> : null}
          {openPanel === "events" ? <EventsPanel events={liveEvents} /> : null}
          {openPanel === "profile" && isAuthenticated ? <ProfilePanel user={user} onLogout={handleLogout} profileData={profileData} /> : null}
        </div>
      </div>
    </header>
  );
}

export function UdeetsHeader() {
  return (
    <Suspense fallback={null}>
      <UdeetsHeaderContent />
    </Suspense>
  );
}

export function UdeetsFooter() {
  return (
    <footer className={cn(FOOTER_BG, "mt-auto")}>
      <div className="flex min-h-14 w-full items-center justify-center px-4 text-sm text-white sm:px-6 lg:px-10">
        © 2026 uDeets. All rights reserved.
      </div>
    </footer>
  );
}

export function UdeetsBottomNav({ activeNav = "home" }: { activeNav?: NavKey }) {
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 lg:hidden", BOTTOM_NAV_BG)}>
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {/* Home */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "home" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <Home className={ICON_BASE} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Search */}
        <Link
          href="/search"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "search" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <Search className={ICON_BASE} />
          <span className="text-[10px] font-medium">Search</span>
        </Link>

        {/* Center Create button — Band-style raised circle */}
        <div className="flex items-center justify-center">
          <Link
            href="/create-hub"
            className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-[#0C5C57] shadow-lg transition active:scale-95"
            aria-label="Create"
          >
            <CirclePlus className="h-6 w-6 text-white stroke-[2]" />
          </Link>
        </div>

        {/* Alerts */}
        <Link
          href="/alerts"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "alerts" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <Bell className={ICON_BASE} />
          <span className="text-[10px] font-medium">Alerts</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "profile" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <UserRound className={ICON_BASE} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
