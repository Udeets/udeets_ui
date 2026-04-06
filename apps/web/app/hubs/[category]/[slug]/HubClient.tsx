/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import type { HubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";
import { getHubConfigByCategory } from "@/lib/hub-templates";
import { getHubColorTheme } from "@/lib/hub-color-themes";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { AttachmentsSection } from "./components/attachments/AttachmentsSection";
import { HubHeroHeader } from "./components/HubHeroHeader";
import { HubSidebarNav } from "./components/HubSidebarNav";
import { MembersSection } from "./components/members/MembersSection";
import { AboutSection } from "./components/sections/AboutSection";
import { CTADisplay } from "./components/ctas/CTADisplay";
import { CTAEditorModal } from "./components/ctas/CTAEditorModal";
import { CustomSectionEditorModal } from "./components/sections/custom/CustomSectionEditorModal";
import { InviteModal } from "./components/modals/InviteModal";
import { DeleteHubModal } from "./components/modals/DeleteHubModal";
import { DeetsSection } from "./components/sections/DeetsSection";
import { EventsSection } from "./components/sections/EventsSection";
import { ReviewsSection } from "./components/sections/ReviewsSection";
import { SettingsSection } from "./components/sections/SettingsSection";
import { CreateDeetModal } from "./components/deets/CreateDeetModal";
import { DeetChildModal } from "./components/deets/DeetChildModal";
import { DeetSettingsModal } from "./components/deets/DeetSettingsModal";
import { AnnouncementChildContent, NoticeChildContent, PollChildContent, EventChildContent, CheckinChildContent } from "./components/deets/ComposerChildPanels";
import type { HubTab } from "./components/hubTypes";
import { useHubConnectFlow } from "./hooks/useHubConnectFlow";
import { useDeetComposer } from "./hooks/useDeetComposer";
import { useHubFilters } from "./hooks/useHubFilters";
import { useHubLiveFeed } from "./hooks/useHubLiveFeed";
import { useHubMediaFlow } from "./hooks/useHubMediaFlow";
import { useHubSettingsFlow } from "./hooks/useHubSettingsFlow";
import { useDeetInteractions } from "./hooks/useDeetInteractions";
import { useHubSectionState } from "./hooks/useHubSectionState";
import { useHubViewerState } from "./hooks/useHubViewerState";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  ICON,
  ImageWithFallback,
  SettingField,
  categoryMetaFor,
  cn,
  normalizePublicSrc,
} from "./components/hubUtils";
import { useHubRole } from "@/hooks/useUserRole";
import { can } from "@/lib/roles";

function formatViewerCommentTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const hubBaseHref = `/hubs/${hub.category}/${hub.slug}`;
  const focusTarget = searchParams.get("focus");
  const requestedTab = searchParams.get("tab");
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const demoHubName = searchParams.get("demo_name")?.trim();
  const demoHubDescription = searchParams.get("demo_description")?.trim();
  const demoComposerText = searchParams.get("demo_composer") ?? "";
  const demoPostedText = searchParams.get("demo_posted") ?? "";
  const demoPollEnabled = searchParams.get("demo_poll") === "1";
  const demoPollVote = searchParams.get("demo_poll_vote");
  const demoLiked = searchParams.get("demo_liked") === "1";

  const initialHubName = demoHubName || hub.name;
  const hubDescription = demoHubDescription || hub.description;
  const [isAdminsEditorOpen, setIsAdminsEditorOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteHubModalOpen, setIsDeleteHubModalOpen] = useState(false);

  const dpInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const isCreatorAdmin = Boolean(user?.id && hub.createdBy && user.id === hub.createdBy);

  // ─── Role-based access ───
  const { role: hubRole, isMember: roleMember, isPending: rolePending } = useHubRole(hub.id, hub.createdBy ?? null);
  const canEditHub = can(hubRole, "hub:edit_settings");
  const canManageMembers = can(hubRole, "hub:manage_members");
  const canViewFullContent = can(hubRole, "hub:view_full_content");

  const canAccessAdmins = canEditHub;
  const creatorMetadata = user?.user_metadata;
  const [creatorProfile, setCreatorProfile] = useState<{ fullName: string; avatarUrl: string | null } | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ fullName: string; avatarUrl: string | null } | null>(null);

  // Always fetch the hub creator's profile from DB so custom name/avatar are used
  useEffect(() => {
    if (!hub.createdBy) return;
    let ignore = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", hub.createdBy!)
        .single();
      if (!ignore && data) {
        setCreatorProfile({ fullName: data.full_name || "Hub Creator", avatarUrl: data.avatar_url });
      }
    })();
    return () => { ignore = true; };
  }, [hub.createdBy]);

  // Fetch the current logged-in user's profile (for comment input avatar etc.)
  useEffect(() => {
    if (!user?.id) return;
    // If the current user IS the creator, reuse that profile
    if (user.id === hub.createdBy) return;
    let ignore = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (!ignore && data) {
        setCurrentUserProfile({ fullName: data.full_name || "User", avatarUrl: data.avatar_url });
      }
    })();
    return () => { ignore = true; };
  }, [user?.id, hub.createdBy]);

  // Prefer profile DB values over auth metadata (user may have customised them)
  const creatorDisplayName =
    creatorProfile?.fullName ||
    (isCreatorAdmin ? (creatorMetadata?.full_name as string) || (creatorMetadata?.name as string) || user?.email || "You" : "Hub Creator");
  const creatorDetail = isCreatorAdmin ? user?.email || "Creator" : "Creator";
  const creatorAvatarSrc =
    creatorProfile?.avatarUrl ||
    (isCreatorAdmin && typeof creatorMetadata?.avatar_url === "string" ? creatorMetadata.avatar_url : "");

  // Current logged-in user's avatar (for comment input, etc.)
  const currentUserAvatarSrc =
    isCreatorAdmin
      ? creatorAvatarSrc
      : currentUserProfile?.avatarUrl ||
        (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "");
  const deetAuthorName =
    creatorProfile?.fullName ||
    (creatorMetadata?.full_name as string) ||
    (creatorMetadata?.name as string) ||
    user?.email?.split("@")[0] ||
    "You";
  const [isJoined, setIsJoined] = useState(isCreatorAdmin);
  const [isMember, setIsMember] = useState(isCreatorAdmin);
  const [isPending, setIsPending] = useState(false);
  const [membershipLoaded, setMembershipLoaded] = useState(isCreatorAdmin);

  // Check actual membership status from DB
  useEffect(() => {
    if (isCreatorAdmin || !user?.id) return;
    let ignore = false;

    async function checkMembership() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("hub_members")
        .select("role, status")
        .eq("hub_id", hub.id)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (ignore) return;
      if (data) {
        if (data.status === "active") {
          setIsMember(true);
          setIsJoined(true);
          setIsPending(false);
        } else if (data.status === "pending") {
          setIsMember(false);
          setIsJoined(false);
          setIsPending(true);
        }
      }
      setMembershipLoaded(true);
    }

    void checkMembership();
    return () => { ignore = true; };
  }, [hub.id, user?.id, isCreatorAdmin]);

  const isPublicHub = hub.visibility === "Public";
  // Content gating: non-members see Header + About only
  const canAccessFullContent = canViewFullContent || isMember || isCreatorAdmin;

  // CTA state
  const [hubCTAs, setHubCTAs] = useState<import("@/lib/services/ctas/cta-types").HubCTARecord[]>([]);
  const [isCTAEditorOpen, setIsCTAEditorOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadCTAs() {
      const { listHubCTAs } = await import("@/lib/services/ctas/list-ctas");
      const ctas = await listHubCTAs(hub.id);
      if (!ignore) setHubCTAs(ctas);
    }
    void loadCTAs();
    return () => { ignore = true; };
  }, [hub.id]);

  // Custom sections state
  const [customSections, setCustomSections] = useState<import("@/lib/services/sections/section-types").HubSection[]>([]);
  const [isSectionEditorOpen, setIsSectionEditorOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadSections() {
      const { listHubSections } = await import("@/lib/services/sections/list-sections");
      const sections = await listHubSections(hub.id);
      if (!ignore) setCustomSections(sections);
    }
    void loadSections();
    return () => { ignore = true; };
  }, [hub.id]);

  // Load all photos from attachments table (includes DP, cover, and gallery)
  const [allAttachmentPhotos, setAllAttachmentPhotos] = useState<string[]>([]);
  const loadAttachmentPhotos = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("attachments")
        .select("file_url")
        .eq("hub_id", hub.id)
        .eq("file_type", "image")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const photoUrls = data.map((row: { file_url: string }) => normalizePublicSrc(row.file_url)).filter(Boolean);
        setAllAttachmentPhotos(photoUrls);
      }
    } catch (err) {
      console.error("[load-attachment-photos]", err);
    }
  };

  useEffect(() => {
    loadAttachmentPhotos();
  }, [hub.id]);

  const { liveFeedItems, prependCreatedDeet, removeDeet } = useHubLiveFeed(hub.id, hub.createdBy);
  const {
    savedHubName,
    savedHubCategory,
    settingsHubName,
    settingsCategory,
    settingsDescription,
    settingsLocation,
    settingsVisibility,
    settingsDiscoverable,
    notificationsEnabled,
    approvalSetting,
    whoCanPost,
    whoCanUpload,
    settingsAccentColor,
    isSavingSettings,
    settingsSaveError,
    settingsSaveSuccess,
    isDirty,
    setSettingsDescription,
    setSettingsLocation,
    setSettingsVisibility,
    setSettingsDiscoverable,
    setNotificationsEnabled,
    setApprovalSetting,
    setWhoCanPost,
    setWhoCanUpload,
    setSettingsAccentColor,
    updateSettingsHubName,
    updateSettingsCategory,
    saveSettings,
    resetSettings,
  } = useHubSettingsFlow({
    hub,
    initialHubName,
    hubDescription,
    isCreatorAdmin,
    onAfterSave: () => {
      if (pendingNavigation) {
        applyNavigation(pendingNavigation);
        setPendingNavigation(null);
        setIsUnsavedChangesOpen(false);
      }
    },
  });
  const hubName = savedHubName;
  const {
    isConnectEditorOpen,
    isSavingConnect,
    connectError,
    connectSuccess,
    connectLinks,
    connectDraft,
    openConnectEditor,
    closeConnectEditor,
    handleConnectChange,
    saveConnect,
  } = useHubConnectFlow(hub);
  const {
    mediaError,
    mediaSuccess,
    isUploadingDp,
    isUploadingCover,
    isUploadingGallery,
    mediaChooserTarget,
    isAlbumPickerOpen,
    dpImageSrc,
    coverImageSrc,
    galleryImages,
    setIsAlbumPickerOpen,
    openMediaChooser,
    closeMediaChooser,
    handleChooseFromDevice,
    handleChooseFromAlbums,
    handleAlbumImageSelect,
    handleMediaFileChange,
  } = useHubMediaFlow({
    hub,
    isCreatorAdmin,
    dpInputRef,
    coverInputRef,
  });

  // Reload attachment photos when media is uploaded
  useEffect(() => {
    if (mediaSuccess || (!isUploadingDp && !isUploadingCover && !isUploadingGallery)) {
      // Small delay to ensure DB insert is complete
      const timer = setTimeout(() => loadAttachmentPhotos(), 500);
      return () => clearTimeout(timer);
    }
  }, [mediaSuccess, isUploadingDp, isUploadingCover, isUploadingGallery]);

  // Merge gallery images with attachment photos, preferring attachments (which include DP/cover uploads)
  const allPhotos = allAttachmentPhotos.length > 0 ? allAttachmentPhotos : galleryImages;
  const recentPhotos = allPhotos.slice(0, 6);
  const displayCoverImageSrc = coverImageSrc;
  const adminImages = (hub.adminImages ?? []).map(normalizePublicSrc).filter(Boolean);
  const albumChoices = allPhotos.filter((image) => image !== dpImageSrc && image !== coverImageSrc);
  const categoryMeta = categoryMetaFor(savedHubCategory);
  const CategoryIcon = categoryMeta.icon;
  const hubTemplateConfig = useMemo(() => getHubConfigByCategory(savedHubCategory), [savedHubCategory]);
  const memberCount = Math.max(1, Number.parseInt(hub.membersLabel, 10) || 0);
  const headerHubName = hub.name?.trim() || hubName;
  const visibilityLabel: "Public" | "Private" = hub.visibility;
  const accentTheme = getHubColorTheme(settingsAccentColor || hub.accentColor);

  // Inject author avatars into feed items
  const allFeedItems = [...liveFeedItems, ...hubContent.feed].map((item) => ({
    ...item,
    authorAvatar:
      item.authorAvatar ||
      (item.authorId && item.authorId === hub.createdBy ? creatorAvatarSrc : undefined) ||
      undefined,
  }));
  const {
    likedDeetIds,
    likingDeetIds,
    likeCountOverrides,
    handleToggleLike,
    expandedCommentDeetId,
    commentsByDeetId,
    commentLoadingDeetIds,
    commentSubmittingDeetId,
    handleToggleComments,
    handleSubmitComment,
  } = useDeetInteractions(allFeedItems);
  const feedItemCount = allFeedItems.length;
  const totalEngagement = allFeedItems.reduce((sum, item) => sum + item.likes + item.comments, 0);
  const totalViews = allFeedItems.reduce((sum, item) => sum + item.views, 0);
  const announcementCount = allFeedItems.filter((item) => item.kind === "announcement" || item.kind === "notice").length;
  const photoDeetCount = allFeedItems.filter((item) => item.kind === "photo").length;
  const activeAdminCount = 1;
  const knownActivityCount = feedItemCount + hubContent.events.length + recentPhotos.length;
  const fileItems: string[] = [];
  const [memberItems, setMemberItems] = useState<Array<{ userId: string; role: string; fullName: string; avatarUrl: string | null; email: string | null; joinedAt: string | null }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ userId: string; fullName: string; avatarUrl: string | null; email: string | null; requestedAt?: string | null }>>([]);
  const [processingUserIds, setProcessingUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Step 1: get active members
      const { data: members, error: membersError } = await supabase
        .from("hub_members")
        .select("user_id, role, joined_at")
        .eq("hub_id", hub.id)
        .eq("status", "active");

      if (membersError) { console.error("[members]", membersError); return; }
      if (!members || members.length === 0) return;

      // Step 2: get profiles for those user_ids
      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      if (!ignore) {
        setMemberItems(members.map((m) => {
          const profile = profileMap.get(m.user_id);
          // Show "Creator" for the hub creator, otherwise proper role label
          const isHubCreator = hub.createdBy && m.user_id === hub.createdBy;
          const roleLabel = isHubCreator ? "Creator" : m.role === "admin" ? "Admin" : "Member";
          return {
            userId: m.user_id,
            role: roleLabel,
            fullName: profile?.full_name ?? m.user_id.slice(0, 8),
            avatarUrl: profile?.avatar_url ?? null,
            email: profile?.email ?? null,
            joinedAt: m.joined_at ?? null,
          };
        }));
      }
    }

    async function loadPendingRequests() {
      const { listPendingRequests, fetchProfilesForUsers } = await import("@/lib/services/members/manage-members");
      const pending = await listPendingRequests(hub.id);
      if (!pending.length) {
        if (!ignore) setPendingRequests([]);
        return;
      }
      const profileMap = await fetchProfilesForUsers(pending.map((p) => p.userId));
      if (!ignore) {
        setPendingRequests(pending.map((p) => {
          const profile = profileMap.get(p.userId);
          return {
            userId: p.userId,
            fullName: profile?.fullName ?? p.userId.slice(0, 8),
            avatarUrl: profile?.avatarUrl ?? null,
            email: profile?.email ?? null,
            requestedAt: p.joinedAt,
          };
        }));
      }
    }

    async function init() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && !ignore) {
        loadMembers();
        // Only load pending requests if the current user is the hub creator
        if (isCreatorAdmin) {
          loadPendingRequests();
        }
      }
    }

    init();
    return () => { ignore = true; };
  }, [hub.id, isCreatorAdmin]);

  const handleApproveRequest = async (userId: string) => {
    setProcessingUserIds((prev) => new Set(prev).add(userId));
    try {
      const { approveMemberRequest } = await import("@/lib/services/members/manage-members");
      await approveMemberRequest(hub.id, userId);
      // Move from pending to active members list
      const approved = pendingRequests.find((r) => r.userId === userId);
      setPendingRequests((prev) => prev.filter((r) => r.userId !== userId));
      if (approved) {
        setMemberItems((prev) => [...prev, { userId: approved.userId, role: "Member", fullName: approved.fullName, avatarUrl: approved.avatarUrl, email: approved.email, joinedAt: new Date().toISOString() }]);
      }
    } catch (error) {
      console.error("[approve]", error);
    } finally {
      setProcessingUserIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setProcessingUserIds((prev) => new Set(prev).add(userId));
    try {
      const { rejectMemberRequest } = await import("@/lib/services/members/manage-members");
      await rejectMemberRequest(hub.id, userId);
      setPendingRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (error) {
      console.error("[reject]", error);
    } finally {
      setProcessingUserIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };
  const memberRoleItems: Array<{ name: string; role: string }> = [];
  const {
    activeSection,
    setActiveSection,
    activePanel,
    membersPanelMode,
    activePeopleView,
    activeAttachmentView,
    pendingNavigation,
    setPendingNavigation,
    isUnsavedChangesOpen,
    setIsUnsavedChangesOpen,
    applyNavigation,
    requestNavigation,
  } = useHubSectionState({
    requestedTab,
    canAccessAdmins,
    isDirty,
  });

  // Reload pending requests when Members tab is accessed
  useEffect(() => {
    if (!isCreatorAdmin || activeSection !== "Members") return;

    let ignore = false;

    async function reloadPendingRequests() {
      const { listPendingRequests, fetchProfilesForUsers } = await import("@/lib/services/members/manage-members");
      const pending = await listPendingRequests(hub.id);
      if (!pending.length) {
        if (!ignore) setPendingRequests([]);
        return;
      }
      const profileMap = await fetchProfilesForUsers(pending.map((p) => p.userId));
      if (!ignore) {
        setPendingRequests(pending.map((p) => {
          const profile = profileMap.get(p.userId);
          return {
            userId: p.userId,
            fullName: profile?.fullName ?? p.userId.slice(0, 8),
            avatarUrl: profile?.avatarUrl ?? null,
            email: profile?.email ?? null,
            requestedAt: p.joinedAt,
          };
        }));
      }
    }

    void reloadPendingRequests();
    return () => { ignore = true; };
  }, [activeSection, hub.id, isCreatorAdmin]);

  const { viewer, openViewer, closeViewer, nextViewerImage, prevViewerImage } =
    useHubViewerState();
  const {
    postSearchQuery,
    setPostSearchQuery,
    feedFilter,
    isFeedSearchOpen,
    isFeedFilterOpen,
    normalizedPostSearch,
    filteredFeedItems,
    showDemoPostedText,
    showDemoPoll,
    toggleFeedSearch,
    toggleFeedFilter,
    selectFeedFilter,
  } = useHubFilters({
    allFeedItems,
    demoPostedText,
    demoPollEnabled,
  });

  const {
    composerOpen,
    activeComposerChild,
    attachedDeetItems,
    selectedPhotoPreviews,
    selectedPhotoFiles,
    modalDraftText,
    isSubmittingDeet,
    deetFormatting,
    isFontSizeMenuOpen,
    deetSettings,
    deetPhotoInputRef,
    setActiveComposerChild,
    setModalDraftText,
    setDeetFormatting,
    setIsFontSizeMenuOpen,
    setDeetSettings,
    openDeetComposer,
    closeDeetComposer,
    discardDeetComposer,
    attachDeetItem,
    removePhoto,
    handleDeetPhotoFiles,
    handleSubmitDeet,
  } = useDeetComposer({
    hubId: hub.id,
    hubSlug: hub.slug,
    demoComposerText,
    isCreatorAdmin,
    authorName: deetAuthorName,
    authorAvatarSrc: creatorAvatarSrc,
    onDeetCreated: prependCreatedDeet,
  });

  const shouldOpenComments = searchParams.get("comments") === "1";

  useEffect(() => {
    if (!focusTarget) return;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(focusTarget);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedItemId(focusTarget);
      window.setTimeout(() => setHighlightedItemId((current) => (current === focusTarget ? null : current)), 2200);

      // Auto-expand comments if ?comments=1 is present
      if (shouldOpenComments) {
        handleToggleComments(focusTarget);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeSection, focusTarget, shouldOpenComments, handleToggleComments]);

  const navigateToFocus = (focusId: string, tab?: HubTab) => {
    const params = new URLSearchParams();
    params.set("focus", focusId);
    if (tab) params.set("tab", tab);
    router.push(`${hubBaseHref}?${params.toString()}`, { scroll: false });
    if (tab) setActiveSection(tab);
  };

  const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setIsUploadingFile(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      for (const file of Array.from(files)) {
        const filePath = `${hub.id}/${Date.now()}-${file.name}`;
        await supabase.storage.from("deet-media").upload(filePath, file);
      }
    } catch (error) {
      console.error("[file-upload]", error);
    } finally {
      setIsUploadingFile(false);
      if (event.target) event.target.value = "";
    }
  };

  const openCenterMembers = (mode: "list" | "invite") => {
    requestNavigation({
      tab: "Members",
      panel: mode === "invite" ? "invite" : "members",
      membersMode: mode,
      membersView: "members",
    });
  };

  const openSettingsPanel = () => {
    requestNavigation({ tab: activeSection, panel: "settings" });
  };

  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleMembershipAction = async () => {
    if (!user?.id) {
      router.push(`/auth?redirect=${encodeURIComponent(hubBaseHref)}`);
      return;
    }
    setIsJoining(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (isPublicHub) {
        // Public hub: join immediately with active status
        await supabase.from("hub_members").upsert({
          hub_id: hub.id,
          user_id: user.id,
          role: "member",
          status: "active",
        }, { onConflict: "hub_id,user_id" });
        setIsMember(true);
        setIsJoined(true);
        setShowJoinConfirm(true);
      } else {
        // Private hub: create pending request
        await supabase.from("hub_members").upsert({
          hub_id: hub.id,
          user_id: user.id,
          role: "member",
          status: "pending",
          joined_at: new Date().toISOString(),
        }, { onConflict: "hub_id,user_id" });
        setIsPending(true);
        setShowJoinConfirm(true);
      }
    } catch (err) {
      console.error("[join-hub] error:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const renderMainContent = () => {
    // Content gating: non-members only see About
    if (!canAccessFullContent && activeSection !== "About") {
      return (
        <div className={cn(CARD, "p-8 text-center")}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ud-brand-light)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--ud-brand-primary)]" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">
            {isPending ? "Request Pending" : "Members Only"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--ud-text-secondary)]">
            {isPending
              ? "Your request to join this hub is awaiting approval from the admin."
              : isPublicHub
                ? "Join this hub to access all content, posts, and community features."
                : "Request access to this private hub to see posts and more."}
          </p>
          {!isPending ? (
            <button
              type="button"
              className={cn(BUTTON_PRIMARY, "mt-5")}
              onClick={handleMembershipAction}
            >
              {isPublicHub ? "Join Hub" : "Request to Join"}
            </button>
          ) : (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Awaiting Approval
            </div>
          )}
        </div>
      );
    }

    if (activePanel === "settings") {
      return (
        <SettingsSection
          isDirty={isDirty}
          isSavingSettings={isSavingSettings}
          isCreatorAdmin={isCreatorAdmin}
          onCancel={resetSettings}
          onSave={() => void saveSettings()}
          dpImageSrc={dpImageSrc}
          coverImageSrc={coverImageSrc}
          settingsHubName={settingsHubName}
          onSettingsHubNameChange={updateSettingsHubName}
          settingsDescription={settingsDescription}
          onSettingsDescriptionChange={setSettingsDescription}
          settingsCategory={settingsCategory}
          onSettingsCategoryChange={updateSettingsCategory}
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
          settingsAccentColor={settingsAccentColor}
          onSettingsAccentColorChange={setSettingsAccentColor}
          settingsSaveSuccess={settingsSaveSuccess}
          settingsSaveError={settingsSaveError}
          hubId={hub.id}
          onShowDeleteModal={() => setIsDeleteHubModalOpen(true)}
        />
      );
    }
    if (activeSection === "Members") {
      return (
        <MembersSection
          activePeopleView={activePeopleView}
          membersPanelMode={membersPanelMode}
          memberItems={memberItems}
          canAccessAdmins={canAccessAdmins}
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
          onInviteMembers={() => setIsInviteModalOpen(true)}
          onOpenSettings={openSettingsPanel}
          onOpenAdminsEditor={() => setIsAdminsEditorOpen(true)}
          onOpenPosts={() => setActiveSection("Posts")}
          isCreatorAdmin={isCreatorAdmin}
          pendingRequests={pendingRequests}
          processingUserIds={processingUserIds}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
        />
      );
    }
    if (activeSection === "About") {
      return (
        <AboutSection
          CategoryIcon={CategoryIcon}
          categoryLabel={categoryMeta.label}
          hubName={hubName}
          hubDescription={hubDescription}
          hubTagline={hub.tagline ?? ""}
          settingsVisibility={settingsVisibility}
          memberCount={memberCount}
          settingsLocation={settingsLocation}
          hubLocationLabel={hub.locationLabel}
          connectLinks={connectLinks}
          isCreatorAdmin={isCreatorAdmin}
          userRole={isCreatorAdmin ? "creator" : isJoined ? "member" : isPending ? "pending" : null}
          onMembershipAction={handleMembershipAction}
          onInviteMembers={() => setIsInviteModalOpen(true)}
          onOpenSettings={openSettingsPanel}
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
          onOpenAdminsEditor={() => setIsAdminsEditorOpen(true)}
          adminImages={adminImages}
          dpImageSrc={dpImageSrc}
          coverImageSrc={coverImageSrc}
          hubCTAs={hubCTAs}
          onOpenCTAEditor={() => setIsCTAEditorOpen(true)}
          onSaveDescription={async (desc: string) => {
            const { updateHub } = await import("@/lib/services/hubs/update-hub");
            await updateHub(hub.id, { description: desc });
          }}
          onOpenViewer={openViewer}
          customSections={customSections}
          onOpenSectionEditor={() => setIsSectionEditorOpen(true)}
          settingsAccentColor={settingsAccentColor}
          onSettingsAccentColorChange={setSettingsAccentColor}
          accentTheme={accentTheme}
        />
      );
    }
    if (activeSection === "Attachments") {
      return (
        <AttachmentsSection
          activeAttachmentView={activeAttachmentView}
          recentPhotos={recentPhotos}
          fileItems={fileItems}
          hubName={hubName}
          onOpenViewer={openViewer}
          isCreatorAdmin={isCreatorAdmin}
          isUploadingGallery={isUploadingGallery}
          onOpenGalleryUpload={() => galleryInputRef.current?.click()}
          galleryInputRef={galleryInputRef}
          onGalleryChange={handleMediaFileChange("gallery")}
          fileInputRef={fileInputRef}
          onFileChange={handleFileUpload}
          onOpenFileUpload={() => fileInputRef.current?.click()}
          isUploadingFile={isUploadingFile}
        />
      );
    }
    if (activeSection === "Events") {
      return (
        <EventsSection
          hubId={hub.id}
          userId={user?.id ?? null}
          isCreatorAdmin={isCreatorAdmin}
        />
      );
    }
    if (activeSection === "Reviews") {
      return (
        <ReviewsSection
          hubName={hubName}
          isCreatorAdmin={isCreatorAdmin}
        />
      );
    }
    return (
      <DeetsSection
        normalizedPostSearch={normalizedPostSearch}
        postSearchQuery={postSearchQuery}
        onPostSearchQueryChange={setPostSearchQuery}
        isFeedSearchOpen={isFeedSearchOpen}
        onToggleFeedSearch={toggleFeedSearch}
        isFeedFilterOpen={isFeedFilterOpen}
        onToggleFeedFilter={toggleFeedFilter}
        feedFilter={feedFilter}
        onSelectFeedFilter={selectFeedFilter}
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
        hubCategory={hub.category}
        hubSlug={hub.slug}
        userAvatarSrc={currentUserAvatarSrc}
        userName={creatorDisplayName}
        currentUserId={user?.id}
        onOpenComposer={openDeetComposer}
        onOpenViewer={openViewer}
        onDeleteDeet={removeDeet}
        likedDeetIds={likedDeetIds}
        likingDeetIds={likingDeetIds}
        likeCountOverrides={likeCountOverrides}
        onToggleLike={handleToggleLike}
        expandedCommentDeetId={expandedCommentDeetId}
        commentsByDeetId={commentsByDeetId}
        commentLoadingDeetIds={commentLoadingDeetIds}
        commentSubmittingDeetId={commentSubmittingDeetId}
        onToggleComments={handleToggleComments}
        onSubmitComment={handleSubmitComment}
      />
    );
  };

  // Build CSS custom property overrides so every component on this page
  // picks up the hub's chosen accent colour via var(--ud-brand-primary) etc.
  const themeVars: React.CSSProperties = {
    "--ud-brand-primary": accentTheme.primary,
    "--ud-brand-primary-hover": accentTheme.primaryHover,
    "--ud-brand-light": accentTheme.surface,
    "--ud-gradient-from": accentTheme.primary,
    "--ud-gradient-to": accentTheme.primaryHover,
    "--ud-border-focus": accentTheme.primary,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--ud-bg-page)] pb-16 md:pb-0" style={themeVars}>
      <UdeetsHeader />

      <div className="mx-auto w-full max-w-7xl">
        {/* Top header — 2-column: DP panel + cover image */}
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
          categoryLabel={categoryMeta.label}
          visibilityLabel={visibilityLabel}
          accentTheme={accentTheme}
        />

        {mediaSuccess ? <p className="px-4 pt-3 text-sm font-medium text-[var(--ud-brand-primary)]">{mediaSuccess}</p> : null}
        {mediaError ? <p className="px-4 pt-3 text-sm font-medium text-[var(--ud-danger)]">{mediaError}</p> : null}

        {/* Mobile horizontal tab bar — visible below lg */}
        <div className="flex overflow-x-auto border-b border-[var(--ud-border)] bg-[var(--ud-bg-card)] lg:hidden" style={{ scrollbarWidth: "none" as never }}>
          {(hubTemplateConfig.tabs.filter((t) => t !== "Settings") as string[])
            .filter((tab) => canAccessFullContent || tab === "About")
            .map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === "Members") {
                    requestNavigation({ tab: tab as HubTab, panel: "members", membersMode: "list", membersView: "members" });
                  } else if (tab === "Attachments") {
                    requestNavigation({ tab: tab as HubTab, panel: "posts", attachmentsView: "photos" });
                  } else {
                    requestNavigation({ tab: tab as HubTab, panel: "posts" });
                  }
                }}
                className={cn(
                  "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition",
                  activeSection === tab && activePanel !== "settings"
                    ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                    : "border-transparent text-[var(--ud-text-muted)] hover:text-[var(--ud-text-secondary)]"
                )}
              >
                {tab === "About"
                  ? hubTemplateConfig.terminology.about
                  : tab === "Posts"
                    ? "Posts"
                    : tab === "Members"
                      ? hubTemplateConfig.terminology.members
                      : tab}
              </button>
            ))}
          {isCreatorAdmin && (
            <button
              type="button"
              onClick={() => requestNavigation({ tab: activeSection, panel: "settings" })}
              className={cn(
                "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition",
                activePanel === "settings"
                  ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                  : "border-transparent text-[var(--ud-text-muted)] hover:text-[var(--ud-text-secondary)]"
              )}
            >
              Settings
            </button>
          )}
        </div>

        {/* Below header — 2-column on desktop, single column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
          {/* Left sidebar — hidden on mobile */}
          <aside className="hidden border-r border-[var(--ud-border)] bg-[var(--ud-bg-card)] lg:block">
            <HubSidebarNav
              activeSection={activeSection}
              activePanel={activePanel}
              isCreatorAdmin={isCreatorAdmin}
              canAccessFullContent={canAccessFullContent}
              templateConfig={hubTemplateConfig}
              onNavigate={requestNavigation}
            />
          </aside>

          {/* Content area */}
          <main className="min-h-[calc(100vh-200px)] min-w-0 overflow-x-hidden bg-[var(--ud-bg-subtle)] p-3 sm:p-6">
            {renderMainContent()}
          </main>
        </div>
      </div>

      {!isDemoPreview ? <UdeetsFooter /> : null}
      {!isDemoPreview ? <UdeetsBottomNav activeNav="home" /> : null}

      {/* Join Hub Confirmation Modal */}
      {showJoinConfirm ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#111111]/45 sm:items-center">
          <div className={cn(CARD, "w-full max-w-md animate-[slideUp_200ms_ease-out] rounded-t-[28px] p-6 sm:rounded-[28px]")}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ud-brand-light)]">
              {isPending ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--ud-brand-primary)]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <h3 className="text-center text-lg font-semibold text-[var(--ud-text-primary)]">
              {isPending ? "Request Sent!" : "Welcome to " + hubName + "!"}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-center text-sm text-[var(--ud-text-secondary)]">
              {isPending
                ? "Your request has been sent to the hub admin. You'll get access once they approve it."
                : "You're now a member. Check out the latest deets from this hub."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {!isPending ? (
                <button
                  type="button"
                  className={cn(BUTTON_PRIMARY, "w-full justify-center")}
                  onClick={() => {
                    setShowJoinConfirm(false);
                    requestNavigation({ tab: "Posts", panel: "posts" });
                  }}
                >
                  View Deets
                </button>
              ) : null}
              <button
                type="button"
                className="w-full rounded-full border border-[var(--ud-border)] px-5 py-3 text-sm font-semibold text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
                onClick={() => setShowJoinConfirm(false)}
              >
                {isPending ? "Got it" : "Stay on About"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isUnsavedChangesOpen ? (
        <div className="fixed inset-0 z-[118] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">You have unsaved changes</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">Save your hub settings before switching tabs, or discard your edits.</p>
            </div>

            {settingsSaveError ? <p className="mt-4 text-sm font-medium text-[var(--ud-danger)]">{settingsSaveError}</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetSettings();
                  if (pendingNavigation) applyNavigation(pendingNavigation);
                  setPendingNavigation(null);
                  setIsUnsavedChangesOpen(false);
                }}
                className={BUTTON_SECONDARY}
              >
                Discard
              </button>
              <button type="button" onClick={() => void saveSettings()} disabled={isSavingSettings} className={cn(BUTTON_PRIMARY, isSavingSettings && "cursor-not-allowed opacity-60")}>
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
                <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">
                  {mediaChooserTarget === "dp" ? "Change Display Picture" : "Change Cover Image"}
                </h3>
                <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">Choose an existing album photo or upload a new one.</p>
              </div>
              <button type="button" onClick={closeMediaChooser} className="rounded-full border border-[var(--ud-border)] p-2 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]" aria-label="Close media chooser">
                <X className={ICON} />
              </button>
            </div>

            {!isAlbumPickerOpen ? (
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => handleChooseFromAlbums(albumChoices)}
                  disabled={!albumChoices.length}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                    albumChoices.length ? "border-[var(--ud-border)] text-[var(--ud-text-primary)] hover:border-[var(--ud-brand-primary)] hover:bg-[var(--ud-bg-subtle)]" : "cursor-not-allowed border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]"
                  )}
                >
                  <span>Choose from Albums</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">{albumChoices.length ? `${albumChoices.length} photos` : "No album photos yet"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleChooseFromDevice}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-left text-sm font-medium text-[var(--ud-text-primary)] transition hover:border-[var(--ud-brand-primary)] hover:bg-[var(--ud-bg-subtle)]"
                >
                  <span>Upload from Device</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Device</span>
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {albumChoices.map((imageUrl, index) => (
                    <button key={`${imageUrl}-${index}`} type="button" onClick={() => void handleAlbumImageSelect(imageUrl)} className="aspect-square overflow-hidden rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] transition hover:border-[var(--ud-brand-primary)]">
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
              selectedPhotoPreviews={selectedPhotoPreviews}
              onRemovePhoto={removePhoto}
              onClose={closeDeetComposer}
              onOpenChild={setActiveComposerChild}
              onSubmit={handleSubmitDeet}
              isSubmitting={isSubmittingDeet}
              authorName={deetAuthorName}
              authorAvatarSrc={creatorAvatarSrc}
              onSetPostType={(postType) => setDeetSettings((prev) => ({ ...prev, postType: postType as import("./components/deets/deetTypes").DeetPostType }))}
              isNotice={deetSettings.noticeEnabled}
              onToggleNotice={() => setDeetSettings((prev) => ({
                ...prev,
                noticeEnabled: !prev.noticeEnabled,
                postType: !prev.noticeEnabled ? "notice" : "post",
              }))}
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
                      className="w-full rounded-2xl border border-dashed border-[var(--ud-brand-primary)] bg-[var(--ud-bg-subtle)] px-4 py-8 text-center text-sm font-medium text-[var(--ud-brand-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
                    >
                      Choose images from device
                    </button>

                    {selectedPhotoPreviews.length ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {selectedPhotoPreviews.map((preview, index) => (
                          <div key={`${preview}-${index}`} className="aspect-square overflow-hidden rounded-2xl bg-[var(--ud-bg-subtle)]">
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
                            files: selectedPhotoFiles,
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
                <DeetChildModal title="Emoji & Stickers" onClose={() => setActiveComposerChild(null)}>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Smileys & People</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤗","🤭","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Gestures & Body</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Hearts & Symbols</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","❤️‍🔥","❤️‍🩹","♥️","🔥","⭐","🌟","✨","💫","🎯","💯","💢","💥","💦","💨","🕊️","🎶","🎵","🔔","📢","📣","💬","💭","🗯️","♠️","♣️","♥️","♦️","🏆","🥇","🥈","🥉","🎖️","🏅","🎗️","🎪"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Food & Nature</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["🍎","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍞","🥐","🥖","🫓","🥨","🥯","🧀","🍳","🥞","🧇","🥓","🍔","🍟","🍕","🌭","🌮","🌯","🫔","🥙","🧆","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍚","🍘","🍥","🥮","🍡","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍩","🍪","☕","🍵","🥤","🧋","🍺","🍻","🥂","🍷"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Activities & Celebrations</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["🎉","🎊","🎈","🎁","🎀","🎄","🎃","🎆","🎇","🧨","🪔","🪅","🎋","🎍","🎎","🎏","🎐","🧧","🎑","🎠","🎡","🎢","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🪘","🎲","♟️","🎯","🎳","🎮","🕹️","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏏","🪃","🥅","⛳","🏹","🎣","🤿","🥊","🥋","🛹","🛼","⛸️","🎿","🛷","🏂","🧗","🏋️","🤸","🤺","⛷️","🏄","🚴"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Animals</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Travel & Places</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["🏠","🏡","🏘️","🏚️","🏗️","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","🌌","🎠","🛝","🎡","🎢","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","✈️","🛩️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Indian & Cultural</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {["🪔","🕉️","🪷","📿","🛕","🐘","🦚","🙏","🧘","🧿","🪬","🫶","🍛","🥥","🍚","🌶️","🫖","🍵","🎭","🪘","🎶","🎵","💃","🕺","👳","👳‍♀️","🧕","🪭","🏵️","🌺","🌸","🌼","💐","🌻","🌹","🪻"].map((e) => (
                          <button key={e} type="button" onClick={() => { setModalDraftText((c) => `${c}${e}`); }} className="flex h-10 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--ud-bg-subtle)] hover:scale-110">{e}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </DeetChildModal>
              ) : null}

              {/* ── Announcement modal ── */}
              {activeComposerChild === "announcement" ? (
                <DeetChildModal title="Announcement" onClose={() => setActiveComposerChild(null)}>
                  <AnnouncementChildContent
                    onAttach={(title, body) => {
                      attachDeetItem({ type: "announcement", title, detail: body });
                      setDeetSettings((prev) => ({ ...prev, postType: "notice" as import("./components/deets/deetTypes").DeetPostType }));
                      setActiveComposerChild(null);
                    }}
                    onCancel={() => setActiveComposerChild(null)}
                  />
                </DeetChildModal>
              ) : null}

              {/* ── Notice modal ── */}
              {activeComposerChild === "notice" ? (
                <DeetChildModal title="Notice" onClose={() => setActiveComposerChild(null)}>
                  <NoticeChildContent
                    onAttach={(title, body) => {
                      attachDeetItem({ type: "notice", title, detail: body });
                      setDeetSettings((prev) => ({ ...prev, postType: "notice" as import("./components/deets/deetTypes").DeetPostType }));
                      setActiveComposerChild(null);
                    }}
                    onCancel={() => setActiveComposerChild(null)}
                  />
                </DeetChildModal>
              ) : null}

              {/* ── Poll modal ── */}
              {activeComposerChild === "poll" ? (
                <DeetChildModal title="Poll" onClose={() => setActiveComposerChild(null)}>
                  <PollChildContent
                    onAttach={(question, options, settings) => {
                      attachDeetItem({
                        type: "poll",
                        title: question,
                        detail: options.join(" · "),
                        options,
                        pollSettings: settings,
                      });
                      setActiveComposerChild(null);
                    }}
                    onCancel={() => setActiveComposerChild(null)}
                  />
                </DeetChildModal>
              ) : null}

              {/* ── Event modal ── */}
              {activeComposerChild === "event" ? (
                <DeetChildModal title="Add Event" onClose={() => setActiveComposerChild(null)}>
                  <EventChildContent
                    onAttach={(title, date, time, location) => {
                      attachDeetItem({ type: "event", title, detail: `${date}${time ? ` at ${time}` : ""}${location ? ` · ${location}` : ""}` });
                      setDeetSettings((prev) => ({ ...prev, postType: "news" as import("./components/deets/deetTypes").DeetPostType }));
                      setActiveComposerChild(null);
                    }}
                    onCancel={() => setActiveComposerChild(null)}
                  />
                </DeetChildModal>
              ) : null}

              {/* ── Check-in modal ── */}
              {activeComposerChild === "checkin" ? (
                <DeetChildModal title="Check In" onClose={() => setActiveComposerChild(null)}>
                  <CheckinChildContent
                    onAttach={(placeName, address) => {
                      attachDeetItem({ type: "checkin", title: `📍 ${placeName}`, detail: address || undefined });
                      setActiveComposerChild(null);
                    }}
                    onCancel={() => setActiveComposerChild(null)}
                  />
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
                <h4 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Discard this deet?</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">You have unsaved text or attached content. If you leave now, those changes will be lost.</p>
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
        <div className="fixed inset-0 z-[120] flex flex-col bg-black/90 lg:flex-row">
          {/* Image area */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 lg:p-6">
            {/* Close button */}
            <button type="button" onClick={closeViewer} className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 lg:right-6 lg:top-6">
              <X className="h-5 w-5 stroke-[1.8]" />
            </button>

            {/* Image counter */}
            {viewer.images.length > 1 ? (
              <div className="absolute left-4 top-4 z-20 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white lg:left-6 lg:top-6">
                {viewer.index + 1} / {viewer.images.length}
              </div>
            ) : null}

            {/* Navigation arrows */}
            {viewer.images.length > 1 ? (
              <>
                <button type="button" onClick={prevViewerImage} className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 lg:left-6">
                  <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
                </button>
                <button type="button" onClick={nextViewerImage} className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 lg:right-6">
                  <ChevronRight className="h-5 w-5 stroke-[1.8]" />
                </button>
              </>
            ) : null}

            {/* Image */}
            <img src={viewer.images[viewer.index]} alt="Hub photo" className="max-h-[85vh] max-w-[90vw] w-auto h-auto rounded-2xl object-contain lg:max-h-[85vh] lg:max-w-[90vw] lg:rounded-3xl" />
          </div>

          {/* Engagement panel — bottom sheet on mobile, sidebar on desktop */}
          <div className="shrink-0 rounded-t-2xl bg-[var(--ud-bg-card)] p-4 lg:flex lg:w-[360px] lg:flex-col lg:rounded-none lg:border-l lg:border-white/20 lg:p-5">
            <h3 className="text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">{viewer.title || "Photo"}</h3>
            <p className="mt-1 text-sm text-[var(--ud-text-secondary)] lg:mt-2">{viewer.body || "Shared from this hub."}</p>

            {/* Engagement metrics */}
            <div className="mt-3 flex items-center gap-4 text-sm text-[var(--ud-text-muted)] lg:mt-4">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                0 views
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                0 likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                0 comments
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-3 border-t border-[var(--ud-border)] pt-3 text-sm text-[var(--ud-text-secondary)] lg:mt-4 lg:pt-4">
              <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]">
                <Heart className={ICON} />
                Like
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]">
                <MessageSquare className={ICON} />
                Comment
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]">
                <Share2 className={ICON} />
                Share
              </button>
            </div>

            {/* Comments area — hidden on mobile for compact view */}
            {viewer.focusId && commentsByDeetId[viewer.focusId] ? (
              <div className="mt-3 hidden max-h-[200px] overflow-y-auto rounded-xl bg-[var(--ud-bg-subtle)] p-3 text-sm text-[var(--ud-text-muted)] lg:mt-4 lg:block space-y-2">
                <p className="font-medium text-[var(--ud-text-secondary)]">Comments</p>
                {commentsByDeetId[viewer.focusId].length === 0 ? (
                  <p className="mt-2 italic text-[var(--ud-text-muted)]">No comments yet. Be the first to comment.</p>
                ) : (
                  <div className="space-y-2">
                    {commentsByDeetId[viewer.focusId].map((comment) => (
                      <div key={comment.id} className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-[var(--ud-text-primary)]">{comment.authorName || "Anonymous"}</span>
                          <span className="text-[var(--ud-text-muted)]">{formatViewerCommentTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-[var(--ud-text-secondary)] mt-0.5">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 hidden max-h-[200px] overflow-y-auto rounded-xl bg-[var(--ud-bg-subtle)] p-3 text-sm text-[var(--ud-text-muted)] lg:mt-4 lg:block">
                <p className="font-medium text-[var(--ud-text-secondary)]">Comments</p>
                <p className="mt-2 italic text-[var(--ud-text-muted)]">No comments yet. Be the first to comment.</p>
              </div>
            )}

            {/* Show the post button */}
            {viewer.focusId ? (
              <button
                type="button"
                className={cn(BUTTON_PRIMARY, "mt-3 w-full lg:mt-auto")}
                onClick={() => {
                  closeViewer();
                  navigateToFocus(viewer.focusId!, "Posts");
                }}
              >
                Show the post
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isConnectEditorOpen ? (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#111111]/45 p-4">
          <div className={cn(CARD, "w-full max-w-md p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">Edit Connect</h3>
                <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">Add or update the links shown in this section.</p>
              </div>
              <button type="button" onClick={closeConnectEditor} className="rounded-full border border-[var(--ud-border)] p-2 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]" aria-label="Close connect editor">
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <SettingField label="Website">
                <input value={connectDraft.website} onChange={handleConnectChange("website")} placeholder="https://yourhub.com" className="w-full rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-sm text-[var(--ud-text-secondary)] outline-none ring-[var(--ud-brand-primary)] transition focus:ring-2" />
              </SettingField>
              <SettingField label="Facebook">
                <input value={connectDraft.facebook} onChange={handleConnectChange("facebook")} placeholder="facebook.com/yourhub" className="w-full rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-sm text-[var(--ud-text-secondary)] outline-none ring-[var(--ud-brand-primary)] transition focus:ring-2" />
              </SettingField>
              <SettingField label="Instagram">
                <input value={connectDraft.instagram} onChange={handleConnectChange("instagram")} placeholder="instagram.com/yourhub" className="w-full rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-sm text-[var(--ud-text-secondary)] outline-none ring-[var(--ud-brand-primary)] transition focus:ring-2" />
              </SettingField>
              <SettingField label="YouTube">
                <input value={connectDraft.youtube} onChange={handleConnectChange("youtube")} placeholder="youtube.com/@yourhub" className="w-full rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-sm text-[var(--ud-text-secondary)] outline-none ring-[var(--ud-brand-primary)] transition focus:ring-2" />
              </SettingField>
              <SettingField label="Phone / Contact">
                <input value={connectDraft.phone} onChange={handleConnectChange("phone")} placeholder="(555) 555-5555" className="w-full rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-sm text-[var(--ud-text-secondary)] outline-none ring-[var(--ud-brand-primary)] transition focus:ring-2" />
              </SettingField>
            </div>

            {connectError ? <p className="mt-4 text-sm text-[var(--ud-danger)]">{connectError}</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeConnectEditor} className={BUTTON_SECONDARY}>
                Cancel
              </button>
              <button type="button" onClick={saveConnect} disabled={isSavingConnect} className={cn(BUTTON_PRIMARY, isSavingConnect && "cursor-not-allowed opacity-75")}>
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
                <h3 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">Hub Admin Tools</h3>
                <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">This is a simple first pass for future admin management.</p>
              </div>
              <button type="button" onClick={() => setIsAdminsEditorOpen(false)} className="rounded-full border border-[var(--ud-border)] p-2 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]" aria-label="Close admin tools">
                <X className={ICON} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {["Add moderators", "Add users", "Create groups"].map((label) => (
                <button key={label} type="button" className="flex w-full items-center justify-between rounded-2xl border border-[var(--ud-border)] px-4 py-3 text-left text-sm font-medium text-[var(--ud-text-primary)] transition hover:border-[var(--ud-brand-primary)] hover:bg-[var(--ud-bg-subtle)]">
                  <span>{label}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Soon</span>
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

      {/* CTA Editor Modal */}
      {isCTAEditorOpen ? (
        <CTAEditorModal
          hubId={hub.id}
          existingCTAs={hubCTAs}
          onClose={() => setIsCTAEditorOpen(false)}
          onSaved={(saved) => setHubCTAs(saved)}
        />
      ) : null}

      {/* Custom Section Editor Modal */}
      {isSectionEditorOpen ? (
        <CustomSectionEditorModal
          hubId={hub.id}
          sections={customSections}
          onClose={() => setIsSectionEditorOpen(false)}
          onSaved={(saved) => setCustomSections(saved)}
        />
      ) : null}

      {/* Invite Modal */}
      {isInviteModalOpen ? (
        <InviteModal
          hubName={hubName}
          hubSlug={hub.slug}
          hubCategory={hub.category}
          hubId={hub.id}
          onClose={() => setIsInviteModalOpen(false)}
        />
      ) : null}

      {/* Delete Hub Modal */}
      {isDeleteHubModalOpen ? (
        <DeleteHubModal
          hubName={hubName}
          hubId={hub.id}
          onClose={() => setIsDeleteHubModalOpen(false)}
          onDeleted={() => {
            setIsDeleteHubModalOpen(false);
            // The deleteHub function will redirect to /dashboard
          }}
        />
      ) : null}
    </div>
  );
}
