import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Church,
  Dumbbell,
  Home,
  Megaphone,
  PawPrint,
  Store,
  Users,
  UtensilsCrossed,
  CheckCircle2,
} from "lucide-react";
import { UdeetsBrandLockup, UdeetsLogoIcon } from "@/components/brand-logo";

export const metadata = {
  title: "Use Cases & Templates | uDeets",
  description: "Discover how restaurants, HOAs, churches, fitness clubs, and more use uDeets to stay connected with their communities.",
};

const USE_CASES = [
  {
    id: "restaurants",
    icon: UtensilsCrossed,
    name: "Restaurants & Cafes",
    tagline: "Share daily specials, menus, and hours with your customers",
    description:
      "Turn your restaurant into a community hub. Post daily specials, update your menu in real time, share behind-the-scenes photos, and let customers RSVP to special events. Stop relying on social media algorithms — reach your regulars directly.",
    features: [
      "Post daily specials and menu updates",
      "Share photos of new dishes and seasonal items",
      "Announce events like wine tastings or live music nights",
      "Manage online ordering links and hours",
      "Build a loyal customer community",
    ],
    templateSlug: "restaurants",
  },
  {
    id: "hoa",
    icon: Home,
    name: "HOA & Neighborhoods",
    tagline: "Keep residents informed with community updates and rules",
    description:
      "Replace the scattered emails, bulletin boards, and WhatsApp groups your HOA relies on. Create a single hub where residents find meeting notices, community rules, maintenance updates, and event announcements — organized and always up to date.",
    features: [
      "Post community announcements and meeting notices",
      "Share rules, bylaws, and important documents",
      "Coordinate maintenance schedules and updates",
      "Organize community events and gatherings",
      "Manage member directory with role-based access",
    ],
    templateSlug: "hoa",
  },
  {
    id: "religious",
    icon: Church,
    name: "Religious Organizations",
    tagline: "Connect your congregation with service times, events, and outreach",
    description:
      "Give your congregation a dedicated space to stay connected. Share service schedules, volunteer opportunities, event calendars, prayer requests, and community outreach updates. Keep everyone in the loop without the noise of group chats.",
    features: [
      "Share service times and schedule changes",
      "Coordinate volunteer sign-ups and events",
      "Post sermons, bulletins, and study materials",
      "Manage congregation directory",
      "Organize small groups and ministry teams",
    ],
    templateSlug: "religious-places",
  },
  {
    id: "fitness",
    icon: Dumbbell,
    name: "Fitness & Sports Clubs",
    tagline: "Manage class schedules, member updates, and club events",
    description:
      "Whether you run a gym, yoga studio, CrossFit box, or sports league — uDeets helps you keep members informed about class schedules, coach updates, competition results, and social events. No more missed announcements.",
    features: [
      "Publish class schedules and real-time changes",
      "Share workout of the day and training tips",
      "Announce competitions and league standings",
      "Coordinate team events and social gatherings",
      "Track member milestones and achievements",
    ],
    templateSlug: "fitness",
  },
  {
    id: "pet-clubs",
    icon: PawPrint,
    name: "Pet Clubs",
    tagline: "Organize meetups, share pet photos, and coordinate community events",
    description:
      "Build a thriving community for pet owners. Share meetup locations, organize dog park visits, post adorable pet photos, and coordinate adoption events. uDeets makes it easy to bring pet lovers together.",
    features: [
      "Organize regular meetups and park visits",
      "Share pet photos and milestone celebrations",
      "Coordinate adoption and foster events",
      "Post vet recommendations and pet care tips",
      "Manage member and pet directories",
    ],
    templateSlug: "pet-clubs",
  },
  {
    id: "communities",
    icon: Users,
    name: "General Communities",
    tagline: "Alumni networks, social clubs, hobby groups, and more",
    description:
      "From alumni associations to book clubs, neighborhood watch groups to hobby communities — uDeets gives any group a clean, organized space to share updates, coordinate events, and stay connected.",
    features: [
      "Post announcements and group updates",
      "Share event calendars and RSVP tracking",
      "Upload and organize photos and files",
      "Manage member roles and permissions",
      "Create polls and gather feedback",
    ],
    templateSlug: "communities",
  },
  {
    id: "events",
    icon: Calendar,
    name: "Event Organizations",
    tagline: "Plan events, manage RSVPs, and share schedules",
    description:
      "Perfect for event planners, conference organizers, and anyone who runs recurring events. Create an event hub with calendars, RSVP tracking, attendee management, and real-time updates.",
    features: [
      "Built-in event calendar with RSVP",
      "Share event details, schedules, and locations",
      "Send updates and last-minute changes",
      "Track attendance and manage capacity",
      "Post recap photos and follow-ups",
    ],
    templateSlug: "events",
  },
  {
    id: "retail",
    icon: Store,
    name: "Retail & Local Businesses",
    tagline: "Promotions, product updates, loyalty programs, and store info",
    description:
      "Give your customers a reason to check in every day. Share product launches, flash sales, loyalty rewards, and store updates. Build a direct relationship with your community without paying for ads.",
    features: [
      "Announce new products and restocks",
      "Share promotions and flash sales",
      "Post store hours and location updates",
      "Build a loyal customer community",
      "Manage loyalty programs and rewards",
    ],
    templateSlug: "retail",
  },
];

export default function UseCasesPage() {
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
              Use cases &{" "}
              <span className="text-[#0C5C57]">templates</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              uDeets comes with pre-built templates for every type of community. Pick one to get started in seconds, then customize it to make it yours.
            </p>
          </div>
        </section>

        {/* Quick nav */}
        <section className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-10" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1 py-3">
              {USE_CASES.map((uc) => (
                <a
                  key={uc.id}
                  href={`#${uc.id}`}
                  className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#EAF6F3] hover:text-[#0C5C57]"
                >
                  <uc.icon className="h-4 w-4" />
                  {uc.name.split("&")[0].trim()}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Use case sections */}
        <div className="py-12 sm:py-16">
          {USE_CASES.map((uc, i) => (
            <section
              key={uc.id}
              id={uc.id}
              className={i % 2 === 1 ? "bg-[#FAFBFC] py-16 sm:py-20" : "bg-white py-16 sm:py-20"}
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                  {/* Info */}
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF6F3] to-[#d4ece7]">
                      <uc.icon className="h-6 w-6 text-[#0C5C57]" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
                      {uc.name}
                    </h2>
                    <p className="mt-2 text-base font-medium text-[#0C5C57]">{uc.tagline}</p>
                    <p className="mt-4 text-base leading-relaxed text-slate-500">{uc.description}</p>

                    <div className="mt-8">
                      <Link
                        href="/create-hub"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Create a {uc.name.split("&")[0].trim()} Hub
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Features checklist */}
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Template features
                      </h3>
                      <div className="mt-5 space-y-4">
                        {uc.features.map((f) => (
                          <div key={f} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0C5C57]" />
                            <span className="text-sm leading-relaxed text-slate-600">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="pb-20 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C5C57] to-[#1a8a82] px-8 py-16 text-center shadow-2xl shadow-teal-900/20 sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(169,209,202,0.15),transparent_50%)]" />
              <div className="relative">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Don&apos;t see your use case?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
                  uDeets works for any group that needs to share information. Start with a general template and customize it to fit your needs.
                </p>
                <div className="mt-8">
                  <Link href="/create-hub" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0C5C57] shadow-lg transition hover:bg-slate-50">
                    Create Your Hub <ArrowRight className="h-4 w-4" />
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
              <Link href="/about" className="text-sm text-white/60 transition hover:text-white">About</Link>
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
