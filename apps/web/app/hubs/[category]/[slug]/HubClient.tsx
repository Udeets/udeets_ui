/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HubRecord } from "@/lib/hubs";

// ✅ uDeets standard gradient system (2-color)
const GRADIENT_2 = "from-teal-500 to-cyan-500";

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
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white font-extrabold shadow-xl",
        `bg-gradient-to-br ${GRADIENT_2}`
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
    <div className="group bg-white rounded-3xl p-6 shadow-lg shadow-black/5 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all">
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

      <div className="mt-5 h-1 w-0 group-hover:w-full transition-all rounded-full bg-gradient-to-r from-teal-200 to-cyan-200" />
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
    <header className={cn("sticky top-0 z-50 shadow-md", `bg-gradient-to-br ${GRADIENT_2}`)}>
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <Link href={ROUTE_HOME} className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
          </div>
          <span className="text-2xl font-bold text-white">uDeets</span>
        </Link>

        {/* No icons on Home/Discover */}
        <div className="flex items-center gap-3">
          <Link href={ROUTE_HOME} className="px-4 py-2 text-white font-semibold hover:bg-white/10 rounded-lg">
            Home
          </Link>
          <Link href={ROUTE_DISCOVER} className="px-4 py-2 text-white font-semibold hover:bg-white/10 rounded-lg">
            Discover
          </Link>
        </div>
      </div>
    </header>
  );

  // ✅ Footer: compact like Home page
  const Footer = (
    <footer className={cn(`bg-gradient-to-br ${GRADIENT_2}`)}>
      <div className="flex h-16 items-center justify-between px-6 lg:px-10 text-white">
        <p>© uDeets. All rights reserved.</p>
        <div className="flex gap-5">
          <IconFacebook className="h-6 w-6 hover:text-white/80 cursor-pointer" />
          <IconInstagram className="h-6 w-6 hover:text-white/80 cursor-pointer" />
          <IconYouTube className="h-6 w-6 hover:text-white/80 cursor-pointer" />
        </div>
      </div>
    </footer>
  );

  // =========================
  // INTRO (pre-subscribe)
  // =========================
  if (mode === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {Header}

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className={cn("absolute inset-0", `bg-gradient-to-br ${GRADIENT_2}`)} />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center px-6 lg:px-16 py-14 lg:py-16">
            {/* LEFT */}
            <div className="text-white max-w-3xl space-y-6">
              <div className="flex items-center gap-4">
                {/* ✅ dpImage (local) */}
                {dpImageSrc ? (
                  <img
                    src={dpImageSrc}
                    alt={`${hub.name} avatar`}
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white/20 border-4 border-white/40" />
                )}

                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">{hub.name}</h1>
                  <div className="mt-1 text-white/90 text-lg">{hub.locationLabel}</div>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                {/* ✅ Public badge BG white */}
                <span className="bg-white text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {hub.visibility}
                </span>
                <span className="text-white/90 text-sm">{hub.membersLabel}</span>
              </div>

              <p className="text-lg sm:text-xl text-white/90 leading-relaxed">{hub.description}</p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="bg-white text-teal-700 px-8 py-4 rounded-xl font-semibold shadow-xl hover:bg-white/80"
                >
                  {subscribed ? "Subscribed" : isPublic ? "Subscribe" : "Request Access"}
                </button>

                {/* No icon on Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:bg-white/10"
                >
                  Share
                </button>
              </div>

              {!isPublic && (
                <div className="text-white/90 text-sm">
                  This is a private hub. Subscribe to request access. Once approved, you’ll unlock the full hub.
                </div>
              )}

              {requested && !isPublic && (
                <div className="rounded-2xl bg-white/15 border border-white/25 p-4 text-white/95">
                  Request sent. You’ll get access after the hub admin approves.
                </div>
              )}
            </div>

            {/* RIGHT IMAGE (heroImage local) */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-cyan-300/30 blur-3xl" />

                <div className="relative rounded-[2.5rem] p-[3px] bg-gradient-to-br from-cyan-300/70 via-white/40 to-cyan-200/70 shadow-[0_0_70px_rgba(93,191,201,0.45)]">
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-white/5 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/30" />
                    <div className="relative h-[460px] w-full">
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
          </div>
        </section>

        {/* ✅ CONTENT SECTION (RESTORED) */}
        <main className="px-6 lg:px-10 py-12">
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
                  <span className="text-teal-700 font-bold">✓</span>
                  <span>Announcements & important alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold">✓</span>
                  <span>Events, reminders, and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold">✓</span>
                  <span>Subscriber-only drops (when enabled)</span>
                </li>
              </ul>
            </PrettyCard>

            <PrettyCard title="Popular Topics" subtitle="What people follow" iconLabel="#">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
                  Updates
                </span>
                <span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-semibold">
                  Events
                </span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                  Deals
                </span>
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                  Community
                </span>
              </div>
            </PrettyCard>

            <PrettyCard title="Contact" subtitle="Reach the hub" iconLabel="✉">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">contact@{hub.slug}.com</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold text-gray-900">(000) 000-0000</span>
                </div>
              </div>
            </PrettyCard>
          </div>

          {/* About block + checklist */}
          <div className="bg-white rounded-3xl p-8 shadow-lg shadow-black/5 border border-gray-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-extrabold text-gray-900">About This Hub</h2>

              <button
                type="button"
                onClick={handleSubscribe}
                className={cn(
                  "text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition",
                  `bg-gradient-to-br ${GRADIENT_2}`
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
                      "mt-0.5 h-6 w-6 rounded-full text-white grid place-items-center text-sm font-extrabold",
                      `bg-gradient-to-br ${GRADIENT_2}`
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {Header}

      <main className="px-6 lg:px-10 py-12">
        <div className="bg-white rounded-3xl p-10 shadow-lg shadow-black/5 border border-gray-100">
          <div className="text-sm text-gray-500">FULL HUB (Managed Experience)</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{hub.name}</h1>
          <p className="text-gray-700 mt-4">
            This is the post-subscribe detailed hub view. Next we’ll plug in the real managed tabs
            (About, Updates, Events, Gallery) and use your actual images from{" "}
            <code className="px-2 py-1 bg-gray-50 rounded">public/hub-images</code>.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/hubs/${hub.category}/${hub.slug}`}
              className={cn(
                "inline-block px-7 py-3 rounded-xl font-semibold text-white",
                `bg-gradient-to-br ${GRADIENT_2}`
              )}
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