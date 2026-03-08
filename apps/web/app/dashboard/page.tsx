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
  galleryImages: string[];
  href: string;
};

type FeedPost = {
  id: string;
  hubId: string;
  type: "announcement" | "notice" | "poll" | "event" | "update" | "image";
  dateLabel: string;
  title: string;
  body: string;
  image?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  pollOptions?: Array<{ label: string; percent: number }>;
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

const HUBS: DashboardHub[] = HUBS_SOURCE.map((hub) => ({
  id: hub.id,
  name: hub.name,
  dpImage: normalizePublicSrc(hub.dpImage || hub.heroImage),
  heroImage: normalizePublicSrc(hub.heroImage),
  galleryImages: (hub.galleryImages?.length ? hub.galleryImages : [hub.heroImage, hub.dpImage])
    .filter((src): src is string => Boolean(src))
    .map((src) => normalizePublicSrc(src)),
  href: `/hubs/${hub.category}/${hub.slug}`,
}));

const POSTS: FeedPost[] = [
  {
    id: "p01",
    hubId: "hcv",
    type: "announcement",
    dateLabel: "2h ago",
    title: "Chaitra Festival Seva Registration Opens Friday",
    body: "Volunteer signup windows for prasadam, queue support, and decor open this Friday at 9:00 AM.",
    views: 984,
    likesCount: 57,
    commentsCount: 16,
    sharesCount: 9,
  },
  {
    id: "p02",
    hubId: "rks",
    type: "notice",
    dateLabel: "3h ago",
    title: "Parking Update for Kannada Cultural Night",
    body: "Overflow parking is now redirected to the east lot. Please follow volunteer signage when arriving.",
    image: "/hub-images/richmond-kannada-sangha2.jpg",
    views: 712,
    likesCount: 32,
    commentsCount: 11,
    sharesCount: 5,
  },
  {
    id: "p03",
    hubId: "desi",
    type: "image",
    dateLabel: "4h ago",
    title: "Weekend Special: Family Combo Goes Live Tonight",
    body: "Our Friday-to-Sunday combo includes two curries, fresh naan, and dessert. Limited servings each evening.",
    views: 1250,
    likesCount: 76,
    commentsCount: 24,
    sharesCount: 18,
  },
  {
    id: "p04",
    hubId: "saint-mikes",
    type: "event",
    dateLabel: "6h ago",
    title: "Community Outreach Drive This Saturday",
    body: "Families are invited to join the parish outreach collection and packing event from 10:00 AM to 1:00 PM.",
    image: "/hub-images/saintmike-3.webp",
    views: 843,
    likesCount: 41,
    commentsCount: 13,
    sharesCount: 7,
  },
  {
    id: "p05",
    hubId: "grtava",
    type: "poll",
    dateLabel: "8h ago",
    title: "Which family event should we host next month?",
    body: "Vote on the preferred format so we can open registrations early.",
    views: 679,
    likesCount: 29,
    commentsCount: 31,
    sharesCount: 10,
    pollOptions: [
      { label: "Telugu Cultural Evening", percent: 42 },
      { label: "Family Sports Day", percent: 28 },
      { label: "Community Picnic", percent: 19 },
      { label: "Youth Talent Showcase", percent: 11 },
    ],
  },
  {
    id: "p06",
    hubId: "honest",
    type: "update",
    dateLabel: "9h ago",
    title: "New Street-Style Chaat Menu Added",
    body: "Evening menu now includes three new chaat options. Available for dine-in and takeout from 5 PM onward.",
    image: "/hub-images/honest-2.jpg",
    views: 1108,
    likesCount: 63,
    commentsCount: 19,
    sharesCount: 14,
  },
  {
    id: "p07",
    hubId: "otf",
    type: "announcement",
    dateLabel: "11h ago",
    title: "Registration Opens Friday for 4-Week Challenge",
    body: "Members can enroll Friday morning. Spots are capped for personalized coach check-ins.",
    views: 932,
    likesCount: 48,
    commentsCount: 15,
    sharesCount: 8,
  },
  {
    id: "p08",
    hubId: "lafit",
    type: "event",
    dateLabel: "12h ago",
    title: "Saturday Morning Mobility Session",
    body: "Join the 45-minute guided mobility class this Saturday at 9:30 AM near studio zone B.",
    image: "/hub-images/lafitness-2.jpeg",
    views: 544,
    likesCount: 22,
    commentsCount: 8,
    sharesCount: 4,
  },
  {
    id: "p09",
    hubId: "tiny-paws",
    type: "notice",
    dateLabel: "13h ago",
    title: "Pickup Window Reminder for Weekend Boarding",
    body: "Saturday and Sunday pickup closes at 6:30 PM this week. Please plan drop-off and return slots accordingly.",
    image: "/hub-images/tinypaws-2.jpg",
    views: 468,
    likesCount: 19,
    commentsCount: 6,
    sharesCount: 3,
  },
  {
    id: "p10",
    hubId: "ruff",
    type: "update",
    dateLabel: "15h ago",
    title: "Training Group Slots Updated",
    body: "Two beginner obedience slots opened for next week. Bookings are now available in the member schedule.",
    image: "/hub-images/ruffcanine-2.webp",
    views: 389,
    likesCount: 15,
    commentsCount: 7,
    sharesCount: 2,
  },
  {
    id: "p11",
    hubId: "giles-hanover",
    type: "notice",
    dateLabel: "18h ago",
    title: "HOA Meeting Agenda Posted",
    body: "This month’s agenda includes landscaping bids, traffic-calming updates, and neighborhood event budget proposals.",
    image: "/hub-images/giles-3.webp",
    views: 521,
    likesCount: 27,
    commentsCount: 12,
    sharesCount: 6,
  },
  {
    id: "p12",
    hubId: "wellesley-hoa",
    type: "poll",
    dateLabel: "1d ago",
    title: "Preferred timing for next neighborhood meetup?",
    body: "Help us finalize a convenient meetup time for maximum resident participation.",
    views: 602,
    likesCount: 34,
    commentsCount: 18,
    sharesCount: 5,
    pollOptions: [
      { label: "Saturday 10:00 AM", percent: 37 },
      { label: "Saturday 5:00 PM", percent: 33 },
      { label: "Sunday 11:00 AM", percent: 30 },
    ],
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
  const [imageFailed, setImageFailed] = useState(false);

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
            {imageSrc && !imageFailed ? (
              <img
                src={imageSrc}
                alt={label}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-center">
                <span className="px-3 text-[11px] font-semibold leading-tight text-[#0C5C57]">
                  Image Coming Soon
                </span>
              </div>
            )}
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

function AvatarImage({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return <div className="h-full w-full bg-[#A9D1CA]/40" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function CoverImage({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-center">
        <span className="px-4 text-sm font-semibold text-[#0C5C57]">Image Coming Soon</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function iconForType(type: FeedPost["type"]) {
  if (type === "announcement") return "Announcement";
  if (type === "notice") return "Notice";
  if (type === "poll") return "Poll";
  if (type === "event") return "Event";
  if (type === "image") return "Image";
  return "Update";
}

function FooterActionIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLike(props: React.SVGProps<SVGSVGElement>) {
  const liked = Boolean(props["data-liked"]);
  return (
    <svg
      viewBox="0 0 24 24"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path
        d="M12 20.5s-7.5-4.5-9.5-9c-1.3-3 .4-6.5 4-7.2 2.2-.4 4.1.4 5.5 2.2 1.4-1.8 3.3-2.6 5.5-2.2 3.6.7 5.3 4.2 4 7.2-2 4.5-9.5 9-9.5 9Z"
      />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  );
}

function getFeedImageForPost(post: FeedPost, hub: DashboardHub) {
  if (post.image) return normalizePublicSrc(post.image);
  const nonDpGallery = hub.galleryImages.filter((src) => src !== hub.dpImage);
  const source = nonDpGallery.length ? nonDpGallery : hub.galleryImages;
  if (!source.length) return hub.heroImage;
  const numericId = Number(post.id.replace(/\D/g, "")) || 1;
  const idx = (numericId + 1) % source.length;
  return source[idx] ?? source[0] ?? hub.heroImage;
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
  const [likedById, setLikedById] = useState<Record<string, boolean>>({});

  const toggleLike = (postId: string) => {
    setLikedById((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

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
                    imageSrc={hub.dpImage}
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
                    imageSrc={hub.dpImage}
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
              My deets
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
              const isLiked = Boolean(likedById[post.id]);
              const displayLikeCount = post.likesCount + (isLiked ? 1 : 0);

              return (
                <Link
                  key={post.id}
                  href="/discover"
                  className={cn("block overflow-hidden", CARD)}
                >
                  <article>
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200">
                        <AvatarImage src={hub.dpImage} alt={`${hub.name} logo`} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-semibold sm:text-base", TEXT_DARK)}>
                          {hub.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded-full bg-[#A9D1CA] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
                            {iconForType(post.type)}
                          </span>
                          <p className="text-xs text-slate-500">{post.dateLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <h3 className={cn("text-base font-semibold", TEXT_DARK)}>{post.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.body}</p>

                        {post.type === "poll" && post.pollOptions?.length ? (
                          <div className="mt-4 space-y-2.5">
                            {post.pollOptions.map((opt) => (
                              <div key={`${post.id}-${opt.label}`}>
                                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                                  <span>{opt.label}</span>
                                  <span>{opt.percent}%</span>
                                </div>
                                <div className="h-2.5 w-full rounded-full bg-slate-200">
                                  <div
                                    className="h-2.5 rounded-full bg-[#0C5C57]"
                                    style={{ width: `${opt.percent}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {(post.image ||
                          post.type === "image" ||
                          post.type === "announcement" ||
                          post.type === "event" ||
                          post.type === "update") && (
                          <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                            <CoverImage src={getFeedImageForPost(post, hub)} alt={post.title} />
                            <div className="absolute inset-0 bg-black/10" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-5 text-sm text-slate-600">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleLike(post.id);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 transition-colors",
                              isLiked ? "font-medium text-[#0C5C57]" : "text-slate-600 hover:text-[#111111]"
                            )}
                          >
                            <IconLike className="h-4 w-4" data-liked={isLiked ? "true" : ""} />
                            <span>Like {displayLikeCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-[#111111]"
                          >
                            <FooterActionIcon path="M7 8h10M7 12h7m7-2a8 8 0 0 1-8 8H5l-2 3V10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
                            <span>Comment {post.commentsCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-[#111111]"
                          >
                            <IconShare className="h-4 w-4" />
                            <span>Share {post.sharesCount}</span>
                          </button>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <FooterActionIcon path="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                          <span>{post.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
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
