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
  UserRound,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import { HOME_EVENTS, HOME_NOTIFICATIONS } from "@/lib/hub-content";
import { isUdeetsLogoSrc, UDEETS_LOGO_SRC } from "@/lib/branding";
import { signOut } from "@/services/auth/signOut";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function truncateLine(value: string, max = 64) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

export type NavKey = "home" | "alerts" | "events";

type OpenPanel = "alerts" | "events" | "profile" | null;

const HEADER_BG = "bg-white border-b border-slate-200/70";
const FOOTER_BG = "bg-[#0C5C57]";
const BOTTOM_NAV_BG = "bg-[#A9D1CA]";
const TEXT_DARK_GREEN = "text-[#0C5C57]";
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
        active ? "bg-[#A9D1CA] text-[#0C5C57]" : "text-slate-700 hover:bg-[#E3F1EF]",
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
        active ? "bg-[#A9D1CA] text-[#0C5C57]" : "text-slate-700 hover:bg-[#E3F1EF]",
        className
      )}
    >
      {children}
    </Link>
  );
}

function NotificationsPanel() {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const filteredItems = HOME_NOTIFICATIONS.filter((item) => activeFilter === "All" || item.type === activeFilter);

  return (
    <div
      data-demo-target={isDemoPreview ? "dashboard-alerts-dropdown" : undefined}
      className="absolute right-16 top-full z-[120] mt-3 w-[360px] rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-semibold text-[#111111]">Notifications</h3>
        <button type="button" className="text-sm font-medium text-[#0C5C57] hover:opacity-80">
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
                  className="group relative flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-[#EEF7F5]"
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
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111111]">
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

function EventsPanel() {
  const [activeFilter, setActiveFilter] = useState<(typeof EVENT_FILTERS)[number]>("Today");
  const filteredGroups = HOME_EVENTS.filter((event) => {
    if (activeFilter === "Today") return event.group === "Today";
    if (activeFilter === "Tomorrow") return event.group === "Tomorrow";
    if (activeFilter === "This Week") return event.group === "This Week";
    if (activeFilter === "My Hubs") return event.badge === "My Hubs";
    return event.badge === "Saved";
  }).reduce<Record<string, typeof HOME_EVENTS>>((acc, event) => {
    acc[event.group] ||= [];
    acc[event.group].push(event);
    return acc;
  }, {});

  return (
    <div className="absolute right-16 top-full z-[120] mt-3 w-[380px] rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-semibold text-[#111111]">Events</h3>
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
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111111]">
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

function ProfilePanel({ user, onLogout }: { user: { email?: string; user_metadata?: Record<string, unknown> } | null; onLogout: () => void }) {
  const displayName = (user?.user_metadata?.full_name as string) || user?.email || "uDeets User";
  const displayEmail = user?.email || "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || "";

  return (
    <div className="absolute right-0 top-full z-[120] mt-3 min-w-[220px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
      {/* User identity card */}
      <div className="flex items-center gap-3 rounded-t-xl bg-gray-50 px-4 py-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
            <span className="text-sm font-semibold text-white/80">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
          <p className="truncate text-xs text-gray-500">{displayEmail}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="border-t border-gray-100 py-1">
        {PROFILE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Icon className="h-4 w-4 stroke-[1.8] text-gray-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 py-1">
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
  const [openPanel, setOpenPanel] = useState<OpenPanel>(searchParams.get("demo_open_panel") === "alerts" ? "alerts" : null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

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

  const unreadNotifications = HOME_NOTIFICATIONS.length > 0;
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
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url as string}
                  alt={user.email ? `${user.email} profile photo` : "User profile photo"}
                  fill
                  className="object-cover object-center"
                  sizes="40px"
                />
              ) : (
                <UserRound className="h-5 w-5 text-slate-700" />
              )}
            </button>
          ) : (
            <Link
              href="/auth"
              aria-label="Sign in"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#E3F1EF]"
            >
              {status === "loading" ? "..." : "Sign in"}
            </Link>
          )}

          {openPanel === "alerts" ? <NotificationsPanel /> : null}
          {openPanel === "events" ? <EventsPanel /> : null}
          {openPanel === "profile" && isAuthenticated ? <ProfilePanel user={user} onLogout={handleLogout} /> : null}
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
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t border-white/40 md:hidden", BOTTOM_NAV_BG)}>
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-2 py-2 sm:px-4">
        {PRIMARY_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-1",
              TEXT_DARK_GREEN,
              activeNav === item.key && "bg-white/35"
            )}
          >
            {item.key === "home" ? <Home className={ICON_BASE} /> : null}
            {item.key === "alerts" ? <Bell className={ICON_BASE} /> : null}
            {item.key === "events" ? <Calendar className={ICON_BASE} /> : null}
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
