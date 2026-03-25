/* eslint-disable @next/next/no-img-element */
"use client";

import {
  BarChart3,
  Bell,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Facebook,
  Files,
  Globe,
  Heart,
  Images,
  Instagram,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Paperclip,
  Phone,
  Share2,
  Shield,
  Target,
  UserCog,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import { getHubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";

const CARD = "rounded-3xl border border-slate-100 bg-white shadow-sm";
const BUTTON_PRIMARY =
  "rounded-full bg-[#0C5C57] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#094a46]";
const BUTTON_SECONDARY =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50";
const ICON = "h-4.5 w-4.5 stroke-[1.8]";
const PREMIUM_ICON_WRAPPER =
  "inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FBFA] text-[#0C5C57]";
type HubTab = "Posts" | "Events" | "Photos" | "Files" | "Members";
type HubPanel = "posts" | "challenges" | "settings";

type ViewerState = {
  open: boolean;
  images: string[];
  index: number;
  title: string;
  body: string;
  focusId?: string;
};

const HUB_TABS: HubTab[] = ["Posts", "Events", "Photos", "Files", "Members"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function hubMediaBase(hub: HubRecord) {
  return `/hub-images/${hub.category}/${hub.slug}`;
}

function ImageWithFallback({
  src,
  sources,
  alt,
  className,
  fallbackClassName,
  fallback,
  loading,
}: {
  src?: string;
  sources?: string[];
  alt: string;
  className: string;
  fallbackClassName: string;
  fallback: React.ReactNode;
  loading?: "lazy" | "eager";
}) {
  const normalizedSources = useMemo(
    () => Array.from(new Set((sources?.length ? sources : [src]).filter(Boolean))) as string[],
    [sources, src]
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const activeSrc = normalizedSources[sourceIndex] ?? normalizedSources[0];

  if (!activeSrc) {
    return <div className={fallbackClassName}>{fallback}</div>;
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}

function FeedItemIcon({ kind }: { kind: "announcement" | "photo" | "notice" | "event" | "file" }) {
  if (kind === "announcement") return <Megaphone className={ICON} />;
  if (kind === "photo") return <Images className={ICON} />;
  if (kind === "notice") return <Bell className={ICON} />;
  if (kind === "event") return <CalendarDays className={ICON} />;
  return <Files className={ICON} />;
}

function summaryLine(parts: string[]) {
  return parts.filter(Boolean).join(" - ");
}

function EmptySection({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className={cn(CARD, "grid min-h-[220px] place-items-center p-8 text-center")}>
      <div className="max-w-sm">
        <h3 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
      </div>
    </section>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(CARD, "p-5")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif font-semibold text-[#111111]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SettingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function HubClient({
  hub,
  mode = "intro",
}: {
  hub: HubRecord;
  mode?: "intro" | "full";
  category?: string;
  slug?: string;
}) {
  void mode;

  const router = useRouter();
  const searchParams = useSearchParams();
  const hubContent = getHubContent(hub.id);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerState>({
    open: false,
    images: [],
    index: 0,
    title: "",
    body: "",
    focusId: undefined,
  });

  const mediaBase = hubMediaBase(hub);
  const hubBaseHref = `/hubs/${hub.category}/${hub.slug}`;
  const focusTarget = searchParams.get("focus");
  const requestedTab = searchParams.get("tab") as HubTab | null;
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const demoHubName = searchParams.get("demo_name")?.trim();
  const demoHubDescription = searchParams.get("demo_description")?.trim();
  const demoHubTagline = searchParams.get("demo_tagline")?.trim();
  const demoComposerText = searchParams.get("demo_composer") ?? "";
  const demoPostedText = searchParams.get("demo_posted") ?? "";
  const demoPollEnabled = searchParams.get("demo_poll") === "1";
  const demoPollVote = searchParams.get("demo_poll_vote");
  const demoLiked = searchParams.get("demo_liked") === "1";
  const initialActiveSection: HubTab = requestedTab && HUB_TABS.includes(requestedTab) ? requestedTab : "Posts";
  const [activeSection, setActiveSection] = useState<HubTab>(initialActiveSection);
  const [activePanel, setActivePanel] = useState<HubPanel>("posts");
  const isCustomHub = "isCustom" in hub && Boolean(hub.isCustom);
  const hubName = demoHubName || hub.name;
  const hubDescription = demoHubDescription || hub.description;
  const hubTagline = demoHubTagline || hub.tagline || hubName;
  const [settingsHubName, setSettingsHubName] = useState(hubName);
  const [settingsDescription, setSettingsDescription] = useState(hubDescription);
  const [settingsLocation, setSettingsLocation] = useState(hub.locationLabel);
  const [settingsVisibility, setSettingsVisibility] = useState<HubRecord["visibility"]>(hub.visibility);
  const [settingsDiscoverable, setSettingsDiscoverable] = useState(
    "discoverable" in hub ? Boolean(hub.discoverable) : true
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [approvalSetting, setApprovalSetting] = useState(settingsVisibility === "Private" ? "Required" : "Open");
  const [whoCanPost, setWhoCanPost] = useState("Admins and members");
  const [whoCanUpload, setWhoCanUpload] = useState("Admins and members");
  const dpImageSrc = normalizePublicSrc(hub.dpImage) || `${mediaBase}/dp.jpg`;
  const coverImageSrc = normalizePublicSrc(hub.heroImage) || `${mediaBase}/cover.jpg`;

  const galleryImages = useMemo(() => {
    const fromHub = (hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean);
    const fallback = [1, 2, 3].map((n) => `${mediaBase}/gallery-${n}.jpg`);
    const ordered = [coverImageSrc, ...fromHub, ...fallback].filter(Boolean);
    return [...new Set(ordered)];
  }, [hub.galleryImages, coverImageSrc, mediaBase]);

  const recentPhotos = isCustomHub ? [] : galleryImages.slice(0, 6);

  const adminImages = [
    normalizePublicSrc(hub.adminImages?.[0]) || `${mediaBase}/admin-1.jpg`,
    normalizePublicSrc(hub.adminImages?.[1]) || `${mediaBase}/admin-2.jpg`,
  ];

  const fileItems = isCustomHub
    ? []
    : [
        "Community Guidelines.pdf",
        "Volunteer Schedule.xlsx",
        "Event Deck.pptx",
      ];

  const memberItems = isCustomHub
    ? []
    : [
        `${hubName} Admin`,
        "Moderator Team",
        "Volunteer Leads",
        "Community Members",
        "New Requests",
      ];
  const hubLabelChips =
    "selectedCategories" in hub && Array.isArray(hub.selectedCategories) && hub.selectedCategories.length
      ? hub.selectedCategories
      : hub.tags ?? [];
  const memberRoleItems = isCustomHub
    ? []
    : [
        { name: `${hubName} Admin`, role: "Admin" },
        { name: "Moderator Team", role: "Admin" },
        { name: "Community Members", role: "Member" },
      ];

  useEffect(() => {
    if (!focusTarget) return;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(focusTarget);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedItemId(focusTarget);

      window.setTimeout(() => setHighlightedItemId((current) => (current === focusTarget ? null : current)), 2200);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [activeSection, focusTarget]);

  const openViewer = (images: string[], index: number, title: string, body: string, focusId?: string) => {
    if (!images.length) return;

    setViewer({
      open: true,
      images,
      index,
      title,
      body,
      focusId,
    });
  };

  const closeViewer = () => setViewer((current) => ({ ...current, open: false }));
  const nextViewerImage = () =>
    setViewer((current) => ({ ...current, index: (current.index + 1) % current.images.length }));
  const prevViewerImage = () =>
    setViewer((current) => ({
      ...current,
      index: current.index === 0 ? current.images.length - 1 : current.index - 1,
    }));

  const navigateToFocus = (focusId: string, tab?: HubTab) => {
    const params = new URLSearchParams();
    params.set("focus", focusId);
    if (tab) {
      params.set("tab", tab);
    }
    router.push(`${hubBaseHref}?${params.toString()}`, { scroll: false });
    if (tab) setActiveSection(tab);
  };

  const renderPostFeed = () => (
    hubContent.feed.length === 0 ? (
      <EmptySection title="No posts yet" body="Share the first update with your community." />
    ) : (
      <>
        <section className={cn(CARD, "p-5")}>
          <div data-demo-target={isDemoPreview ? "hub-composer-section" : undefined}>
          <textarea
            defaultValue={demoComposerText}
            data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
            placeholder="Share an update with your hub..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-slate-500">
              <button type="button" className="rounded-full p-2 transition hover:bg-[#E3F1EF] hover:text-[#0C5C57]">
                <Images className={ICON} />
              </button>
              <button type="button" className="rounded-full p-2 transition hover:bg-[#E3F1EF] hover:text-[#0C5C57]">
                <Paperclip className={ICON} />
              </button>
              <button type="button" className="rounded-full p-2 transition hover:bg-[#E3F1EF] hover:text-[#0C5C57]">
                <BarChart3 className={ICON} />
              </button>
              <button type="button" className="rounded-full p-2 transition hover:bg-[#E3F1EF] hover:text-[#0C5C57]">
                <CalendarDays className={ICON} />
              </button>
              <button type="button" className="rounded-full p-2 transition hover:bg-[#E3F1EF] hover:text-[#0C5C57]">
                <MapPin className={ICON} />
              </button>
            </div>
            <button
              type="button"
              data-demo-target={isDemoPreview ? "hub-composer-post" : undefined}
              className={BUTTON_PRIMARY}
            >
              Post
            </button>
          </div>
          </div>
        </section>

        {demoPostedText ? (
          <section className={cn(CARD, "p-5")}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-[#111111]">Announcement</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{demoPostedText}</p>
            </div>
          </section>
        ) : null}

        {demoPollEnabled ? (
          <section className={cn(CARD, "p-5")}>
            <div
              data-demo-target={isDemoPreview ? "hub-poll-section" : undefined}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <h3 className="text-base font-semibold text-[#111111]">Free Pet Check-up in Mechanicsville</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Would you attend the complimentary pet wellness check this Saturday?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-poll-yes" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    demoPollVote === "yes" ? "bg-[#0C5C57] text-white" : "bg-white text-slate-600 border border-slate-200"
                  )}
                >
                  Yes
                </button>
                <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500">
                  Maybe
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-like-button" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    demoLiked ? "bg-[#EAF6F3] text-[#0C5C57]" : "bg-white text-slate-500 border border-slate-200"
                  )}
                >
                  Like
                </button>
                <span className="text-xs font-medium text-slate-400">214 people engaged</span>
              </div>
            </div>
          </section>
        ) : null}

        <section className={cn(CARD, "p-5")}>
          <div className="flex flex-wrap gap-2">
            {["All Posts", "Announcements", "Events", "Photos", "Files"].map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  index === 0
                    ? "bg-[#0C5C57] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {hubContent.feed.map((item) => (
            <article
              id={item.id}
              key={item.id}
              className={cn(
                CARD,
                "scroll-mt-28 p-5 transition",
                highlightedItemId === item.id && "ring-2 ring-[#A9D1CA] ring-offset-2 ring-offset-[#E3F1EF]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                  <ImageWithFallback
                    src={dpImageSrc}
                    sources={[dpImageSrc, coverImageSrc, ...recentPhotos]}
                    alt={`${item.author} avatar`}
                    className="h-full w-full object-cover"
                    fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                    fallback={initials(item.author)}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111111]">{item.author}</h3>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{item.time}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F7FBFA] px-2.5 py-1 text-[11px] font-semibold text-[#0C5C57]">
                      <FeedItemIcon kind={item.kind} />
                      {item.title}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>

                  {item.image ? (
                    <button
                      type="button"
                      className="mt-4 block w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
                      onClick={() =>
                        openViewer([item.image!, ...recentPhotos], 0, item.title, item.body, item.id)
                      }
                    >
                      <div className="aspect-[16/9] w-full">
                        <ImageWithFallback
                          src={item.image}
                          sources={[item.image, ...recentPhotos, coverImageSrc]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-sm font-medium text-[#0C5C57]"
                          fallback="Image unavailable"
                          loading="lazy"
                        />
                      </div>
                    </button>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center gap-5">
                      <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                        <Heart className={ICON} />
                        <span>{item.likes}</span>
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                        <MessageSquare className={ICON} />
                        <span>{item.comments}</span>
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                        <Share2 className={ICON} />
                        <span>Share</span>
                      </button>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-slate-500">
                      <Eye className={ICON} />
                      <span>{item.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </>
    )
  );

  const renderEventsTab = () => (
    hubContent.events.length === 0 ? (
      <EmptySection title="No events yet" body="Plan the first event for your hub when you are ready." />
    ) : (
      <section className="space-y-4">
        {hubContent.events.map((event) => (
        <article
          id={event.id}
          key={event.id}
          className={cn(
            CARD,
            "scroll-mt-28 p-5 transition",
            highlightedItemId === event.id && "ring-2 ring-[#A9D1CA] ring-offset-2 ring-offset-[#E3F1EF]"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#A9D1CA]/55 px-2.5 py-1 text-[11px] font-semibold text-[#0C5C57]">
                  {event.theme}
                </span>
                <span className="rounded-full bg-[#F7FBFA] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {event.badge}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-serif font-semibold text-[#111111]">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{event.description}</p>
            </div>

            <button
              type="button"
              onClick={() => navigateToFocus(event.focusId, "Posts")}
              className={BUTTON_SECONDARY}
            >
              View event update
            </button>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#F7FBFA] px-4 py-3">{event.dateLabel}</div>
            <div className="rounded-2xl bg-[#F7FBFA] px-4 py-3">{event.time}</div>
            <div className="rounded-2xl bg-[#F7FBFA] px-4 py-3">{event.location}</div>
          </div>
        </article>
        ))}
      </section>
    )
  );

  const renderPhotosTab = () => (
    recentPhotos.length === 0 ? (
      <EmptySection title="No photos yet" body="Add photos later to bring this hub to life." />
    ) : (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {recentPhotos.map((img, index) => (
        <button
          key={`${img}-${index}`}
          type="button"
          className={cn(CARD, "overflow-hidden p-0")}
          onClick={() => openViewer(recentPhotos, index, `${hubName} Album`, "Recent photos from this hub.")}
        >
          <div className="aspect-square">
            <ImageWithFallback
              src={img}
              sources={[img, ...recentPhotos.filter((photo) => photo !== img), coverImageSrc, dpImageSrc]}
              alt={`${hubName} album ${index + 1}`}
              className="h-full w-full object-cover"
              fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-sm font-medium text-[#0C5C57]"
              fallback="Photo"
            />
          </div>
        </button>
      ))}
      </section>
    )
  );

  const renderFilesTab = () => (
    fileItems.length === 0 ? (
      <EmptySection title="No files yet" body="Shared guides, forms, and resources will appear here." />
    ) : (
      <section className="space-y-3">
      {fileItems.map((file) => (
        <div key={file} className={cn(CARD, "flex items-center justify-between gap-3 p-4")}>
          <div className="flex items-center gap-3">
            <span className={PREMIUM_ICON_WRAPPER}>
              <Paperclip className={ICON} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#111111]">{file}</p>
              <p className="text-xs text-slate-500">Mock shared file</p>
            </div>
          </div>
          <button type="button" className={BUTTON_SECONDARY}>
            Open
          </button>
        </div>
      ))}
      </section>
    )
  );

  const renderMembersTab = () => (
    memberItems.length === 0 ? (
      <EmptySection title="No members yet" body="Invite people to join and start building your community." />
    ) : (
      <section className="space-y-3">
      {memberItems.map((member) => (
        <div key={member} className={cn(CARD, "flex items-center gap-3 p-4")}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#111111]">
            {initials(member)}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111111]">{member}</p>
            <p className="text-xs text-slate-500">Mock member record</p>
          </div>
        </div>
      ))}
      </section>
    )
  );

  const renderMainContent = () => {
    if (activeSection === "Events") return renderEventsTab();
    if (activeSection === "Photos") return renderPhotosTab();
    if (activeSection === "Files") return renderFilesTab();
    if (activeSection === "Members") return renderMembersTab();
    return renderPostFeed();
  };

  const renderChallengesPanel = () => (
    <section className={cn(CARD, "grid min-h-[320px] place-items-center p-8 text-center")}>
      <div className="max-w-lg">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
          <Target className="h-7 w-7 stroke-[1.8]" />
        </div>
        <h2 className="mt-6 text-3xl font-serif font-semibold tracking-tight text-[#111111]">What are Challenges?</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Challenges help your community stay engaged by working toward shared goals such as events,
          volunteering, or participation activities.
        </p>
        <button type="button" className={cn(BUTTON_PRIMARY, "mt-8 px-6 py-3 text-sm")}>
          Create a Challenge
        </button>
      </div>
    </section>
  );

  const renderSettingsPanel = () => (
    <div className="space-y-5">
      <SettingsSection
        title="Profile"
        description="Update how your hub appears to members across uDeets."
      >
        <div className="grid gap-5 md:grid-cols-[120px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
              <ImageWithFallback
                src={dpImageSrc}
                sources={[dpImageSrc, coverImageSrc]}
                alt={`${settingsHubName} display`}
                className="h-full w-full object-cover"
                fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-lg font-semibold text-[#111111]"
                fallback={initials(settingsHubName)}
              />
            </div>
            <button type="button" className={BUTTON_SECONDARY}>
              Change DP
            </button>
          </div>
          <div className="space-y-4">
            <SettingField label="Hub Name">
              <input
                value={settingsHubName}
                onChange={(event) => setSettingsHubName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              />
            </SettingField>
            <SettingField label="Cover Image">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F7FBFA] px-4 py-4 text-sm text-slate-500">
                Cover image ready. Upload controls can be added next.
              </div>
            </SettingField>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <div className="flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[#111111]">In-app notifications</p>
            <p className="mt-1 text-xs text-slate-500">Receive activity updates for this hub inside uDeets.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={() => setNotificationsEnabled((current) => !current)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-200",
              notificationsEnabled ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
                notificationsEnabled ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Hub Info">
        <div className="grid gap-4 md:grid-cols-2">
          <SettingField label="Description">
            <textarea
              value={settingsDescription}
              onChange={(event) => setSettingsDescription(event.target.value)}
              rows={4}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
            />
          </SettingField>
          <div className="space-y-4">
            <SettingField label="Category">
              <div className="rounded-2xl border border-slate-200 bg-[#F7FBFA] px-4 py-3 text-sm text-slate-700">
                {hubLabelChips.length ? hubLabelChips.join(", ") : "General Hub"}
              </div>
            </SettingField>
            <SettingField label="Location">
              <input
                value={settingsLocation}
                onChange={(event) => setSettingsLocation(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              />
            </SettingField>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Visibility">
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setSettingsVisibility("Public")}
            className={cn(
              "rounded-3xl border px-5 py-5 text-left transition",
              settingsVisibility === "Public"
                ? "border-[#0C5C57] bg-[#EAF6F3]"
                : "border-slate-200 bg-white hover:border-[#A9D1CA]"
            )}
          >
            <p className="text-base font-serif font-semibold text-[#111111]">Public</p>
            <p className="mt-2 text-sm text-slate-600">Anyone can discover and view this hub's public updates.</p>
          </button>
          <button
            type="button"
            onClick={() => setSettingsVisibility("Private")}
            className={cn(
              "rounded-3xl border px-5 py-5 text-left transition",
              settingsVisibility === "Private"
                ? "border-[#0C5C57] bg-[#EAF6F3]"
                : "border-slate-200 bg-white hover:border-[#A9D1CA]"
            )}
          >
            <p className="text-base font-serif font-semibold text-[#111111]">Private</p>
            <p className="mt-2 text-sm text-slate-600">Only approved members can view posts, updates, and files.</p>
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[#111111]">Show this hub in Discover</p>
            <p className="mt-1 text-xs text-slate-500">Control whether new people can find this hub in discovery.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settingsDiscoverable}
            onClick={() => setSettingsDiscoverable((current) => !current)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-200",
              settingsDiscoverable ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
                settingsDiscoverable ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Members">
        <div className="space-y-3">
          {memberRoleItems.length ? (
            memberRoleItems.map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#111111]">
                    {initials(member.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                </div>
                <UserCog className="h-4.5 w-4.5 text-slate-400" />
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[#F7FBFA] px-4 py-4 text-sm text-slate-600">
              No members yet. Invite people after your first post.
            </div>
          )}
        </div>
        <div className="mt-4">
          <SettingField label="Approval Settings">
            <select
              value={approvalSetting}
              onChange={(event) => setApprovalSetting(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
            >
              <option>Required</option>
              <option>Open</option>
            </select>
          </SettingField>
        </div>
      </SettingsSection>

      <SettingsSection title="Content Settings">
        <div className="grid gap-4 md:grid-cols-2">
          <SettingField label="Who can post">
            <select
              value={whoCanPost}
              onChange={(event) => setWhoCanPost(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
            >
              <option>Admins only</option>
              <option>Admins and members</option>
            </select>
          </SettingField>
          <SettingField label="Who can upload files/photos">
            <select
              value={whoCanUpload}
              onChange={(event) => setWhoCanUpload(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
            >
              <option>Admins only</option>
              <option>Admins and members</option>
            </select>
          </SettingField>
        </div>
      </SettingsSection>

      <SettingsSection title="Danger Zone" description="These actions are not connected to backend logic yet.">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Leave hub
          </button>
          <button
            type="button"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Delete hub
          </button>
        </div>
      </SettingsSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E3F1EF]">
      <UdeetsHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <aside className="space-y-6 lg:col-span-3 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
            <section className={cn(CARD, "p-6")}>
              <div className="text-center">
                <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#A9D1CA] shadow-sm">
                  <ImageWithFallback
                    src={dpImageSrc}
                    sources={[dpImageSrc, coverImageSrc, ...galleryImages]}
                    alt={`${hubName} display`}
                    className="h-full w-full object-cover"
                    fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-2xl font-semibold text-[#111111]"
                    fallback={initials(hubName)}
                  />
                </div>
                <h1 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">{hubName}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{hubDescription}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-[#F7FBFA] px-3 py-1 text-xs font-medium text-slate-600">
                    {hub.membersLabel}
                  </span>
                  <span className="rounded-full bg-[#F7FBFA] px-3 py-1 text-xs font-medium text-slate-600">
                    {settingsVisibility}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setActivePanel("settings")} className={BUTTON_PRIMARY}>
                    Hub Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel("challenges")}
                    className={BUTTON_SECONDARY}
                  >
                    Challenges
                  </button>
                </div>
              </div>
            </section>

            <section className={cn(CARD, "p-6")}>
              <h2 className="text-base font-semibold tracking-tight text-[#111111]">Recent Photos</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {recentPhotos.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ring-2 ring-white"
                    onClick={() =>
                      openViewer(recentPhotos, index, `${hubName} Photo`, "Recent photo from this hub.")
                    }
                  >
                    <ImageWithFallback
                      src={img}
                      sources={[img, ...recentPhotos.filter((photo) => photo !== img), coverImageSrc, dpImageSrc]}
                      alt={`${hubName} photo ${index + 1}`}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-[11px] font-medium text-[#0C5C57]"
                      fallback="Photo"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>

            <section className={cn(CARD, "p-6")}>
              <h2 className="text-base font-semibold tracking-tight text-[#111111]">Connect</h2>
              <div className="mt-4 space-y-2.5 text-sm text-slate-600">
                <a href={hub.website || "#"} className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]">
                  <Globe className={ICON} />
                  <span className="truncate">{hub.website || "www.udeets-hub.com"}</span>
                </a>
                <a href="#" className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]">
                  <Facebook className={ICON} />
                  <span className="truncate">facebook.com/udeets</span>
                </a>
                <a href="#" className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]">
                  <Instagram className={ICON} />
                  <span className="truncate">instagram.com/{hub.slug.replace(/-/g, "")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]">
                  <Youtube className={ICON} />
                  <span className="truncate">youtube.com/@udeets</span>
                </a>
                <a href="tel:+18045551234" className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]">
                  <Phone className={ICON} />
                  <span className="truncate">(804) 555-1234</span>
                </a>
                <a href={`mailto:hello@${hub.slug}.com`} className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]">
                  <Mail className={ICON} />
                  <span className="truncate">hello@{hub.slug}.com</span>
                </a>
              </div>
            </section>
          </aside>

          <section className="lg:col-span-9">
            <section className={cn(CARD, "overflow-hidden")}>
              <div className="aspect-[16/6] w-full bg-slate-100">
                <ImageWithFallback
                  src={coverImageSrc}
                  sources={[coverImageSrc, ...galleryImages, dpImageSrc]}
                  alt={`${hubName} cover`}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-sm font-medium text-[#0C5C57]"
                  fallback="Cover photo"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{hub.category.replace(/-/g, " ")}</p>
                    <h2 className="mt-2 text-2xl font-serif font-semibold tracking-tight text-[#111111]">
                      {hubTagline}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                      {isCustomHub ? settingsDescription : hub.intro || hub.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hubLabelChips.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#A9D1CA]/45 px-3 py-1 text-xs font-semibold capitalize text-[#0C5C57]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </section>

          <section className={cn("space-y-6 lg:col-start-4", activePanel === "posts" ? "lg:col-span-6" : "lg:col-span-9")}>
            <section className={cn(CARD, "p-2")}>
              <div className="grid grid-cols-5 items-center gap-1">
                {HUB_TABS.map((tab) => (
                  <div key={tab} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePanel("posts");
                        setActiveSection(tab);
                      }}
                      aria-label={tab}
                      title={tab}
                      className={cn(
                        "w-full rounded-2xl px-3 py-3 text-center text-sm font-semibold tracking-tight transition",
                        activePanel === "posts" && activeSection === tab
                          ? "bg-[#A9D1CA] text-[#0C5C57]"
                          : "text-slate-600 hover:bg-[#E3F1EF] hover:text-[#0C5C57]"
                      )}
                    >
                      {tab}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {activePanel === "posts" ? renderMainContent() : null}

            {activePanel === "challenges" ? renderChallengesPanel() : null}
            {activePanel === "settings" ? renderSettingsPanel() : null}
          </section>

          {activePanel === "posts" ? (
          <aside className="space-y-4 lg:col-span-3 lg:self-start lg:sticky lg:top-24">
            <section className={cn(CARD, "p-4")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-tight text-[#111111]">Hub Notifications</h2>
                <Bell className={ICON} />
              </div>
              <div className="mt-3 space-y-2">
                {hubContent.notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => navigateToFocus(notification.focusId, "Posts")}
                    className="group grid w-full grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#E3F1EF]"
                  >
                    <p className="text-[11px] font-medium text-slate-500">{notification.meta}</p>
                    <p className="truncate text-sm font-semibold leading-snug text-[#111111] group-hover:whitespace-normal">
                      {notification.title}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className={cn(CARD, "p-4")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-tight text-[#111111]">Upcoming Events</h2>
                <CalendarDays className={ICON} />
              </div>
              <div className="mt-3 space-y-2">
                {hubContent.events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigateToFocus(event.focusId, "Posts")}
                    className="group grid w-full grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#E3F1EF]"
                  >
                    <p className="text-[11px] font-medium text-slate-500">{event.dateLabel}</p>
                    <p className="truncate text-sm font-semibold leading-snug text-[#111111] group-hover:whitespace-normal">
                      {summaryLine([event.title, `${event.dateLabel} ${event.time}`])}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className={cn(CARD, "p-5")}>
              <h2 className="text-base font-semibold tracking-tight text-[#111111]">Hub Admins</h2>
              <div className="mt-3 space-y-3">
                {[0, 1].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                      <ImageWithFallback
                        src={adminImages[index]}
                        sources={[adminImages[index], dpImageSrc, coverImageSrc, ...recentPhotos]}
                        alt="Admin"
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                        fallback={initials(index === 0 ? `${hubName} Admin` : "Moderator Team")}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        {index === 0 ? `${hubName} Admin` : "Moderator Team"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {index === 0 ? "Lead Admin" : "Community Admin"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
          ) : null}
        </div>
      </main>

      {!isDemoPreview ? <UdeetsFooter /> : null}
      {!isDemoPreview ? <UdeetsBottomNav activeNav="home" /> : null}

      {viewer.open ? (
        <div className="fixed inset-0 z-[120] flex bg-black/85">
          <div className="relative flex min-w-0 flex-1 items-center justify-center p-6">
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-6 top-6 z-20 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            >
              <X className="h-5 w-5 stroke-[1.8]" />
            </button>
            {viewer.images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prevViewerImage}
                  className="absolute left-6 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                >
                  <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
                </button>
                <button
                  type="button"
                  onClick={nextViewerImage}
                  className="absolute right-[376px] top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                >
                  <ChevronRight className="h-5 w-5 stroke-[1.8]" />
                </button>
              </>
            ) : null}
            <img src={viewer.images[viewer.index]} alt="Hub photo" className="max-h-[85vh] max-w-[65vw] rounded-3xl object-contain" />
          </div>

          <aside className="hidden w-[360px] shrink-0 flex-col border-l border-white/20 bg-white p-5 lg:flex">
            <h3 className="text-base font-semibold tracking-tight text-[#111111]">{viewer.title || "Photo"}</h3>
            <p className="mt-2 text-sm text-slate-600">{viewer.body || "Shared from this hub."}</p>
            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              <p>Comments</p>
              <p>• Great update from the hub team.</p>
              <p>• Looking forward to this event.</p>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
              <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                <Heart className={ICON} />
                Like
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                <MessageSquare className={ICON} />
                Comment
              </button>
            </div>
            <button
              type="button"
              className={cn(BUTTON_PRIMARY, "mt-auto w-full")}
              onClick={() => {
                closeViewer();
                if (viewer.focusId) navigateToFocus(viewer.focusId, "Posts");
              }}
            >
              Show the post
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
