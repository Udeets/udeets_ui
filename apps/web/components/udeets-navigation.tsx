"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CirclePlus,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  SquarePen,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HOME_CHATS, HOME_EVENTS, HOME_NOTIFICATIONS } from "@/lib/hub-content";
import { clearMockSession } from "@/lib/mock-auth";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type NavKey = "home" | "alerts" | "events" | "chat";

type OpenPanel = "alerts" | "events" | "chat" | "profile" | null;

const HEADER_BG = "bg-white border-b border-slate-200/70";
const FOOTER_BG = "bg-[#0C5C57]";
const BOTTOM_NAV_BG = "bg-[#A9D1CA]";
const TEXT_DARK = "text-[#111111]";
const TEXT_DARK_GREEN = "text-[#0C5C57]";
const ICON_BASE = "h-5 w-5 stroke-[1.8]";

const PRIMARY_ITEMS = [
  { href: "/dashboard", label: "Home", key: "home" },
  { href: "/alerts", label: "Alerts", key: "alerts" },
  { href: "/events", label: "Events", key: "events" },
  { href: "/chat", label: "Chat", key: "chat" },
] as const;

const PROFILE_ITEMS = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/my-posts", label: "My Posts", icon: SquarePen },
  { href: "/create-hub", label: "Create Hub", icon: CirclePlus },
  { href: "/settings", label: "Settings", icon: Settings },
];

const FILTERS = ["All", "Tagged", "New Posts", "Activity"] as const;

const EVENT_FILTERS = ["Today", "Tomorrow", "This Week", "My Hubs", "Saved"] as const;

const CHATS = [
  ...HOME_CHATS,
];

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
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");

  return (
    <div className="absolute right-16 top-full z-[120] mt-3 w-[360px] rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
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
      <div className="mt-4 space-y-3">
        {HOME_NOTIFICATIONS.filter((item) => activeFilter === "All" || item.type === activeFilter).map((item) => (
          <Link key={item.id} href={item.href} className="block rounded-2xl bg-[#F7FBFA] p-4 transition hover:bg-[#EEF7F5]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[#111111]">{item.title}</p>
              <span className="text-xs text-slate-500">{item.meta}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ChatPanel() {
  return (
    <div className="absolute right-16 top-full z-[120] mt-3 w-[360px] rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-semibold text-[#111111]">Chat</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Settings className="h-4.5 w-4.5 stroke-[1.8]" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <SquarePen className="h-4.5 w-4.5 stroke-[1.8]" />
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {CHATS.map((chat) => (
          <Link
            key={chat.id}
            href={chat.href}
            className="flex w-full items-start justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4 text-left hover:bg-[#EEF7F5]"
          >
            <div>
              <p className="text-sm font-semibold text-[#111111]">{chat.title}</p>
              <p className="mt-1 text-sm text-slate-600">{chat.preview}</p>
              <p className="mt-1 text-xs text-slate-500">{chat.hub}</p>
            </div>
            <div className="ml-4 text-right">
              <p className="text-xs text-slate-500">{chat.time}</p>
              {chat.unread ? (
                <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0C5C57] px-2 text-xs font-semibold text-white">
                  {chat.unread}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
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

      <div className="mt-4 max-h-[420px] space-y-5 overflow-y-auto pr-1">
        {Object.entries(filteredGroups).map(([groupTitle, items]) => (
          <section key={groupTitle}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {groupTitle}
            </h4>
            <div className="space-y-3">
              {items.map((event) => (
                <Link key={event.id} href={event.href} className="block rounded-2xl bg-[#F7FBFA] p-4 transition hover:bg-[#EEF7F5]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#111111]">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.hub}</p>
                    </div>
                    <span className="rounded-full bg-[#A9D1CA]/55 px-2.5 py-1 text-[11px] font-semibold text-[#0C5C57]">
                      {event.badge}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>{event.dateLabel}</p>
                    <p>{event.time}</p>
                    <p>{event.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ProfilePanel({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="absolute right-0 top-full z-[120] mt-3 w-[144px]">
      <div className="space-y-2">
        {PROFILE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 stroke-[1.8]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4 stroke-[1.8]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export function UdeetsHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
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
    if (pathname === "/dashboard") {
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    router.push("/dashboard");
  };

  const handleLogout = () => {
    clearMockSession();
    setOpenPanel(null);
    router.push("/");
  };

  const unreadNotifications = HOME_NOTIFICATIONS.length > 0;
  const isHomeActive = pathname === "/dashboard";
  const isDiscoverActive = pathname === "/discover";
  const isAlertsActive = pathname === "/alerts";
  const isEventsActive = pathname === "/events";
  const isChatActive = pathname === "/chat";

  return (
    <header className={cn("sticky top-0 z-30", HEADER_BG)}>
      <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
        <button type="button" onClick={handleHome} className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
          </div>
          <span className={cn("truncate text-2xl font-serif font-semibold tracking-tight", TEXT_DARK)}>
            uDeets
          </span>
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

            <NavIconButton
              aria-label="Chat"
              active={isChatActive}
              onClick={() => setOpenPanel((panel) => (panel === "chat" ? null : "chat"))}
            >
              <MessageCircle className={ICON_BASE} />
            </NavIconButton>
          </nav>

          <NavIconLink
            href="/discover"
            ariaLabel="Discover"
            className="border border-slate-200 md:hidden"
          >
            <Search className={ICON_BASE} />
          </NavIconLink>

          <button
            type="button"
            onClick={() => setOpenPanel((panel) => (panel === "profile" ? null : "profile"))}
            aria-label="Open profile menu"
            className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200"
          >
            <Image src="/udeets-logo.png" alt="uDeets" fill className="object-cover" />
          </button>

          {openPanel === "alerts" ? <NotificationsPanel /> : null}
          {openPanel === "events" ? <EventsPanel /> : null}
          {openPanel === "chat" ? <ChatPanel /> : null}
          {openPanel === "profile" ? <ProfilePanel onLogout={handleLogout} /> : null}
        </div>
      </div>
    </header>
  );
}

export function UdeetsFooter() {
  return (
    <footer className={FOOTER_BG}>
      <div className="flex min-h-14 w-full items-center justify-center px-4 text-sm text-white sm:px-6 lg:px-10">
        © 2026 uDeets. All rights reserved.
      </div>
    </footer>
  );
}

export function UdeetsBottomNav({ activeNav = "home" }: { activeNav?: NavKey }) {
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t border-white/40 md:hidden", BOTTOM_NAV_BG)}>
      <div className="mx-auto grid max-w-7xl grid-cols-4 px-2 py-2 sm:px-4">
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
            {item.key === "chat" ? <MessageCircle className={ICON_BASE} /> : null}
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
