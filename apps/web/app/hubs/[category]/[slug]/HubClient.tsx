/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HubRecord } from "@/lib/hubs";

const HEADER_BG = "bg-white border-b border-slate-200/60";
const FOOTER_BG = "bg-[#0C5C57]";
const PAGE_BG = "bg-[#E3F1EF]";
const SECTION_MINT_BG = "bg-[#E3F1EF]";
const NAV_TEXT = "text-[#111111]";
const LOGO_TEXT = "text-[#111111]";
const BODY_TEXT = "text-slate-600";
const BRAND_TEXT_STYLE = `truncate text-xl font-serif font-semibold tracking-tight ${LOGO_TEXT} sm:text-2xl`;
const DISPLAY_HEADING = "font-serif font-semibold tracking-tight text-[#111111]";
const ACCENT_MEDIUM_GREEN = "bg-[#A9D1CA]";
const ICON_GREEN = "text-[#0C5C57]";
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

function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
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
    <div className="group rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all">
      <div className="mb-4 flex items-center gap-3">
        <MiniIcon label={iconLabel} />
        <div className="min-w-0">
          <div className="truncate text-base font-extrabold leading-tight text-[#111111]">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>

      <div className="text-sm text-slate-700">{children}</div>

      <div className="mt-5 h-1 w-0 rounded-full bg-slate-300 transition-all group-hover:w-full" />
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
  return <HubClientInner key={hub.id} hub={hub} mode={mode} category={category} slug={slug} />;
}

function HubClientInner({
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

  const [requested, setRequested] = useState(false);
  const [dpFailed, setDpFailed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageFailed, setCurrentImageFailed] = useState(false);

  const isPublic = hub.visibility === "Public";

  const resolvedCategory = category ?? hub.category;
  const resolvedSlug = slug ?? hub.slug;

  const dpImageSrc = normalizePublicSrc(hub.dpImage);
  const galleryImages = useMemo(() => {
    const primary = hub.heroImage ? [hub.heroImage] : [];
    const sourceGallery = hub.galleryImages?.length ? hub.galleryImages : [];
    const ordered = [...primary, ...sourceGallery]
      .map((src) => normalizePublicSrc(src))
      .filter(Boolean);
    const unique = [...new Set(ordered)];
    if (unique.length > 0) return unique;
    return dpImageSrc ? [dpImageSrc] : [];
  }, [hub.heroImage, hub.galleryImages, dpImageSrc]);
  const hasGalleryNav = galleryImages.length > 1;
  const activeImageSrc = galleryImages[currentImageIndex] || "";

  const aboutLines = useMemo(() => {
    if (hub.about?.length) return hub.about;
    return [
      "See what is happening right now with announcements and highlights.",
      "Get reminders so you never miss key community updates.",
      "Subscribe to unlock a richer, ongoing local experience.",
    ];
  }, [hub.about]);

  const offerings = useMemo(() => {
    if (hub.offerings?.length) return hub.offerings;
    return [
      "Timely announcements and alerts",
      "Events and participation opportunities",
      "Subscriber-focused updates and reminders",
    ];
  }, [hub.offerings]);

  const highlights = useMemo(() => {
    if (hub.highlights?.length) return hub.highlights;
    return [
      "Active local community participation",
      "Reliable communication and updates",
      "Clear, organized information in one place",
    ];
  }, [hub.highlights]);

  const quickInfo = useMemo(() => {
    if (hub.quickInfo?.length) return hub.quickInfo;
    return [
      { label: "Type", value: "Community Hub" },
      { label: "Access", value: hub.visibility },
      { label: "Location", value: hub.locationLabel },
    ];
  }, [hub.quickInfo, hub.visibility, hub.locationLabel]);

  const handleSubscribe = () => {
    try {
      localStorage.setItem(subKey(hub.id), "true");
    } catch {
      // ignore
    }

    if (isPublic) {
      router.push(`/hubs/${resolvedCategory}/${resolvedSlug}/full`);
      return;
    }

    setRequested(true);
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  };

  const ctaTitle = hub.cta?.title ?? "Stay Connected";
  const ctaDescription =
    hub.cta?.description ?? "Subscribe to get the latest updates and important announcements.";

  const showPrevImage = () => {
    if (!hasGalleryNav) return;
    setCurrentImageFailed(false);
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    if (!hasGalleryNav) return;
    setCurrentImageFailed(false);
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const Header = (
    <header className={cn("sticky top-0 z-50", HEADER_BG)}>
      <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
        <Link href={ROUTE_HOME} className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative h-10 w-10">
            <Image src="/udeets-logo.png" alt="uDeets Logo" fill className="object-contain" priority />
          </div>
          <span className={BRAND_TEXT_STYLE}>uDeets</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={ROUTE_HOME}
            className={`rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} hover:bg-slate-100 sm:px-5 sm:py-2.5`}
          >
            Home
          </Link>
          <Link
            href={ROUTE_DISCOVER}
            className={`rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} hover:bg-slate-100 sm:px-5 sm:py-2.5`}
          >
            Discover
          </Link>
        </div>
      </div>
    </header>
  );

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

  if (mode === "intro") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        {Header}

        <section className={cn("relative overflow-hidden", SECTION_MINT_BG)}>
          <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-emerald-100/80 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-10 lg:py-16">
            <div className="max-w-3xl space-y-6 text-slate-900">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {dpImageSrc && !dpFailed ? (
                  <img
                    src={dpImageSrc}
                    alt={`${hub.name} avatar`}
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm"
                    loading="lazy"
                    onError={() => setDpFailed(true)}
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#A9D1CA] font-serif text-lg font-semibold text-[#111111]">
                    {initials(hub.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className={cn("break-words text-3xl leading-tight sm:text-4xl lg:text-5xl", DISPLAY_HEADING)}>
                    {hub.name}
                  </h1>
                  <div className={cn("mt-1 text-lg", BODY_TEXT)}>{hub.tagline ?? hub.locationLabel}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {hub.visibility}
                </span>
                <span className={cn("text-sm", BODY_TEXT)}>{hub.membersLabel}</span>
                <span className={cn("text-sm", BODY_TEXT)}>{hub.locationLabel}</span>
              </div>

              <p className={cn("text-lg leading-relaxed sm:text-xl", BODY_TEXT)}>
                {hub.intro ?? hub.description}
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-4">
                <button type="button" onClick={handleSubscribe} className={cn(BUTTON_PRIMARY, "text-center")}>
                  Subscribe
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Share
                </button>
              </div>

              {!isPublic && (
                <div className={cn("text-sm", BODY_TEXT)}>
                  This is a private hub. Subscribe to request access. Once approved, you will unlock the full hub.
                </div>
              )}

              {requested && !isPublic && (
                <div className="rounded-xl border border-slate-100 bg-[#E3F1EF] p-4 text-slate-700">
                  Request sent. You will get access after the hub admin approves.
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-white shadow-sm">
                  <div className="relative aspect-[16/9] w-full bg-[#E3F1EF]">
                    {activeImageSrc && !currentImageFailed ? (
                      <img
                        src={activeImageSrc}
                        alt={`${hub.name} cover`}
                        className="h-full w-full rounded-[2.5rem] object-cover object-center"
                        loading="lazy"
                        onError={() => setCurrentImageFailed(true)}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-[2.5rem] bg-[#A9D1CA]/40 p-8 text-center">
                        <div>
                          <div className="text-sm font-semibold text-[#0C5C57]">Hero Image Coming Soon</div>
                          <div className="mt-2 text-sm text-slate-600">/hub-images/{hub.slug}-hero.jpg</div>
                        </div>
                      </div>
                    )}

                    {hasGalleryNav ? (
                      <>
                        <button
                          type="button"
                          aria-label="Previous image"
                          onClick={showPrevImage}
                          className="absolute left-4 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#0C5C57] shadow-sm transition hover:bg-white"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label="Next image"
                          onClick={showNextImage}
                          className="absolute right-4 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#0C5C57] shadow-sm transition hover:bg-white"
                        >
                          ›
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PrettyCard title="Quick Info" subtitle="Know the basics" iconLabel="i">
              <div className="space-y-3">
                {quickInfo.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="flex items-start gap-2">
                    <span className="text-slate-600">{item.label}:</span>
                    <span className="font-semibold text-[#111111]">{item.value}</span>
                  </div>
                ))}
              </div>
            </PrettyCard>

            <PrettyCard title="Key Offerings" subtitle="What is available" iconLabel="★">
              <ul className="space-y-3">
                {offerings.map((item, idx) => (
                  <li key={`${idx}-${item}`} className="flex items-start gap-2">
                    <span className={cn("font-bold", ICON_GREEN)}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </PrettyCard>

            <PrettyCard title="Community Highlights" subtitle="What to expect" iconLabel="#">
              <ul className="space-y-3">
                {highlights.map((item, idx) => (
                  <li key={`${idx}-${item}`} className="flex items-start gap-2">
                    <span className={cn("font-bold", ICON_GREEN)}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </PrettyCard>

            <PrettyCard title="Contact" subtitle="Visit and connect" iconLabel="✉">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-slate-600">Website:</span>
                  {hub.website ? (
                    <a
                      href={hub.website}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-semibold text-[#0C5C57] hover:underline"
                    >
                      {hub.website}
                    </a>
                  ) : (
                    <span className="font-semibold text-[#111111]">Coming soon</span>
                  )}
                </div>
                {hub.contact?.visit ? <p className="text-slate-700">{hub.contact.visit}</p> : null}
              </div>
            </PrettyCard>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className={cn("text-2xl", DISPLAY_HEADING)}>About This Hub</h2>
            <p className={cn("mt-5 leading-relaxed", BODY_TEXT)}>{hub.description}</p>

            <ul className="mt-6 space-y-3">
              {aboutLines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 place-items-center rounded-full text-sm font-extrabold text-[#0C5C57]",
                      ACCENT_MEDIUM_GREEN
                    )}
                  >
                    ✓
                  </span>
                  <span className="text-slate-700">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className={cn("text-2xl", DISPLAY_HEADING)}>{ctaTitle}</h2>
            <p className={cn("mt-4 max-w-3xl", BODY_TEXT)}>{ctaDescription}</p>
            {hub.contact?.stayConnected ? (
              <p className={cn("mt-3 max-w-3xl", BODY_TEXT)}>{hub.contact.stayConnected}</p>
            ) : null}

            <div className="mt-6">
              <button type="button" onClick={handleSubscribe} className={BUTTON_PRIMARY}>
                Subscribe
              </button>
            </div>
          </div>
        </main>

        {Footer}
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      {Header}

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="text-sm text-slate-500">FULL HUB (Managed Experience)</div>
          <h1 className={cn("mt-2 break-words text-2xl sm:text-3xl", DISPLAY_HEADING)}>{hub.name}</h1>
          <p className="mt-4 text-slate-700">
            This is the post-subscribe detailed hub view. The full managed tabs (About, Updates, Events, Gallery)
            can be layered in here next while reusing this shared data model.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/hubs/${hub.category}/${hub.slug}`} className={BUTTON_PRIMARY}>
              Back to Intro
            </Link>

            <Link
              href={ROUTE_DISCOVER}
              className="inline-block rounded-xl border-2 border-gray-200 px-7 py-3 font-semibold text-gray-700 hover:bg-gray-50"
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
