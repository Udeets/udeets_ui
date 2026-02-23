// app/dashboard/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

type AccordionId = "religious-places" | "communities" | "restaurants";

export default function DashboardPage() {
  const [open, setOpen] = useState<AccordionId | null>(null);

  function toggle(id: AccordionId) {
    setOpen((curr) => (curr === id ? null : id));
  }

  return (
    <main className="min-h-screen bg-white font-sans text-gray-800 antialiased selection:bg-cyan-200 selection:text-gray-900">
      {/* ================= Top Navigation (Global uDeets) ================= */}
      <header className={`${GRADIENT} w-full sticky top-0 z-50 shadow-md`}>
        <div className="w-full px-8 h-16 flex items-center justify-between">
          {/* Left: Logo + Brand (extreme left) */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/udeets-logo.png"
              alt="uDeets Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain"
            />
            <span className="text-white font-bold text-2xl tracking-tight">
              uDeets
            </span>
          </Link>

          {/* Right: Home + Logout (extreme right) */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              aria-label="Home"
              className="text-white/90 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
            >
              <IconHome className="h-6 w-6" />
            </Link>

            {/* No auth yet: placeholder */}
            <Link
              href="/"
              className="text-white/90 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"
            >
              Logout
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= Main Content ================= */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-12">
        {/* A) Discover Hubs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <IconCompass className="h-5 w-5 text-gray-700" />
              Discover Hubs
            </h2>
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              3 Categories
            </span>
          </div>

          <div className="space-y-3">
            {/* Religious Places */}
            <Accordion
              id="religious-places"
              title="Religious Places"
              icon={
                <CircleIcon
                  bgClass="bg-indigo-50 group-hover:bg-indigo-100"
                  icon={<IconPlaceOfWorship className="h-4 w-4 text-indigo-600" />}
                />
              }
              open={open === "religious-places"}
              onToggle={() => toggle("religious-places")}
            >
              <HubRow
                name="Hindu Center of Virginia"
                avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                subLabel="Public Hub"
                href="/hubs/religious-places/hindu-center-of-virginia"
              />
            </Accordion>

            {/* Communities */}
            <Accordion
              id="communities"
              title="Communities"
              icon={
                <CircleIcon
                  bgClass="bg-green-50 group-hover:bg-green-100"
                  icon={<IconUsers className="h-4 w-4 text-green-600" />}
                />
              }
              open={open === "communities"}
              onToggle={() => toggle("communities")}
            >
              <HubRow
                name="RKS – Richmond Kannada Sangha"
                avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                subLabel="Public Hub"
                href="/hubs/communities/richmond-kannada-sangha"
              />
            </Accordion>

            {/* Restaurants */}
            <Accordion
              id="restaurants"
              title="Restaurants"
              icon={
                <CircleIcon
                  bgClass="bg-orange-50 group-hover:bg-orange-100"
                  icon={<IconUtensils className="h-4 w-4 text-orange-600" />}
                />
              }
              open={open === "restaurants"}
              onToggle={() => toggle("restaurants")}
            >
              <HubRow
                name="Desi Bites"
                avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
                subLabel="Public Hub"
                href="/hubs/restaurants/desi-bites"
              />
            </Accordion>
          </div>
        </section>

        {/* B) Create Your Hub */}
        <section className="space-y-6 pt-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <IconLayerGroup className="h-5 w-5 text-gray-700" />
            Create Your Hub
          </h2>

          <Link href="/hub/create" className="block group">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer w-full h-48">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 group-hover:scale-110 transition-all duration-300 mb-4">
                <span className="text-2xl text-gray-600 group-hover:text-gray-900">
                  +
                </span>
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                Start building your own hub
              </span>
            </div>
          </Link>
        </section>

        {/* C) Public Feed */}
        <section className="space-y-6 pt-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <IconRss className="h-5 w-5 text-gray-700" />
              Public Feed
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Latest public posts from hubs on uDeets.
            </p>
          </div>

          <div className="space-y-8">
            {/* Hindu Center posts */}
            <FeedImagePost
              hubName="Hindu Center of Virginia"
              hubType="Religious Place"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
              timeLabel="Today"
              bg="bg-gradient-to-br from-orange-50 to-orange-100"
              centerIcon={<IconOm className="h-16 w-16 text-orange-200" />}
              text="Evening prayers and community gathering today. Join us for a spiritual session."
            />
            <FeedCardPost
              hubName="Hindu Center of Virginia"
              hubType="Religious Place • Feb 24"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
              accent="orange"
              badgeIcon={<IconCalendarCheck className="h-5 w-5 text-orange-600" />}
              title="Mahashivaratri Gathering"
              description="Feb 24 • Evening prayers + community dinner"
            />
            <FeedImagePost
              hubName="Hindu Center of Virginia"
              hubType="Religious Place"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
              timeLabel="Yesterday"
              bg="bg-gradient-to-br from-yellow-50 to-orange-50"
              centerIcon={<IconPray className="h-16 w-16 text-yellow-200" />}
              text="Volunteers preparing for upcoming celebrations. Thank you to everyone who helped setup!"
            />

            {/* RKS posts */}
            <FeedImagePost
              hubName="RKS – Richmond Kannada Sangha"
              hubType="Community"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
              timeLabel="2 days ago"
              bg="bg-gradient-to-br from-red-50 to-yellow-50"
              centerIcon={<IconMusic className="h-16 w-16 text-red-200" />}
              text="Community meet-up highlights. What an amazing turnout for the cultural evening!"
            />
            <FeedCardPost
              hubName="RKS – Richmond Kannada Sangha"
              hubType="Community • This week"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
              accent="blue"
              badgeIcon={<IconBullhorn className="h-5 w-5 text-blue-600" />}
              title="Ugadi Sambhrama Planning"
              description="Volunteers needed • coordination meeting this week"
            />
            <FeedImagePost
              hubName="RKS – Richmond Kannada Sangha"
              hubType="Community"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
              timeLabel="3 days ago"
              bg="bg-gradient-to-br from-green-50 to-teal-50"
              centerIcon={<IconUsersRect className="h-16 w-16 text-green-200" />}
              text="Kannada culture, food, and music — see you soon at the picnic!"
            />

            {/* Desi Bites posts */}
            <FeedImagePost
              hubName="Desi Bites"
              hubType="Restaurant"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
              timeLabel="4h ago"
              bg="bg-gradient-to-br from-orange-100 to-red-100"
              centerIcon={<IconBowl className="h-16 w-16 text-orange-300" />}
              text="Fresh specials today. Authentic Hyderabadi Dum Biryani ready to serve!"
            />
            <FeedCardPost
              hubName="Desi Bites"
              hubType="Restaurant • Limited Time"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
              accent="green"
              badgeIcon={<IconTag className="h-5 w-5 text-green-600" />}
              title="Weekend Specials"
              description="Chai + snack combos • limited availability"
              dashed
            />
            <FeedImagePost
              hubName="Desi Bites"
              hubType="Restaurant"
              avatarUrl="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
              timeLabel="5h ago"
              bg="bg-gradient-to-br from-gray-50 to-gray-200"
              centerIcon={<IconStore className="h-16 w-16 text-gray-300" />}
              text="New items coming soon — stay tuned. We are renovating our interior for better experience."
            />
          </div>

          {/* Loading state */}
          <div className="py-8 flex justify-center">
            <div className="flex items-center space-x-2 text-gray-500 text-sm animate-pulse">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ================= UI Components ================= */

function Accordion({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors focus:outline-none group"
        aria-expanded={open}
        aria-controls={`content-${id}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-700">{title}</span>
        </div>

        <span
          className={`text-gray-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <IconChevronDown className="h-4 w-4" />
        </span>
      </button>

      <div
        id={`content-${id}`}
        className={`bg-gray-50 border-t border-gray-100 overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function CircleIcon({
  bgClass,
  icon,
}: {
  bgClass: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${bgClass}`}
    >
      {icon}
    </div>
  );
}

function HubRow({
  name,
  avatarUrl,
  subLabel,
  href,
}: {
  name: string;
  avatarUrl: string;
  subLabel: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        </div>

        <div>
          <h4 className="font-bold text-gray-900 text-sm md:text-base">
            {name}
          </h4>
          <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <IconGlobe className="h-3 w-3 text-gray-400" />
            {subLabel}
          </span>
        </div>
      </div>

      <Link
        href={href}
        className="px-4 py-2 text-white text-sm font-medium rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600"
        style={{ backgroundColor: "#0E5A64" }}
      >
        View Hub
      </Link>
    </div>
  );
}

function FeedImagePost({
  hubName,
  hubType,
  avatarUrl,
  timeLabel,
  bg,
  centerIcon,
  text,
}: {
  hubName: string;
  hubType: string;
  avatarUrl: string;
  timeLabel: string;
  bg: string;
  centerIcon: React.ReactNode;
  text: string;
}) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
            <img src={avatarUrl} alt={hubName} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-gray-900">{hubName}</span>
            <span className="text-xs text-gray-500">{hubType}</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">{timeLabel}</span>
      </div>

      <div className={`w-full h-64 md:h-80 overflow-hidden relative ${bg}`}>
        <div className="absolute inset-0 bg-black/5 hover:bg-black/0 transition-colors" />
        <div className="w-full h-full flex items-center justify-center">
          {centerIcon}
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-800 text-sm leading-relaxed">{text}</p>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
        <ActionIcon icon={<IconHeartOutline className="h-5 w-5" />} hover="hover:text-red-500" />
        <ActionIcon icon={<IconComment className="h-5 w-5" />} hover="hover:text-blue-500" />
        <ActionIcon icon={<IconPaperPlane className="h-5 w-5" />} hover="hover:text-green-500" />
      </div>
    </article>
  );
}

function FeedCardPost({
  hubName,
  hubType,
  avatarUrl,
  accent,
  badgeIcon,
  title,
  description,
  dashed,
}: {
  hubName: string;
  hubType: string;
  avatarUrl: string;
  accent: "orange" | "blue" | "green";
  badgeIcon: React.ReactNode;
  title: string;
  description: string;
  dashed?: boolean;
}) {
  const bg =
    accent === "orange"
      ? "bg-orange-50 border-orange-100"
      : accent === "blue"
      ? "bg-blue-50 border-blue-100"
      : "bg-green-50 border-green-100";

  const borderStyle = dashed ? "border-dashed" : "border-solid";

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
          <img src={avatarUrl} alt={hubName} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-gray-900">{hubName}</span>
          <span className="text-xs text-gray-500">{hubType}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className={`${bg} ${borderStyle} rounded-lg p-4 border`}>
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-white p-2 rounded-md shadow-sm">
              {badgeIcon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
        <ActionIcon icon={<IconHeartOutline className="h-5 w-5" />} hover="hover:text-red-500" />
        <ActionIcon icon={<IconComment className="h-5 w-5" />} hover="hover:text-blue-500" />
        <ActionIcon icon={<IconPaperPlane className="h-5 w-5" />} hover="hover:text-green-500" />
      </div>
    </article>
  );
}

function ActionIcon({
  icon,
  hover,
}: {
  icon: React.ReactNode;
  hover: string;
}) {
  return (
    <button
      type="button"
      className={`text-gray-400 transition-colors ${hover}`}
      aria-label="Action"
    >
      {icon}
    </button>
  );
}

/* ================= Icons (inline SVG) ================= */

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 21v-6h5v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconCompass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14.5 9.5 9.5 14.5l5-2 0-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlaceOfWorship({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M5 10v9h14v-9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 19v-5h6v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUtensils({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6 2v8M4 2v8M8 2v8M6 10v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 2v8c0 2 2 2 2 0V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 4v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLayerGroup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconRss({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 11a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2c3 3 3 17 0 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2c-3 3-3 17 0 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconHeartOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 5-7 2 0 3.5 1 4 2 0.5-1 2-2 4-2 4 0 6.5 3.5 5 7-2 4.5-9 9-9 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconComment({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M21 14a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconPaperPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2 15 22l-4-9-9-4L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconOm({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 9c0-2.5 2-4 5-4 2.8 0 5 1.5 5 4 0 2.1-1.5 3.3-3.3 3.8M9.5 18c2.5 0 4.5-1.5 4.5-4.2 0-1.9-1-3.1-2.3-3.8M6.2 13.2c-.8.7-1.2 1.7-1.2 2.8 0 2.2 1.7 4 4.5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPray({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M10 4l2 2 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendarCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 8h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="m9 14 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMusic({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M19 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M11 16V6l10-2v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8l10-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBullhorn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 11v2a2 2 0 0 0 2 2h2l6 4V5L7 9H5a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 7h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" />
      <path d="M7 15l1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUsersRect({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 7h18v14H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M16 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M6 19a4 4 0 0 1 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 19a4 4 0 0 0-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBowl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 13h16a8 8 0 0 1-16 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" stroke="currentColor" strokeWidth="2" />
      <path d="M9 5c0 1 1 1 1 2M12 5c0 1 1 1 1 2M15 5c0 1 1 1 1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 12V3h9l9 9-9 9-9-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7.5 7.5h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconStore({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 7h16l-1 5H5L4 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 12v9h12v-9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}