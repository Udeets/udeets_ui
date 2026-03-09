/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { HubRecord } from "@/lib/hubs";

const HEADER_BG = "bg-white border-b border-slate-200/60";
const FOOTER_BG = "bg-[#0C5C57]";
const BRAND_TEXT_STYLE = "truncate text-xl font-semibold tracking-tight text-[#111111] sm:text-2xl";
const CARD = "rounded-xl border border-slate-100 bg-white shadow-sm";
const BUTTON_PRIMARY =
  "rounded-full bg-[#0C5C57] px-4 py-2 text-xs font-semibold text-white hover:bg-[#094a46]";

const ROUTE_HOME = "/";
const ROUTE_DISCOVER = "/discover";

type HubTab = "Post" | "Events" | "Albums" | "Attachments" | "Members";

type LocalFeedItem = {
  id: string;
  author: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  views: number;
};

type ViewerState = {
  open: boolean;
  images: string[];
  index: number;
  title: string;
  body: string;
};

function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  fallback,
  loading,
}: {
  src?: string;
  alt: string;
  className: string;
  fallbackClassName: string;
  fallback: React.ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(!src);
  if (!src || failed) {
    return <div className={fallbackClassName}>{fallback}</div>;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function hubMediaBase(hub: HubRecord) {
  return `/hub-images/${hub.category}/${hub.slug}`;
}

function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
    </svg>
  );
}

function IconChat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M7 8h10M7 12h7m7-2a8 8 0 0 1-8 8H5l-2 3V10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
    </svg>
  );
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconLike(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 20.5s-7.5-4.5-9.5-9c-1.3-3 .4-6.5 4-7.2 2.2-.4 4.1.4 5.5 2.2 1.4-1.8 3.3-2.6 5.5-2.2 3.6.7 5.3 4.2 4 7.2-2 4.5-9.5 9-9.5 9Z" />
    </svg>
  );
}

function IconComment(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M7 8h10M7 12h7m7-2a8 8 0 0 1-8 8H5l-2 3V10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  );
}

function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconImage(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.7" />
      <path d="M21 16l-5-5-5 5-2-2-6 6" />
    </svg>
  );
}

function IconPaperclip(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21.4 11.1 12 20.5a6 6 0 0 1-8.5-8.5L12 3.5a4 4 0 0 1 5.7 5.7L8.8 18a2 2 0 1 1-2.8-2.8l8.2-8.2" />
    </svg>
  );
}

function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M8 2v3m8-3v3M3 9h18M5 6h14a2 2 0 0 1 2 2v11H3V8a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function IconPoll(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 21V9m8 12V3m8 18v-8" />
    </svg>
  );
}

function IconLocation(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconGlobe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.8L7 10a16 16 0 0 0 7 7l1.7-1.8a2 2 0 0 1 1.8-.6l2.8.4A2 2 0 0 1 22 16.9Z" />
    </svg>
  );
}

function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M7.5 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H16.7V5c-.3 0-1.3-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7v3h2.8v8h3.7Z" />
    </svg>
  );
}

function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4Z" />
      <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M17.6 6.4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  );
}

function IconYouTube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.9 4.6 12 4.6 12 4.6s-5.9 0-7.5.5A3 3 0 0 0 2.4 7.2 31.3 31.3 0 0 0 2 12c0 1.7.1 3.4.4 4.8a3 3 0 0 0 2.1 2.1c1.6.5 7.5.5 7.5.5s5.9 0 7.5-.5a3 3 0 0 0 2.1-2.1c.3-1.4.4-3.1.4-4.8s-.1-3.4-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

export default function HubClient({
  hub,
  mode = "intro",
}: {
  hub: HubRecord;
  mode?: "intro" | "full";
  category?: string;
  slug?: string;
}) {
  void mode;

  const [activeTab, setActiveTab] = useState<HubTab>("Post");
  const [viewer, setViewer] = useState<ViewerState>({
    open: false,
    images: [],
    index: 0,
    title: "",
    body: "",
  });

  const mediaBase = hubMediaBase(hub);
  const dpImageSrc = normalizePublicSrc(hub.dpImage) || `${mediaBase}/dp.jpg`;
  const coverImageSrc = normalizePublicSrc(hub.heroImage) || `${mediaBase}/cover.jpg`;

  const galleryImages = useMemo(() => {
    const fromHub = (hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean);
    const fallback = [1, 2, 3].map((n) => `${mediaBase}/gallery-${n}.jpg`);
    const ordered = [coverImageSrc, ...fromHub, ...fallback].filter(Boolean);
    return [...new Set(ordered)];
  }, [hub.galleryImages, coverImageSrc, mediaBase]);

  const recentPhotos = galleryImages.slice(0, 6);

  const feedSeedImages = useMemo(() => {
    const fromHub = (hub.feedImages ?? []).map(normalizePublicSrc).filter(Boolean);
    const fallback = [1, 2, 3].map((n) => `${mediaBase}/feed-${n}.jpg`);
    const ordered = [...fromHub, ...galleryImages, ...fallback].filter(Boolean);
    return [...new Set(ordered)];
  }, [hub.feedImages, mediaBase, galleryImages]);

  const feedItems = useMemo<LocalFeedItem[]>(() => {
    const seeded: LocalFeedItem[] = [
      {
        id: "f1",
        author: `${hub.name} Admin`,
        time: "2h ago",
        content: "Quick reminder: this week’s featured update thread is now live in Deets. Please check pinned notes before posting.",
        image: feedSeedImages[0],
        likes: 28,
        comments: 9,
        views: 214,
      },
      {
        id: "f2",
        author: `${hub.name} Team`,
        time: "4h ago",
        content: "Event reminder: volunteer check-in starts 30 minutes before kickoff. Please arrive early to help with setup.",
        likes: 17,
        comments: 6,
        views: 156,
      },
      {
        id: "f3",
        author: "Community Moderator",
        time: "Today",
        content: "Notice: parking and entry flow have been updated for this weekend. Follow signage near the main gate.",
        image: feedSeedImages[1],
        likes: 34,
        comments: 12,
        views: 263,
      },
      {
        id: "f4",
        author: `${hub.name} Team`,
        time: "Yesterday",
        content: "Photo highlights from the latest meetup are up. Tap to view the full image thread and discussion.",
        image: feedSeedImages[2],
        likes: 42,
        comments: 15,
        views: 302,
      },
      {
        id: "f5",
        author: "Hub Ops",
        time: "Yesterday",
        content: "Attachment posted: updated community guidelines and schedule sheet are now available in the files area.",
        likes: 12,
        comments: 4,
        views: 128,
      },
      {
        id: "f6",
        author: `${hub.name} Admin`,
        time: "2d ago",
        content: "Registration opens Friday at 10:00 AM. Please complete profile details before attempting registration.",
        image: feedSeedImages[3],
        likes: 23,
        comments: 8,
        views: 187,
      },
      {
        id: "f7",
        author: "Community Host",
        time: "2d ago",
        content: "Thanks everyone for participating. We’re collecting feedback to prioritize next month’s sessions and activities.",
        likes: 31,
        comments: 11,
        views: 241,
      },
    ];

    const updates = (hub.updates ?? []).slice(0, 3).map((u, idx) => ({
      id: `u-${u.id}`,
      author: `${hub.name} Team`,
      time: u.dateLabel,
      content: u.body,
      image: normalizePublicSrc(u.image) || feedSeedImages[idx % Math.max(feedSeedImages.length, 1)],
      likes: 20 + idx * 4,
      comments: 5 + idx,
      views: 140 + idx * 35,
    }));

    return [...updates, ...seeded];
  }, [hub.name, hub.updates, feedSeedImages]);

  const upcomingEvents = useMemo(() => {
    if (hub.events?.length) return hub.events.slice(0, 4);
    return [
      { id: "ev-1", title: "Tech Summit", meta: "Mar 15", desc: "Main Hall" },
      { id: "ev-2", title: "AI Workshop", meta: "Mar 20", desc: "Community Room" },
      { id: "ev-3", title: "Volunteer Meetup", meta: "Mar 24", desc: "Pavilion" },
    ];
  }, [hub.events]);

  const adminImages = [
    normalizePublicSrc(hub.adminImages?.[0]) || `${mediaBase}/admin-1.jpg`,
    normalizePublicSrc(hub.adminImages?.[1]) || `${mediaBase}/admin-2.jpg`,
  ];

  const openViewer = (images: string[], index: number, title: string, body: string) => {
    if (!images.length) return;
    setViewer({ open: true, images, index, title, body });
  };

  const closeViewer = () => setViewer((v) => ({ ...v, open: false }));

  const nextViewerImage = () => {
    setViewer((v) => ({ ...v, index: (v.index + 1) % v.images.length }));
  };

  const prevViewerImage = () => {
    setViewer((v) => ({ ...v, index: v.index === 0 ? v.images.length - 1 : v.index - 1 }));
  };

  const Header = (
    <header className={cn("sticky top-0 z-50", HEADER_BG)}>
      <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
        <Link href={ROUTE_HOME} className="flex min-w-0 items-center gap-2.5">
          <div className="relative h-10 w-10">
            <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
          </div>
          <span className={BRAND_TEXT_STYLE}>uDeets</span>
        </Link>

        <div className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/dashboard" className="font-medium text-[#111111] hover:text-[#0C5C57]">Deets</Link>
          <Link href={ROUTE_DISCOVER} className="font-medium text-[#111111] hover:text-[#0C5C57]">Discover</Link>
          <button type="button" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-[#111111]"><IconBell className="h-5 w-5" /></button>
          <button type="button" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-[#111111]"><IconChat className="h-5 w-5" /></button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#111111]">JD</div>
        </div>
      </div>
    </header>
  );

  const Footer = (
    <footer className={FOOTER_BG}>
      <div className="flex min-h-16 w-full flex-col items-center justify-between gap-2 px-4 py-3 text-center text-white sm:flex-row sm:px-6 sm:text-left lg:px-10">
        <p className="text-sm sm:text-base">© uDeets. All rights reserved.</p>
        <div className="flex gap-5">
          <IconFacebook className="h-6 w-6 cursor-pointer text-white/90 hover:text-white" />
          <IconInstagram className="h-6 w-6 cursor-pointer text-white/90 hover:text-white" />
          <IconYouTube className="h-6 w-6 cursor-pointer text-white/90 hover:text-white" />
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#E3F1EF] font-sans">
      {Header}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:h-[calc(100vh-4.5rem)] lg:overflow-hidden">
        <div className="grid grid-cols-1 gap-6 lg:h-full lg:min-h-0 lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)]">
          <aside className="lg:col-span-3 lg:row-start-1">
            <section className={cn(CARD, "p-6")}>
              <div className="text-center">
                <div className="mx-auto mb-4 h-[128px] w-[128px] overflow-hidden rounded-full border-4 border-white bg-[#A9D1CA] shadow-sm">
                  <ImageWithFallback
                    src={dpImageSrc}
                    alt={`${hub.name} dp`}
                    className="h-full w-full object-cover"
                    fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-2xl font-semibold text-[#111111]"
                    fallback={initials(hub.name)}
                  />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-[#111111]">{hub.name}</h2>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {hub.membersLabel}
                </span>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className={BUTTON_PRIMARY}>
                    Hub Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      navigator.clipboard?.writeText(window.location.href).catch(() => {});
                    }}
                    className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Share Hub
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-4 lg:col-span-9 lg:col-start-4 lg:row-start-1">
            <section className={cn(CARD, "overflow-hidden")}>
              <div className="aspect-[16/6] w-full bg-slate-100">
                <ImageWithFallback
                  src={coverImageSrc}
                  alt={`${hub.name} cover`}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-sm font-medium text-[#0C5C57]"
                  fallback="Cover photo"
                />
              </div>
            </section>
          </section>

          <aside className="space-y-6 lg:col-span-3 lg:row-start-2 lg:min-h-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto">
            <section className={cn(CARD, "p-6")}>
              <h3 className="mb-4 text-base font-semibold tracking-tight text-[#111111]">Recent Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {recentPhotos.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ring-2 ring-white"
                    onClick={() =>
                      openViewer(recentPhotos, idx, `${hub.name} Photo`, "Recent photo from this hub")
                    }
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`${hub.name} photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-[11px] font-medium text-[#0C5C57]"
                      fallback="Photo"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>

            <section className={cn(CARD, "p-6")}>
              <h3 className="mb-4 text-base font-semibold tracking-tight text-[#111111]">Connect</h3>
              <div className="space-y-2.5">
                <a href={hub.website || "#"} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:text-[#0C5C57]">
                  <IconGlobe className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600">{hub.website || "www.udeets-hub.com"}</span>
                </a>
                <a href="#" className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:text-[#0C5C57]">
                  <IconFacebook className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600">facebook.com/udeets</span>
                </a>
                <a href="#" className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:text-[#0C5C57]">
                  <IconInstagram className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600">instagram.com/{hub.slug.replace(/-/g, "")}</span>
                </a>
                <a href="#" className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:text-[#0C5C57]">
                  <IconYouTube className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600">youtube.com/@udeets</span>
                </a>
                <a href="tel:+18045551234" className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:text-[#0C5C57]">
                  <IconPhone className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600">(804) 555-1234</span>
                </a>
                <a href={`mailto:hello@${hub.slug}.com`} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:text-[#0C5C57]">
                  <IconMail className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600">hello@{hub.slug}.com</span>
                </a>
              </div>
            </section>
          </aside>

          <section className="relative space-y-4 lg:col-span-6 lg:col-start-4 lg:row-start-2 lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            <section className={cn(CARD, "border-b border-slate-200 p-2")}> 
              <div className="flex items-center gap-1 overflow-x-auto">
                {(["Post", "Events", "Albums", "Attachments", "Members"] as HubTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold",
                      activeTab === tab ? "text-[#0C5C57]" : "text-slate-600 hover:text-[#0C5C57]"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </section>

            {activeTab !== "Post" ? (
              <div className="absolute inset-x-0 top-14 z-20 rounded-xl bg-white/95 p-5 shadow-sm backdrop-blur-sm">
                <h3 className="mb-3 text-lg font-semibold tracking-tight text-[#111111]">{activeTab}</h3>
                {activeTab === "Events" ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-semibold text-[#111111]">{event.title}</p>
                        <p className="text-sm text-slate-600">{event.meta}</p>
                        <p className="text-sm text-slate-500">{event.desc}</p>
                      </div>
                    ))}
                  </div>
                ) : activeTab === "Albums" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {recentPhotos.map((img, idx) => (
                      <button
                        key={`${img}-album-${idx}`}
                        type="button"
                        className="aspect-square overflow-hidden rounded-xl bg-slate-100"
                        onClick={() => openViewer(recentPhotos, idx, `${hub.name} Album`, "Photo album view")}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`${hub.name} album ${idx + 1}`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-[11px] font-medium text-[#0C5C57]"
                          fallback="Photo"
                        />
                      </button>
                    ))}
                  </div>
                ) : activeTab === "Attachments" ? (
                  <div className="space-y-2">
                    {["Community Guidelines.pdf", "Event Deck.pptx", "Volunteer Roster.xlsx"].map((file) => (
                      <div key={file} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-[#111111]">{file}</div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {["Ava Patel", "Noah Kim", "Mia Jordan", "Liam Chen", "Sofia Reed"].map((member) => (
                      <div key={member} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-[#111111]">{member}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <section className={cn(CARD, "p-4")}>
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Deets, files, events..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </div>
            </section>

            <section className={cn(CARD, "p-5")}>
              <textarea
                placeholder="What's on your mind?"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <button type="button" className="rounded-lg p-2 hover:bg-slate-50 hover:text-[#0C5C57]"><IconImage className="h-4 w-4" /></button>
                  <button type="button" className="rounded-lg p-2 hover:bg-slate-50 hover:text-[#0C5C57]"><IconPaperclip className="h-4 w-4" /></button>
                  <button type="button" className="rounded-lg p-2 hover:bg-slate-50 hover:text-[#0C5C57]"><IconPoll className="h-4 w-4" /></button>
                  <button type="button" className="rounded-lg p-2 hover:bg-slate-50 hover:text-[#0C5C57]"><IconCalendar className="h-4 w-4" /></button>
                  <button type="button" className="rounded-lg p-2 hover:bg-slate-50 hover:text-[#0C5C57]"><IconLocation className="h-4 w-4" /></button>
                </div>
                <button type="button" className={BUTTON_PRIMARY}>Post</button>
              </div>
            </section>

            <section className="space-y-4 pb-2">
              <div className={cn(CARD, "p-5")}> 
                <h3 className="mb-4 text-lg font-semibold tracking-tight text-[#111111]">Deets</h3>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={cn(BUTTON_PRIMARY, "px-4 py-2 text-sm")}>All Posts</button>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Notices</button>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Events</button>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Photos</button>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Files</button>
                </div>
              </div>

              {feedItems.map((item) => (
                <article key={item.id} className={cn(CARD, "p-5")}> 
                  <div className="flex items-start gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                      <ImageWithFallback
                        src={dpImageSrc}
                        alt={`${item.author} avatar`}
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                        fallback={initials(item.author)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#111111]">{item.author}</h4>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{item.time}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.content}</p>
                      {item.image ? (
                        <button
                          type="button"
                          className="mt-4 block w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100"
                          onClick={() => openViewer([item.image, ...recentPhotos], 0, item.author, item.content)}
                        >
                          <div className="aspect-[16/9] w-full">
                            <ImageWithFallback
                              src={item.image}
                              alt={`${item.author} post`}
                              className="h-full w-full object-cover"
                              fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-sm font-medium text-[#0C5C57]"
                              fallback="Image unavailable"
                              loading="lazy"
                            />
                          </div>
                        </button>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
                        <div className="flex items-center gap-5">
                          <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#0C5C57]"><IconLike className="h-4 w-4" /><span>{item.likes}</span></button>
                          <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#0C5C57]"><IconComment className="h-4 w-4" /><span>{item.comments}</span></button>
                          <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#0C5C57]"><IconShare className="h-4 w-4" /><span>Share</span></button>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-slate-500"><IconEye className="h-4 w-4" /><span>{item.views}</span></div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </section>

          <aside className="space-y-6 lg:col-span-3 lg:col-start-10 lg:row-start-2 lg:min-h-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:pb-6">
            <section className={cn(CARD, "p-6")}>
              <h3 className="mb-4 text-base font-semibold tracking-tight text-[#111111]">Upcoming Events</h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border-l-4 border-[#0C5C57] bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-[#111111]">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{event.meta}</p>
                    <p className="text-xs text-slate-500">{event.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={cn(CARD, "p-6")}>
              <h3 className="mb-4 text-base font-semibold tracking-tight text-[#111111]">Hub Admins</h3>
              <div className="space-y-3">
                {[0, 1].map((idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                      <ImageWithFallback
                        src={adminImages[idx]}
                        alt="Admin"
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                        fallback={initials(idx === 0 ? `${hub.name} Admin` : "Moderator Team")}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{idx === 0 ? `${hub.name} Admin` : "Moderator Team"}</p>
                      <p className="text-xs text-slate-500">{idx === 0 ? "Lead Admin" : "Community Admin"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </aside>
        </div>
      </main>

      {Footer}

      {viewer.open ? (
        <div className="fixed inset-0 z-[120] flex bg-black/85">
          <div className="relative flex min-w-0 flex-1 items-center justify-center p-6">
            <button type="button" onClick={closeViewer} className="absolute right-6 top-6 z-20 rounded-full bg-white/15 p-2 text-white hover:bg-white/25">
              <IconClose className="h-5 w-5" />
            </button>
            {viewer.images.length > 1 ? (
              <>
                <button type="button" onClick={prevViewerImage} className="absolute left-6 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <IconChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={nextViewerImage} className="absolute right-[376px] top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <IconChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
            <img src={viewer.images[viewer.index]} alt="Hub photo" className="max-h-[85vh] max-w-[65vw] rounded-xl object-contain" />
          </div>

          <aside className="hidden w-[360px] shrink-0 flex-col border-l border-white/20 bg-white p-5 lg:flex">
            <h3 className="text-base font-semibold tracking-tight text-[#111111]">{viewer.title || "Photo"}</h3>
            <p className="mt-2 text-sm text-slate-600">{viewer.body || "Shared from this hub."}</p>
            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <p>Comments</p>
              <p>• Great update from the hub team.</p>
              <p>• Looking forward to this event.</p>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
              <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#0C5C57]"><IconLike className="h-4 w-4" />Like</button>
              <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#0C5C57]"><IconComment className="h-4 w-4" />Comment</button>
            </div>
            <button type="button" className={cn(BUTTON_PRIMARY, "mt-auto w-full")}>Show the post</button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
