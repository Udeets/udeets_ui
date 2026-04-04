"use client";

import Link from "next/link";
import { ArrowRight, Globe, Heart, Megaphone, Shield, Sparkles, Target, Users, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UdeetsBrandLockup, UdeetsLogoIcon } from "@/components/brand-logo";


function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ─── Scroll-animated wrapper ─── */
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

/* ─── Animated counter ─── */
function AnimatedValue({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setValue(current);
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{value}{suffix}</span>;
}

/* ─── Floating orbit graphic ─── */
function OrbitGraphic() {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72 lg:h-80 lg:w-80">
      {/* Orbits */}
      <div className="absolute inset-0 animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-[#A9D1CA]/40" />
      <div className="absolute inset-6 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-dashed border-[#A9D1CA]/30" />
      <div className="absolute inset-12 animate-[spin_10s_linear_infinite] rounded-full border border-dashed border-[#A9D1CA]/20" />

      {/* Center logo */}
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] shadow-lg shadow-teal-900/20">
        <UdeetsLogoIcon className="h-10 w-10 text-white/90" alt="" />
      </div>

      {/* Floating nodes */}
      <div className="absolute left-2 top-8 animate-[float_3s_ease-in-out_infinite] rounded-xl bg-[var(--ud-bg-page)] p-2 shadow-md border border-[var(--ud-border-subtle)]">
        <Megaphone className="h-5 w-5 text-[var(--ud-brand-primary)]" />
      </div>
      <div className="absolute right-0 top-1/4 animate-[float_3s_ease-in-out_infinite_0.5s] rounded-xl bg-[var(--ud-bg-page)] p-2 shadow-md border border-[var(--ud-border-subtle)]">
        <Users className="h-5 w-5 text-blue-500" />
      </div>
      <div className="absolute bottom-8 left-4 animate-[float_3s_ease-in-out_infinite_1s] rounded-xl bg-[var(--ud-bg-page)] p-2 shadow-md border border-[var(--ud-border-subtle)]">
        <Globe className="h-5 w-5 text-purple-500" />
      </div>
      <div className="absolute bottom-1/4 right-2 animate-[float_3s_ease-in-out_infinite_1.5s] rounded-xl bg-[var(--ud-bg-page)] p-2 shadow-md border border-[var(--ud-border-subtle)]">
        <Shield className="h-5 w-5 text-amber-500" />
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--ud-bg-page)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-page)]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <UdeetsBrandLockup textClassName="text-xl sm:text-2xl" priority />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/discover" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]" aria-label="Discover">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.3-4.3" /><circle cx="11" cy="11" r="7" /></svg>
            </Link>
            <Link href="/auth" className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero — visual-first with orbit graphic */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute -top-32 right-1/4 h-[400px] w-[400px] rounded-full bg-[var(--ud-brand-light)]/60 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-[#A9D1CA]/20 blur-[80px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#A9D1CA]/50 bg-[var(--ud-brand-light)] px-4 py-1.5">
                  <Heart className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" />
                  <span className="text-xs font-medium text-[var(--ud-brand-primary)]">Our story</span>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-5xl lg:text-6xl">
                  Community connection,{" "}
                  <span className="text-[var(--ud-brand-primary)]">reimagined</span>
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-500">
                  Every community deserves a clean, organized space to share what matters. That&apos;s why we built uDeets.
                </p>
              </div>

              <div className="flex justify-center">
                <OrbitGraphic />
              </div>
            </div>
          </div>
        </section>

        {/* The problem → solution — visual cards, not paragraphs */}
        <section className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                The problem we solve
              </h2>
            </AnimateOnScroll>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {[
                {
                  emoji: "😩",
                  before: "Important updates buried in 200+ unread messages",
                  after: "Every update organized and easy to find",
                },
                {
                  emoji: "🔀",
                  before: "Info scattered across WhatsApp, email, Facebook, and notice boards",
                  after: "One hub — everything in one place",
                },
                {
                  emoji: "📉",
                  before: "Members miss events, deadlines, and announcements",
                  after: "Members stay informed and engaged",
                },
              ].map((item, i) => (
                <AnimateOnScroll key={item.emoji} delay={i * 150}>
                  <div className="rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-page)] p-6 text-center">
                    <div className="text-4xl">{item.emoji}</div>
                    <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600/80 line-through decoration-red-300">
                      {item.before}
                    </div>
                    <div className="my-3 text-lg text-slate-300">↓</div>
                    <div className="rounded-lg bg-[var(--ud-brand-light)] px-3 py-2 text-sm font-medium text-[var(--ud-brand-primary)]">
                      {item.after}
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Values — icon grid with staggered animation */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                What we stand for
              </h2>
            </AnimateOnScroll>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Target, title: "Simplicity first", description: "No bloat, no learning curve. If it takes more than a minute to understand, we haven't done our job." },
                { icon: Shield, title: "Privacy by default", description: "We don't sell data, run ads, or monetize your members' attention. Your data stays yours." },
                { icon: Users, title: "Built for real people", description: "Designed for the small business owner, the HOA board member, the church volunteer." },
                { icon: Zap, title: "Speed matters", description: "Fast load times, instant updates. Members find what they need in seconds." },
                { icon: Globe, title: "Free & accessible", description: "Free to start, mobile-friendly, works for communities of all sizes." },
                { icon: Sparkles, title: "Always improving", description: "We ship improvements every week based on real community feedback." },
              ].map((v, i) => (
                <AnimateOnScroll key={v.title} delay={i * 100}>
                  <div className="group rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-page)] p-6 transition duration-300 hover:border-[#A9D1CA] hover:shadow-md">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF6F3] to-[#d4ece7] transition-transform duration-300 group-hover:scale-110">
                      <v.icon className="h-5 w-5 text-[var(--ud-brand-primary)]" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.description}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline — visual milestones */}
        <section className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <AnimateOnScroll className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)] sm:text-4xl">
                Our journey
              </h2>
            </AnimateOnScroll>

            <div className="relative mt-14">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-[#0C5C57] via-[#A9D1CA] to-transparent sm:left-1/2" />

              {[
                { date: "2025", title: "The idea", description: "Frustrated by buried group chat updates, we envisioned a better way for communities to share information." },
                { date: "Early 2026", title: "Built & launched", description: "uDeets goes live with hub creation, deets, events, and 8 pre-built templates for different community types." },
                { date: "Now", title: "Growing together", description: "Communities across the country are creating hubs for restaurants, HOAs, churches, fitness clubs, and more." },
                { date: "Next", title: "What's coming", description: "Native mobile apps, advanced analytics, AI-powered summaries, and premium features for larger organizations." },
              ].map((milestone, i) => (
                <AnimateOnScroll key={milestone.date} delay={i * 200}>
                  <div className={cn("relative mb-12 flex items-start gap-6 last:mb-0", i % 2 === 1 ? "sm:flex-row-reverse sm:text-right" : "")}>
                    {/* Dot */}
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-xs font-bold text-white shadow-lg shadow-teal-900/20 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                      {i + 1}
                    </div>
                    {/* Content */}
                    <div className={cn("flex-1 rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-page)] p-5", i % 2 === 1 ? "sm:mr-16" : "sm:ml-16")}>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--ud-brand-primary)]">{milestone.date}</div>
                      <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">{milestone.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{milestone.description}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <AnimateOnScroll>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-8 py-16 text-center shadow-2xl shadow-teal-900/20 sm:px-16 sm:py-20">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(169,209,202,0.15),transparent_50%)]" />
                <div className="relative">
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Ready to build your community hub?
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
                    It takes less than 60 seconds to create your first hub.
                  </p>
                  <div className="mt-8">
                    <Link href="/auth" className="inline-flex items-center gap-2 rounded-full bg-[var(--ud-bg-page)] px-7 py-3.5 text-sm font-semibold text-[var(--ud-brand-primary)] shadow-lg transition hover:bg-slate-50">
                      Get Started Free <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <UdeetsLogoIcon className="h-7 w-7 text-white/80" alt="uDeets" />
              <span className="text-lg font-semibold text-white">uDeets</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <Link href="/" className="text-sm text-white/60 transition hover:text-white">Home</Link>
              <Link href="/discover" className="text-sm text-white/60 transition hover:text-white">Discover</Link>
              <Link href="/use-cases" className="text-sm text-white/60 transition hover:text-white">Use Cases</Link>
              <Link href="/resources" className="text-sm text-white/60 transition hover:text-white">Resources</Link>
              <Link href="/terms" className="text-sm text-white/60 transition hover:text-white">Terms</Link>
              <Link href="/privacy" className="text-sm text-white/60 transition hover:text-white">Privacy</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} uDeets. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
