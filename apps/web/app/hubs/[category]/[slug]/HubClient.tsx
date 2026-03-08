/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HubRecord } from "@/lib/hubs";

const HEADER_BG = "bg-white border-b border-slate-200/60";
const FOOTER_BG = "bg-[#0C5C57]";
const PAGE_BG = "bg-[#E3F1EF]";
const SECTION_MINT_BG = "bg-[#E3F1EF]";
const HERO_ACCENT_BG = SECTION_MINT_BG;
const NAV_TEXT = "text-[#111111]";
const LOGO_TEXT = "text-[#111111]";
const BRAND_TEXT_STYLE = `truncate text-xl font-serif font-semibold tracking-tight ${LOGO_TEXT} sm:text-2xl`;
const DISPLAY_HEADING = "font-serif font-semibold tracking-tight text-[#111111]";
const ACCENT_MEDIUM_GREEN = "bg-[#A9D1CA]";
const ICON_GREEN = "text-[#0B6E78]";
const BUTTON_PRIMARY =
  "rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-medium text-white hover:bg-[#094a46]";

const ROUTE_HOME = "/";
const ROUTE_DISCOVER = "/discover";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function subKey(hubId: string) {
  return `udeets:subscribed:${hubId}`;
}

// Ensure local public images work even if caller forgets leading "/"
function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

// ✅ Footer icons: same SVG set as Home page
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

// Simple small inline icon (no emojis)
function MiniIcon({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl font-extrabold",
        ICON_GREEN,
        ACCENT_MEDIUM_GREEN
      )}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

function PrettyCard({
  title,
  subtitle,
  iconLabel,
  children,
}: {
  title: string;
  subtitle: string;
  iconLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group bg-white rounded-xl p-6 shadow-sm border border-slate-100 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <MiniIcon label={iconLabel} />
        <div className="min-w-0">
          <div className="text-base font-extrabold text-gray-900 leading-tight truncate">
            {title}
          </div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
      </div>

      <div className="text-sm text-gray-700">{children}</div>

      <div className="mt-5 h-1 w-0 group-hover:w-full transition-all rounded-full bg-slate-300" />
    </div>
  );
}

export default function HubClient({
  hub,
  mode = "intro",
  category,
  slug,
}: {
  hub: HubRecord;
  mode?: "intro" | "full";
  category?: string;
  slug?: string;
}) {
  const router = useRouter();

  const [subscribed, setSubscribed] = useState(false);
  const [requested, setRequested] = useState(false);

  const isPublic = hub.visibility === "Public";

  useEffect(() => {
    try {
      setSubscribed(localStorage.getItem(subKey(hub.id)) === "true");
    } catch {
      // ignore
    }
  }, [hub.id]);

  const resolvedCategory = category ?? hub.category;
  const resolvedSlug = slug ?? hub.slug;

  const heroImageSrc = normalizePublicSrc(hub.heroImage);
  const dpImageSrc = normalizePublicSrc(hub.dpImage);

  const aboutLines = useMemo(() => {
    if (hub.about?.length) return hub.about;
    return [
      "See what’s happening right now—announcements, specials, and highlights.",
      "Get reminders so you never miss key events or limited-time deals.",
      "Unlock the full hub experience after subscribing.",
    ];
  }, [hub.about]);

  const handleSubscribe = () => {
    try {
      localStorage.setItem(subKey(hub.id), "true");
    } catch {
      // ignore
    }
    setSubscribed(true);

    if (isPublic) {
      router.push(`/hubs/${resolvedCategory}/${resolvedSlug}/full`);
      return;
    }

    setRequested(true);
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  // ✅ Header: extreme ends like Home page
  const Header = (
    <header className={cn("sticky top-0 z-50", HEADER_BG)}>
      <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
        <Link href={ROUTE_HOME} className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative h-10 w-10">
            <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
          </div>
          <span className={BRAND_TEXT_STYLE}>uDeets</span>
        </Link>

        {/* No icons on Home/Discover */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={ROUTE_HOME} className={`rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} hover:bg-slate-100 sm:px-5 sm:py-2.5`}>
            Home
          </Link>
          <Link href={ROUTE_DISCOVER} className={`rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} hover:bg-slate-100 sm:px-5 sm:py-2.5`}>
            Discover
          </Link>
        </div>
      </div>
    </header>
  );

  // ✅ Footer: compact like Home page
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

  // =========================
  // INTRO (pre-subscribe)
  // =========================
  if (mode === "intro") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        {Header}

        {/* HERO */}
        <section className={cn("relative overflow-hidden", HERO_ACCENT_BG)}>
          <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-emerald-100/80 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-10 lg:py-16">
            {/* LEFT */}
            <div className="max-w-3xl space-y-6 text-slate-900">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {/* ✅ dpImage (local) */}
                {dpImageSrc ? (
                  <img
                    src={dpImageSrc}
                    alt={`${hub.name} avatar`}
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-emerald-100/70" />
                )}

                <div className="min-w-0">
                  <h1 className={cn("break-words text-3xl leading-tight sm:text-4xl lg:text-5xl", DISPLAY_HEADING)}>{hub.name}</h1>
                  <div className="mt-1 text-lg text-slate-600">{hub.locationLabel}</div>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                {/* ✅ Public badge BG white */}
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {hub.visibility}
                </span>
                <span className="text-sm text-slate-600">{hub.membersLabel}</span>
              </div>

              <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">{hub.description}</p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-4">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className={cn(BUTTON_PRIMARY, "text-center")}
                >
                  {subscribed ? "Subscribed" : isPublic ? "Subscribe" : "Request Access"}
                </button>

                {/* No icon on Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Share
                </button>
              </div>

              {!isPublic && (
                <div className="text-sm text-slate-600">
                  This is a private hub. Subscribe to request access. Once approved, you’ll unlock the full hub.
                </div>
              )}

              {requested && !isPublic && (
                <div className="rounded-xl border border-slate-100 bg-[#E3F1EF] p-4 text-slate-700">
                  Request sent. You’ll get access after the hub admin approves.
                </div>
              )}
            </div>

            {/* RIGHT IMAGE (heroImage local) */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-white shadow-sm">
                  <div className="relative h-[280px] w-full sm:h-[380px] lg:h-[460px]">
                    <img
                      src={heroImageSrc}
                      alt={`${hub.name} cover`}
                      className="h-full w-full object-cover rounded-[2.5rem]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ✅ CONTENT SECTION (RESTORED) */}
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          {/* 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <PrettyCard title="Quick Info" subtitle="Know the basics" iconLabel="i">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold text-gray-900">{hub.locationLabel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Visibility:</span>
                  <span className="font-semibold text-gray-900">{hub.visibility}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Members:</span>
                  <span className="font-semibold text-gray-900">{hub.membersLabel}</span>
                </div>
              </div>
            </PrettyCard>

            <PrettyCard title="What You’ll Get" subtitle="Why it’s worth it" iconLabel="★">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span>Announcements & important alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span>Events, reminders, and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-800 font-bold">✓</span>
                  <span>Subscriber-only drops (when enabled)</span>
                </li>
              </ul>
            </PrettyCard>

            <PrettyCard title="Popular Topics" subtitle="What people follow" iconLabel="#">
              <div className="flex flex-wrap gap-2">
                <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold text-[#111111]", ACCENT_MEDIUM_GREEN)}>
                  Updates
                </span>
                <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold text-[#111111]", ACCENT_MEDIUM_GREEN)}>
                  Events
                </span>
                <span className="px-3 py-1.5 bg-[#E3F1EF] text-slate-700 rounded-full text-xs font-semibold">
                  Deals
                </span>
                <span className="px-3 py-1.5 bg-[#E3F1EF] text-slate-700 rounded-full text-xs font-semibold">
                  Community
                </span>
              </div>
            </PrettyCard>

            <PrettyCard title="Contact" subtitle="Reach the hub" iconLabel="✉">
              <div className="space-y-3 min-w-0">
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="break-all font-semibold text-gray-900">contact@{hub.slug}.com</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold text-gray-900">(000) 000-0000</span>
                </div>
              </div>
            </PrettyCard>
          </div>

          {/* About block + checklist */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className={cn("text-2xl", DISPLAY_HEADING)}>About This Hub</h2>

              <button
                type="button"
                onClick={handleSubscribe}
                className={cn(
                  `${BUTTON_PRIMARY} transition`
                )}
              >
                {subscribed ? "Subscribed" : isPublic ? "Subscribe to Continue" : "Request Access"}
              </button>
            </div>

            <p className="text-gray-600 mt-5 leading-relaxed">{hub.description}</p>

            <ul className="space-y-3 mt-6">
              {aboutLines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 place-items-center rounded-full text-[#0E5A64] text-sm font-extrabold",
                      ACCENT_MEDIUM_GREEN
                    )}
                  >
                    ✓
                  </span>
                  <span className="text-gray-700">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </main>

        {Footer}
      </div>
    );
  }

  // =========================
  // FULL (post-subscribe) placeholder
  // =========================
  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      {Header}

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm sm:p-10">
          <div className="text-sm text-gray-500">FULL HUB (Managed Experience)</div>
          <h1 className={cn("mt-2 break-words text-2xl sm:text-3xl", DISPLAY_HEADING)}>{hub.name}</h1>
          <p className="text-gray-700 mt-4">
            This is the post-subscribe detailed hub view. Next we’ll plug in the real managed tabs
            (About, Updates, Events, Gallery) and use your actual images from{" "}
            <code className="px-2 py-1 bg-gray-50 rounded">public/hub-images</code>.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/hubs/${hub.category}/${hub.slug}`}
              className={BUTTON_PRIMARY}
            >
              Back to Intro
            </Link>

            <Link
              href={ROUTE_DISCOVER}
              className="inline-block px-7 py-3 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Back to Discover
            </Link>
          </div>
        </div>
      </main>

      {Footer}
    </div>
  );
}
