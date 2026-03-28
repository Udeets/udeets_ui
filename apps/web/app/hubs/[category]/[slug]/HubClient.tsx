/* eslint-disable @next/next/no-img-element */
"use client";

import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Eye,
  Facebook,
  Files,
  Globe,
  Heart,
  Images,
  Instagram,
  Landmark,
  Loader2,
  MapPin,
  Megaphone,
  MessageSquare,
  Phone,
  Paperclip,
  PawPrint,
  Plus,
  Search,
  Share2,
  Shield,
  Settings,
  Target,
  UtensilsCrossed,
  UserCog,
  UserPlus,
  UsersRound,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import type { HubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";
import { updateHub } from "@/lib/services/hubs/update-hub";
import { uploadHubMedia } from "@/lib/services/hubs/upload-hub-media";
import { useAuthSession } from "@/services/auth/useAuthSession";

const CARD = "rounded-3xl border border-slate-100 bg-white shadow-sm";
const BUTTON_PRIMARY =
  "rounded-full bg-[#0C5C57] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#094a46]";
const BUTTON_SECONDARY =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50";
const ICON = "h-4.5 w-4.5 stroke-[1.8]";
const EMPTY_MEDIA_BG = "#A9D1CA";
const ACTION_ICON = "h-4 w-4 stroke-[1.6]";
const ACTION_ICON_BUTTON = "inline-flex items-center text-[#111111]/78 transition hover:text-[#0C5C57]";
const PREMIUM_ICON_WRAPPER =
  "inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FBFA] text-[#0C5C57]";
type HubTab = "Posts" | "Events" | "Photos" | "Files" | "Members";
type HubPanel = "posts" | "challenges" | "settings" | "members" | "invite";

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

function compactId(value?: string) {
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function displayLinkValue(value?: string) {
  if (!value) return "";

  return value
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

function MediaEmptyState({ square = false }: { square?: boolean }) {
  return (
    <div
      className={cn("grid h-full w-full place-items-center text-[#0C5C57]", square ? "aspect-square rounded-2xl" : "")}
      style={{ backgroundColor: EMPTY_MEDIA_BG }}
    >
      <Plus className="h-9 w-9 stroke-[1.9] text-white/75" />
    </div>
  );
}

function categoryMetaFor(category: HubRecord["category"]) {
  if (category === "restaurants") return { icon: UtensilsCrossed, label: "Restaurant" };
  if (category === "religious-places") return { icon: Landmark, label: "Religious Place" };
  if (category === "fitness") return { icon: Dumbbell, label: "Fitness" };
  if (category === "pet-clubs") return { icon: PawPrint, label: "Pet Club" };
  if (category === "hoa") return { icon: Building2, label: "HOA" };
  return { icon: UsersRound, label: "Community" };
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
  const { status, user } = useAuthSession();
  const hubContent = useMemo<HubContent>(
    () => ({
      hubId: hub.id,
      feed: [],
      events: [],
      notifications: [],
    }),
    [hub.id],
  );
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerState>({
    open: false,
    images: [],
    index: 0,
    title: "",
    body: "",
    focusId: undefined,
  });

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
  const [membersPanelMode, setMembersPanelMode] = useState<"list" | "invite">("list");
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<"Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos">("Newest");
  const [composerToolTarget, setComposerToolTarget] = useState<"photo" | "file" | "poll" | "event" | "location" | null>(null);
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
  const [isConnectEditorOpen, setIsConnectEditorOpen] = useState(false);
  const [isAdminsEditorOpen, setIsAdminsEditorOpen] = useState(false);
  const [isSavingConnect, setIsSavingConnect] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [connectLinks, setConnectLinks] = useState({
    website: hub.website ?? "",
    facebook: hub.facebookUrl ?? "",
    instagram: hub.instagramUrl ?? "",
    youtube: hub.youtubeUrl ?? "",
    phone: hub.phoneNumber ?? "",
  });
  const [connectDraft, setConnectDraft] = useState({
    website: hub.website ?? "",
    facebook: hub.facebookUrl ?? "",
    instagram: hub.instagramUrl ?? "",
    youtube: hub.youtubeUrl ?? "",
    phone: hub.phoneNumber ?? "",
  });
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaSuccess, setMediaSuccess] = useState<string | null>(null);
  const [isUploadingDp, setIsUploadingDp] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [mediaChooserTarget, setMediaChooserTarget] = useState<"dp" | "cover" | null>(null);
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);
  const [dpImageSrc, setDpImageSrc] = useState(normalizePublicSrc(hub.dpImage));
  const [coverImageSrc, setCoverImageSrc] = useState(normalizePublicSrc(hub.heroImage));
  const [galleryImages, setGalleryImages] = useState(() =>
    (hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean)
  );
  const dpInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const recentPhotos = galleryImages.slice(0, 6);

  const adminImages = (hub.adminImages ?? []).map(normalizePublicSrc).filter(Boolean);
  const isCreatorAdmin = Boolean(user?.id && hub.createdBy && user.id === hub.createdBy);
  const creatorMetadata = user?.user_metadata;
  const creatorDisplayName = isCreatorAdmin
    ? creatorMetadata?.full_name || creatorMetadata?.name || user?.email || "You"
    : "Hub Creator";
  const creatorDetail = isCreatorAdmin
    ? user?.email || "Admin"
    : hub.createdBy
      ? `Admin • ${compactId(hub.createdBy)}`
      : "Admin";
  const creatorAvatarSrc =
    isCreatorAdmin && typeof creatorMetadata?.avatar_url === "string" ? creatorMetadata.avatar_url : "";
  const albumChoices = galleryImages.filter((image) => image !== dpImageSrc && image !== coverImageSrc);
  const categoryMeta = categoryMetaFor(hub.category);
  const CategoryIcon = categoryMeta.icon;
  const memberCount = Math.max(1, Number.parseInt(hub.membersLabel, 10) || 0);

  const fileItems: string[] = [];

  const memberItems: string[] = [];
  const hubLabelChips = hub.tags ?? [];
  const memberRoleItems: Array<{ name: string; role: string }> = [];

  useEffect(() => {
    setConnectLinks({
      website: hub.website ?? "",
      facebook: hub.facebookUrl ?? "",
      instagram: hub.instagramUrl ?? "",
      youtube: hub.youtubeUrl ?? "",
      phone: hub.phoneNumber ?? "",
    });
    setConnectDraft({
      website: hub.website ?? "",
      facebook: hub.facebookUrl ?? "",
      instagram: hub.instagramUrl ?? "",
      youtube: hub.youtubeUrl ?? "",
      phone: hub.phoneNumber ?? "",
    });
  }, [hub.facebookUrl, hub.instagramUrl, hub.phoneNumber, hub.website, hub.youtubeUrl]);

  useEffect(() => {
    setDpImageSrc(normalizePublicSrc(hub.dpImage));
    setCoverImageSrc(normalizePublicSrc(hub.heroImage));
    setGalleryImages((hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean));
  }, [hub.dpImage, hub.galleryImages, hub.heroImage]);

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

  const handleConnectChange =
    (field: "website" | "facebook" | "instagram" | "youtube" | "phone") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setConnectDraft((current) => ({ ...current, [field]: value }));
    };

  const openConnectEditor = () => {
    setConnectDraft(connectLinks);
    setConnectError(null);
    setConnectSuccess(null);
    setIsConnectEditorOpen(true);
  };

  const handleSaveConnect = async () => {
    setIsSavingConnect(true);
    setConnectError(null);
    setConnectSuccess(null);

    try {
      const updatedHub = await updateHub(hub.id, {
        websiteUrl: connectDraft.website,
        facebookUrl: connectDraft.facebook,
        instagramUrl: connectDraft.instagram,
        youtubeUrl: connectDraft.youtube,
        phoneNumber: connectDraft.phone,
      });

      const nextConnectLinks = {
        website: updatedHub.website_url ?? "",
        facebook: updatedHub.facebook_url ?? "",
        instagram: updatedHub.instagram_url ?? "",
        youtube: updatedHub.youtube_url ?? "",
        phone: updatedHub.phone_number ?? "",
      };

      setConnectLinks(nextConnectLinks);
      setConnectDraft(nextConnectLinks);
      setConnectSuccess("Connect links updated.");
      setIsConnectEditorOpen(false);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Connect links could not be saved.");
    } finally {
      setIsSavingConnect(false);
    }
  };

  const handleMediaUpload = async (kind: "dp" | "cover" | "gallery", file: File) => {
    setMediaError(null);
    setMediaSuccess(null);

    if (kind === "dp") setIsUploadingDp(true);
    if (kind === "cover") setIsUploadingCover(true);
    if (kind === "gallery") setIsUploadingGallery(true);

    try {
      const uploadedUrl = await uploadHubMedia({
        file,
        slug: hub.slug,
        kind,
      });

      const nextGallery = kind === "gallery" ? [...galleryImages, uploadedUrl] : galleryImages;
      const updatedHub = await updateHub(hub.id, {
        dpImageUrl: kind === "dp" ? uploadedUrl : undefined,
        coverImageUrl: kind === "cover" ? uploadedUrl : undefined,
        galleryImageUrls: kind === "gallery" ? nextGallery : undefined,
      });

      setDpImageSrc(normalizePublicSrc(updatedHub.dp_image_url || undefined));
      setCoverImageSrc(normalizePublicSrc(updatedHub.cover_image_url || undefined));
      setGalleryImages((updatedHub.gallery_image_urls ?? []).map(normalizePublicSrc).filter(Boolean));
      setMediaSuccess(
        kind === "gallery"
          ? "Recent photos updated."
          : kind === "dp"
            ? "Display picture updated."
            : "Cover image updated."
      );
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Hub media could not be updated.");
    } finally {
      if (kind === "dp") setIsUploadingDp(false);
      if (kind === "cover") setIsUploadingCover(false);
      if (kind === "gallery") setIsUploadingGallery(false);
    }
  };

  const handleMediaFileChange =
    (kind: "dp" | "cover" | "gallery") =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      await handleMediaUpload(kind, file);
    };

  const openCenterMembers = (mode: "list" | "invite") => {
    setMembersPanelMode(mode);
    setActivePanel(mode === "invite" ? "invite" : "members");
  };

  const normalizedPostSearch = postSearchQuery.trim().toLowerCase();
  const searchedFeedItems = hubContent.feed.filter((item) => {
    if (!normalizedPostSearch) return true;

    return [item.title, item.body, item.author, item.time].some((value) =>
      value.toLowerCase().includes(normalizedPostSearch)
    );
  });
  const filteredFeedItems = searchedFeedItems.filter((item) => {
    if (feedFilter === "Newest" || feedFilter === "Oldest") return true;
    if (feedFilter === "Announcements") return item.kind === "announcement" || item.kind === "notice";
    if (feedFilter === "Events") return item.kind === "event";
    if (feedFilter === "Photos") return item.kind === "photo";
    return false;
  });
  const showDemoPostedText =
    feedFilter !== "Events" &&
    feedFilter !== "Polls" &&
    feedFilter !== "Photos" &&
    Boolean(demoPostedText) &&
    (!normalizedPostSearch || demoPostedText.toLowerCase().includes(normalizedPostSearch));
  const demoPollSearchText = "free pet check-up in mechanicsville would you attend the complimentary pet wellness check this saturday";
  const showDemoPoll =
    (feedFilter === "Newest" || feedFilter === "Oldest" || feedFilter === "Polls" || feedFilter === "Events") &&
    demoPollEnabled &&
    (!normalizedPostSearch || demoPollSearchText.includes(normalizedPostSearch));

  const openMediaChooser = (target: "dp" | "cover") => {
    if (!isCreatorAdmin) {
      return;
    }

    setMediaChooserTarget(target);
    setIsAlbumPickerOpen(false);
    setMediaError(null);
  };

  const closeMediaChooser = () => {
    setMediaChooserTarget(null);
    setIsAlbumPickerOpen(false);
  };

  const handleChooseFromDevice = () => {
    if (!mediaChooserTarget) {
      return;
    }

    closeMediaChooser();

    if (mediaChooserTarget === "dp") {
      dpInputRef.current?.click();
      return;
    }

    coverInputRef.current?.click();
  };

  const handleChooseFromAlbums = () => {
    if (!albumChoices.length) {
      return;
    }

    setIsAlbumPickerOpen(true);
  };

  const handleAlbumImageSelect = async (imageUrl: string) => {
    if (!mediaChooserTarget) {
      return;
    }

    setMediaError(null);
    setMediaSuccess(null);

    if (mediaChooserTarget === "dp") {
      setIsUploadingDp(true);
    } else {
      setIsUploadingCover(true);
    }

    try {
      const updatedHub = await updateHub(hub.id, {
        dpImageUrl: mediaChooserTarget === "dp" ? imageUrl : undefined,
        coverImageUrl: mediaChooserTarget === "cover" ? imageUrl : undefined,
      });

      setDpImageSrc(normalizePublicSrc(updatedHub.dp_image_url || undefined));
      setCoverImageSrc(normalizePublicSrc(updatedHub.cover_image_url || undefined));
      setMediaSuccess(mediaChooserTarget === "dp" ? "Display picture updated." : "Cover image updated.");
      closeMediaChooser();
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Hub media could not be updated.");
    } finally {
      setIsUploadingDp(false);
      setIsUploadingCover(false);
    }
  };

  const renderPostComposer = () => (
    <section className={cn(CARD, "p-5")}>
      <div data-demo-target={isDemoPreview ? "hub-composer-section" : undefined}>
        <textarea
          defaultValue={demoComposerText}
          data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
          placeholder={isCreatorAdmin ? "What's going on in your hub today?" : "Hub admins can create updates here."}
          rows={3}
          readOnly={!isCreatorAdmin}
          className={cn(
            "w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2",
            !isCreatorAdmin && "cursor-not-allowed bg-slate-50 text-slate-500"
          )}
        />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-3 text-slate-500">
            {[
              { key: "photo" as const, icon: Images, label: "Add photo" },
              { key: "file" as const, icon: Paperclip, label: "Attach file" },
              { key: "poll" as const, icon: BarChart3, label: "Create poll" },
              { key: "event" as const, icon: CalendarDays, label: "Create event" },
              { key: "location" as const, icon: MapPin, label: "Add location" },
            ].map(({ key, icon: ComposerIcon, label }) => (
              <button
                key={key}
                type="button"
                disabled={!isCreatorAdmin}
                onClick={() => isCreatorAdmin && setComposerToolTarget(key)}
                aria-label={label}
                title={label}
                className={cn(
                  "transition",
                  isCreatorAdmin ? "hover:text-[#0C5C57]" : "cursor-not-allowed opacity-50"
                )}
              >
                <ComposerIcon className={ICON} />
              </button>
            ))}
          </div>
          <button
            type="button"
            data-demo-target={isDemoPreview ? "hub-composer-post" : undefined}
            disabled={!isCreatorAdmin}
            className={cn(BUTTON_PRIMARY, !isCreatorAdmin && "cursor-not-allowed opacity-60")}
          >
            Post
          </button>
        </div>
      </div>
    </section>
  );

  const renderPostSearchRow = () => (
    <section className={cn(CARD, "p-4")}>
      <label className="flex items-center gap-3 rounded-2xl bg-[#F7FBFA] px-4 py-3">
        <Search className="h-4.5 w-4.5 text-slate-400" />
        <input
          value={postSearchQuery}
          onChange={(event) => setPostSearchQuery(event.target.value)}
          placeholder="Search posts in this hub"
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </label>
    </section>
  );

  const renderCenterPanel = ({
    title,
    description,
    children,
    actions,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <section className={cn(CARD, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );

  const renderPostFeed = () => (
    <>
      {renderPostSearchRow()}
      {renderPostComposer()}
      {renderCenterPanel({
        title: "Deets",
        description: normalizedPostSearch ? "Showing filtered hub updates." : "Latest posts and updates from this hub.",
        actions: (
          <select
            value={feedFilter}
            onChange={(event) =>
              setFeedFilter(
                event.target.value as "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos"
              )
            }
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
          >
            {["Newest", "Oldest", "Announcements", "Events", "Polls", "Photos"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ),
        children:
          filteredFeedItems.length === 0 && !showDemoPostedText && !showDemoPoll ? (
            <div className="grid min-h-[260px] place-items-center text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
                  <MessageSquare className="h-6 w-6 stroke-[1.8]" />
                </div>
                <h3 className="mt-5 text-2xl font-serif font-semibold tracking-tight text-[#111111]">
                  {normalizedPostSearch ? "No matching deets" : "Your deets feed is ready"}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {normalizedPostSearch
                    ? "Try a different search or filter to find the update you want."
                    : isCreatorAdmin
                      ? "Start the stream with your first update, event reminder, or shared photo."
                      : "Check back soon for updates, announcements, and deets from this hub."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {showDemoPostedText ? (
                <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4.5 w-4.5 text-[#0C5C57]" />
                    <h3 className="text-base font-semibold text-[#111111]">Update</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{demoPostedText}</p>
                </section>
              ) : null}

              {showDemoPoll ? (
                <section
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
                        demoPollVote === "yes" ? "bg-[#0C5C57] text-white" : "border border-slate-200 bg-white text-slate-600"
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
                        demoLiked ? "bg-[#EAF6F3] text-[#0C5C57]" : "border border-slate-200 bg-white text-slate-500"
                      )}
                    >
                      Like
                    </button>
                    <span className="text-xs font-medium text-slate-400">214 people engaged</span>
                  </div>
                </section>
              ) : null}

              <section className="space-y-4">
                {filteredFeedItems.map((item) => (
                  <article
                    id={item.id}
                    key={item.id}
                    className={cn(
                      "rounded-2xl border border-slate-100 bg-slate-50 p-4 transition",
                      highlightedItemId === item.id && "ring-2 ring-[#A9D1CA] ring-offset-2 ring-offset-white"
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0C5C57]">
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
            </div>
          ),
      })}
    </>
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
              sources={[img, ...recentPhotos.filter((photo) => photo !== img)]}
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

  const renderMembersTab = () =>
    renderCenterPanel({
      title: membersPanelMode === "invite" ? "Invite Members" : "Members",
      description:
        membersPanelMode === "invite"
          ? "Invite tools can plug in here next. This area will handle invitations and join requests."
          : "Manage and review the people connected to this hub.",
      children:
        memberItems.length === 0 ? (
          <div className="grid min-h-[260px] place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
                {membersPanelMode === "invite" ? (
                  <UserPlus className="h-6 w-6 stroke-[1.8]" />
                ) : (
                  <UsersRound className="h-6 w-6 stroke-[1.8]" />
                )}
              </div>
              <h3 className="mt-5 text-2xl font-serif font-semibold tracking-tight text-[#111111]">
                {membersPanelMode === "invite" ? "Invite your first members" : "No members yet"}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {membersPanelMode === "invite"
                  ? "Invite people to join and start building your community."
                  : "This member list will populate as people join your hub."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {memberItems.map((member) => (
              <div key={member} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#111111]">
                  {initials(member)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{member}</p>
                  <p className="text-xs text-slate-500">Member record</p>
                </div>
              </div>
            ))}
          </div>
        ),
    });

  const renderMainContent = () => {
    if (activeSection === "Events") return renderEventsTab();
    if (activeSection === "Photos") return renderPhotosTab();
    if (activeSection === "Files") return renderFilesTab();
    if (activeSection === "Members") return renderMembersTab();
    return renderPostFeed();
  };

  const renderChallengesPanel = () =>
    renderCenterPanel({
      title: "Challenges",
      description: "Plan shared goals, participation drives, and engagement activities for your hub.",
      children: (
        <div className="grid min-h-[320px] place-items-center text-center">
          <div className="max-w-lg">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
              <Target className="h-7 w-7 stroke-[1.8]" />
            </div>
            <h3 className="mt-6 text-3xl font-serif font-semibold tracking-tight text-[#111111]">What are Challenges?</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Challenges help your community stay engaged by working toward shared goals such as events,
              volunteering, or participation activities.
            </p>
            <button type="button" className={cn(BUTTON_PRIMARY, "mt-8 px-6 py-3 text-sm")}>
              Create a Challenge
            </button>
          </div>
        </div>
      ),
    });

  const renderSettingsPanel = () =>
    renderCenterPanel({
      title: "Settings",
      description: "Manage how this hub appears and behaves across uDeets.",
      children: (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Profile</h3>
            <p className="mt-1 text-sm text-slate-600">Update how your hub appears to members across uDeets.</p>
          </div>
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

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Notifications</h3>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4">
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
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Hub Info</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Visibility</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Members</h3>
            <div className="mt-4 space-y-3">
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
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Content Settings</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-serif font-semibold text-[#111111]">Danger Zone</h3>
            <p className="mt-1 text-sm text-slate-600">These actions are not connected to backend logic yet.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          </div>
        </div>
      ),
    });

  return (
    <div className="min-h-screen bg-[#E3F1EF]">
      <UdeetsHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <aside className="space-y-6 lg:col-span-3 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
            <section className={cn(CARD, "overflow-hidden")}>
              <div className="p-4">
                <div className="relative aspect-[4/4.2] overflow-hidden rounded-[1.6rem]">
                  <div className="absolute inset-0">
                    <input
                      ref={dpInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMediaFileChange("dp")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => openMediaChooser("dp")}
                      disabled={!isCreatorAdmin || isUploadingDp}
                      className={cn(
                        "group relative h-full w-full overflow-hidden rounded-[1.6rem] bg-[#A9D1CA] shadow-sm",
                        isCreatorAdmin && "cursor-pointer"
                      )}
                    >
                      {dpImageSrc ? (
                        <ImageWithFallback
                          src={dpImageSrc}
                          sources={[dpImageSrc]}
                          alt={`${hubName} display`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-2xl font-semibold text-[#111111]"
                          fallback={initials(hubName)}
                        />
                      ) : (
                        <MediaEmptyState />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-[#A9D1CA] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CategoryIcon className="h-4.5 w-4.5 shrink-0 stroke-[1.9] text-white" />
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                      {categoryMeta.label}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#111111]">
                    {settingsVisibility}
                  </span>
                </div>
                <h1 className="mt-2 text-lg font-serif font-semibold tracking-tight text-[#111111]">{hubName}</h1>
                <div className="mt-3 flex items-center gap-4 text-[#111111]">
                  <button
                    type="button"
                    onClick={() => setActivePanel("settings")}
                    className={ACTION_ICON_BUTTON}
                    aria-label="Hub settings"
                    title="Hub settings"
                  >
                    <Settings className={ACTION_ICON} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel("challenges")}
                    className={ACTION_ICON_BUTTON}
                    aria-label="Challenges"
                    title="Challenges"
                  >
                    <Target className={ACTION_ICON} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openCenterMembers("list")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#111111]/78 transition hover:text-[#0C5C57]"
                    aria-label="Members"
                    title="Members"
                  >
                    <UsersRound className={ACTION_ICON} />
                    <span>{memberCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCenterMembers("invite")}
                    className={ACTION_ICON_BUTTON}
                    aria-label="Invite members"
                    title="Invite members"
                  >
                    <UserPlus className={ACTION_ICON} />
                  </button>
                </div>
              </div>
            </section>

            <section className={cn(CARD, "p-6")}>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleMediaFileChange("gallery")}
                className="hidden"
              />
              <h2 className="text-sm font-semibold tracking-tight text-[#111111]">Recent Photos</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {recentPhotos.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => isCreatorAdmin && galleryInputRef.current?.click()}
                    disabled={!isCreatorAdmin || isUploadingGallery}
                    className={cn("aspect-square overflow-hidden rounded-2xl", isCreatorAdmin && "cursor-pointer")}
                    style={{ backgroundColor: EMPTY_MEDIA_BG }}
                  >
                    <MediaEmptyState square />
                  </button>
                ) : (
                  recentPhotos.map((img, index) => (
                    <div
                      key={`${img}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ring-2 ring-white"
                    >
                      <button
                        type="button"
                        className="h-full w-full"
                        onClick={() =>
                          openViewer(recentPhotos, index, `${hubName} Photo`, "Recent photo from this hub.")
                        }
                      >
                        <ImageWithFallback
                          src={img}
                          sources={[img, ...recentPhotos.filter((photo) => photo !== img)]}
                          alt={`${hubName} photo ${index + 1}`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-[11px] font-medium text-[#0C5C57]"
                          fallback="Photo"
                          loading="lazy"
                        />
                      </button>
                      {isCreatorAdmin && index === 0 ? (
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/92 text-[#0C5C57] shadow-sm transition hover:bg-white"
                          aria-label="Add another photo"
                        >
                          {isUploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={cn(CARD, "p-6")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold tracking-tight text-[#111111]">Connect</h2>
                {isCreatorAdmin ? (
                  <button
                    type="button"
                    onClick={openConnectEditor}
                    className={ACTION_ICON_BUTTON}
                    aria-label="Edit connect links"
                    title="Edit connect links"
                  >
                    <Settings className={ACTION_ICON} />
                  </button>
                ) : null}
              </div>
              <div className="mt-4 space-y-2.5 text-sm text-slate-600">
                {[
                  { icon: Globe, label: "Website", value: connectLinks.website, alwaysVisible: true, href: connectLinks.website || "#" },
                  { icon: Facebook, label: "Facebook", value: connectLinks.facebook, href: connectLinks.facebook },
                  { icon: Instagram, label: "Instagram", value: connectLinks.instagram, href: connectLinks.instagram },
                  { icon: Youtube, label: "YouTube", value: connectLinks.youtube, href: connectLinks.youtube },
                  { icon: Phone, label: "Phone", value: connectLinks.phone, href: connectLinks.phone ? `tel:${connectLinks.phone}` : undefined },
                ]
                  .filter((item) => item.alwaysVisible || item.value)
                  .map(({ icon: LinkIcon, label, value, href, alwaysVisible }) =>
                  value ? (
                    <a
                      key={label}
                      href={href}
                      target={label === "Phone" ? undefined : "_blank"}
                      rel={label === "Phone" ? undefined : "noreferrer"}
                      className="flex items-center gap-3 rounded-2xl px-1 py-1.5 transition hover:text-[#0C5C57]"
                    >
                      <LinkIcon className={ICON} />
                      <span className="truncate">{label === "Phone" ? value : displayLinkValue(value)}</span>
                    </a>
                  ) : (
                    <div key={label} className="flex items-center gap-3 rounded-2xl px-1 py-1.5 text-slate-400">
                      <LinkIcon className={ICON} />
                      {alwaysVisible ? <span className="truncate italic">Not added yet</span> : null}
                    </div>
                  )
                )}
              </div>
              {connectSuccess ? <p className="mt-4 text-xs font-medium text-[#0C5C57]">{connectSuccess}</p> : null}
              {connectError ? <p className="mt-4 text-xs font-medium text-[#B42318]">{connectError}</p> : null}
            </section>
          </aside>

          <section className="lg:col-span-9">
            <section className={cn(CARD, "overflow-hidden")}>
              <div className="relative aspect-[16/6] w-full bg-slate-100">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMediaFileChange("cover")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => openMediaChooser("cover")}
                  disabled={!isCreatorAdmin || isUploadingCover}
                  className={cn("h-full w-full", isCreatorAdmin && "cursor-pointer")}
                  style={!coverImageSrc ? { backgroundColor: EMPTY_MEDIA_BG } : undefined}
                >
                  {coverImageSrc ? (
                    <ImageWithFallback
                      src={coverImageSrc}
                      sources={[coverImageSrc]}
                      alt={`${hubName} cover`}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-sm font-medium text-[#0C5C57]"
                      fallback="Cover photo"
                    />
                  ) : (
                    <MediaEmptyState />
                  )}
                </button>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{hub.category.replace(/-/g, " ")}</p>
                    <h2 className="mt-2 text-2xl font-serif font-semibold tracking-tight text-[#111111]">
                      {hubTagline}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                      {hub.intro || settingsDescription || hub.description}
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
            {mediaSuccess ? <p className="mt-3 text-sm font-medium text-[#0C5C57]">{mediaSuccess}</p> : null}
            {mediaError ? <p className="mt-3 text-sm font-medium text-[#B42318]">{mediaError}</p> : null}
          </section>

          <section className="space-y-6 lg:col-span-6">
            <section className={cn(CARD, "p-2")}>
              <div className="grid grid-cols-5 items-center gap-1">
                {HUB_TABS.map((tab) => (
                  <div key={tab} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePanel("posts");
                        setActiveSection(tab);
                        if (tab === "Members") {
                          setMembersPanelMode("list");
                        }
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
            {activePanel === "members" ? renderMembersTab() : null}
            {activePanel === "invite" ? renderMembersTab() : null}
          </section>

          <aside className="space-y-4 lg:col-span-3 lg:self-start lg:sticky lg:top-24">
            <section className={cn(CARD, "p-4")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-tight text-[#111111]">Hub Notifications</h2>
                <Bell className={ICON} />
              </div>
              <div className="mt-3 space-y-2">
                {hubContent.notifications.length ? (
                  hubContent.notifications.map((notification) => (
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
                  ))
                ) : (
                  <p className="text-sm leading-relaxed text-slate-500">No notifications yet for this hub.</p>
                )}
              </div>
            </section>

            <section className={cn(CARD, "p-4")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-tight text-[#111111]">Upcoming Events</h2>
                <CalendarDays className={ICON} />
              </div>
              <div className="mt-3 space-y-2">
                {hubContent.events.length ? (
                  hubContent.events.map((event) => (
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
                  ))
                ) : (
                  <p className="text-sm leading-relaxed text-slate-500">No events are published for this hub yet.</p>
                )}
              </div>
            </section>

            <section className={cn(CARD, "p-5")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-tight text-[#111111]">Hub Admins</h2>
                {isCreatorAdmin ? (
                  <button
                    type="button"
                    onClick={() => setIsAdminsEditorOpen(true)}
                    className={ACTION_ICON_BUTTON}
                    aria-label="Manage hub admins"
                    title="Manage hub admins"
                  >
                    <Settings className={ACTION_ICON} />
                  </button>
                ) : null}
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                    <ImageWithFallback
                      src={creatorAvatarSrc}
                      sources={[creatorAvatarSrc, ...adminImages, dpImageSrc, coverImageSrc, ...recentPhotos]}
                      alt={creatorDisplayName}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                      fallback={initials(creatorDisplayName)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-tight text-[#111111]">{creatorDisplayName}</p>
                    <p className="text-xs text-slate-500">{creatorDetail}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  {status === "loading"
                    ? "Loading admin details..."
                    : isCreatorAdmin
                      ? "You are the first Hub Admin because you created this hub."
                      : "The hub creator is the first admin for now."}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {!isDemoPreview ? <UdeetsFooter /> : null}
      {!isDemoPreview ? <UdeetsBottomNav activeNav="home" /> : null}

      {mediaChooserTarget ? (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-semibold tracking-tight text-[#111111]">
                  {mediaChooserTarget === "dp" ? "Change Display Picture" : "Change Cover Image"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">Choose an existing album photo or upload a new one.</p>
              </div>
              <button
                type="button"
                onClick={closeMediaChooser}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close media chooser"
              >
                <X className={ICON} />
              </button>
            </div>

            {!isAlbumPickerOpen ? (
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleChooseFromAlbums}
                  disabled={!albumChoices.length}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                    albumChoices.length
                      ? "border-slate-200 text-[#111111] hover:border-[#A9D1CA] hover:bg-[#F7FBFA]"
                      : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                  )}
                >
                  <span>Choose from Albums</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {albumChoices.length ? `${albumChoices.length} photos` : "No album photos yet"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleChooseFromDevice}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-[#111111] transition hover:border-[#A9D1CA] hover:bg-[#F7FBFA]"
                >
                  <span>Upload from Device</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Device</span>
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <div className="grid grid-cols-3 gap-3">
                  {albumChoices.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => void handleAlbumImageSelect(imageUrl)}
                      className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition hover:border-[#A9D1CA]"
                    >
                      <ImageWithFallback
                        src={imageUrl}
                        sources={[imageUrl]}
                        alt={`Album photo ${index + 1}`}
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center"
                        fallback={<Plus className="h-7 w-7 stroke-[1.9] text-white/75" />}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-between gap-3">
                  <button type="button" onClick={() => setIsAlbumPickerOpen(false)} className={BUTTON_SECONDARY}>
                    Back
                  </button>
                  <button type="button" onClick={handleChooseFromDevice} className={BUTTON_PRIMARY}>
                    Upload from Device
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {composerToolTarget ? (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-semibold tracking-tight text-[#111111]">
                  {composerToolTarget === "photo" ? "Add photo" : null}
                  {composerToolTarget === "file" ? "Attach file" : null}
                  {composerToolTarget === "poll" ? "Create poll" : null}
                  {composerToolTarget === "event" ? "Create event" : null}
                  {composerToolTarget === "location" ? "Add location" : null}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {composerToolTarget === "photo" ? "Photo posting can plug into this composer next." : null}
                  {composerToolTarget === "file" ? "File sharing can be added here as the backend is expanded." : null}
                  {composerToolTarget === "poll" ? "Poll creation can live here when post interactions are wired." : null}
                  {composerToolTarget === "event" ? "Event creation can open from here into the hub feed workflow." : null}
                  {composerToolTarget === "location" ? "Location tagging can be added here for local updates and meetups." : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposerToolTarget(null)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close composer tool"
              >
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setComposerToolTarget(null)} className={BUTTON_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

      {isConnectEditorOpen ? (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-semibold tracking-tight text-[#111111]">Edit Connect</h3>
                <p className="mt-1 text-sm text-slate-600">Add or update the links shown in this section.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectEditorOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close connect editor"
              >
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <SettingField label="Website">
                <input
                  value={connectDraft.website}
                  onChange={handleConnectChange("website")}
                  placeholder="https://yourhub.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </SettingField>
              <SettingField label="Facebook">
                <input
                  value={connectDraft.facebook}
                  onChange={handleConnectChange("facebook")}
                  placeholder="facebook.com/yourhub"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </SettingField>
              <SettingField label="Instagram">
                <input
                  value={connectDraft.instagram}
                  onChange={handleConnectChange("instagram")}
                  placeholder="instagram.com/yourhub"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </SettingField>
              <SettingField label="YouTube">
                <input
                  value={connectDraft.youtube}
                  onChange={handleConnectChange("youtube")}
                  placeholder="youtube.com/@yourhub"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </SettingField>
              <SettingField label="Phone / Contact">
                <input
                  value={connectDraft.phone}
                  onChange={handleConnectChange("phone")}
                  placeholder="(555) 555-5555"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </SettingField>
            </div>

            {connectError ? <p className="mt-4 text-sm text-[#B42318]">{connectError}</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setIsConnectEditorOpen(false)} className={BUTTON_SECONDARY}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConnect}
                disabled={isSavingConnect}
                className={cn(BUTTON_PRIMARY, isSavingConnect && "cursor-not-allowed opacity-75")}
              >
                {isSavingConnect ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Save links"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminsEditorOpen ? (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-semibold tracking-tight text-[#111111]">Hub Admin Tools</h3>
                <p className="mt-1 text-sm text-slate-600">This is a simple first pass for future admin management.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminsEditorOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close admin tools"
              >
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {["Add moderators", "Add users", "Create groups"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-[#111111] transition hover:border-[#A9D1CA] hover:bg-[#F7FBFA]"
                >
                  <span>{label}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Soon</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setIsAdminsEditorOpen(false)} className={BUTTON_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
