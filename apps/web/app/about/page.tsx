import Link from "next/link";
import { ArrowRight, Globe, Heart, Shield, Sparkles, Target, Users, Zap } from "lucide-react";
import { UdeetsBrandLockup, UdeetsLogoIcon } from "@/components/brand-logo";

export const metadata = {
  title: "About | uDeets",
  description: "Learn about uDeets — the modern community hub platform for businesses, organizations, and neighborhoods.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <UdeetsBrandLockup textClassName="text-xl sm:text-2xl" priority />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/discover" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#111111]" aria-label="Discover">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.3-4.3" /><circle cx="11" cy="11" r="7" /></svg>
            </Link>
            <Link href="/auth" className="inline-flex items-center rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF6F3]/40 to-white py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#A9D1CA]/50 bg-white px-4 py-1.5">
              <Heart className="h-3.5 w-3.5 text-[#0C5C57]" />
              <span className="text-xs font-medium text-[#0C5C57]">Our story</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl lg:text-6xl">
              Community connection,{" "}
              <span className="text-[#0C5C57]">reimagined</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              uDeets was built on a simple idea: every community — from a neighborhood HOA to a local restaurant — deserves a clean, organized space to share what matters. No more buried messages, scattered updates, or information overload.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
                  Our mission
                </h2>
                <p className="mt-6 text-base leading-relaxed text-slate-500">
                  We believe the best communities are built on clear, accessible information. uDeets makes it effortless for organizations of any size to create a dedicated hub where members can find updates, events, and important details — all in one place.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-500">
                  Whether you run a restaurant and want to share daily specials, manage an HOA and need to post community rules, or lead a fitness club coordinating class schedules — uDeets gives you the tools to keep your people informed and engaged.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative flex h-64 w-64 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#0C5C57] to-[#1a8a82] shadow-2xl shadow-teal-900/20">
                  <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]" />
                  <UdeetsLogoIcon className="h-28 w-28 text-white/80" alt="uDeets" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-t border-slate-100 bg-[#FAFBFC] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
                What we stand for
              </h2>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Target, title: "Simplicity first", description: "No bloat, no learning curve. uDeets is designed to be intuitive from the first click. If it takes more than a minute to understand, we haven't done our job." },
                { icon: Shield, title: "Privacy by default", description: "Your community's data belongs to your community. We don't sell data, run ads, or monetize your members' attention. Private hubs stay private." },
                { icon: Users, title: "Built for real communities", description: "We design for the small business owner, the HOA board member, the church volunteer — real people running real communities, not tech companies." },
                { icon: Zap, title: "Speed matters", description: "Fast load times, instant updates, no friction. Your members should be able to find what they need in seconds, not minutes of scrolling." },
                { icon: Globe, title: "Accessible to everyone", description: "Free to start, mobile-friendly, and designed to work for communities of all sizes — from 5 members to 5,000." },
                { icon: Sparkles, title: "Continuously improving", description: "We ship improvements every week based on real feedback from community leaders. uDeets gets better because you help us make it better." },
              ].map((v) => (
                <div key={v.title} className="rounded-2xl border border-slate-100 bg-white p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F3]">
                    <v.icon className="h-5 w-5 text-[#0C5C57]" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-[#111111]">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it started */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              How it started
            </h2>
            <div className="mt-10 space-y-6 text-base leading-relaxed text-slate-500">
              <p>
                uDeets started from a frustration we all know too well — trying to find that one important update buried in a group chat with 200+ unread messages. Whether it was a restaurant's weekend specials, an HOA meeting notice, or a fitness class schedule change, the information was always there somewhere... just impossible to find.
              </p>
              <p>
                We looked at the tools people were using — WhatsApp groups, Facebook pages, email newsletters, notice boards — and realized none of them were designed for what communities actually need: a single, organized place where the important stuff is always easy to find.
              </p>
              <p>
                So we built uDeets. A platform where every community gets its own hub — clean, organized, and purpose-built with templates for restaurants, HOAs, religious organizations, fitness clubs, and more. No message threads to dig through. No algorithm deciding what you see. Just the deets that matter, organized beautifully.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C5C57] to-[#1a8a82] px-8 py-16 text-center shadow-2xl shadow-teal-900/20 sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(169,209,202,0.15),transparent_50%)]" />
              <div className="relative">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Ready to build your community hub?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
                  It takes less than 60 seconds to create your first hub.
                </p>
                <div className="mt-8">
                  <Link href="/auth" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0C5C57] shadow-lg transition hover:bg-slate-50">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-[#111111]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <UdeetsLogoIcon className="h-7 w-7 text-white/80" alt="uDeets" />
              <span className="text-lg font-semibold text-white">uDeets</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm text-white/60 transition hover:text-white">Home</Link>
              <Link href="/discover" className="text-sm text-white/60 transition hover:text-white">Discover</Link>
              <Link href="/use-cases" className="text-sm text-white/60 transition hover:text-white">Use Cases</Link>
              <Link href="/resources" className="text-sm text-white/60 transition hover:text-white">Resources</Link>
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
