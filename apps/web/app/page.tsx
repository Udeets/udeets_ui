"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, CalendarDays, Clapperboard, ImageIcon, MapPin, Megaphone, Search, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UdeetsBrandLockup, UdeetsLogoIcon } from "@/components/brand-logo";
import { HowItWorksAnimated } from "@/components/home/how-it-works-animated";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import type { Hub as SupabaseHub } from "@/types/hub";

const PAGE_BG = "bg-white";
const HEADER_BG = "bg-white border-b border-slate-200/60";
const FOOTER_BG = "bg-[#0C5C57]";
const TEXT_PRIMARY = "text-[#111111]";
const NAV_TEXT = "text-[#111111]";
const BRAND_TEXT_STYLE = `text-xl sm:text-2xl`;
const DISPLAY_HEADING = `font-serif font-semibold tracking-tight ${TEXT_PRIMARY}`;
const SECTION_HEADING = `font-serif font-semibold tracking-tight ${TEXT_PRIMARY}`;
const BODY_TEXT = "font-sans leading-relaxed text-slate-600";
const BUTTON_PRIMARY = "rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-medium text-white hover:bg-[#094a46]";
const HEADER_ACTION = `rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} hover:bg-slate-100 sm:px-5 sm:py-2.5`;
const HERO_HEADING_LINE_ONE = "Deets that matter.";
const HERO_HEADING_LINE_TWO = "Simplified and organized.";
const HERO_TAGLINE = "Create hubs or subscribe to stay on top of deets that matter. Powered by uDeets.";

type TopHub = {
  id: string;
  name: string;
  intro: string;
  href: string;
  image: string;
  visibility: "Public" | "Private";
};

function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function toTopHub(hub: SupabaseHub): TopHub {
  return {
    id: hub.id,
    name: hub.name,
    intro: hub.description || "A new uDeets hub is getting set up.",
    href: `/hubs/${hub.category}/${hub.slug}`,
    image: normalizePublicSrc(hub.dp_image_url || hub.cover_image_url || undefined),
    visibility: "Public",
  };
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

function TopHubCard({ hub }: { hub: TopHub }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={hub.href}
      className="group relative flex h-[260px] w-[min(360px,calc(100vw-2rem))] flex-shrink-0 min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:border-slate-300 sm:w-[360px]"
    >
      {hub.image && !imageFailed ? (
        <Image
          src={hub.image}
          alt={hub.name}
          fill
          unoptimized
          loader={({ src }) => src}
          className="absolute inset-0 h-full w-full object-cover"
          sizes="(max-width: 640px) calc(100vw - 2rem), 360px"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[#A9D1CA]/35">
          <span className="px-4 text-sm font-semibold text-[#0C5C57]">Hub Image Coming Soon</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/75 via-[#111111]/35 to-transparent" />
      <div className="relative mt-auto w-full p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className={cn("min-w-0 break-words text-2xl leading-tight text-white", SECTION_HEADING)}>
            {hub.name}
          </h3>
          <span className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#111111]">
            {hub.visibility}
          </span>
        </div>
        <p className="line-clamp-2 break-words text-sm text-white/90">{hub.intro}</p>
      </div>
    </Link>
  );
}

function HeroBrandVisual() {
  const pillGroups = [
    {
      className: "left-[9%] top-[11%]",
      pills: [
        { Icon: ImageIcon, label: "Photo", className: "relative z-10 w-[5.6rem] sm:w-[6.2rem]" },
        { Icon: Clapperboard, label: "Video", className: "relative -mt-3 ml-6 w-[5.5rem] sm:-mt-3.5 sm:ml-7 sm:w-[6.1rem]" },
      ],
    },
    {
      className: "right-[8%] top-[14%]",
      pills: [
        { Icon: Search, label: "Search", className: "relative z-10 w-[5.8rem] sm:w-[6.4rem]" },
        { Icon: Users, label: "Members", className: "relative -mt-3 mr-6 w-[6.2rem] sm:-mt-3.5 sm:mr-7 sm:w-[6.9rem]" },
      ],
    },
    {
      className: "left-[10%] bottom-[16%]",
      pills: [
        { Icon: Megaphone, label: "Updates", className: "relative z-10 w-[6.1rem] sm:w-[6.7rem]" },
        { Icon: Bell, label: "Alerts", className: "relative -mt-3 ml-6 w-[5.7rem] sm:-mt-3.5 sm:ml-7 sm:w-[6.3rem]" },
      ],
    },
    {
      className: "right-[9%] bottom-[17%]",
      pills: [
        { Icon: CalendarDays, label: "Events", className: "relative z-10 w-[5.8rem] sm:w-[6.4rem]" },
        { Icon: MapPin, label: "Map", className: "relative -mt-3 mr-6 w-[5rem] sm:-mt-3.5 sm:mr-7 sm:w-[5.6rem]" },
      ],
    },
  ] as const;

  return (
    <div className="relative h-[280px] w-full sm:h-[420px] lg:h-[540px]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[18rem] w-[18rem] rounded-full bg-white/60 blur-3xl sm:h-[23rem] sm:w-[23rem] lg:h-[27rem] lg:w-[27rem]" />
      </div>

      <div className="relative flex h-full items-center justify-center p-4 sm:p-6">
        <div className="relative flex aspect-square w-full max-w-[29rem] items-center justify-center overflow-hidden rounded-[2rem] bg-[#0C5C57] shadow-[0_24px_60px_rgba(12,92,87,0.18)]">
          {pillGroups.map(({ className, pills }, index) => (
            <div
              key={index}
              className={`pointer-events-none absolute z-0 flex flex-col items-center gap-1.5 sm:gap-2 ${className}`}
            >
              {pills.map(({ Icon, label, className: pillClassName }) => (
                <div
                  key={label}
                  className={`rounded-2xl border border-white/12 bg-white/[0.12] px-3 py-1.5 shadow-[0_12px_30px_rgba(4,24,22,0.16)] backdrop-blur-md sm:px-3.5 sm:py-1.5 ${pillClassName}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon strokeWidth={2} className="h-4 w-4 shrink-0 text-white/92 sm:h-[1.05rem] sm:w-[1.05rem]" />
                    <span className="text-[10px] font-medium tracking-[0.14em] text-white/78 uppercase sm:text-[11px]">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="relative z-10 flex items-center justify-center">
            <div className="pointer-events-none absolute h-24 w-24 rounded-full bg-white/30 blur-2xl sm:h-32 sm:w-32 lg:h-40 lg:w-40" />
            <UdeetsLogoIcon
              className="h-28 w-28 text-white/80 opacity-90 drop-shadow-[0_8px_20px_rgba(255,255,255,0.14)] sm:h-40 sm:w-40 lg:h-52 lg:w-52"
              alt="uDeets logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const hubsRowRef = useRef<HTMLDivElement | null>(null);
  const [pauseAutoScroll, setPauseAutoScroll] = useState(false);
  const [topHubs, setTopHubs] = useState<TopHub[]>([]);

  useEffect(() => {
    const el = hubsRowRef.current;
    if (!el) return;

    const timer = window.setInterval(() => {
      if (pauseAutoScroll) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      el.scrollBy({ left: 1, behavior: "auto" });
    }, 28);

    return () => window.clearInterval(timer);
  }, [pauseAutoScroll]);

  useEffect(() => {
    let cancelled = false;

    async function loadTopHubs() {
      try {
        const hubs = await listHubs();
        if (!cancelled) {
          setTopHubs(hubs.slice(0, 8).map(toTopHub));
        }
      } catch {
        if (!cancelled) {
          setTopHubs([]);
        }
      }
    }

    void loadTopHubs();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollHubsBy = (delta: number) => {
    const el = hubsRowRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      {/* HEADER */}
      <header className={cn("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName={BRAND_TEXT_STYLE} priority />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth"
              className={HEADER_ACTION}
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className={BUTTON_PRIMARY}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className={PAGE_BG}>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-60 w-60 rounded-full bg-cyan-100/50 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-10">
            {/* LEFT CONTENT */}
            <div className="max-w-3xl space-y-6 text-slate-900 sm:space-y-7">
              <h1 className={cn("break-words text-4xl leading-[0.95] sm:text-5xl lg:text-6xl", DISPLAY_HEADING)}>
                <span className="block">{HERO_HEADING_LINE_ONE}</span>
                <span className="block">{HERO_HEADING_LINE_TWO}</span>
              </h1>

              <p className={cn("max-w-2xl text-base sm:text-lg lg:text-xl", BODY_TEXT)}>{HERO_TAGLINE}</p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
                <Link
                  href="/auth"
                  className={cn(BUTTON_PRIMARY, "text-center")}
                >
                  Get Started Free
                </Link>

                <Link
                  href="/discover"
                  className="rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Discover
                </Link>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <HeroBrandVisual />
              </div>
            </div>
          </div>
        </section>

        <HowItWorksAnimated />

        {/* TOP HUBS */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="mb-10 flex items-center justify-between gap-4">
              <h2 className={cn("text-3xl sm:text-4xl", SECTION_HEADING)}>Our Top Hubs</h2>
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  aria-label="Scroll hubs left"
                  onClick={() => scrollHubsBy(-380)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  <IconChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll hubs right"
                  onClick={() => scrollHubsBy(380)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  <IconChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={hubsRowRef}
              onMouseEnter={() => setPauseAutoScroll(true)}
              onMouseLeave={() => setPauseAutoScroll(false)}
              className="flex gap-6 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" as never }}
            >
              {topHubs.length ? (
                topHubs.map((hub) => <TopHubCard key={hub.id} hub={hub} />)
              ) : (
                <div className="w-full rounded-xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                  <h3 className={cn("text-2xl", SECTION_HEADING)}>No hubs yet</h3>
                  <p className="mt-3 text-sm text-slate-600">Create the first hub to see it featured here.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
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
      </main>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
