"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronDown,
  Church,
  Dumbbell,
  Globe,
  Home,
  MapPin,
  Megaphone,
  MessageSquare,
  PawPrint,
  Shield,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
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
  locationLabel: string;
};

function toTopHub(hub: SupabaseHub): TopHub {
  return {
    id: hub.id,
    name: hub.name,
    intro: hub.description || "A community hub on uDeets.",
    href: `/hubs/${hub.category}/${hub.slug}`,
    image: normalizePublicSrc(hub.dp_image_url || hub.cover_image_url || undefined),
    category: hub.category,
    locationLabel: [hub.city, hub.state].filter(Boolean).join(", "),
  };
}

/* ─── Feature card ─── */
function FeatureCard({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) {
  return (
    <div className="group rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-6 transition duration-300 hover:border-[#A9D1CA] hover:shadow-lg hover:shadow-[#0C5C57]/5">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ud-brand-light)]">
        <Icon className="h-5 w-5 text-[var(--ud-brand-primary)]" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{description}</p>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-sm font-bold text-white">
          {number}
        </div>
        {number < 3 && <div className="mt-2 h-full w-px bg-gradient-to-b from-[#A9D1CA] to-transparent" />}
      </div>
      <div className="pb-10">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{description}</p>
      </div>
    </div>
  );
}

/* ─── Discover-style hub list item (horizontal scroll version) ─── */
function HubListItemHorizontal({ hub }: { hub: TopHub }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={hub.href}
      className="flex w-[320px] shrink-0 items-start gap-4 rounded-xl bg-[var(--ud-bg-card)] p-3 transition duration-200 hover:shadow-md border border-[var(--ud-border-subtle)] hover:border-[var(--ud-border)]"
    >
      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
        {hub.image && !imageFailed ? (
          <img
            src={hub.image}
            alt={hub.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
            <span className="text-2xl font-semibold text-white/70">{hub.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--ud-text-primary)]">{hub.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--ud-text-secondary)]">{hub.intro}</p>
        {hub.locationLabel && (
          <p className="mt-1.5 text-[12px] text-[var(--ud-text-muted)] truncate">{hub.locationLabel}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── Use-case card ─── */
function UseCaseCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-6 transition duration-300 hover:border-[#A9D1CA] hover:shadow-lg hover:shadow-[#0C5C57]/5"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF6F3] to-[#d4ece7]">
        <Icon className="h-6 w-6 text-[var(--ud-brand-primary)]" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)] group-hover:text-[var(--ud-brand-primary)] transition">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--ud-brand-primary)]">
        Learn more <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

/* ─── FAQ item ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--ud-border-subtle)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-[var(--ud-text-primary)]">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[var(--ud-text-muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)]">{answer}</p>
      </div>
    </div>
  );
}

/* ─── Animated phone mockup for hero ─── */
function HeroPhoneMockup() {
  const [activeScreen, setActiveScreen] = useState(0);
  const screens = [
    { icon: Megaphone, label: "Announcements", color: "from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]" },
    { icon: Calendar, label: "Events", color: "from-blue-500 to-blue-600" },
    { icon: Users, label: "Members", color: "from-purple-500 to-purple-600" },
    { icon: MapPin, label: "Discover", color: "from-amber-500 to-amber-600" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveScreen((s) => (s + 1) % screens.length), 2500);
    return () => clearInterval(timer);
  }, [screens.length]);

  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px]">
      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[2.5rem] border-[8px] border-[#111111] bg-[var(--ud-bg-card)] shadow-2xl shadow-slate-900/20">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-[#111111] px-6 py-2">
          <span className="text-[10px] font-medium text-white/60">9:41</span>
          <div className="flex gap-1">
            <div className="h-1.5 w-3 rounded-sm bg-white/60" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
          </div>
        </div>

        {/* App header */}
        <div className="bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <UdeetsLogoIcon className="h-6 w-6 text-white" alt="" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">My Community Hub</div>
              <div className="text-[10px] text-white/60">128 members</div>
            </div>
          </div>
        </div>

        {/* Animated screens */}
        <div className="relative h-[320px] sm:h-[360px] overflow-hidden">
          {screens.map((screen, i) => (
            <div
              key={screen.label}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-500"
              style={{
                opacity: activeScreen === i ? 1 : 0,
                transform: activeScreen === i ? "translateY(0)" : "translateY(20px)",
              }}
            >
              <div className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br", screen.color)}>
                <screen.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[var(--ud-text-primary)]">{screen.label}</div>
                <div className="mt-2 space-y-2">
                  <div className="mx-auto h-2.5 w-48 rounded-full bg-slate-100" />
                  <div className="mx-auto h-2.5 w-36 rounded-full bg-slate-100" />
                  <div className="mx-auto h-2.5 w-40 rounded-full bg-slate-100" />
                </div>
              </div>
              {/* Fake cards */}
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-[var(--ud-bg-subtle)] p-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-24 rounded-full bg-slate-200" />
                    <div className="h-2 w-16 rounded-full bg-slate-100" />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--ud-bg-subtle)] p-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-20 rounded-full bg-slate-200" />
                    <div className="h-2 w-14 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-around border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-4 py-3">
          {screens.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setActiveScreen(i)}
              className="flex flex-col items-center gap-1"
            >
              <s.icon className={cn("h-4 w-4 transition", activeScreen === i ? "text-[var(--ud-brand-primary)]" : "text-[var(--ud-border)]")} />
              <div className={cn("h-1 w-1 rounded-full transition", activeScreen === i ? "bg-[#0C5C57]" : "bg-transparent")} />
            </button>
          ))}
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -left-8 top-1/4 animate-[float_3s_ease-in-out_infinite] rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-2 shadow-lg sm:-left-16">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ud-brand-light)]">
            <Bell className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" />
          </div>
          <div className="text-xs font-medium text-[var(--ud-text-primary)]">New deet!</div>
        </div>
      </div>
      <div className="absolute -right-6 top-2/3 animate-[float_3s_ease-in-out_infinite_1.5s] rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-2 shadow-lg sm:-right-14">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ud-brand-light)]">
            <Users className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" />
          </div>
          <div className="text-xs font-medium text-[var(--ud-text-primary)]">+3 joined</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Scroll-animated section wrapper ─── */
function AnimateOnScroll({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
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

/* ─── Header dropdown ─── */
function NavDropdown({ label, items }: { label: string; items: { label: string; href: string; description?: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-elevated)] p-2 shadow-xl shadow-slate-200/50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 transition hover:bg-[var(--ud-bg-subtle)]"
            >
              <div className="text-sm font-medium text-[var(--ud-text-primary)]">{item.label}</div>
              {item.description && (
                <div className="mt-0.5 text-xs text-[var(--ud-text-secondary)]">{item.description}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── FAQ data ─── */
const FAQ_ITEMS = [
  {
    question: "What is a hub?",
    answer:
      "A hub is your community's home on uDeets. It's a dedicated space where you can share updates (called deets), events, photos, and important information with your members. Think of it as a modern replacement for group chats, Facebook groups, and community bulletin boards, all in one clean, organized place.",
  },
  {
    question: "Is uDeets free to use?",
    answer:
      "Yes! Creating a hub and joining hubs is completely free. We believe every community deserves a great tool to stay connected. Premium features for larger organizations will be available in the future.",
  },
  {
    question: "What types of communities can use uDeets?",
    answer:
      "uDeets works for any group that needs to share information and stay connected. Popular use cases include restaurants sharing daily specials, HOAs posting community updates, religious organizations coordinating events, fitness clubs managing schedules, pet clubs organizing meetups, and neighborhood groups staying informed.",
  },
  {
    question: "How is uDeets different from WhatsApp groups or Facebook groups?",
    answer:
      "Unlike chat apps where important information gets buried in conversations, uDeets organizes everything by type: announcements, events, photos, and files. Members can find what they need without scrolling through hundreds of messages. Plus, hub creators get professional tools like custom branding, event RSVPs, and role-based access control.",
  },
  {
    question: "Can I make my hub private?",
    answer:
      "Absolutely. When creating a hub, you can choose between public (discoverable by anyone) or private (invite-only). Private hubs require an admin to approve join requests, giving you full control over who can see your content.",
  },
  {
    question: "What are templates and how do they work?",
    answer:
      "Templates are pre-configured hub setups designed for specific types of communities. For example, the Restaurant template comes with sections for menu, specials, and hours, while the HOA template includes sections for rules, maintenance, and community events. Templates save you setup time and you can always customize them later.",
  },
  {
    question: "How do members join my hub?",
    answer:
      "Members can join by searching for your hub on the Discover page, through a direct invite link you share, or by visiting your hub's custom URL (yourhub.udeets.com). For private hubs, members request to join and an admin approves the request.",
  },
  {
    question: "Can I customize my hub's appearance?",
    answer:
      "Yes! You can upload a display picture and cover photo, choose from 6 accent color themes, and organize your sections however you like. Your hub gets its own custom URL (yourhub.udeets.com) for easy sharing.",
  },
];

/* ─── Template data ─── */
const TEMPLATES = [
  { icon: UtensilsCrossed, name: "Restaurants", description: "Menus, daily specials, hours, and online ordering links", slug: "restaurants" },
  { icon: Home, name: "HOA", description: "Community rules, maintenance updates, and resident communication", slug: "hoa" },
  { icon: Church, name: "Religious Places", description: "Service times, event calendars, and congregation updates", slug: "religious-places" },
  { icon: Dumbbell, name: "Fitness", description: "Class schedules, member workouts, and club announcements", slug: "fitness" },
  { icon: PawPrint, name: "Pet Clubs", description: "Meetup coordination, pet galleries, and community events", slug: "pet-clubs" },
  { icon: Users, name: "Communities", description: "Neighborhood groups, alumni networks, and social clubs", slug: "communities" },
  { icon: Calendar, name: "Events", description: "Event planning, RSVPs, calendars, and attendee management", slug: "events" },
  { icon: Store, name: "Retail", description: "Product updates, promotions, loyalty programs, and store info", slug: "retail" },
];

export default function Page() {
  const hubsRowRef = useRef<HTMLDivElement | null>(null);
  const [pauseAutoScroll, setPauseAutoScroll] = useState(false);
  const [topHubs, setTopHubs] = useState<TopHub[]>([]);
  const [showAppComingSoon, setShowAppComingSoon] = useState(false);

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
        if (!cancelled) setTopHubs(hubs.slice(0, 12).map(toTopHub));
      } catch {
        if (!cancelled) setTopHubs([]);
      }
    }
    void loadTopHubs();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--ud-bg-page)]">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-page)]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* Left: Logo + nav links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <UdeetsBrandLockup textClassName="text-xl sm:text-2xl" priority />
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              <Link
                href="/about"
                className="rounded-full px-3 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              >
                About
              </Link>

              <NavDropdown
                label="Use Cases"
                items={[
                  { label: "Restaurants", href: "/use-cases#restaurants", description: "Menus, specials & online ordering" },
                  { label: "HOA & Communities", href: "/use-cases#hoa", description: "Updates, rules & resident comms" },
                  { label: "Religious Places", href: "/use-cases#religious", description: "Services, events & outreach" },
                  { label: "Fitness & Sports", href: "/use-cases#fitness", description: "Schedules, classes & clubs" },
                  { label: "All Use Cases", href: "/use-cases", description: "See all templates and use cases" },
                ]}
              />

              <NavDropdown
                label="Resources"
                items={[
                  { label: "FAQ", href: "/resources#faq", description: "Frequently asked questions" },
                  { label: "Blog", href: "/resources#blog", description: "Tips, updates & community stories" },
                  { label: "Tutorials", href: "/resources#tutorials", description: "Step-by-step guides" },
                  { label: "Help Centre", href: "/resources#help", description: "Get support" },
                ]}
              />
            </nav>
          </div>

          {/* Right: Search + Theme Toggle + Sign in */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/discover"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
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
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-[var(--ud-brand-light)]/60 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-[#A9D1CA]/20 blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:px-10 lg:pb-32 lg:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppComingSoon(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2.5 text-white transition hover:bg-[#222222]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] uppercase tracking-wide opacity-70">Download on the</div>
                    <div className="text-sm font-semibold -mt-0.5">App Store</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAppComingSoon(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2.5 text-white transition hover:bg-[#222222]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zM14.851 13.06l2.559 1.478-3.041 3.041-2.559-1.478zm3.11-3.538L20.6 11.04c.543.314.543 1.107 0 1.42L17.96 13.98l-2.518-1.98zm-3.11-3.538 2.559-1.478 3.041 3.041-2.559 1.478z" /></svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] uppercase tracking-wide opacity-70">Get it on</div>
                    <div className="text-sm font-semibold -mt-0.5">Google Play</div>
                  </div>
                </button>
              </div>

              <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight text-[var(--ud-text-primary)] sm:text-6xl lg:text-7xl">
                Deets that matter.
                <br />
                <span className="text-[var(--ud-brand-primary)]">Seamlessly managed.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--ud-text-secondary)] sm:text-xl">
                Create hubs for your community, business, or organization. Share updates, events, and important details, all in one place.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:opacity-90 hover:shadow-xl hover:shadow-teal-900/25"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--ud-border)] px-7 py-3.5 text-sm font-medium text-[var(--ud-text-primary)] transition hover:border-[var(--ud-border)] hover:bg-[var(--ud-bg-subtle)]"
                >
                  Explore Hubs
                </Link>
              </div>
            </div>

            <div className="mt-16 flex justify-center sm:mt-20">
              <HeroPhoneMockup />
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                Everything your community needs
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ud-text-secondary)]">
                From local businesses to neighborhoods, uDeets gives you the tools to stay connected and informed.
              </p>
            </AnimateOnScroll>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Megaphone, title: "Real-time Updates", description: "Post announcements, events, deals, and alerts. Your community sees them instantly." },
                { icon: Users, title: "Membership & Roles", description: "Manage members with roles like admin, moderator, and member. Control who can post and view." },
                { icon: Globe, title: "Public or Private", description: "Choose who can find and join your hub. Public hubs are discoverable; private hubs are invite-only." },
                { icon: Bell, title: "Smart Notifications", description: "Members get notified about the deets that matter to them. No noise, just signal." },
                { icon: MapPin, title: "Local Discovery", description: "Discover hubs near you. Find restaurants, communities, and organizations in your neighborhood." },
                { icon: Shield, title: "Template System", description: "Pre-configured templates for restaurants, HOAs, schools, fitness clubs, and more. Get started in seconds." },
              ].map((f, i) => (
                <AnimateOnScroll key={f.title} delay={i * 100}>
                  <FeatureCard icon={f.icon} title={f.title} description={f.description} />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ─── USE CASES / TEMPLATES ─── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                Built for every type of community
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ud-text-secondary)]">
                Choose a template to get started in seconds, or build your hub from scratch. Each template comes with sections, labels, and layouts designed for your specific use case.
              </p>
            </AnimateOnScroll>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATES.map((t, i) => (
                <AnimateOnScroll key={t.slug} delay={i * 80}>
                  <UseCaseCard
                    icon={t.icon}
                    title={t.name}
                    description={t.description}
                    href={`/use-cases#${t.slug}`}
                  />
                </AnimateOnScroll>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/use-cases"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ud-brand-primary)] transition hover:underline"
              >
                See all use cases and templates
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              <AnimateOnScroll>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                  Up and running in minutes
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--ud-text-secondary)]">
                  No technical setup needed. Create your hub, customize it, and start sharing with your community.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200} className="space-y-0">
                <StepCard
                  number={1}
                  title="Create your hub"
                  description="Pick a template that fits your community: restaurant, HOA, neighborhood group, or start from scratch. Name it, set visibility, and you're live."
                />
                <StepCard
                  number={2}
                  title="Share deets"
                  description="Post updates, events, specials, alerts, and photos. Add CTA buttons so your community can order, RSVP, or contact you directly."
                />
                <StepCard
                  number={3}
                  title="Grow your community"
                  description="Members join, subscribe, and stay informed. Everything they need in one clean, organized hub."
                />
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ─── EXPLORE HUBS (Discover-style horizontal scroll) ─── */}
        {topHubs.length > 0 && (
          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
              <AnimateOnScroll className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                    Explore hubs
                  </h2>
                  <p className="mt-2 text-base text-[var(--ud-text-secondary)]">See what communities are building on uDeets.</p>
                </div>
                <Link
                  href="/discover"
                  className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)] transition hover:underline sm:inline-flex"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </AnimateOnScroll>

              <div
                ref={hubsRowRef}
                onMouseEnter={() => setPauseAutoScroll(true)}
                onMouseLeave={() => setPauseAutoScroll(false)}
                className="flex gap-4 overflow-x-auto pb-4"
                style={{ scrollbarWidth: "none" as never }}
              >
                {topHubs.map((hub) => (
                  <HubListItemHorizontal key={hub.id} hub={hub} />
                ))}
              </div>

              <div className="mt-6 text-center sm:hidden">
                <Link href="/discover" className="text-sm font-medium text-[var(--ud-brand-primary)]">
                  View all hubs →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ─── TESTIMONIALS ─── */}
        <section className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                Loved by communities everywhere
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ud-text-secondary)]">
                See how organizations are using uDeets to stay connected.
              </p>
            </AnimateOnScroll>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote: "uDeets replaced our WhatsApp group chaos. Now our HOA members actually find the information they need.",
                  name: "Sarah K.",
                  role: "HOA President, Lakewood Estates",
                },
                {
                  quote: "We post our daily specials on our hub and customers check it every morning. It's become part of their routine.",
                  name: "Marco T.",
                  role: "Owner, Bella Cucina Restaurant",
                },
                {
                  quote: "Our congregation loves the event calendar and announcements. It keeps everyone in the loop without group chat overload.",
                  name: "Pastor James W.",
                  role: "Grace Community Church",
                },
              ].map((t, i) => (
                <AnimateOnScroll
                  key={t.name}
                  delay={i * 150}
                  className="rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-6"
                >
                  <MessageSquare className="mb-4 h-5 w-5 text-[#A9D1CA]" />
                  <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)] italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-[var(--ud-border-subtle)] pt-4">
                    <p className="text-sm font-semibold text-[var(--ud-text-primary)]">{t.name}</p>
                    <p className="text-xs text-[var(--ud-text-secondary)]">{t.role}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-20 sm:py-28" id="faq">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <AnimateOnScroll className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ud-text-secondary)]">
                Everything you need to know about uDeets and hubs.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200} className="mt-12 rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-6 sm:px-8">
              {FAQ_ITEMS.map((item) => (
                <FAQItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </AnimateOnScroll>

            <div className="mt-8 text-center">
              <p className="text-sm text-[var(--ud-text-secondary)]">
                Still have questions?{" "}
                <Link href="/resources#help" className="font-medium text-[var(--ud-brand-primary)] hover:underline">
                  Visit our Help Centre
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER ─── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-8 py-16 text-center shadow-2xl shadow-teal-900/20 sm:px-16 sm:py-20">
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[var(--ud-brand-primary)] shadow-lg transition hover:bg-white/90"
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

      {/* ─── App Coming Soon Modal ─── */}
      {showAppComingSoon && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAppComingSoon(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[var(--ud-bg-card)] p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Coming Soon!</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
              We&apos;re building native apps for iOS and Android. In the meantime, uDeets works great in your mobile browser.
            </p>
            <button
              type="button"
              onClick={() => setShowAppComingSoon(false)}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--ud-border-subtle)] bg-[#111111]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <UdeetsLogoIcon className="h-7 w-7 text-white/80" alt="uDeets" />
                <span className="text-lg font-semibold text-white">uDeets</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                The modern community hub for businesses, organizations, and neighborhoods.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Product</h4>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link href="/discover" className="text-sm text-white/60 transition hover:text-white">Discover</Link>
                <Link href="/create-hub" className="text-sm text-white/60 transition hover:text-white">Create a Hub</Link>
                <Link href="/use-cases" className="text-sm text-white/60 transition hover:text-white">Use Cases</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Resources</h4>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link href="/resources#faq" className="text-sm text-white/60 transition hover:text-white">FAQ</Link>
                <Link href="/resources#blog" className="text-sm text-white/60 transition hover:text-white">Blog</Link>
                <Link href="/resources#tutorials" className="text-sm text-white/60 transition hover:text-white">Tutorials</Link>
                <Link href="/resources#help" className="text-sm text-white/60 transition hover:text-white">Help Centre</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Company</h4>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link href="/about" className="text-sm text-white/60 transition hover:text-white">About</Link>
                <Link href="/terms" className="text-sm text-white/60 transition hover:text-white">Terms & Conditions</Link>
                <Link href="/privacy" className="text-sm text-white/60 transition hover:text-white">Privacy Policy</Link>
                <Link href="/auth" className="text-sm text-white/60 transition hover:text-white">Sign In</Link>
              </div>
              <div className="mt-6 flex gap-4">
                <IconFacebook className="h-5 w-5 text-white/40 transition hover:text-white/80" />
                <IconInstagram className="h-5 w-5 text-white/40 transition hover:text-white/80" />
                <IconYouTube className="h-5 w-5 text-white/40 transition hover:text-white/80" />
              </div>
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
