"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import { isUdeetsLogoSrc, UDEETS_LOGO_SRC } from "@/lib/branding";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { listHubs } from "@/services/hubs/listHubs";
import type { Hub as SupabaseHub } from "@/types/hub";

type DashboardHub = {
  id: string;
  name: string;
  dpImage: string;
  heroImage: string;
  galleryImages: string[];
  href: string;
};

type FeedPost = {
  id: string;
  hubId: string;
  type: "announcement" | "notice" | "event" | "update" | "image" | "file";
  dateLabel: string;
  title: string;
  body: string;
  image?: string;
  href: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
};

const PAGE_BG = "bg-[#E3F1EF]";
const TOP_BG = "bg-[#E3F1EF]";
const TEXT_DARK = "text-[#111111]";
const CARD = "rounded-3xl border border-slate-100 bg-white shadow-sm";
const TILE_BOX =
  "relative h-[148px] w-[148px] overflow-hidden rounded-[30px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]";
type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePublicSrc(src?: string) {
  if (!src) return UDEETS_LOGO_SRC;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function toDashboardHub(hub: SupabaseHub): DashboardHub {
  const dpImage = normalizePublicSrc(hub.dp_image_url || hub.cover_image_url || undefined);
  const heroImage = normalizePublicSrc(hub.cover_image_url || hub.dp_image_url || undefined);

  return {
    id: hub.id,
    name: hub.name,
    dpImage,
    heroImage,
    galleryImages: [heroImage, dpImage].filter(Boolean),
    href: `/hubs/${hub.category}/${hub.slug}`,
  };
}

const POSTS: FeedPost[] = [];

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-[#0C5C57]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function HubCardTile({
  href,
  label,
  imageSrc,
  isCreate = false,
}: {
  href: string;
  label: string;
  imageSrc?: string;
  isCreate?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link href={href} className="block w-[148px] shrink-0" aria-label={label}>
      <div className={cn(TILE_BOX, "group transition-transform duration-200 hover:-translate-y-0.5")}>
        {isCreate ? (
          <div className="flex h-full w-full items-center justify-center bg-[#A9D1CA]/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <PlusIcon />
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden rounded-[30px]">
            {imageSrc && !imageFailed ? (
              <img
                src={imageSrc}
                alt={label}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-center">
                <span className="px-3 text-[11px] font-semibold leading-tight text-[#0C5C57]">
                  Image Coming Soon
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 min-h-[40px] px-1">
        <p className="line-clamp-2 text-center text-[12px] font-serif font-semibold leading-tight text-[#111111]">
          {label}
        </p>
      </div>
    </Link>
  );
}

function AvatarImage({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return <div className="h-full w-full bg-[#A9D1CA]/40" />;
  }

  const isLogo = isUdeetsLogoSrc(src);

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full", isLogo ? "object-contain" : "object-cover")}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function CoverImage({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-center">
        <span className="px-4 text-sm font-semibold text-[#0C5C57]">Image Coming Soon</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function iconForType(type: FeedPost["type"]) {
  if (type === "announcement") return "Announcement";
  if (type === "notice") return "Notice";
  if (type === "event") return "Event";
  if (type === "image") return "Image";
  if (type === "file") return "File";
  return "Update";
}

function FooterActionIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLike(props: React.SVGProps<SVGSVGElement> & { "data-liked"?: boolean }) {
  const liked = Boolean(props["data-liked"]);
  return (
    <svg
      viewBox="0 0 24 24"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path
        d="M12 20.5s-7.5-4.5-9.5-9c-1.3-3 .4-6.5 4-7.2 2.2-.4 4.1.4 5.5 2.2 1.4-1.8 3.3-2.6 5.5-2.2 3.6.7 5.3 4.2 4 7.2-2 4.5-9.5 9-9.5 9Z"
      />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  );
}

function getFeedImageForPost(post: FeedPost, hub: DashboardHub) {
  if (post.image) return normalizePublicSrc(post.image);
  const nonDpGallery = hub.galleryImages.filter((src) => src !== hub.dpImage);
  const source = nonDpGallery.length ? nonDpGallery : hub.galleryImages;
  if (!source.length) return hub.heroImage;
  const numericId = Number(post.id.replace(/\D/g, "")) || 1;
  const idx = (numericId + 1) % source.length;
  return source[idx] ?? source[0] ?? hub.heroImage;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [hubs, setHubs] = useState<DashboardHub[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [hubsLoadError, setHubsLoadError] = useState<string | null>(null);
  const [isHubsExpanded, setIsHubsExpanded] = useState(false);
  const [expandedAnchor, setExpandedAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const hubsPanelRef = useRef<HTMLDivElement | null>(null);

  const hubMap = useMemo(() => new Map(hubs.map((hub) => [hub.id, hub])), [hubs]);
  const collapsedHubs = hubs.slice(0, 8);
  const [likedById, setLikedById] = useState<Record<string, boolean>>({});

  const toggleLike = (postId: string) => {
    setLikedById((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await getCurrentSession();

        if (cancelled) return;

        if (session) {
          setAuthStatus("authenticated");
          return;
        }

        setAuthStatus("unauthenticated");
        router.replace("/auth");
      } catch {
        if (cancelled) return;
        setAuthStatus("unauthenticated");
        router.replace("/auth");
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setHubs([]);
      setIsLoadingHubs(authStatus === "checking");
      return;
    }

    let cancelled = false;

    async function loadDashboardHubs() {
      setIsLoadingHubs(true);
      setHubsLoadError(null);

      try {
        const dbHubs = await listHubs();
        if (!cancelled) {
          setHubs(dbHubs.map(toDashboardHub));
        }
      } catch (error) {
        if (!cancelled) {
          setHubs([]);
          setHubsLoadError(error instanceof Error ? error.message : "Hubs could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHubs(false);
        }
      }
    }

    void loadDashboardHubs();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        isHubsExpanded &&
        hubsPanelRef.current &&
        !hubsPanelRef.current.contains(target)
      ) {
        setIsHubsExpanded(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isHubsExpanded]);

  useEffect(() => {
    if (!isHubsExpanded) return;

    const updateAnchor = () => {
      const rect = hubsPanelRef.current?.getBoundingClientRect();
      if (!rect) return;

      setExpandedAnchor({
        top: Math.max(72, rect.top),
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);

    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [isHubsExpanded]);

  const toggleHubsExpanded = () => {
    if (!isHubsExpanded) {
      const rect = hubsPanelRef.current?.getBoundingClientRect();
      if (rect) {
        setExpandedAnchor({
          top: Math.max(72, rect.top),
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
      setIsHubsExpanded(true);
      return;
    }

    setIsHubsExpanded(false);
  };

  if (authStatus === "checking" && searchParams.get("demo_preview") !== "1") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        <UdeetsHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
          <section className={cn("p-6 text-center", CARD)}>
            <h1 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Loading dashboard...</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We&apos;re checking your session and loading your hubs.
            </p>
          </section>
        </main>
        <UdeetsFooter />
        <UdeetsBottomNav activeNav="home" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" && searchParams.get("demo_preview") !== "1") {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        <UdeetsHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
          <section className={cn("p-6 text-center", CARD)}>
            <h1 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Redirecting to sign in...</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Your session could not be found, so we&apos;re sending you to the auth page.
            </p>
          </section>
        </main>
        <UdeetsFooter />
        <UdeetsBottomNav activeNav="home" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <UdeetsHeader />

      {isHubsExpanded ? (
        <button
          type="button"
          aria-label="Close expanded hubs panel"
          onClick={() => setIsHubsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        />
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
        <section
          className={cn("relative mb-6 rounded-3xl p-4 sm:p-6", TOP_BG)}
          style={
            isHubsExpanded && expandedAnchor
              ? { minHeight: expandedAnchor.height }
              : undefined
          }
        >
          <div
            ref={hubsPanelRef}
            className={cn(
              CARD,
              "p-5 sm:p-6",
              isHubsExpanded && "fixed z-50 max-h-[72vh] overflow-y-auto"
            )}
            style={
              isHubsExpanded && expandedAnchor
                ? {
                    top: expandedAnchor.top,
                    left: expandedAnchor.left,
                    width: expandedAnchor.width,
                  }
                : undefined
            }
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1
                className={cn(
                  "text-2xl font-serif font-semibold tracking-tight sm:text-3xl",
                  TEXT_DARK
                )}
              >
                My Hubs
              </h1>

              <div className="flex items-center gap-4 text-sm font-medium sm:text-base">
                <Link href="/create-hub" className={cn(TEXT_DARK, "hover:opacity-80")}>
                  Create Hub
                </Link>
                <button
                  type="button"
                  onClick={toggleHubsExpanded}
                  className={cn(TEXT_DARK, "hover:opacity-80")}
                >
                  {isHubsExpanded ? "Collapse" : "See All"}
                </button>
              </div>
            </div>

            {isHubsExpanded ? (
              <div className="flex flex-wrap gap-x-6 gap-y-6">
                {hubs.map((hub) => (
                  <HubCardTile
                    key={hub.id}
                    href={hub.href}
                    label={hub.name}
                    imageSrc={hub.dpImage}
                  />
                ))}
                <HubCardTile href="/create-hub" label="Create Hub" isCreate />
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-3">
                {collapsedHubs.map((hub) => (
                  <HubCardTile
                    key={hub.id}
                    href={hub.href}
                    label={hub.name}
                    imageSrc={hub.dpImage}
                  />
                ))}
                <HubCardTile href="/create-hub" label="Create Hub" isCreate />
              </div>
            )}

            {isLoadingHubs ? <p className="mt-4 text-sm text-slate-500">Loading hubs...</p> : null}
            {hubsLoadError ? <p className="mt-4 text-sm text-rose-600">{hubsLoadError}</p> : null}
            {!isLoadingHubs && !hubs.length && !hubsLoadError ? (
              <p className="mt-4 text-sm text-slate-500">No hubs yet. Create one to get started.</p>
            ) : null}
          </div>
        </section>

        <section className={cn("mt-6", isHubsExpanded && "pointer-events-none")}>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={cn(
                "text-xl font-serif font-semibold tracking-tight sm:text-2xl",
                TEXT_DARK
              )}
            >
              My deets
            </h2>
            <Link
              href="/discover"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Explore
            </Link>
          </div>

          <div className="space-y-4">
            {POSTS.length ? POSTS.map((post) => {
              const hub = hubMap.get(post.hubId);
              if (!hub) return null;
              const isLiked = Boolean(likedById[post.id]);
              const displayLikeCount = post.likesCount + (isLiked ? 1 : 0);

              return (
                <Link
                  key={post.id}
                  href={post.href}
                  className={cn("block overflow-hidden", CARD)}
                >
                  <article>
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200">
                        <AvatarImage src={hub.dpImage} alt={`${hub.name} logo`} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-semibold sm:text-base", TEXT_DARK)}>
                          {hub.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded-full bg-[#A9D1CA] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
                            {iconForType(post.type)}
                          </span>
                          <p className="text-xs text-slate-500">{post.dateLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <h3 className={cn("text-base font-semibold", TEXT_DARK)}>{post.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.body}</p>

                        {(post.image ||
                          post.type === "image" ||
                          post.type === "announcement" ||
                          post.type === "event" ||
                          post.type === "update") && (
                          <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                            <CoverImage src={getFeedImageForPost(post, hub)} alt={post.title} />
                            <div className="absolute inset-0 bg-black/10" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-5 text-sm text-slate-600">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleLike(post.id);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 transition-colors",
                              isLiked ? "font-medium text-[#0C5C57]" : "text-slate-600 hover:text-[#111111]"
                            )}
                          >
                            <IconLike className="h-4 w-4" data-liked={isLiked} />
                            <span>Like {displayLikeCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-[#111111]"
                          >
                            <FooterActionIcon path="M7 8h10M7 12h7m7-2a8 8 0 0 1-8 8H5l-2 3V10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
                            <span>Comment {post.commentsCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-[#111111]"
                          >
                            <IconShare className="h-4 w-4" />
                            <span>Share {post.sharesCount}</span>
                          </button>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <FooterActionIcon path="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                          <span>{post.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            }) : (
              <div className={cn("p-6 text-center", CARD)}>
                <h3 className="text-lg font-serif font-semibold text-[#111111]">No deets yet</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Hub posts and updates will appear here once they are published from your hubs.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <UdeetsFooter />
      <UdeetsBottomNav activeNav="home" />
    </div>
  );
}
