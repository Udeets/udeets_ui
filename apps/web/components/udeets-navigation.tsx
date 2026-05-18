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
  MapPin,
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
import { getMyHeaderFeedApi, getProfileSummary } from "@/lib/api/profiles";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function truncateLine(value: string, max = 64) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

export type NavKey = "home" | "alerts" | "events" | "local";

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

function NotificationsPanel({
  notifications,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onClearRead,
}: {
  notifications: HubNotificationItem[];
  readIds: Set<string>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearRead: () => void;
}) {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const filteredItems = notifications.filter((item) => activeFilter === "All" || item.type === activeFilter);
  const readCount = notifications.filter((n) => readIds.has(n.id)).length;
  const hasUnread = notifications.some((n) => !readIds.has(n.id));

  return (
    <div
      data-demo-target={isDemoPreview ? "dashboard-alerts-dropdown" : undefined}
      className="absolute right-0 top-full z-[120] mt-3 w-[calc(100vw-2rem)] max-w-[360px] rounded-3xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:right-16"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">Notifications</h3>
        <div className="flex items-center gap-3 text-sm font-medium">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={!hasUnread}
            className="text-[#0C5C57] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark all as read
          </button>
          <button
            type="button"
            onClick={onClearRead}
            disabled={readCount === 0}
            title={readCount === 0 ? "Nothing to clear yet" : `Clear ${readCount} read notification${readCount === 1 ? "" : "s"}`}
            className="text-slate-500 transition hover:text-[var(--ud-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear read
          </button>
        </div>
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
                  onClick={() => onMarkRead(item.id)}
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">
                      {`${item.hub} — ${item.title}`}
                    </p>
                    {item.id.startsWith("join-") ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Needs action
                      </span>
                    ) : item.id.startsWith("accepted-") ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Accepted
                      </span>
                    ) : null}
                  </div>
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

function UdeetsHeaderContent({ hubSettings }: { hubSettings?: { onOpenSettings?: () => void; onOpenSearch?: () => void; isCreatorAdmin?: boolean } }) {
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
      const summary = await getProfileSummary(user.id);
      if (!ignore && summary) {
        setProfileData({ fullName: summary.fullName, avatarUrl: summary.avatarUrl });
      }
    })();
    return () => { ignore = true; };
  }, [user?.id]);
  const resolvedAvatarUrl = profileData?.avatarUrl || (user?.user_metadata?.avatar_url as string) || "";

  // ── Live notifications & events via FastAPI ──
  const [liveNotifications, setLiveNotifications] = useState<HubNotificationItem[]>([]);
  const [liveEvents, setLiveEvents] = useState<HubEventItem[]>([]);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const onMembersChanged = () => setTimeout(() => setHeaderRefreshKey((k) => k + 1), 400);
    window.addEventListener("hub-members-changed", onMembersChanged);
    window.addEventListener("hub-chat-invites-changed", onMembersChanged);

    return () => {
      window.removeEventListener("hub-members-changed", onMembersChanged);
      window.removeEventListener("hub-chat-invites-changed", onMembersChanged);
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
        const feed = await getMyHeaderFeedApi();
        if (ignore) return;
        setLiveNotifications(feed.notifications ?? []);
        setLiveEvents(feed.events ?? []);
      } catch (err) {
        console.error("[header-live-data]", err);
      }
    })();

    const interval = setInterval(() => {
      setHeaderRefreshKey((value) => value + 1);
    }, 20000);

    return () => {
      ignore = true;
      clearInterval(interval);
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

  // Notification read + cleared state persisted to localStorage so it survives
  // closing the bell, navigating away, and returning later. Without this, every
  // time the panel remounts, every notification looks fresh again.
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());
  const [clearedNotifIds, setClearedNotifIds] = useState<Set<string>>(new Set());

  // Hydrate once on mount.
  useEffect(() => {
    try {
      const readRaw = typeof window !== "undefined" ? localStorage.getItem("udeets:notif-read-v1") : null;
      const clearedRaw = typeof window !== "undefined" ? localStorage.getItem("udeets:notif-cleared-v1") : null;
      if (readRaw) setReadNotifIds(new Set(JSON.parse(readRaw) as string[]));
      if (clearedRaw) setClearedNotifIds(new Set(JSON.parse(clearedRaw) as string[]));
    } catch {
      /* private mode / disabled storage */
    }
  }, []);

  // Persist on change. Cap at 500 entries each to avoid unbounded growth.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const trimmed = Array.from(readNotifIds).slice(-500);
      localStorage.setItem("udeets:notif-read-v1", JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }, [readNotifIds]);
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const trimmed = Array.from(clearedNotifIds).slice(-500);
      localStorage.setItem("udeets:notif-cleared-v1", JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }, [clearedNotifIds]);

  // Visible = not cleared. Unread count drives the bell dot; it now reflects
  // every kind of notification (new posts, join requests, acceptances) rather
  // than just "actionable" ones like before.
  const visibleNotifications = liveNotifications.filter((n) => !clearedNotifIds.has(n.id));
  const unreadNotifCount = visibleNotifications.filter((n) => !readNotifIds.has(n.id)).length;
  const unreadNotifications = unreadNotifCount > 0;

  const markNotifRead = (id: string) => {
    setReadNotifIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };
  const markAllNotifsRead = () => {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      for (const n of visibleNotifications) next.add(n.id);
      return next;
    });
  };
  const clearReadNotifs = () => {
    setClearedNotifIds((prev) => {
      const next = new Set(prev);
      for (const n of visibleNotifications) {
        if (readNotifIds.has(n.id)) next.add(n.id);
      }
      return next;
    });
  };
  const isHomeActive = isAuthenticated ? pathname === "/dashboard" : pathname === "/";
  const isDiscoverActive = pathname === "/discover";
  const isAlertsActive = pathname === "/alerts";
  const isEventsActive = pathname === "/events";
  const isLocalActive = pathname === "/local";

  return (
    <header className={cn("sticky top-0 z-30", HEADER_BG)}>
      <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
        {/* Left side: Back arrow on mobile inside hub, logo elsewhere */}
        {hubSettings ? (
          <>
            {/* Mobile: back arrow */}
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 lg:hidden"
              aria-label="Go back"
            >
              <svg className="h-6 w-6 text-[var(--ud-text-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            {/* Desktop: keep logo */}
            <button type="button" onClick={handleHome} className="hidden min-w-0 items-center gap-3 lg:flex">
              <UdeetsBrandLockup
                logoClassName="h-10 w-10"
                textClassName="text-2xl"
                priority
              />
            </button>
          </>
        ) : (
          <button type="button" onClick={handleHome} className="flex min-w-0 items-center gap-3">
            <UdeetsBrandLockup
              logoClassName="h-10 w-10"
              textClassName="text-2xl"
              priority
            />
          </button>
        )}

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

              {/* Local — sits right next to the notification bell so the
                  platform-wide news/jobs/alerts/deals feed is one tap away
                  from where users already look for new activity. */}
              <NavIconLink href="/local" ariaLabel="Local" active={isLocalActive}>
                <MapPin className={ICON_BASE} />
              </NavIconLink>

              <NavIconButton
                aria-label="Events"
                active={isEventsActive}
                onClick={() => setOpenPanel((panel) => (panel === "events" ? null : "events"))}
              >
                <Calendar className={ICON_BASE} />
              </NavIconButton>

            </nav>
          ) : null}

          {/* Mobile: Search icon (hub-specific or global discover) */}
          {hubSettings?.onOpenSearch ? (
            <NavIconButton
              aria-label="Search this hub"
              onClick={hubSettings.onOpenSearch}
              className="border border-slate-200 md:hidden"
            >
              <Search className={ICON_BASE} />
            </NavIconButton>
          ) : (
            <NavIconLink
              href="/discover"
              ariaLabel="Discover"
              className="border border-slate-200 md:hidden"
            >
              <Search className={ICON_BASE} />
            </NavIconLink>
          )}

          {/* Mobile: Hub settings gear (only inside hub for admin) */}
          {hubSettings?.isCreatorAdmin && hubSettings?.onOpenSettings ? (
            <NavIconButton
              aria-label="Hub settings"
              onClick={hubSettings.onOpenSettings}
              className="border border-slate-200 md:hidden"
            >
              <Settings className={ICON_BASE} />
            </NavIconButton>
          ) : null}

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

          {openPanel === "alerts" ? (
            <NotificationsPanel
              notifications={visibleNotifications}
              readIds={readNotifIds}
              onMarkRead={markNotifRead}
              onMarkAllRead={markAllNotifsRead}
              onClearRead={clearReadNotifs}
            />
          ) : null}
          {openPanel === "events" ? <EventsPanel events={liveEvents} /> : null}
          {openPanel === "profile" && isAuthenticated ? <ProfilePanel user={user} onLogout={handleLogout} profileData={profileData} /> : null}
        </div>
      </div>
    </header>
  );
}

export function UdeetsHeader({ hubSettings }: { hubSettings?: { onOpenSettings?: () => void; onOpenSearch?: () => void; isCreatorAdmin?: boolean } } = {}) {
  return (
    <Suspense fallback={null}>
      <UdeetsHeaderContent hubSettings={hubSettings} />
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
      <div className="mx-auto grid max-w-lg grid-cols-4">
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

        {/* Notifications */}
        <Link
          href="/alerts"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "alerts" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <Bell className={ICON_BASE} />
          <span className="text-[10px] font-medium">Notifications</span>
        </Link>

        {/* Events */}
        <Link
          href="/events"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "events" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <Calendar className={ICON_BASE} />
          <span className="text-[10px] font-medium">Events</span>
        </Link>

        {/* Local */}
        <Link
          href="/local"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 pb-2 pt-2",
            activeNav === "local" ? TEXT_ACTIVE : TEXT_MUTED
          )}
        >
          <div className="relative">
            <MapPin className={ICON_BASE} />
          </div>
          <span className="text-[10px] font-medium">Local</span>
        </Link>
      </div>
    </nav>
  );
}
