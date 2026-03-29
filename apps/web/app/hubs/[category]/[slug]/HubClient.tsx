/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  Target,
  X,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import type { HubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";
import { createStoredDeet, getHubStoredDeets, storedDeetToHubFeedItem, subscribeToStoredDeets } from "@/lib/deets-store";
import { updateHub } from "@/lib/services/hubs/update-hub";
import { uploadHubMedia } from "@/lib/services/hubs/upload-hub-media";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { HubHeroHeader } from "./components/HubHeroHeader";
import { HubTabBar } from "./components/HubTabBar";
import { AboutSection } from "./components/sections/AboutSection";
import { AdminsSection } from "./components/sections/AdminsSection";
import { DeetsSection } from "./components/sections/DeetsSection";
import { EventsSection } from "./components/sections/EventsSection";
import { FilesSection } from "./components/sections/FilesSection";
import { MembersSection } from "./components/sections/MembersSection";
import { PhotosSection } from "./components/sections/PhotosSection";
import { SettingsSection } from "./components/sections/SettingsSection";
import { CreateDeetModal } from "./components/deets/CreateDeetModal";
import { DeetChildModal } from "./components/deets/DeetChildModal";
import { DeetSettingsModal } from "./components/deets/DeetSettingsModal";
import type { AttachedDeetItem, ComposerChildFlow, DeetFormattingState, DeetSettingsState } from "./components/deets/deetTypes";
import type { ConnectLinks, HubPanel, HubTab, PendingNavigation, ViewerState } from "./components/hubTypes";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  HUB_TABS,
  ICON,
  ImageWithFallback,
  SettingField,
  categoryMetaFor,
  cn,
  compactId,
  normalizePublicSrc,
} from "./components/hubUtils";
import { SectionShell } from "./components/SectionShell";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image preview could not be created."));
    };
    reader.onerror = () => reject(new Error("Image preview could not be created."));
    reader.readAsDataURL(file);
  });
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
  const hubContent = useMemo<HubContent>(() => ({ hubId: hub.id, feed: [], events: [], notifications: [] }), [hub.id]);

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerState>({ open: false, images: [], index: 0, title: "", body: "", focusId: undefined });

  const hubBaseHref = `/hubs/${hub.category}/${hub.slug}`;
  const focusTarget = searchParams.get("focus");
  const requestedTab = searchParams.get("tab") as HubTab | null;
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const demoHubName = searchParams.get("demo_name")?.trim();
  const demoHubDescription = searchParams.get("demo_description")?.trim();
  const demoComposerText = searchParams.get("demo_composer") ?? "";
  const demoPostedText = searchParams.get("demo_posted") ?? "";
  const demoPollEnabled = searchParams.get("demo_poll") === "1";
  const demoPollVote = searchParams.get("demo_poll_vote");
  const demoLiked = searchParams.get("demo_liked") === "1";

  const initialActiveSection: HubTab = requestedTab && HUB_TABS.includes(requestedTab) ? requestedTab : "About";
  const [activeSection, setActiveSection] = useState<HubTab>(initialActiveSection);
  const [activePanel, setActivePanel] = useState<HubPanel>("posts");
  const [membersPanelMode, setMembersPanelMode] = useState<"list" | "invite">("list");

  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<"Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos">("Newest");
  const [isFeedSearchOpen, setIsFeedSearchOpen] = useState(false);
  const [isFeedFilterOpen, setIsFeedFilterOpen] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [activeComposerChild, setActiveComposerChild] = useState<ComposerChildFlow | null>(null);
  const [attachedDeetItems, setAttachedDeetItems] = useState<AttachedDeetItem[]>([]);
  const [selectedPhotoPreviews, setSelectedPhotoPreviews] = useState<string[]>([]);
  const [publishedDeets, setPublishedDeets] = useState<HubContent["feed"]>([]);
  const [modalDraftText, setModalDraftText] = useState("");
  const [isSubmittingDeet, setIsSubmittingDeet] = useState(false);
  const [deetFormatting, setDeetFormatting] = useState<DeetFormattingState>({
    fontSize: "small",
    bold: false,
    italic: false,
    underline: false,
    textColor: "#111111",
  });
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [deetSettings, setDeetSettings] = useState<DeetSettingsState>({ noticeEnabled: false, commentsEnabled: true });

  const initialHubName = demoHubName || hub.name;
  const hubDescription = demoHubDescription || hub.description;
  const [savedHubName, setSavedHubName] = useState(initialHubName);
  const [savedHubCategory, setSavedHubCategory] = useState<HubRecord["category"]>(hub.category);
  const hubName = savedHubName;
  const [settingsHubName, setSettingsHubName] = useState(initialHubName);
  const [settingsCategory, setSettingsCategory] = useState<HubRecord["category"]>(hub.category);
  const [settingsDescription, setSettingsDescription] = useState(hubDescription);
  const [settingsLocation, setSettingsLocation] = useState(hub.locationLabel);
  const [settingsVisibility, setSettingsVisibility] = useState<HubRecord["visibility"]>(hub.visibility);
  const [settingsDiscoverable, setSettingsDiscoverable] = useState("discoverable" in hub ? Boolean((hub as HubRecord & { discoverable?: boolean }).discoverable) : true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [approvalSetting, setApprovalSetting] = useState(settingsVisibility === "Private" ? "Required" : "Open");
  const [whoCanPost, setWhoCanPost] = useState("Admins and members");
  const [whoCanUpload, setWhoCanUpload] = useState("Admins and members");
  const [isConnectEditorOpen, setIsConnectEditorOpen] = useState(false);
  const [isAdminsEditorOpen, setIsAdminsEditorOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [isUnsavedChangesOpen, setIsUnsavedChangesOpen] = useState(false);
  const [isSavingConnect, setIsSavingConnect] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [connectLinks, setConnectLinks] = useState<ConnectLinks>({
    website: hub.website ?? "",
    facebook: hub.facebookUrl ?? "",
    instagram: hub.instagramUrl ?? "",
    youtube: hub.youtubeUrl ?? "",
    phone: hub.phoneNumber ?? "",
  });
  const [connectDraft, setConnectDraft] = useState<ConnectLinks>({
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
  const [galleryImages, setGalleryImages] = useState(() => (hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean));

  const dpInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const deetPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const recentPhotos = galleryImages.slice(0, 6);
  const displayCoverImageSrc = galleryImages.find((image) => image && image !== coverImageSrc) || coverImageSrc;
  const adminImages = (hub.adminImages ?? []).map(normalizePublicSrc).filter(Boolean);
  const isCreatorAdmin = Boolean(user?.id && hub.createdBy && user.id === hub.createdBy);
  const canAccessAdmins = isCreatorAdmin;
  const creatorMetadata = user?.user_metadata;
  const creatorDisplayName = isCreatorAdmin ? creatorMetadata?.full_name || creatorMetadata?.name || user?.email || "You" : "Hub Creator";
  const creatorDetail = isCreatorAdmin ? user?.email || "Admin" : hub.createdBy ? `Admin • ${compactId(hub.createdBy)}` : "Admin";
  const creatorAvatarSrc = isCreatorAdmin && typeof creatorMetadata?.avatar_url === "string" ? creatorMetadata.avatar_url : "";
  const albumChoices = galleryImages.filter((image) => image !== dpImageSrc && image !== coverImageSrc);
  const categoryMeta = categoryMetaFor(savedHubCategory);
  const CategoryIcon = categoryMeta.icon;
  const memberCount = Math.max(1, Number.parseInt(hub.membersLabel, 10) || 0);
  const headerHubName = hub.name?.trim() || hubName;
  const visibleTabs = canAccessAdmins ? HUB_TABS : HUB_TABS.filter((tab) => tab !== "Admins");
  const allFeedItems = [...publishedDeets, ...hubContent.feed];
  const feedItemCount = allFeedItems.length;
  const totalEngagement = allFeedItems.reduce((sum, item) => sum + item.likes + item.comments, 0);
  const totalViews = allFeedItems.reduce((sum, item) => sum + item.views, 0);
  const announcementCount = allFeedItems.filter((item) => item.kind === "announcement" || item.kind === "notice").length;
  const photoDeetCount = allFeedItems.filter((item) => item.kind === "photo").length;
  const activeAdminCount = 1;
  const knownActivityCount = feedItemCount + hubContent.events.length + recentPhotos.length;
  const isDirty = settingsHubName.trim() !== savedHubName.trim() || settingsCategory !== savedHubCategory;
  const fileItems: string[] = [];
  const memberItems: string[] = [];
  const memberRoleItems: Array<{ name: string; role: string }> = [];

  const isComposerDirty =
    modalDraftText.trim().length > 0 ||
    attachedDeetItems.length > 0 ||
    selectedPhotoPreviews.length > 0 ||
    deetSettings.noticeEnabled ||
    !deetSettings.commentsEnabled;

  useEffect(() => {
    const syncDeets = () => {
      setPublishedDeets(getHubStoredDeets(hub.id).map(storedDeetToHubFeedItem));
    };

    syncDeets();
    return subscribeToStoredDeets(() => syncDeets());
  }, [hub.id]);

  useEffect(() => {
    setConnectLinks({ website: hub.website ?? "", facebook: hub.facebookUrl ?? "", instagram: hub.instagramUrl ?? "", youtube: hub.youtubeUrl ?? "", phone: hub.phoneNumber ?? "" });
    setConnectDraft({ website: hub.website ?? "", facebook: hub.facebookUrl ?? "", instagram: hub.instagramUrl ?? "", youtube: hub.youtubeUrl ?? "", phone: hub.phoneNumber ?? "" });
  }, [hub.facebookUrl, hub.instagramUrl, hub.phoneNumber, hub.website, hub.youtubeUrl]);

  useEffect(() => {
    if (!canAccessAdmins && activeSection === "Admins") setActiveSection("About");
  }, [activeSection, canAccessAdmins]);

  useEffect(() => {
    if (!composerOpen) return;

    setModalDraftText(demoComposerText);
    setDeetFormatting({ fontSize: "small", bold: false, italic: false, underline: false, textColor: "#111111" });
    setIsFontSizeMenuOpen(false);
    setAttachedDeetItems([]);
    setSelectedPhotoPreviews([]);
    setDeetSettings({ noticeEnabled: false, commentsEnabled: true });
  }, [composerOpen, demoComposerText]);

  useEffect(() => {
    if (!composerOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isSubmittingDeet) return;
      if (activeComposerChild && activeComposerChild !== "quit_confirm") {
        setActiveComposerChild(null);
        return;
      }
      if (isComposerDirty) {
        setActiveComposerChild("quit_confirm");
        return;
      }
      setComposerOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeComposerChild, composerOpen, isComposerDirty, isSubmittingDeet]);

  useEffect(() => {
    setSavedHubName(initialHubName);
    setSettingsHubName(initialHubName);
    setSavedHubCategory(hub.category);
    setSettingsCategory(hub.category);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
  }, [hub.category, initialHubName]);

  useEffect(() => {
    setDpImageSrc(normalizePublicSrc(hub.dpImage));
    setCoverImageSrc(normalizePublicSrc(hub.heroImage));
    setGalleryImages((hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean));
  }, [hub.dpImage, hub.galleryImages, hub.heroImage]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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
    setViewer({ open: true, images, index, title, body, focusId });
  };

  const closeViewer = () => setViewer((current) => ({ ...current, open: false }));
  const nextViewerImage = () => setViewer((current) => ({ ...current, index: (current.index + 1) % current.images.length }));
  const prevViewerImage = () => setViewer((current) => ({ ...current, index: current.index === 0 ? current.images.length - 1 : current.index - 1 }));

  const applyNavigation = ({ tab, panel, membersMode }: PendingNavigation) => {
    setActiveSection(tab);
    if (membersMode) setMembersPanelMode(membersMode);
    setActivePanel(panel);
  };

  const requestNavigation = (next: PendingNavigation) => {
    const sameSection = activeSection === next.tab;
    const samePanel = activePanel === next.panel;
    const sameMembersMode = next.membersMode ? membersPanelMode === next.membersMode : true;
    if (sameSection && samePanel && sameMembersMode) return;
    if (isDirty) {
      setPendingNavigation(next);
      setIsUnsavedChangesOpen(true);
      return;
    }
    applyNavigation(next);
  };

  const navigateToFocus = (focusId: string, tab?: HubTab) => {
    const params = new URLSearchParams();
    params.set("focus", focusId);
    if (tab) params.set("tab", tab);
    router.push(`${hubBaseHref}?${params.toString()}`, { scroll: false });
    if (tab) setActiveSection(tab);
  };

  const handleConnectChange = (field: keyof ConnectLinks) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setConnectDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSaveSettings = async () => {
    if (!isCreatorAdmin || !isDirty) return;
    setIsSavingSettings(true);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
    try {
      const updatedHub = await updateHub(hub.id, { name: settingsHubName, category: settingsCategory });
      setSavedHubName(updatedHub.name);
      setSettingsHubName(updatedHub.name);
      setSavedHubCategory(updatedHub.category);
      setSettingsCategory(updatedHub.category);
      setSettingsSaveSuccess("Hub settings saved.");
      if (pendingNavigation) {
        applyNavigation(pendingNavigation);
        setPendingNavigation(null);
        setIsUnsavedChangesOpen(false);
      }
    } catch (error) {
      setSettingsSaveError(error instanceof Error ? error.message : "Hub settings could not be saved.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCancelSettingsChanges = () => {
    setSettingsHubName(savedHubName);
    setSettingsCategory(savedHubCategory);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
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
      const uploadedUrl = await uploadHubMedia({ file, slug: hub.slug, kind });
      const nextGallery = kind === "gallery" ? [...galleryImages, uploadedUrl] : galleryImages;
      const updatedHub = await updateHub(hub.id, {
        dpImageUrl: kind === "dp" ? uploadedUrl : undefined,
        coverImageUrl: kind === "cover" ? uploadedUrl : undefined,
        galleryImageUrls: kind === "gallery" ? nextGallery : undefined,
      });
      setDpImageSrc(normalizePublicSrc(updatedHub.dp_image_url || undefined));
      setCoverImageSrc(normalizePublicSrc(updatedHub.cover_image_url || undefined));
      setGalleryImages((updatedHub.gallery_image_urls ?? []).map(normalizePublicSrc).filter(Boolean));
      setMediaSuccess(kind === "gallery" ? "Recent photos updated." : kind === "dp" ? "Display picture updated." : "Cover image updated.");
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Hub media could not be updated.");
    } finally {
      if (kind === "dp") setIsUploadingDp(false);
      if (kind === "cover") setIsUploadingCover(false);
      if (kind === "gallery") setIsUploadingGallery(false);
    }
  };

  const handleMediaFileChange = (kind: "dp" | "cover" | "gallery") => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleMediaUpload(kind, file);
  };

  const openCenterMembers = (mode: "list" | "invite") => {
    requestNavigation({ tab: "Members", panel: mode === "invite" ? "invite" : "members", membersMode: mode });
  };

  const normalizedPostSearch = postSearchQuery.trim().toLowerCase();
  const searchedFeedItems = allFeedItems.filter((item) => {
    if (!normalizedPostSearch) return true;
    return [item.title, item.body, item.author, item.time].some((value) => value.toLowerCase().includes(normalizedPostSearch));
  });
  const filteredFeedItems = searchedFeedItems.filter((item) => {
    if (feedFilter === "Newest" || feedFilter === "Oldest") return true;
    if (feedFilter === "Announcements") return item.kind === "announcement" || item.kind === "notice";
    if (feedFilter === "Events") return item.kind === "event";
    if (feedFilter === "Photos") return item.kind === "photo";
    return false;
  });
  const showDemoPostedText = feedFilter !== "Events" && feedFilter !== "Polls" && feedFilter !== "Photos" && Boolean(demoPostedText) && (!normalizedPostSearch || demoPostedText.toLowerCase().includes(normalizedPostSearch));
  const demoPollSearchText = "free pet check-up in mechanicsville would you attend the complimentary pet wellness check this saturday";
  const showDemoPoll = (feedFilter === "Newest" || feedFilter === "Oldest" || feedFilter === "Polls" || feedFilter === "Events") && demoPollEnabled && (!normalizedPostSearch || demoPollSearchText.includes(normalizedPostSearch));

  const openMediaChooser = (target: "dp" | "cover") => {
    if (!isCreatorAdmin) return;
    setMediaChooserTarget(target);
    setIsAlbumPickerOpen(false);
    setMediaError(null);
  };

  const closeMediaChooser = () => {
    setMediaChooserTarget(null);
    setIsAlbumPickerOpen(false);
  };

  const handleChooseFromDevice = () => {
    if (!mediaChooserTarget) return;
    closeMediaChooser();
    if (mediaChooserTarget === "dp") {
      dpInputRef.current?.click();
      return;
    }
    coverInputRef.current?.click();
  };

  const handleChooseFromAlbums = () => {
    if (!albumChoices.length) return;
    setIsAlbumPickerOpen(true);
  };

  const handleAlbumImageSelect = async (imageUrl: string) => {
    if (!mediaChooserTarget) return;
    setMediaError(null);
    setMediaSuccess(null);
    if (mediaChooserTarget === "dp") setIsUploadingDp(true);
    else setIsUploadingCover(true);

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

  const openDeetComposer = (child: ComposerChildFlow | null = null) => {
    if (!isCreatorAdmin) return;
    setComposerOpen(true);
    setActiveComposerChild(child);
  };

  const resetDeetComposer = () => {
    setComposerOpen(false);
    setActiveComposerChild(null);
    setAttachedDeetItems([]);
    setSelectedPhotoPreviews([]);
    setModalDraftText("");
    setIsFontSizeMenuOpen(false);
    setDeetFormatting({ fontSize: "small", bold: false, italic: false, underline: false, textColor: "#111111" });
    setDeetSettings({ noticeEnabled: false, commentsEnabled: true });
  };

  const closeDeetComposer = () => {
    if (isSubmittingDeet) return;
    if (isComposerDirty) {
      setActiveComposerChild("quit_confirm");
      return;
    }
    setComposerOpen(false);
    setActiveComposerChild(null);
  };

  const discardDeetComposer = () => {
    if (isSubmittingDeet) return;
    resetDeetComposer();
  };

  const attachDeetItem = (item: Omit<AttachedDeetItem, "id">) => {
    setAttachedDeetItems((current) => [...current, { id: `${item.type}-${Date.now()}-${current.length}`, ...item }]);
    setActiveComposerChild(null);
  };

  const handleDeetPhotoFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (!files.length) return;

    try {
      const previews = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setSelectedPhotoPreviews((current) => [...current, ...previews]);
    } catch {
      setActiveComposerChild(null);
    }
  };

  const handleSubmitDeet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingDeet) return;

    const trimmedText = modalDraftText.trim();
    const hasContent = Boolean(trimmedText || attachedDeetItems.length || selectedPhotoPreviews.length);
    if (!hasContent) return;

    setIsSubmittingDeet(true);

    try {
      const photoAttachment = attachedDeetItems.find((item) => item.type === "photo" && item.previews?.length);
      const syntheticPhotoAttachment =
        !photoAttachment && selectedPhotoPreviews.length
          ? {
              type: "photo" as const,
              title: selectedPhotoPreviews.length === 1 ? "1 photo attached" : `${selectedPhotoPreviews.length} photos attached`,
              detail: "Ready to post in this deet.",
              previews: selectedPhotoPreviews,
            }
          : null;
      const finalAttachments = [
        ...attachedDeetItems,
        ...(syntheticPhotoAttachment ? [syntheticPhotoAttachment] : []),
      ];
      const primaryImage = photoAttachment?.previews?.[0] || selectedPhotoPreviews[0];
      const newestSticker = [...attachedDeetItems].reverse().find((item) => item.type === "sticker" && item.detail);
      const authorName =
        creatorMetadata?.full_name ||
        creatorMetadata?.name ||
        user?.email?.split("@")[0] ||
        "You";

      createStoredDeet({
        hubId: hub.id,
        hubSlug: hub.slug,
        hubHref: `/hubs/${hub.category}/${hub.slug}`,
        hubName: headerHubName,
        category: hub.category,
        authorName,
        title: deetSettings.noticeEnabled ? "Notice" : primaryImage ? "Photo" : "Deet",
        body: trimmedText || newestSticker?.detail || "Shared a new update.",
        kind: deetSettings.noticeEnabled ? "Notices" : primaryImage ? "Photos" : "Posts",
        image: primaryImage,
        attachments: finalAttachments.map((item) => ({
          type: item.type,
          title: item.title,
          detail: item.detail,
          previews: item.previews,
        })),
      });
      resetDeetComposer();
    } finally {
      setIsSubmittingDeet(false);
    }
  };

  const renderMainContent = () => {
    if (activeSection === "Events") {
      return <EventsSection events={hubContent.events} highlightedItemId={highlightedItemId} onViewEventUpdate={(focusId) => navigateToFocus(focusId, "Posts")} />;
    }
    if (activeSection === "Members") {
      return <MembersSection membersPanelMode={membersPanelMode} memberItems={memberItems} onInviteMembers={() => openCenterMembers("invite")} />;
    }
    if (activeSection === "About") {
      return (
        <AboutSection
          CategoryIcon={CategoryIcon}
          categoryLabel={categoryMeta.label}
          hubName={hubName}
          hubDescription={hubDescription}
          settingsVisibility={settingsVisibility}
          memberCount={memberCount}
          settingsLocation={settingsLocation}
          hubLocationLabel={hub.locationLabel}
          connectLinks={connectLinks}
          isCreatorAdmin={isCreatorAdmin}
          onOpenConnectEditor={openConnectEditor}
          connectSuccess={connectSuccess}
          connectError={connectError}
          isUploadingGallery={isUploadingGallery}
          onOpenGalleryUpload={() => galleryInputRef.current?.click()}
          galleryInputRef={galleryInputRef}
          onGalleryChange={handleMediaFileChange("gallery")}
          recentPhotos={recentPhotos}
          creatorAvatarSrc={creatorAvatarSrc}
          creatorDisplayName={creatorDisplayName}
          creatorDetail={creatorDetail}
          status={status}
          isAdminsEditorOpen={isAdminsEditorOpen}
          onOpenAdminsEditor={() => setIsAdminsEditorOpen(true)}
          adminImages={adminImages}
          dpImageSrc={dpImageSrc}
          coverImageSrc={coverImageSrc}
        />
      );
    }
    if (activeSection === "Photos") {
      return <PhotosSection recentPhotos={recentPhotos} hubName={hubName} onOpenViewer={openViewer} />;
    }
    if (activeSection === "Files") {
      return <FilesSection fileItems={fileItems} />;
    }
    if (activeSection === "Admins") {
      return canAccessAdmins ? (
        <AdminsSection
          headerHubName={headerHubName}
          memberCount={memberCount}
          knownActivityCount={knownActivityCount}
          feedItemCount={feedItemCount}
          announcementCount={announcementCount}
          photoDeetCount={photoDeetCount}
          totalViews={totalViews}
          totalEngagement={totalEngagement}
          activeAdminCount={activeAdminCount}
          eventCount={hubContent.events.length}
          recentPhotoCount={recentPhotos.length}
          onInviteMembers={() => openCenterMembers("invite")}
          onOpenSettings={() => requestNavigation({ tab: "Settings", panel: "settings" })}
          onOpenAdminsEditor={() => setIsAdminsEditorOpen(true)}
          onOpenPosts={() => setActiveSection("Posts")}
        />
      ) : null;
    }
    if (activeSection === "Settings") {
      return (
        <SettingsSection
          isDirty={isDirty}
          isSavingSettings={isSavingSettings}
          isCreatorAdmin={isCreatorAdmin}
          onCancel={handleCancelSettingsChanges}
          onSave={() => void handleSaveSettings()}
          dpImageSrc={dpImageSrc}
          coverImageSrc={coverImageSrc}
          settingsHubName={settingsHubName}
          onSettingsHubNameChange={(value) => {
            setSettingsHubName(value);
            setSettingsSaveError(null);
            setSettingsSaveSuccess(null);
          }}
          settingsDescription={settingsDescription}
          onSettingsDescriptionChange={setSettingsDescription}
          settingsCategory={settingsCategory}
          onSettingsCategoryChange={(value) => {
            setSettingsCategory(value);
            setSettingsSaveError(null);
            setSettingsSaveSuccess(null);
          }}
          settingsLocation={settingsLocation}
          onSettingsLocationChange={setSettingsLocation}
          settingsVisibility={settingsVisibility}
          onSettingsVisibilityChange={setSettingsVisibility}
          settingsDiscoverable={settingsDiscoverable}
          onSettingsDiscoverableChange={setSettingsDiscoverable}
          notificationsEnabled={notificationsEnabled}
          onNotificationsEnabledChange={setNotificationsEnabled}
          memberRoleItems={memberRoleItems}
          approvalSetting={approvalSetting}
          onApprovalSettingChange={setApprovalSetting}
          whoCanPost={whoCanPost}
          onWhoCanPostChange={setWhoCanPost}
          whoCanUpload={whoCanUpload}
          onWhoCanUploadChange={setWhoCanUpload}
          settingsSaveSuccess={settingsSaveSuccess}
          settingsSaveError={settingsSaveError}
        />
      );
    }
    return (
      <DeetsSection
        normalizedPostSearch={normalizedPostSearch}
        postSearchQuery={postSearchQuery}
        onPostSearchQueryChange={setPostSearchQuery}
        isFeedSearchOpen={isFeedSearchOpen}
        onToggleFeedSearch={() =>
          setIsFeedSearchOpen((current) => {
            const next = !current;
            if (!next) setPostSearchQuery("");
            return next;
          })
        }
        isFeedFilterOpen={isFeedFilterOpen}
        onToggleFeedFilter={() => setIsFeedFilterOpen((current) => !current)}
        feedFilter={feedFilter}
        onSelectFeedFilter={(value) => {
          setFeedFilter(value);
          setIsFeedFilterOpen(false);
        }}
        filteredFeedItems={filteredFeedItems}
        showDemoPostedText={showDemoPostedText}
        demoPostedText={demoPostedText}
        showDemoPoll={showDemoPoll}
        demoPollVote={demoPollVote}
        demoLiked={demoLiked}
        highlightedItemId={highlightedItemId}
        isDemoPreview={isDemoPreview}
        isCreatorAdmin={isCreatorAdmin}
        dpImageSrc={dpImageSrc}
        coverImageSrc={coverImageSrc}
        recentPhotos={recentPhotos}
        hubName={hubName}
        onOpenComposer={openDeetComposer}
        onOpenViewer={openViewer}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#E3F1EF]">
      <UdeetsHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-10">
        <HubHeroHeader
          dpInputRef={dpInputRef}
          coverInputRef={coverInputRef}
          onDpChange={handleMediaFileChange("dp")}
          onCoverChange={handleMediaFileChange("cover")}
          onOpenDpChooser={() => openMediaChooser("dp")}
          onOpenCoverChooser={() => openMediaChooser("cover")}
          isCreatorAdmin={isCreatorAdmin}
          isUploadingDp={isUploadingDp}
          isUploadingCover={isUploadingCover}
          dpImageSrc={dpImageSrc}
          displayCoverImageSrc={displayCoverImageSrc}
          coverImageSrc={coverImageSrc}
          headerHubName={headerHubName}
          hubName={hubName}
          memberCount={memberCount}
          CategoryIcon={CategoryIcon}
          onInviteMembers={() => openCenterMembers("invite")}
          onOpenSettings={() => requestNavigation({ tab: "Settings", panel: "settings" })}
        />

        {mediaSuccess ? <p className="mt-3 text-sm font-medium text-[#0C5C57]">{mediaSuccess}</p> : null}
        {mediaError ? <p className="mt-3 text-sm font-medium text-[#B42318]">{mediaError}</p> : null}

        <HubTabBar
          visibleTabs={visibleTabs}
          activeSection={activeSection}
          activePanel={activePanel}
          membersPanelMode={membersPanelMode}
          onNavigate={requestNavigation}
        />

        <section className="mt-6">
          {activePanel === "posts" ? renderMainContent() : null}
          {activePanel === "challenges" ? (
            <SectionShell title="Challenges" description="Plan shared goals, participation drives, and engagement activities for your hub.">
              <div className="grid min-h-[320px] place-items-center text-center">
                <div className="max-w-lg">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
                    <Target className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="mt-6 text-3xl font-serif font-semibold tracking-tight text-[#111111]">What are Challenges?</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Challenges help your community stay engaged by working toward shared goals such as events, volunteering, or participation activities.
                  </p>
                  <button type="button" className={cn(BUTTON_PRIMARY, "mt-8 px-6 py-3 text-sm")}>
                    Create a Challenge
                  </button>
                </div>
              </div>
            </SectionShell>
          ) : null}
          {activePanel === "settings" ? renderMainContent() : null}
          {activePanel === "members" ? renderMainContent() : null}
          {activePanel === "invite" ? renderMainContent() : null}
        </section>
      </main>

      {!isDemoPreview ? <UdeetsFooter /> : null}
      {!isDemoPreview ? <UdeetsBottomNav activeNav="home" /> : null}

      {isUnsavedChangesOpen ? (
        <div className="fixed inset-0 z-[118] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div>
              <h3 className="text-lg font-serif font-semibold tracking-tight text-[#111111]">You have unsaved changes</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Save your hub settings before switching tabs, or discard your edits.</p>
            </div>

            {settingsSaveError ? <p className="mt-4 text-sm font-medium text-[#B42318]">{settingsSaveError}</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  handleCancelSettingsChanges();
                  if (pendingNavigation) applyNavigation(pendingNavigation);
                  setPendingNavigation(null);
                  setIsUnsavedChangesOpen(false);
                }}
                className={BUTTON_SECONDARY}
              >
                Discard
              </button>
              <button type="button" onClick={() => void handleSaveSettings()} disabled={isSavingSettings} className={cn(BUTTON_PRIMARY, isSavingSettings && "cursor-not-allowed opacity-60")}>
                {isSavingSettings ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
              <button type="button" onClick={closeMediaChooser} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Close media chooser">
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
                    albumChoices.length ? "border-slate-200 text-[#111111] hover:border-[#A9D1CA] hover:bg-[#F7FBFA]" : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                  )}
                >
                  <span>Choose from Albums</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">{albumChoices.length ? `${albumChoices.length} photos` : "No album photos yet"}</span>
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
                    <button key={`${imageUrl}-${index}`} type="button" onClick={() => void handleAlbumImageSelect(imageUrl)} className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition hover:border-[#A9D1CA]">
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

      {composerOpen && typeof document !== "undefined"
        ? createPortal(
            <CreateDeetModal
              draftText={modalDraftText}
              onDraftTextChange={setModalDraftText}
              formatting={deetFormatting}
              onFormattingChange={(next) => {
                setDeetFormatting(next);
                if (isFontSizeMenuOpen) setIsFontSizeMenuOpen(false);
              }}
              isFontSizeMenuOpen={isFontSizeMenuOpen}
              onToggleFontSizeMenu={() => setIsFontSizeMenuOpen((current) => !current)}
              onCloseFontSizeMenu={() => setIsFontSizeMenuOpen(false)}
              attachedItems={attachedDeetItems}
              onClose={closeDeetComposer}
              onOpenChild={setActiveComposerChild}
              onSubmit={handleSubmitDeet}
              isSubmitting={isSubmittingDeet}
            />,
            document.body
          )
        : null}

      {composerOpen && activeComposerChild && activeComposerChild !== "quit_confirm" && typeof document !== "undefined"
        ? createPortal(
            <>
              {activeComposerChild === "photo" ? (
                <DeetChildModal title="Upload Photos" onClose={() => setActiveComposerChild(null)}>
                  <div>
                    <input ref={deetPhotoInputRef} type="file" accept="image/*" multiple onChange={handleDeetPhotoFiles} className="hidden" />
                    <button
                      type="button"
                      onClick={() => deetPhotoInputRef.current?.click()}
                      className="w-full rounded-2xl border border-dashed border-[#A9D1CA] bg-[#F7FBFA] px-4 py-8 text-center text-sm font-medium text-[#0C5C57] transition hover:bg-[#EEF7F4]"
                    >
                      Choose images from device
                    </button>

                    {selectedPhotoPreviews.length ? (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {selectedPhotoPreviews.map((preview, index) => (
                          <div key={`${preview}-${index}`} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                            <img src={preview} alt={`Selected ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex justify-end gap-3">
                      <button type="button" onClick={() => setActiveComposerChild(null)} className={BUTTON_SECONDARY}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedPhotoPreviews.length) return;
                          attachDeetItem({
                            type: "photo",
                            title: selectedPhotoPreviews.length === 1 ? "1 photo attached" : `${selectedPhotoPreviews.length} photos attached`,
                            detail: "Ready to post in this deet.",
                            previews: selectedPhotoPreviews,
                          });
                        }}
                        className={BUTTON_PRIMARY}
                      >
                        Attach
                      </button>
                    </div>
                  </div>
                </DeetChildModal>
              ) : null}

              {activeComposerChild === "emoji" ? (
                <DeetChildModal title="Choose Sticker" onClose={() => setActiveComposerChild(null)}>
                  <div className="grid grid-cols-4 gap-3">
                    {["😀", "🎉", "🙏", "📣", "❤️", "🌟", "📸", "🎊", "🪔", "😊", "🙌", "🎈", "🐘", "🕉️", "🌸", "✨", "🪷", "📿", "🥥", "🍛", "🎵", "🎁", "🎆", "💛"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setModalDraftText((current) => `${current}${current ? " " : ""}${emoji}`);
                          attachDeetItem({ type: "sticker", title: "Sticker added", detail: emoji });
                        }}
                        className="flex h-16 items-center justify-center rounded-2xl border border-slate-200 text-2xl transition hover:border-[#A9D1CA] hover:bg-[#F7FBFA]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </DeetChildModal>
              ) : null}

              {activeComposerChild === "settings" ? (
                <DeetChildModal title="Deet Settings" onClose={() => setActiveComposerChild(null)}>
                  <DeetSettingsModal settings={deetSettings} onChange={setDeetSettings} onCancel={() => setActiveComposerChild(null)} onSave={() => setActiveComposerChild(null)} />
                </DeetChildModal>
              ) : null}
            </>,
            document.body
          )
        : null}

      {composerOpen && activeComposerChild === "quit_confirm" && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[230] flex items-center justify-center bg-[rgba(15,23,42,0.72)] p-4">
              <div className={cn(CARD, "w-full max-w-sm p-5")}>
                <h4 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">Discard this deet?</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">You have unsaved text or attached content. If you leave now, those changes will be lost.</p>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={() => setActiveComposerChild(null)} className={BUTTON_SECONDARY}>
                    Cancel
                  </button>
                  <button type="button" onClick={discardDeetComposer} className={BUTTON_PRIMARY}>
                    Discard
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {viewer.open ? (
        <div className="fixed inset-0 z-[120] flex bg-black/85">
          <div className="relative flex min-w-0 flex-1 items-center justify-center p-6">
            <button type="button" onClick={closeViewer} className="absolute right-6 top-6 z-20 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25">
              <X className="h-5 w-5 stroke-[1.8]" />
            </button>
            {viewer.images.length > 1 ? (
              <>
                <button type="button" onClick={prevViewerImage} className="absolute left-6 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25">
                  <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
                </button>
                <button type="button" onClick={nextViewerImage} className="absolute right-[376px] top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25">
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
              <button type="button" onClick={() => setIsConnectEditorOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Close connect editor">
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <SettingField label="Website">
                <input value={connectDraft.website} onChange={handleConnectChange("website")} placeholder="https://yourhub.com" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2" />
              </SettingField>
              <SettingField label="Facebook">
                <input value={connectDraft.facebook} onChange={handleConnectChange("facebook")} placeholder="facebook.com/yourhub" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2" />
              </SettingField>
              <SettingField label="Instagram">
                <input value={connectDraft.instagram} onChange={handleConnectChange("instagram")} placeholder="instagram.com/yourhub" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2" />
              </SettingField>
              <SettingField label="YouTube">
                <input value={connectDraft.youtube} onChange={handleConnectChange("youtube")} placeholder="youtube.com/@yourhub" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2" />
              </SettingField>
              <SettingField label="Phone / Contact">
                <input value={connectDraft.phone} onChange={handleConnectChange("phone")} placeholder="(555) 555-5555" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2" />
              </SettingField>
            </div>

            {connectError ? <p className="mt-4 text-sm text-[#B42318]">{connectError}</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setIsConnectEditorOpen(false)} className={BUTTON_SECONDARY}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveConnect} disabled={isSavingConnect} className={cn(BUTTON_PRIMARY, isSavingConnect && "cursor-not-allowed opacity-75")}>
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
              <button type="button" onClick={() => setIsAdminsEditorOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Close admin tools">
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {["Add moderators", "Add users", "Create groups"].map((label) => (
                <button key={label} type="button" className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-[#111111] transition hover:border-[#A9D1CA] hover:bg-[#F7FBFA]">
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
