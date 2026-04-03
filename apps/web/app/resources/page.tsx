"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  PlayCircle,
  Search,
} from "lucide-react";
import { UdeetsBrandLockup, UdeetsLogoIcon } from "@/components/brand-logo";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ─── FAQ Accordion ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-[#111111]">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", open ? "max-h-96 pb-5" : "max-h-0")}>
        <p className="text-sm leading-relaxed text-slate-500">{answer}</p>
      </div>
    </div>
  );
}

/* ─── Data ─── */
const FAQ_ITEMS = [
  {
    question: "What is a hub?",
    answer:
      "A hub is your community's home on uDeets. It's a dedicated space where you can share updates (called deets), events, photos, and important information with your members. Think of it as a modern replacement for group chats, Facebook groups, and community bulletin boards — all in one clean, organized place.",
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
      "Unlike chat apps where important information gets buried in conversations, uDeets organizes everything by type — announcements, events, photos, files. Members can find what they need without scrolling through hundreds of messages. Plus, hub creators get professional tools like custom branding, event RSVPs, and role-based access control.",
  },
  {
    question: "Can I make my hub private?",
    answer:
      "Absolutely. When creating a hub, you can choose between public (discoverable by anyone) or private (invite-only). Private hubs require an admin to approve join requests, giving you full control over who can see your content.",
  },
  {
    question: "What are templates and how do they work?",
    answer:
      "Templates are pre-configured hub setups designed for specific types of communities. For example, the Restaurant template comes with sections for menu, specials, and hours, while the HOA template includes sections for rules, maintenance, and community events. Templates save you setup time — you can always customize them later.",
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
  {
    question: "How do I post a deet?",
    answer:
      "From your hub's Deets tab, click the 'Create Deet' button. You can write rich text with formatting (bold, italic, color), attach photos, and publish to your entire community. Members will see it in their feed instantly.",
  },
  {
    question: "Can I create events in my hub?",
    answer:
      "Yes! The Events section lets you create events with a title, date/time, location, and description. Members can RSVP directly, and you can see who's attending. Events show up in a calendar view for easy browsing.",
  },
  {
    question: "What happens if I delete my hub?",
    answer:
      "Deleting a hub is permanent. All deets, events, members, and files associated with the hub will be removed. You'll be asked to confirm by typing the hub name before deletion.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "uDeets is a mobile-first web app, which means it works beautifully on any phone's browser — no download required. A native app for iOS and Android is on our roadmap.",
  },
];

const TUTORIALS = [
  {
    title: "Creating your first hub",
    description: "A step-by-step walkthrough of the hub creation process — from choosing a template to inviting your first members.",
    duration: "5 min read",
    icon: Lightbulb,
  },
  {
    title: "Posting deets like a pro",
    description: "Learn how to use the rich text editor, add photos, format your posts, and engage your community effectively.",
    duration: "3 min read",
    icon: FileText,
  },
  {
    title: "Setting up events & RSVPs",
    description: "How to create events, manage the calendar, track RSVPs, and send updates to attendees.",
    duration: "4 min read",
    icon: PlayCircle,
  },
  {
    title: "Managing members & roles",
    description: "Understand the role system, approve join requests, invite members, and control who can post and manage your hub.",
    duration: "3 min read",
    icon: BookOpen,
  },
  {
    title: "Customizing your hub's look",
    description: "Change your hub's accent color theme, upload a display picture and cover photo, and make your hub uniquely yours.",
    duration: "2 min read",
    icon: Lightbulb,
  },
  {
    title: "Sharing your hub with the world",
    description: "Learn about your hub's custom URL, invite links, the Discover page, and strategies for growing your membership.",
    duration: "3 min read",
    icon: MessageCircle,
  },
];

const BLOG_POSTS = [
  {
    title: "Why every HOA needs a digital hub in 2026",
    excerpt: "Paper notices and email chains are relics. Here's why modern HOAs are switching to purpose-built community platforms.",
    date: "Mar 28, 2026",
    tag: "Community",
  },
  {
    title: "5 ways restaurants are using uDeets to build loyal customers",
    excerpt: "From daily specials to event promotion, discover how local restaurants are turning one-time visitors into regulars.",
    date: "Mar 15, 2026",
    tag: "Use Cases",
  },
  {
    title: "The problem with WhatsApp for community management",
    excerpt: "Group chats are great for conversation, terrible for information. Here's why your community deserves better.",
    date: "Mar 3, 2026",
    tag: "Insights",
  },
  {
    title: "Introducing event RSVPs and calendar view",
    excerpt: "Our latest update brings full event management to every hub — create events, track RSVPs, and share calendars.",
    date: "Feb 20, 2026",
    tag: "Product",
  },
];

export default function ResourcesPage() {
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
        <section className="bg-gradient-to-b from-[#EAF6F3]/40 to-white py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h1 className="text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
              Resources &{" "}
              <span className="text-[#0C5C57]">help</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              Everything you need to get the most out of uDeets — guides, tutorials, FAQs, and more.
            </p>

            {/* Quick nav pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <a href="#faq" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]">
                <HelpCircle className="h-4 w-4" /> FAQ
              </a>
              <a href="#blog" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]">
                <FileText className="h-4 w-4" /> Blog
              </a>
              <a href="#tutorials" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]">
                <BookOpen className="h-4 w-4" /> Tutorials
              </a>
              <a href="#help" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]">
                <MessageCircle className="h-4 w-4" /> Help Centre
              </a>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-20 sm:py-28" id="faq">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F3]">
                <HelpCircle className="h-5 w-5 text-[#0C5C57]" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
                Frequently asked questions
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Quick answers to the most common questions about uDeets.
            </p>

            <div className="mt-10 rounded-2xl border border-slate-100 bg-white px-6 sm:px-8">
              {FAQ_ITEMS.map((item) => (
                <FAQItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── BLOG ─── */}
        <section className="border-t border-slate-100 bg-[#FAFBFC] py-20 sm:py-28" id="blog">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F3]">
                <FileText className="h-5 w-5 text-[#0C5C57]" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
                Blog
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Tips, updates, and stories from the uDeets community.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {BLOG_POSTS.map((post) => (
                <article
                  key={post.title}
                  className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-6 transition duration-300 hover:border-slate-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#EAF6F3] px-2.5 py-0.5 text-xs font-medium text-[#0C5C57]">{post.tag}</span>
                    <span className="text-xs text-slate-400">{post.date}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#111111] group-hover:text-[#0C5C57] transition">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0C5C57]">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TUTORIALS ─── */}
        <section className="py-20 sm:py-28" id="tutorials">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F3]">
                <BookOpen className="h-5 w-5 text-[#0C5C57]" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
                Tutorials
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Step-by-step guides to help you get the most out of uDeets.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TUTORIALS.map((tut) => (
                <div
                  key={tut.title}
                  className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-6 transition duration-300 hover:border-[#A9D1CA] hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F3]">
                    <tut.icon className="h-5 w-5 text-[#0C5C57]" />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-[#111111] group-hover:text-[#0C5C57] transition">
                    {tut.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{tut.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-slate-400">{tut.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HELP CENTRE ─── */}
        <section className="border-t border-slate-100 bg-[#FAFBFC] py-20 sm:py-28" id="help">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
              Help Centre
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-left">
                <Search className="mb-3 h-5 w-5 text-[#0C5C57]" />
                <h3 className="text-base font-semibold text-[#111111]">Search for answers</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Browse our FAQ above or search through our knowledge base for detailed guides and troubleshooting steps.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-left">
                <MessageCircle className="mb-3 h-5 w-5 text-[#0C5C57]" />
                <h3 className="text-base font-semibold text-[#111111]">Contact support</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Need direct assistance? Reach out to our support team and we&apos;ll get back to you within 24 hours.
                </p>
                <a
                  href="mailto:support@udeets.com"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0C5C57] hover:underline"
                >
                  support@udeets.com <ArrowRight className="h-3.5 w-3.5" />
                </a>
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
              <Link href="/about" className="text-sm text-white/60 transition hover:text-white">About</Link>
              <Link href="/use-cases" className="text-sm text-white/60 transition hover:text-white">Use Cases</Link>
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
