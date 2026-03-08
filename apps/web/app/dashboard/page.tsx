"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HUBS as HUBS_SOURCE } from "@/lib/hubs";

type DashboardHub = {
  id: string;
  name: string;
  dpImage: string;
  heroImage: string;
  href: string;
};

type FeedPost = {
  id: string;
  hubId: string;
  time: string;
  kind: "image" | "text";
  title: string;
  body: string;
};

const PAGE_BG = "bg-[#E3F1EF]";
const HEADER_BG = "bg-white border-b border-slate-200/70";
const FOOTER_BG = "bg-[#0C5C57]";
const TOP_BG = "bg-[#E3F1EF]";
const BOTTOM_NAV_BG = "bg-[#A9D1CA]";
const TEXT_DARK = "text-[#111111]";
const TEXT_DARK_GREEN = "text-[#0C5C57]";
const CARD = "rounded-3xl border border-slate-100 bg-white shadow-sm";
const TILE_BOX =
  "relative h-[148px] w-[148px] overflow-hidden rounded-[30px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePublicSrc(src?: string) {
  if (!src) return "/udeets-logo.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

const HUBS: DashboardHub[] = HUBS_SOURCE.slice(0, 12).map((hub) => ({
  id: hub.id,
  name: hub.name,
  dpImage: normalizePublicSrc(hub.dpImage || hub.heroImage),
  heroImage: normalizePublicSrc(hub.heroImage),
  href: `/hubs/${hub.category}/${hub.slug}`,
}));

const POSTS: FeedPost[] = [
  {
    id: "p1",
    hubId: HUBS[0]?.id ?? "",
    time: "2h ago",
    kind: "image",
    title: "Weekend highlights are live",
    body: "New photos, announcements, and event posters were just added.",
  },
  {
    id: "p2",
    hubId: HUBS[1]?.id ?? "",
    time: "3h ago",
    kind: "image",
    title: "Community event poster published",
    body: "RSVP details and venue info are now available in this hub.",
  },
  {
    id: "p3",
    hubId: HUBS[2]?.id ?? "",
    time: "4h ago",
    kind: "image",
    title: "New weekly deal is now active",
    body: "Limited offer details are up. Check timings before you visit.",
  },
  {
    id: "p4",
    hubId: HUBS[3]?.id ?? "",
    time: "5h ago",
    kind: "image",
    title: "Updated schedule poster",
    body: "This week’s updated schedule and notices are now posted.",
  },
  {
    id: "p5",
    hubId: HUBS[4]?.id ?? "",
    time: "6h ago",
    kind: "image",
    title: "Member activity highlights",
    body: "Top moments from the latest meetup are now in the feed.",
  },
  {
    id: "p6",
    hubId: HUBS[5]?.id ?? "",
    time: "7h ago",
    kind: "image",
    title: "Promotion banner dropped",
    body: "Check the latest promo banner and details before it ends.",
  },
  {
    id: "p7",
    hubId: HUBS[6]?.id ?? "",
    time: "8h ago",
    kind: "image",
    title: "Activity photos uploaded",
    body: "Photo recap from today’s community activity is now available.",
  },
  {
    id: "p8",
    hubId: HUBS[7]?.id ?? "",
    time: "9h ago",
    kind: "image",
    title: "New hub poster this week",
    body: "Important poster and details were added for all members.",
  },
  {
    id: "p9",
    hubId: HUBS[8]?.id ?? "",
    time: "10h ago",
    kind: "text",
    title: "Announcement: timing update",
    body: "Please check revised timings for this week’s regular activities.",
  },
  {
    id: "p10",
    hubId: HUBS[9]?.id ?? "",
    time: "11h ago",
    kind: "text",
    title: "Reminder: upcoming meeting",
    body: "A quick reminder that the next member meeting is scheduled soon.",
  },
  {
    id: "p11",
    hubId: HUBS[10]?.id ?? "",
    time: "12h ago",
    kind: "text",
    title: "Community notice",
    body: "Please review the latest notice posted by the hub organizers.",
  },
  {
    id: "p12",
    hubId: HUBS[11]?.id ?? "",
    time: "13h ago",
    kind: "text",
    title: "Update from admin team",
    body: "General updates and reminders have been posted for members.",
  },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuUserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path
        d="M5 19c1.5-2.7 4-4 7-4s5.5 1.3 7 4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuPostsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7 7h10M7 12h10M7 17h6" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
    </svg>
  );
}

function MenuCreateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function MenuSettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9.2 6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
    </svg>
  );
}

function MenuLogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M14 7l5 5-5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 12H9" strokeLinecap="round" />
      <path d="M5 5h6v14H5z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-8 w-8", TEXT_DARK_GREEN)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function BottomNavIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HubCardTile({
  href,
  label,
  imageSrc,
  isCreate = false,
}: {
  href: string;
  label: string;
  imageSrc?: string;
  isCreate?: boolean;
}) {
  return (
    <Link href={href} className="block w-[148px] shrink-0" aria-label={label}>
      <div className={cn(TILE_BOX, "group transition-transform duration-200 hover:-translate-y-0.5")}>
        {isCreate ? (
          <div className="flex h-full w-full items-center justify-center bg-[#A9D1CA]/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <PlusIcon />
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden rounded-[30px]">
            <img
              src={imageSrc}
              alt={label}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      <div className="mt-3 min-h-[40px] px-1">
        <p className="line-clamp-2 text-center text-[12px] font-serif font-semibold leading-tight text-[#111111]">
          {label}
        </p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [isHubsExpanded, setIsHubsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [expandedAnchor, setExpandedAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const hubsPanelRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const hubMap = useMemo(() => new Map(HUBS.map((hub) => [hub.id, hub])), []);
  const collapsedHubs = HUBS.slice(0, 8);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        isHubsExpanded &&
        hubsPanelRef.current &&
        !hubsPanelRef.current.contains(target)
      ) {
        setIsHubsExpanded(false);
      }

      if (
        isProfileOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isHubsExpanded, isProfileOpen]);

  useEffect(() => {
    if (!isHubsExpanded) return;

    const updateAnchor = () => {
      const rect = hubsPanelRef.current?.getBoundingClientRect();
      if (!rect) return;

      setExpandedAnchor({
        top: Math.max(72, rect.top),
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);

    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [isHubsExpanded]);

  const toggleHubsExpanded = () => {
    if (!isHubsExpanded) {
      const rect = hubsPanelRef.current?.getBoundingClientRect();
      if (rect) {
        setExpandedAnchor({
          top: Math.max(72, rect.top),
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
      setIsHubsExpanded(true);
      return;
    }

    setIsHubsExpanded(false);
  };

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <header className={cn("sticky top-0 z-30", HEADER_BG)}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/udeets-logo.png"
                alt="uDeets Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span
              className={cn(
                "truncate text-2xl font-serif font-semibold tracking-tight",
                TEXT_DARK
              )}
            >
              uDeets
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/discover"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <SearchIcon />
            </Link>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                aria-label="Open profile menu"
                className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200"
              >
                <Image src="/udeets-logo.png" alt="uDeets" fill className="object-cover" />
              </button>

              {isProfileOpen ? (
                <div className="absolute right-0 z-[120] mt-3 w-[132px]">
                  <div className="space-y-2">
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
                    >
                      <MenuUserIcon />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
                    >
                      <MenuPostsIcon />
                      <span>My Posts</span>
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
                    >
                      <MenuCreateIcon />
                      <span>Create Hub</span>
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
                    >
                      <MenuSettingsIcon />
                      <span>Settings</span>
                    </Link>
                    <Link
                      href="/auth"
                      className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-2.5 text-sm font-medium text-black shadow-[0_6px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
                    >
                      <MenuLogoutIcon />
                      <span>Logout</span>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {isHubsExpanded ? (
        <button
          type="button"
          aria-label="Close expanded hubs panel"
          onClick={() => setIsHubsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        />
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10">
        <section
          className={cn("relative mb-6 rounded-3xl p-4 sm:p-6", TOP_BG)}
          style={
            isHubsExpanded && expandedAnchor
              ? { minHeight: expandedAnchor.height }
              : undefined
          }
        >
          <div
            ref={hubsPanelRef}
            className={cn(
              CARD,
              "p-5 sm:p-6",
              isHubsExpanded && "fixed z-50 max-h-[72vh] overflow-y-auto"
            )}
            style={
              isHubsExpanded && expandedAnchor
                ? {
                    top: expandedAnchor.top,
                    left: expandedAnchor.left,
                    width: expandedAnchor.width,
                  }
                : undefined
            }
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1
                className={cn(
                  "text-2xl font-serif font-semibold tracking-tight sm:text-3xl",
                  TEXT_DARK
                )}
              >
                My Hubs
              </h1>

              <div className="flex items-center gap-4 text-sm font-medium sm:text-base">
                <Link href="/discover" className={cn(TEXT_DARK, "hover:opacity-80")}>
                  Create Hub
                </Link>
                <button
                  type="button"
                  onClick={toggleHubsExpanded}
                  className={cn(TEXT_DARK, "hover:opacity-80")}
                >
                  {isHubsExpanded ? "Collapse" : "See All"}
                </button>
              </div>
            </div>

            {isHubsExpanded ? (
              <div className="flex flex-wrap gap-x-6 gap-y-6">
                {HUBS.map((hub) => (
                  <HubCardTile
                    key={hub.id}
                    href={hub.href}
                    label={hub.name}
                    imageSrc={hub.heroImage}
                  />
                ))}
                <HubCardTile href="/discover" label="Create Hub" isCreate />
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-3">
                {collapsedHubs.map((hub) => (
                  <HubCardTile
                    key={hub.id}
                    href={hub.href}
                    label={hub.name}
                    imageSrc={hub.heroImage}
                  />
                ))}
                <HubCardTile href="/discover" label="Create Hub" isCreate />
              </div>
            )}
          </div>
        </section>

        <section className={cn("mt-6", isHubsExpanded && "pointer-events-none")}>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={cn(
                "text-xl font-serif font-semibold tracking-tight sm:text-2xl",
                TEXT_DARK
              )}
            >
              Community Pulse
            </h2>
            <Link
              href="/discover"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Explore
            </Link>
          </div>

          <div className="space-y-4">
            {POSTS.map((post) => {
              const hub = hubMap.get(post.hubId);
              if (!hub) return null;

              return (
                <Link
                  key={post.id}
                  href="/discover"
                  className={cn("block overflow-hidden", CARD)}
                >
                  <article>
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200">
                        <img
                          src={hub.dpImage}
                          alt={`${hub.name} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-semibold sm:text-base", TEXT_DARK)}>
                          {hub.name}
                        </p>
                        <p className="text-xs text-slate-500">{post.time} • Hub update</p>
                      </div>
                    </div>

                    {post.kind === "image" ? (
                      <>
                        <div className="relative h-56 w-full bg-slate-100 sm:h-72">
                          <img
                            src={hub.heroImage}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/15" />
                        </div>
                        <div className="p-4 sm:p-5">
                          <h3 className={cn("text-base font-semibold", TEXT_DARK)}>
                            {post.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {post.body}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <h3 className={cn("text-base font-semibold", TEXT_DARK)}>
                            {post.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {post.body}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className={FOOTER_BG}>
        <div className="flex min-h-14 w-full items-center justify-center px-4 text-sm text-white sm:px-6 lg:px-10">
          © 2026 uDeets. All rights reserved.
        </div>
      </footer>

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-white/40",
          BOTTOM_NAV_BG
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-4 px-2 py-2 sm:px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1",
              TEXT_DARK_GREEN
            )}
          >
            <BottomNavIcon path="M3 10.5 12 3l9 7.5V21H3v-10.5Z" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            href="/discover"
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1",
              TEXT_DARK_GREEN
            )}
          >
            <BottomNavIcon path="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
            <span className="text-xs font-medium">Alerts</span>
          </Link>

          <Link
            href="/discover"
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1",
              TEXT_DARK_GREEN
            )}
          >
            <BottomNavIcon path="M8 2v3m8-3v3M3 9h18M5 6h14a2 2 0 0 1 2 2v11H3V8a2 2 0 0 1 2-2Z" />
            <span className="text-xs font-medium">Events</span>
          </Link>

          <Link
            href="/discover"
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1",
              TEXT_DARK_GREEN
            )}
          >
            <BottomNavIcon path="M7 8h10M7 12h7m7-2a8 8 0 0 1-8 8H5l-2 3V10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
            <span className="text-xs font-medium">Chat</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
