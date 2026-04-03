"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell, Globe, MapPin, Megaphone, Shield, Sparkles, Users, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UdeetsBrandLockup, UdeetsLogoIcon } from "@/components/brand-logo";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import type { Hub as SupabaseHub } from "@/types/hub";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

type TopHub = {
  id: string;
  name: string;
  intro: string;
  href: string;
  image: string;
  category: string;
};

function toTopHub(hub: SupabaseHub): TopHub {
  return {
    id: hub.id,
    name: hub.name,
    intro: hub.description || "A community hub on uDeets.",
    href: `/hubs/${hub.category}/${hub.slug}`,
    image: normalizePublicSrc(hub.dp_image_url || hub.cover_image_url || undefined),
    category: hub.category,
  };
}

/* ─── Feature card ─── */
function FeatureCard({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-6 transition duration-300 hover:border-[#A9D1CA] hover:shadow-lg hover:shadow-[#0C5C57]/5">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F3]">
        <Icon className="h-5 w-5 text-[#0C5C57]" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-[#111111]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] text-sm font-bold text-white">
          {number}
        </div>
        {number < 3 && <div className="mt-2 h-full w-px bg-gradient-to-b from-[#A9D1CA] to-transparent" />}
      </div>
      <div className="pb-10">
        <h3 className="text-lg font-semibold tracking-tight text-[#111111]">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}

/* ─── Hub card ─── */
function HubCard({ hub }: { hub: TopHub }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={hub.href}
      className="group flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition duration-300 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50"
    >
      <div className="relative h-[160px] overflow-hidden bg-[#EAF6F3]">
        {hub.image && !imageFailed ? (
          <Image
            src={hub.image}
            alt={hub.name}
            fill
            unoptimized
            loader={({ src }) => src}
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="300px"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UdeetsLogoIcon className="h-12 w-12 text-[#0C5C57]/20" alt="" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold tracking-tight text-[#111111] group-hover:text-[#0C5C57] transition">
          {hub.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{hub.intro}</p>
      </div>
    </Link>
  );
}

/* ─── Social icons ─── */
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
        if (!cancelled) setTopHubs(hubs.slice(0, 8).map(toTopHub));
      } catch {
        if (!cancelled) setTopHubs([]);
      }
    }
    void loadTopHubs();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <UdeetsBrandLockup textClassName="text-xl sm:text-2xl" priority />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/discover"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#111111]"
              aria-label="Discover"
              title="Discover"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-4.3-4.3" />
                <circle cx="11" cy="11" r="7" />
              </svg>
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient orbs */}
          <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-[#EAF6F3]/60 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-[#A9D1CA]/20 blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:px-10 lg:pb-32 lg:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#A9D1CA]/50 bg-[#EAF6F3] px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#0C5C57]" />
                <span className="text-xs font-medium text-[#0C5C57]">Your community, simplified</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight text-[#111111] sm:text-6xl lg:text-7xl">
                Deets that matter.
                <br />
                <span className="text-[#0C5C57]">Organized beautifully.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500 sm:text-xl">
                Create hubs for your community, business, or organization. Share updates, events, and important details — all in one place.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:opacity-90 hover:shadow-xl hover:shadow-teal-900/25"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-7 py-3.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Explore Hubs
                </Link>
              </div>
            </div>

            {/* Hero visual */}
            <div className="mt-16 flex justify-center sm:mt-20">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-[#0C5C57] to-[#1a8a82] shadow-2xl shadow-teal-900/25 sm:h-80 sm:w-80 lg:h-96 lg:w-96">
                <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]" />
                <UdeetsLogoIcon
                  className="h-32 w-32 text-white/80 drop-shadow-[0_4px_24px_rgba(255,255,255,0.1)] sm:h-40 sm:w-40 lg:h-48 lg:w-48"
                  alt="uDeets logo"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="border-t border-slate-100 bg-[#FAFBFC] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
                Everything your community needs
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-500">
                From local businesses to neighborhoods, uDeets gives you the tools to stay connected and informed.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Megaphone}
                title="Real-time Updates"
                description="Post announcements, events, deals, and alerts. Your community sees them instantly."
              />
              <FeatureCard
                icon={Users}
                title="Membership & Roles"
                description="Manage members with roles like admin, moderator, and member. Control who can post and view."
              />
              <FeatureCard
                icon={Globe}
                title="Public or Private"
                description="Choose who can find and join your hub. Public hubs are discoverable; private hubs are invite-only."
              />
              <FeatureCard
                icon={Bell}
                title="Smart Notifications"
                description="Members get notified about the deets that matter to them — no noise, just signal."
              />
              <FeatureCard
                icon={MapPin}
                title="Local Discovery"
                description="Discover hubs near you. Find restaurants, communities, and organizations in your neighborhood."
              />
              <FeatureCard
                icon={Shield}
                title="Template System"
                description="Pre-configured templates for restaurants, HOAs, schools, fitness clubs, and more. Get started in seconds."
              />
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
                  Up and running in minutes
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-500">
                  No technical setup needed. Create your hub, customize it, and start sharing with your community.
                </p>
              </div>

              <div className="space-y-0">
                <StepCard
                  number={1}
                  title="Create your hub"
                  description="Pick a template that fits — restaurant, HOA, community group, or start from scratch. Name it, set visibility, and you're live."
                />
                <StepCard
                  number={2}
                  title="Share deets"
                  description="Post updates, events, specials, alerts, and photos. Add CTA buttons so your community can order, RSVP, or contact you directly."
                />
                <StepCard
                  number={3}
                  title="Grow your community"
                  description="Members join, subscribe, and stay informed. Everything they need — in one clean, organized hub."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── TOP HUBS ─── */}
        {topHubs.length > 0 && (
          <section className="border-t border-slate-100 bg-[#FAFBFC] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
              <div className="mb-12 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
                    Explore hubs
                  </h2>
                  <p className="mt-2 text-base text-slate-500">See what communities are building on uDeets.</p>
                </div>
                <Link
                  href="/discover"
                  className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-[#0C5C57] transition hover:underline sm:inline-flex"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div
                ref={hubsRowRef}
                onMouseEnter={() => setPauseAutoScroll(true)}
                onMouseLeave={() => setPauseAutoScroll(false)}
                className="flex gap-5 overflow-x-auto pb-4"
                style={{ scrollbarWidth: "none" as never }}
              >
                {topHubs.map((hub) => (
                  <HubCard key={hub.id} hub={hub} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── CTA BANNER ─── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C5C57] to-[#1a8a82] px-8 py-16 text-center shadow-2xl shadow-teal-900/20 sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(169,209,202,0.15),transparent_50%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_50%)]" />

              <div className="relative">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Ready to build your hub?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                  Join thousands of communities using uDeets to stay connected. It takes less than 60 seconds to get started.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0C5C57] shadow-lg transition hover:bg-slate-50"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 bg-[#111111]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
            <div className="flex items-center gap-3">
              <UdeetsLogoIcon className="h-7 w-7 text-white/80" alt="uDeets" />
              <span className="text-lg font-semibold text-white">uDeets</span>
            </div>

            <div className="flex items-center gap-8">
              <Link href="/discover" className="text-sm text-white/60 transition hover:text-white">
                Discover
              </Link>
              <Link href="/auth" className="text-sm text-white/60 transition hover:text-white">
                Sign in
              </Link>
            </div>

            <div className="flex gap-4">
              <IconFacebook className="h-5 w-5 text-white/40 transition hover:text-white/80" />
              <IconInstagram className="h-5 w-5 text-white/40 transition hover:text-white/80" />
              <IconYouTube className="h-5 w-5 text-white/40 transition hover:text-white/80" />
            </div>
          </div>

          <div className="border-t border-white/10 py-6 text-center">
            <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} uDeets. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
