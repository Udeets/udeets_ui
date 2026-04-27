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
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { DeetSharePopover } from "@/components/deets/DeetSharePopover";
import { FeedPostBody } from "@/components/deets/FeedPostBody";
import { SafeDeetBody } from "@/components/deets/SafeDeetBody";
import { isGenericDeetTitle } from "@/lib/deets/deet-title";
import {
  DeetTypeContent,
  getStructuredHeadlineForFeed,
  headlineForHubFeedPoll,
  PollContent,
  resolveDeetType,
  StructuredDescriptionShell,
} from "./components/deets/feedDeetTypeBlocks";
import { EmojiReactButton, POST_ICON } from "./components/deets/feedEmojiReact";
import type { LocalFeedTag } from "./components/deets/deetTypes";
import { DeetsSection } from "./components/sections/DeetsSection";
import { EventsSection } from "./components/sections/EventsSection";
import { ReviewsSection } from "./components/sections/ReviewsSection";
import { SettingsSection } from "./components/sections/SettingsSection";
import { CreateDeetModal } from "./components/deets/CreateDeetModal";
import { DeetCommentsSection } from "./components/deets/DeetCommentsSection";
import type { DeetComment } from "@/lib/services/deets/deet-interactions";
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
  initials,
  normalizePublicSrc,
} from "./components/hubUtils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
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
  // Track description as local state so UI reflects saves without needing a route refresh.
  const [hubDescriptionState, setHubDescriptionState] = useState<string>(hub.description || "");
  const hubDescription = demoHubDescription || hubDescriptionState;
  // Cover image vertical offset (0–100). Defaults to 50 (center).
  const [coverImageOffsetY, setCoverImageOffsetY] = useState<number>(
    typeof hub.coverImageOffsetY === "number" ? hub.coverImageOffsetY : 50
  );
  const [dpImageOffsetY, setDpImageOffsetY] = useState<number>(
    typeof hub.dpImageOffsetY === "number" ? hub.dpImageOffsetY : 50
  );
  const [isAdminsEditorOpen, setIsAdminsEditorOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteHubModalOpen, setIsDeleteHubModalOpen] = useState(false);

  const dpInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  // ─── Role-based access ───
  const { role: hubRole, isMember: roleMember, isPending: rolePending } = useHubRole(hub.id, hub.createdBy ?? null);
  const canEditHub = can(hubRole, "hub:edit_settings");
  const canManageMembers = can(hubRole, "hub:manage_members");
  const canViewFullContent = can(hubRole, "hub:view_full_content");

  const isHubCreator = Boolean(user?.id && hub.createdBy && user.id === hub.createdBy);
  const isCreatorAdmin = isHubCreator || (hubRole === "admin" || hubRole === "super_admin");

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

  // Mark this hub as seen for the current user so dashboard unread can clear (best-effort RPC).
  useEffect(() => {
    if (!user?.id || !hub.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (cancelled) return;
        await supabase.rpc("mark_hub_seen", { p_hub_id: hub.id });
      } catch (err) {
        console.warn("[hub] mark_hub_seen failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, hub.id]);

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
      if (!data) {
        // No row: user is not in this hub (also covers navigating from another hub
        // where React kept prior isMember state — we must clear stale membership).
        setIsMember(false);
        setIsJoined(false);
        setIsPending(false);
      } else if (data.status === "active") {
        setIsMember(true);
        setIsJoined(true);
        setIsPending(false);
      } else if (data.status === "pending") {
        setIsMember(false);
        setIsJoined(false);
        setIsPending(true);
      } else {
        // invited or any future status: treat as not an active member for gating.
        setIsMember(false);
        setIsJoined(false);
        setIsPending(false);
      }
      setMembershipLoaded(true);
    }

    void checkMembership();
    return () => { ignore = true; };
  }, [hub.id, user?.id, isCreatorAdmin]);

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

  const { liveFeedItems, prependCreatedDeet, removeDeet, replaceFeedDeet } = useHubLiveFeed(hub.id, hub.createdBy);
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
    updateSettingsHubName,
    updateSettingsCategory,
    saveSettings,
    resetSettings,
  } = useHubSettingsFlow({
    hub,
    initialHubName,
    hubDescription,
    isCreatorAdmin,
    onAfterSave: (newCategory: string) => {
      // Refresh page with updated category in URL — this re-fetches server data
      // and resets all client state (including any pending navigation)
      router.replace(`/hubs/${newCategory}/${hub.slug}?tab=About`);
    },
  });
  const hubName = savedHubName;
  const hubBaseHref = `/hubs/${savedHubCategory || hub.category}/${hub.slug}`;
  const isPublicHub = settingsVisibility === "Public";
  const canCreateDeets =
    Boolean(user?.id) &&
    (isCreatorAdmin || (whoCanPost !== "Admins only" && (isPublicHub || isMember)));

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
  const headerHubName = hubName || hub.name?.trim() || "Hub";
  const visibilityLabel: "Public" | "Private" = settingsVisibility;
  const accentTheme = getHubColorTheme(hub.accentColor || "teal");

  // Inject author avatars into feed items (memoized so useDeetInteractions' feed effect does not
  // re-fire every render and race / overwrite reactions after a change.)
  // Prefer the live Supabase-backed list once it has loaded. Concatenating SSR `hubContent.feed`
  // with `liveFeedItems` duplicated every deet, so a client-side remove left the SSR copy visible
  // (and looked like delete failed after refresh if the DB was fine).
  const allFeedItems = useMemo(() => {
    const source = liveFeedItems.length > 0 ? liveFeedItems : hubContent.feed;
    return source.map((item) => ({
      ...item,
      authorAvatar:
        item.authorAvatar ||
        (item.authorId && item.authorId === hub.createdBy ? creatorAvatarSrc : undefined) ||
        undefined,
    }));
  }, [liveFeedItems, hubContent.feed, creatorAvatarSrc, hub.createdBy]);
  const {
    likedDeetIds,
    myReactionsByDeetId,
    likingDeetIds,
    likeCountOverrides,
    viewCountOverrides,
    handleToggleLike,
    handleIncrementView,
    reactorsByDeetId,
    reactionsModalDeetId,
    reactionsModalData,
    reactionsModalLoading,
    handleOpenReactionsModal,
    handleCloseReactionsModal,
    expandedCommentDeetId,
    commentsByDeetId,
    commentLoadingDeetIds,
    commentSubmittingDeetId,
    commentCountOverrides,
    commentError,
    handleToggleComments,
    openCommentsPanelForDeet,
    loadCommentsForDeetIfNeeded,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    viewersDeetId,
    viewersByDeetId,
    viewersLoading,
    handleToggleViewers,
    prefetchViewersForDeet,
  } = useDeetInteractions(allFeedItems);

  const recordShareForDeet = useCallback((deetId: string) => {
    void import("@/lib/services/deets/deet-interactions").then(({ recordDeetShare }) => {
      void recordDeetShare(deetId);
    });
  }, []);

  const [pageOrigin, setPageOrigin] = useState("");
  useEffect(() => {
    setPageOrigin(window.location.origin);
  }, []);

  const [viewerShareCopied, setViewerShareCopied] = useState(false);
  const viewerShareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashViewerShareCopied = useCallback(() => {
    setViewerShareCopied(true);
    if (viewerShareCopiedTimeoutRef.current) clearTimeout(viewerShareCopiedTimeoutRef.current);
    viewerShareCopiedTimeoutRef.current = setTimeout(() => setViewerShareCopied(false), 2000);
  }, []);

  const feedItemCount = allFeedItems.length;
  const totalEngagement = allFeedItems.reduce((sum, item) => sum + item.likes + item.comments, 0);
  const totalViews = allFeedItems.reduce((sum, item) => sum + item.views, 0);
  const announcementCount = allFeedItems.filter(
    (item) =>
      item.kind === "announcement" ||
      item.kind === "notice" ||
      item.kind === "survey" ||
      item.kind === "payment" ||
      item.kind === "alert",
  ).length;
  const photoDeetCount = allFeedItems.filter((item) => item.kind === "photo").length;
  const activeAdminCount = 1;
  const knownActivityCount = feedItemCount + hubContent.events.length + recentPhotos.length;
  const fileItems: string[] = [];
  const [memberItems, setMemberItems] = useState<Array<{ userId: string; role: string; fullName: string; avatarUrl: string | null; email: string | null; joinedAt: string | null }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ userId: string; fullName: string; avatarUrl: string | null; email: string | null; requestedAt?: string | null }>>([]);
  const [processingUserIds, setProcessingUserIds] = useState<Set<string>>(new Set());
  const [joinRequestToast, setJoinRequestToast] = useState<{ name: string; avatarUrl: string | null } | null>(null);

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

    const onVisibilityChange = () => {
      if (!ignore && document.visibilityState === "visible" && isCreatorAdmin) {
        void loadPendingRequests();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      ignore = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hub.id, isCreatorAdmin]);

  // Real-time: listen for new join requests so the creator gets a toast notification
  useEffect(() => {
    if (!isCreatorAdmin) return;

    let sub: { unsubscribe: () => void } | null = null;

    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      sub = supabase
        .channel(`hub-join-requests-${hub.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "hub_members", filter: `hub_id=eq.${hub.id}` },
          async (payload) => {
            const row = payload.new as { user_id: string; status: string; hub_id: string };
            if (row.status !== "pending") return;

            // Fetch profile info for the toast
            try {
              const { fetchProfilesForUsers } = await import("@/lib/services/members/manage-members");
              const profileMap = await fetchProfilesForUsers([row.user_id]);
              const profile = profileMap.get(row.user_id);
              const fullName = profile?.fullName ?? "Someone";
              const avatarUrl = profile?.avatarUrl ?? null;

              // Show toast
              setJoinRequestToast({ name: fullName, avatarUrl });

              // Add to pending list
              setPendingRequests((prev) => {
                if (prev.some((r) => r.userId === row.user_id)) return prev;
                return [...prev, {
                  userId: row.user_id,
                  fullName,
                  avatarUrl,
                  email: profile?.email ?? null,
                  requestedAt: new Date().toISOString(),
                }];
              });

              // Auto-dismiss toast after 6 seconds
              setTimeout(() => setJoinRequestToast(null), 6000);
            } catch (err) {
              console.error("[join-request-subscription]", err);
            }
          },
        )
        .subscribe();
    })();

    return () => {
      sub?.unsubscribe();
    };
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
      // Notify header to refresh notifications (clears bell dot)
      window.dispatchEvent(new Event("hub-members-changed"));
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
      // Notify header to refresh notifications (clears bell dot)
      window.dispatchEvent(new Event("hub-members-changed"));
    } catch (error) {
      console.error("[reject]", error);
    } finally {
      setProcessingUserIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  // ── Leave hub ──
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveHub = async () => {
    if (!user?.id) return;
    setIsLeaving(true);
    try {
      const { leaveHub } = await import("@/lib/services/members/manage-members");
      await leaveHub(hub.id, user.id);
      setIsMember(false);
      setIsJoined(false);
      setShowLeaveConfirm(false);
      window.dispatchEvent(new Event("hub-members-changed"));
      // Redirect to discover page after leaving
      const { default: routerModule } = await import("next/navigation");
      window.location.href = "/discover";
    } catch (error) {
      console.error("[leave-hub]", error);
    } finally {
      setIsLeaving(false);
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
    hasFocusTarget: Boolean(focusTarget),
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
  useBodyScrollLock(viewer.open);

  const [imageViewerViewersOpen, setImageViewerViewersOpen] = useState(false);
  useEffect(() => {
    if (!viewer.open) setImageViewerViewersOpen(false);
  }, [viewer.open]);

  useEffect(() => {
    if (!viewer.open || !viewer.focusId || viewer.commentContext) return;
    void loadCommentsForDeetIfNeeded(viewer.focusId);
  }, [viewer.open, viewer.focusId, viewer.commentContext, loadCommentsForDeetIfNeeded]);

  const [imageViewerComposerFooterVisible, setImageViewerComposerFooterVisible] = useState(false);
  useEffect(() => {
    if (!viewer.open || viewer.commentContext || !viewer.focusId) {
      setImageViewerComposerFooterVisible(false);
      return;
    }
    setImageViewerComposerFooterVisible(false);
  }, [viewer.open, viewer.focusId, viewer.commentContext]);

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
    composerPhase,
    selectComposerKindAndCompose,
    backToComposerPickStep,
    activeComposerChild,
    composerAccessoryPanel,
    setComposerAccessoryPanel,
    pickPhotosOnOpen,
    setPickPhotosOnOpen,
    composerKind,
    composerTitle,
    setComposerTitle,
    composerBodyHtml,
    setComposerBodyHtml,
    composerTypePayload,
    setComposerTypePayload,
    selectedPhotoPreviews,
    isSubmittingDeet,
    submitError,
    deetFormatting,
    isFontSizeMenuOpen,
    deetSettings,
    deetPhotoInputRef,
    setActiveComposerChild,
    setDeetFormatting,
    setIsFontSizeMenuOpen,
    setDeetSettings,
    openDeetComposer,
    closeDeetComposer,
    discardDeetComposer,
    removePhoto,
    handleDeetPhotoFiles,
    handleSubmitDeet,
    editingDeetId,
    editPersistedGalleryUrls,
    removePersistedGalleryPhoto,
  } = useDeetComposer({
    hubId: hub.id,
    hubSlug: hub.slug,
    demoComposerText,
    canCreateDeets,
    authorName: deetAuthorName,
    authorAvatarSrc: creatorAvatarSrc,
    userId: user?.id ?? null,
    onDeetCreated: prependCreatedDeet,
    onDeetUpdated: replaceFeedDeet,
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

      // Auto-expand comments if ?comments=1 is present (open, do not toggle closed)
      if (shouldOpenComments) {
        void openCommentsPanelForDeet(focusTarget);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeSection, focusTarget, shouldOpenComments, openCommentsPanelForDeet]);

  const navigateToFocus = (focusId: string, tab?: HubTab, opts?: { openComments?: boolean }) => {
    const params = new URLSearchParams();
    params.set("focus", focusId);
    if (opts?.openComments) params.set("comments", "1");
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
          hubName={hubName}
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
          currentUserId={user?.id}
          onLeaveHub={!isHubCreator ? () => setShowLeaveConfirm(true) : undefined}
          onMuteNotifications={() => { /* TODO: implement mute */ }}
          onReportHub={() => { /* TODO: implement report */ }}
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
          userRole={isHubCreator ? "creator" : isCreatorAdmin ? "admin" : isJoined ? "member" : isPending ? "pending" : null}
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
            setHubDescriptionState(desc);
          }}
          onOpenViewer={openViewer}
          customSections={customSections}
          onOpenSectionEditor={() => setIsSectionEditorOpen(true)}
          onLeaveHub={!isHubCreator ? () => setShowLeaveConfirm(true) : undefined}
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
        canCreateDeets={canCreateDeets}
        dpImageSrc={dpImageSrc}
        coverImageSrc={coverImageSrc}
        recentPhotos={recentPhotos}
        hubName={hubName}
        hubCategory={savedHubCategory}
        hubSlug={hub.slug}
        userAvatarSrc={currentUserAvatarSrc}
        userName={creatorDisplayName}
        currentUserId={user?.id}
        onOpenComposer={openDeetComposer}
        onOpenViewer={(images, index, title, body, focusId, commentContext) => openViewer(images, index, title, body, focusId, commentContext)}
        onDeleteDeet={removeDeet}
        likedDeetIds={likedDeetIds}
        myReactionsByDeetId={myReactionsByDeetId}
        likingDeetIds={likingDeetIds}
        likeCountOverrides={likeCountOverrides}
        onToggleLike={handleToggleLike}
        reactorsByDeetId={reactorsByDeetId}
        reactionsModalDeetId={reactionsModalDeetId}
        reactionsModalData={reactionsModalData}
        reactionsModalLoading={reactionsModalLoading}
        onOpenReactionsModal={handleOpenReactionsModal}
        onCloseReactionsModal={handleCloseReactionsModal}
        expandedCommentDeetId={expandedCommentDeetId}
        commentsByDeetId={commentsByDeetId}
        commentLoadingDeetIds={commentLoadingDeetIds}
        commentSubmittingDeetId={commentSubmittingDeetId}
        commentCountOverrides={commentCountOverrides}
        commentError={commentError}
        onToggleComments={handleToggleComments}
        onSubmitComment={handleSubmitComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        viewersDeetId={viewersDeetId}
        viewersByDeetId={viewersByDeetId}
        viewersLoading={viewersLoading}
        onToggleViewers={handleToggleViewers}
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
    <div className="min-h-screen bg-[var(--ud-bg-page)] pb-16 md:pb-0" style={themeVars}>
      <UdeetsHeader hubSettings={{
        isCreatorAdmin,
        onOpenSettings: isCreatorAdmin ? openSettingsPanel : undefined,
        onOpenSearch: () => {/* TODO: hub-specific search */},
      }} />

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
          creatorDisplayName={creatorDisplayName}
          onOpenMembers={() => openCenterMembers("list")}
          onInviteMembers={() => setIsInviteModalOpen(true)}
          onOpenAlerts={() => router.push(`/alerts?hub_id=${hub.id}`)}
          coverImageOffsetY={coverImageOffsetY}
          onSaveCoverOffsetY={async (percent) => {
            setCoverImageOffsetY(percent);
            try {
              const { updateHub } = await import("@/lib/services/hubs/update-hub");
              await updateHub(hub.id, { coverImageOffsetY: percent });
            } catch (err) {
              console.error("[hub] save cover offset failed:", err);
              // Best-effort: surface nothing. Next page load will re-read the DB value.
            }
          }}
          dpImageOffsetY={dpImageOffsetY}
          onSaveDpOffsetY={async (percent) => {
            setDpImageOffsetY(percent);
            try {
              const { updateHub } = await import("@/lib/services/hubs/update-hub");
              await updateHub(hub.id, { dpImageOffsetY: percent });
            } catch (err) {
              console.error("[hub] save dp offset failed:", err);
            }
          }}
        />

        {mediaSuccess ? <p className="px-4 pt-3 text-sm font-medium text-[var(--ud-brand-primary)]">{mediaSuccess}</p> : null}
        {mediaError ? <p className="px-4 pt-3 text-sm font-medium text-[var(--ud-danger)]">{mediaError}</p> : null}

        {/* Mobile horizontal tab bar: About, Posts, Events, Attachments */}
        <div className="flex border-b border-[var(--ud-border)] bg-[var(--ud-bg-card)] lg:hidden">
          {(["About", "Posts", "Events", "Attachments"] as const)
            .filter((tab) => canAccessFullContent || tab === "About")
            .map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === "Attachments") {
                    requestNavigation({ tab: tab as HubTab, panel: "posts", attachmentsView: "photos" });
                  } else {
                    requestNavigation({ tab: tab as HubTab, panel: "posts" });
                  }
                }}
                className={cn(
                  "flex-1 border-b-2 py-3 text-center text-sm font-medium transition",
                  activeSection === tab && activePanel !== "settings" && activePanel !== "members"
                    ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                    : "border-transparent text-[var(--ud-text-muted)] hover:text-[var(--ud-text-secondary)]"
                )}
              >
                {tab === "About" ? hubTemplateConfig.terminology.about : tab}
              </button>
            ))}
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
              pendingCount={pendingRequests.length}
              onNavigate={requestNavigation}
            />
          </aside>

          {/* Content area */}
          <main className="min-h-[calc(100vh-200px)] min-w-0 bg-[var(--ud-bg-subtle)] p-3 sm:p-6">
            {renderMainContent()}
          </main>
        </div>
      </div>

      {!isDemoPreview ? <UdeetsFooter /> : null}
      {/* Bottom nav only shows on /dashboard, not inside hub pages */}

      {/* Join Request Toast — shown to creator when someone requests to join */}
      {joinRequestToast ? (
        <div className="fixed right-4 top-20 z-[250] animate-[slideDown_300ms_ease-out] rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-xl sm:right-8">
          <div className="flex items-center gap-3">
            {joinRequestToast.avatarUrl ? (
              <img src={joinRequestToast.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                {joinRequestToast.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{joinRequestToast.name}</p>
              <p className="text-xs text-gray-500">wants to join your hub</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setJoinRequestToast(null);
                requestNavigation({ tab: "Members", panel: "members" });
              }}
              className="ml-4 rounded-full bg-[var(--ud-brand-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setJoinRequestToast(null)}
              className="ml-1 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      ) : null}

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
                  View Posts
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

      {/* Leave Hub Confirmation Modal */}
      {showLeaveConfirm ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Leave {hubName}?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to leave this hub? You&apos;ll lose access to all content and will need to rejoin.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLeaveHub}
                disabled={isLeaving}
                className="w-full rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isLeaving ? "Leaving..." : "Leave Hub"}
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="text-sm font-medium text-gray-500 transition hover:text-gray-700"
              >
                Cancel
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
              submitError={submitError}
              composerEntryStep={composerPhase}
              onBackToPickStep={backToComposerPickStep}
              onPickComposerKind={selectComposerKindAndCompose}
              composerKind={composerKind}
              composerTitle={composerTitle}
              onComposerTitleChange={setComposerTitle}
              draftText={composerBodyHtml}
              onDraftTextChange={setComposerBodyHtml}
              composerTypePayload={composerTypePayload}
              onComposerTypePayloadChange={setComposerTypePayload}
              formatting={deetFormatting}
              onFormattingChange={(next) => {
                setDeetFormatting(next);
                if (isFontSizeMenuOpen) setIsFontSizeMenuOpen(false);
              }}
              isFontSizeMenuOpen={isFontSizeMenuOpen}
              onToggleFontSizeMenu={() => setIsFontSizeMenuOpen((current) => !current)}
              onCloseFontSizeMenu={() => setIsFontSizeMenuOpen(false)}
              selectedPhotoPreviews={selectedPhotoPreviews}
              onRemovePhoto={removePhoto}
              onClose={closeDeetComposer}
              onSubmit={handleSubmitDeet}
              isSubmitting={isSubmittingDeet}
              deetPhotoInputRef={deetPhotoInputRef}
              onPhotoFilesChange={handleDeetPhotoFiles}
              pickPhotosOnOpen={pickPhotosOnOpen}
              onConsumePickPhotosIntent={() => setPickPhotosOnOpen(false)}
              deetSettings={deetSettings}
              onDeetSettingsChange={setDeetSettings}
              composerAccessoryPanel={composerAccessoryPanel}
              onComposerAccessoryChange={setComposerAccessoryPanel}
              isEditMode={Boolean(editingDeetId)}
              editPersistedGalleryUrls={editPersistedGalleryUrls}
              onRemovePersistedGalleryPhoto={removePersistedGalleryPhoto}
              authorName={deetAuthorName}
              authorAvatarSrc={creatorAvatarSrc}
              onSetPostType={(tag) =>
                setDeetSettings((prev) => ({
                  ...prev,
                  localFeedTag: tag === "post" ? null : (tag as LocalFeedTag),
                }))
              }
              currentPostType={deetSettings.localFeedTag ?? undefined}
            />,
            document.body
          )
        : null}

      {composerOpen && activeComposerChild === "quit_confirm" && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[230] flex items-center justify-center bg-[rgba(15,23,42,0.72)] p-4">
              <div className={cn(CARD, "w-full max-w-sm p-5")}>
                <h4 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
                  {editingDeetId ? "Discard your changes?" : "Discard this deet?"}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
                  {editingDeetId
                    ? "You have unsaved edits to this post. If you leave now, those changes will be lost."
                    : "You have unsaved text or attached content. If you leave now, those changes will be lost."}
                </p>
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
        <div className="fixed inset-0 z-[120] flex min-h-0 min-w-0 flex-col overflow-x-hidden bg-black/90 lg:flex-row">
          {/* Image area — min-w-0 so huge intrinsic image widths cannot blow out the row and clip the sidebar */}
          <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-4 lg:min-h-0 lg:flex-1 lg:p-6">
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

            {/* Image — max-w-full respects flex column width (min-w-0 ancestor); avoids pushing reactions panel off-screen */}
            <img
              src={viewer.images[viewer.index]}
              alt="Hub photo"
              className="h-auto max-h-[85vh] w-auto max-w-full rounded-2xl object-contain lg:max-h-[85vh] lg:rounded-3xl"
            />
          </div>

          {/* Engagement panel — grows to use remaining height (mobile) / full viewport (desktop) */}
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-t-2xl bg-[var(--ud-bg-card)] p-4 lg:h-full lg:min-h-0 lg:w-[360px] lg:max-w-[360px] lg:shrink-0 lg:grow-0 lg:flex-none lg:self-stretch lg:rounded-none lg:border-l lg:border-white/20 lg:p-5">
            {viewer.commentContext ? (
              /* ── Comment image sidebar ── */
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {/* Comment author */}
                <div className="flex shrink-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                    {viewer.commentContext.authorAvatar ? (
                      <img src={viewer.commentContext.authorAvatar} alt={viewer.commentContext.authorName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]">
                        {viewer.commentContext.authorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ud-text-primary)]">{viewer.commentContext.authorName}</p>
                    <p className="text-xs text-[var(--ud-text-muted)]">{formatViewerCommentTime(viewer.commentContext.createdAt)}</p>
                  </div>
                </div>

                {/* Comment body */}
                {viewer.commentContext.body && viewer.commentContext.body !== "📷" ? (
                  <p className="mt-3 shrink-0 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{viewer.commentContext.body}</p>
                ) : null}

                {/* Action buttons */}
                <div className="mt-3 flex shrink-0 items-center gap-3 border-t border-[var(--ud-border)] pt-3 text-sm text-[var(--ud-text-secondary)] lg:mt-4 lg:pt-4">
                  {viewer.commentContext.reactedEmoji ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ud-brand-primary)]">
                      <span className="text-base">{viewer.commentContext.reactedEmoji}</span>
                      {({ "👍": "Liked", "❤️": "Loved", "😂": "Haha", "😮": "Surprised", "😢": "Sad", "🙏": "Thanks" })[viewer.commentContext.reactedEmoji] ?? "Reacted"}
                    </span>
                  ) : (
                    <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]">
                      <Heart className={ICON} />
                      React
                    </button>
                  )}
                  <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]">
                    <MessageSquare className={ICON} />
                    Reply
                  </button>
                </div>

                {/* Replies to this comment */}
                {viewer.commentContext.replies && viewer.commentContext.replies.length > 0 ? (
                  <div className="mt-3 hidden min-h-0 flex-1 overflow-y-auto rounded-xl bg-[var(--ud-bg-subtle)] p-3 text-sm lg:mt-4 lg:block lg:min-h-0 space-y-3">
                    <p className="text-xs font-medium text-[var(--ud-text-muted)]">{viewer.commentContext.replies.length} {viewer.commentContext.replies.length === 1 ? "reply" : "replies"}</p>
                    {viewer.commentContext.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                          {reply.authorAvatar ? (
                            <img src={reply.authorAvatar} alt={reply.authorName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[8px] font-bold text-[var(--ud-brand-primary)]">
                              {reply.authorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[var(--ud-text-primary)]">{reply.authorName}</span>
                            <span className="text-[10px] text-[var(--ud-text-muted)]">{formatViewerCommentTime(reply.createdAt)}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--ud-text-secondary)]">{reply.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 hidden min-h-0 flex-1 rounded-xl bg-[var(--ud-bg-subtle)] p-3 text-sm lg:mt-4 lg:block lg:min-h-0">
                    <p className="text-xs italic text-[var(--ud-text-muted)]">No replies yet</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Post image sidebar ── */
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {viewer.focusId ? (() => {
                  const fi = allFeedItems.find((f) => f.id === viewer.focusId) ?? null;
                  if (!fi) {
                    return (
                      <>
                        <h3 className="shrink-0 text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">
                          {viewer.title || "Photo"}
                        </h3>
                        {viewer.body?.trim() ? (
                          <SafeDeetBody
                            source={viewer.body}
                            className="mt-1 shrink-0 text-sm text-[var(--ud-text-secondary)] lg:mt-2"
                          />
                        ) : (
                          <p className="mt-1 shrink-0 text-sm text-[var(--ud-text-secondary)] lg:mt-2">Shared from this hub.</p>
                        )}
                      </>
                    );
                  }
                  const deetType = resolveDeetType(fi.kind, fi.deetAttachments);
                  const hasRichSection = Boolean(deetType && fi.deetAttachments?.some((a) => a.type === deetType));
                  const showStructuredRichBody = Boolean(hasRichSection && deetType && deetType !== "poll");
                  const structuredHeadline = deetType
                    ? getStructuredHeadlineForFeed(deetType, fi.deetAttachments, fi.title)
                    : null;
                  const headline =
                    deetType === "poll"
                      ? headlineForHubFeedPoll(structuredHeadline, fi.deetAttachments, fi.title)
                      : structuredHeadline ||
                        (fi.title?.trim() && !isGenericDeetTitle(fi.title) ? fi.title.trim() : null);
                  const isPlainFeedPost = deetType === null;
                  const showPollDescriptionBody = Boolean(deetType === "poll" && fi.body?.trim());
                  const showBodyBlock = Boolean(fi.body?.trim() && (!hasRichSection || showPollDescriptionBody));
                  const hasTextBlock = Boolean(headline || showBodyBlock || deetType);
                  const typeBlockSpacing = headline || showBodyBlock ? "mt-3" : "mt-1";

                  return (
                    <div
                      className={cn(
                        "min-h-0 max-h-[42vh] shrink-0 overflow-y-auto pr-1 lg:max-h-[min(60vh,520px)] lg:pr-0",
                        hasTextBlock && "min-h-[80px]",
                      )}
                    >
                      {headline ? (
                        <h3 className="text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">{headline}</h3>
                      ) : null}
                      {showBodyBlock ? (
                        deetType === "poll" ? (
                          <StructuredDescriptionShell type="poll" className={headline ? "mt-2" : "mt-3"}>
                            <FeedPostBody
                              body={fi.body}
                              title={fi.title}
                              dedupeBodyAgainstTitle={false}
                              className="text-sm leading-relaxed text-[var(--ud-text-secondary)]"
                            />
                          </StructuredDescriptionShell>
                        ) : isPlainFeedPost ? (
                          <StructuredDescriptionShell type="post" className={headline ? "mt-2" : "mt-3"}>
                            <FeedPostBody
                              body={fi.body}
                              title={fi.title}
                              dedupeBodyAgainstTitle={false}
                              className="text-sm leading-relaxed text-[var(--ud-text-secondary)]"
                            />
                          </StructuredDescriptionShell>
                        ) : (
                          <FeedPostBody
                            body={fi.body}
                            title={fi.title}
                            dedupeBodyAgainstTitle
                            className={cn(
                              "text-sm leading-relaxed text-[var(--ud-text-secondary)]",
                              headline ? "mt-2" : "mt-3",
                            )}
                          />
                        )
                      ) : null}
                      {deetType === "poll" ? (
                        <div className={typeBlockSpacing}>
                          <PollContent
                            deetId={fi.id}
                            attachments={fi.deetAttachments}
                            className={showPollDescriptionBody ? "mt-2" : undefined}
                          />
                        </div>
                      ) : deetType ? (
                        <div className={typeBlockSpacing}>
                          <DeetTypeContent
                            type={deetType}
                            attachments={fi.deetAttachments}
                            bodyHtml={showStructuredRichBody ? fi.body : undefined}
                            deetId={fi.id}
                            currentUserId={user?.id}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })() : (
                  <>
                    <h3 className="shrink-0 text-base font-semibold tracking-tight text-[var(--ud-text-primary)]">
                      {viewer.title || "Photo"}
                    </h3>
                    {viewer.body?.trim() ? (
                      <SafeDeetBody
                        source={viewer.body}
                        className="mt-1 shrink-0 text-sm text-[var(--ud-text-secondary)] lg:mt-2"
                      />
                    ) : (
                      <p className="mt-1 shrink-0 text-sm text-[var(--ud-text-secondary)] lg:mt-2">Shared from this hub.</p>
                    )}
                  </>
                )}

                {/* Engagement metrics — Views & Reactions only (comments list is below) */}
                {viewer.focusId
                  ? (() => {
                      const fid = viewer.focusId;
                      const fi = allFeedItems.find((f) => f.id === fid) ?? null;
                      const viewCount = fi ? fi.views + (viewCountOverrides[fi.id] ?? 0) : 0;
                      const reactionCount = fi ? (likeCountOverrides[fi.id] ?? fi.likes) : 0;
                      const canSeeViewers = Boolean(
                        user?.id && fi && (user.id === fi.authorId || isCreatorAdmin),
                      );
                      const reactionsLabel = reactionCount === 1 ? "Reaction" : "Reactions";
                      const viewsControl = canSeeViewers ? (
                        <button
                          type="button"
                          onClick={() => {
                            void prefetchViewersForDeet(fid);
                            setImageViewerViewersOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md py-0.5 text-left text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-text-primary)] motion-reduce:transition-none"
                          aria-label={`${viewCount} Views. Open list of viewers.`}
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="font-semibold tabular-nums text-[var(--ud-text-primary)]">{viewCount}</span>
                          <span> Views</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--ud-text-muted)]">
                          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="font-semibold tabular-nums text-[var(--ud-text-primary)]">{viewCount}</span>
                          <span> Views</span>
                        </span>
                      );
                      return (
                        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--ud-text-muted)] lg:mt-4">
                          {viewsControl}
                          <span className="text-[var(--ud-text-muted)]" aria-hidden>
                            ·
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleOpenReactionsModal(fid)}
                            className="rounded-md py-0.5 text-left text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-text-primary)] motion-reduce:transition-none"
                            aria-label={`${reactionCount} ${reactionsLabel}. Open list of people who reacted.`}
                          >
                            <span className="font-semibold tabular-nums text-[var(--ud-text-primary)]">{reactionCount}</span>
                            <span> {reactionsLabel}</span>
                          </button>
                        </div>
                      );
                    })()
                  : null}

                {/* Actions — same behavior as feed card (react / comment / share) */}
                {viewer.focusId ? (
                  <div className="mt-3 flex shrink-0 gap-1 border-t border-[var(--ud-border)] pt-3 sm:gap-2 lg:mt-4 lg:pt-4">
                    {(() => {
                      const vItem = allFeedItems.find((f) => f.id === viewer.focusId) ?? null;
                      const viewerCommentsOn = vItem?.deetOptions?.commentsEnabled !== false;
                      const viewerReactionsOn = vItem?.deetOptions?.reactionsEnabled !== false;
                      const shareTitle = ((vItem?.title ?? viewer.title ?? "").trim() || "Post");
                      return (
                        <>
                          <div className="min-w-0 flex-1 rounded-lg motion-reduce:active:scale-100">
                            <EmojiReactButton
                              deetId={viewer.focusId}
                              isLiked={likedDeetIds?.has(viewer.focusId) ?? false}
                              isLiking={likingDeetIds?.has(viewer.focusId) ?? false}
                              onToggleLike={handleToggleLike}
                              syncedReaction={myReactionsByDeetId[viewer.focusId] ?? null}
                              interactionsEnabled={viewerReactionsOn}
                              triggerClassName="max-sm:min-h-[44px] w-full rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
                            />
                          </div>
                          <button
                            type="button"
                            aria-expanded={imageViewerComposerFooterVisible}
                            disabled={!viewerCommentsOn}
                            title={!viewerCommentsOn ? "Comments are turned off for this post" : undefined}
                            onClick={() => {
                              if (!viewerCommentsOn) return;
                              setImageViewerComposerFooterVisible((open) => !open);
                            }}
                            className={cn(
                              "flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors motion-reduce:transition-none sm:min-h-0 sm:py-2.5 active:scale-[0.98] motion-reduce:active:scale-100",
                              imageViewerComposerFooterVisible
                                ? "font-semibold text-[var(--ud-brand-primary)]"
                                : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]",
                              !viewerCommentsOn && "cursor-not-allowed opacity-50 hover:bg-transparent",
                            )}
                          >
                            <MessageSquare className={POST_ICON} />
                            <span>Comment</span>
                          </button>
                          <DeetSharePopover
                            shareUrl={`${pageOrigin}${hubBaseHref}?focus=${viewer.focusId}`}
                            title={shareTitle}
                            deetId={viewer.focusId}
                            onRecordShare={recordShareForDeet}
                            onCopySuccess={flashViewerShareCopied}
                            copied={viewerShareCopied}
                            triggerClassName="max-sm:min-h-[44px] rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
                          />
                        </>
                      );
                    })()}
                  </div>
                ) : null}

                {viewer.focusId ? (
                  <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                    <div className="flex shrink-0 items-baseline justify-between gap-2 px-0.5">
                      <p className="font-medium text-[var(--ud-text-secondary)]">Comments</p>
                      <span className="text-xs tabular-nums text-[var(--ud-text-muted)]">
                        {(() => {
                          const fi = allFeedItems.find((f) => f.id === viewer.focusId) ?? null;
                          const n = fi ? fi.comments + (commentCountOverrides[fi.id] ?? 0) : 0;
                          return `${n} ${n === 1 ? "Comment" : "Comments"}`;
                        })()}
                      </span>
                    </div>
                    <DeetCommentsSection
                      key={viewer.focusId}
                      layout="embedded"
                      deetId={viewer.focusId}
                      allowNewComments={
                        (allFeedItems.find((f) => f.id === viewer.focusId)?.deetOptions?.commentsEnabled !== false)
                      }
                      comments={commentsByDeetId[viewer.focusId] ?? []}
                      isLoading={commentLoadingDeetIds.has(viewer.focusId)}
                      isSubmitting={commentSubmittingDeetId === viewer.focusId}
                      error={commentError}
                      currentUserId={user?.id}
                      onSubmitComment={handleSubmitComment}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      showComposerFooter={imageViewerComposerFooterVisible}
                      onRequestComposerFooter={() => setImageViewerComposerFooterVisible(true)}
                      onDismissComposerFooter={() => setImageViewerComposerFooterVisible(false)}
                      autoFocusComposer={imageViewerComposerFooterVisible}
                      onOpenViewer={(images, index, comment) => {
                        if (comment) {
                          const clientReaction =
                            (comment as DeetComment & { _clientReaction?: string | null })._clientReaction ?? null;
                          openViewer(images, index, "", "", undefined, {
                            commentId: comment.id,
                            authorName: comment.authorName ?? "User",
                            authorAvatar: comment.authorAvatar,
                            body: comment.body,
                            createdAt: comment.createdAt,
                            reactedEmoji: clientReaction,
                            replies: comment.replies?.map((r) => ({
                              id: r.id,
                              authorName: r.authorName ?? "User",
                              authorAvatar: r.authorAvatar,
                              body: r.body,
                              createdAt: r.createdAt,
                            })),
                          });
                        } else {
                          openViewer(images, index, viewer.title, viewer.body, viewer.focusId);
                        }
                      }}
                      userAvatarSrc={currentUserAvatarSrc}
                      userName={
                        currentUserProfile?.fullName ||
                        (user?.user_metadata?.full_name as string | undefined) ||
                        user?.email?.split("@")[0] ||
                        "You"
                      }
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {imageViewerViewersOpen && viewer.focusId && !viewer.commentContext ? (
            <div
              className="fixed inset-0 z-[125] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hub-image-viewer-viewers-title"
              onClick={() => setImageViewerViewersOpen(false)}
            >
              <div
                className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] px-5 py-3.5">
                  <h3 id="hub-image-viewer-viewers-title" className="text-base font-semibold text-[var(--ud-text-primary)]">
                    Viewers
                  </h3>
                  <button
                    type="button"
                    onClick={() => setImageViewerViewersOpen(false)}
                    className="rounded-full p-1 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
                    aria-label="Close viewers"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-[min(60vh,320px)] overflow-y-auto">
                  {viewersLoading && !(viewer.focusId in viewersByDeetId) ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-text-muted)]" />
                    </div>
                  ) : (viewersByDeetId[viewer.focusId] ?? []).length > 0 ? (
                    <div className="py-1">
                      {(viewersByDeetId[viewer.focusId] ?? []).map((v) => (
                        <div key={v.userId} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                            <ImageWithFallback
                              src={v.avatar || ""}
                              sources={v.avatar ? [v.avatar] : []}
                              alt={v.name}
                              className="h-full w-full object-cover"
                              fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                              fallback={initials(v.name)}
                            />
                          </div>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ud-text-primary)]">{v.name}</span>
                          <span className="shrink-0 text-xs text-[var(--ud-text-muted)]">
                            {v.viewedAt ? new Date(v.viewedAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-center text-sm text-[var(--ud-text-muted)]">No views yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
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
          hubCategory={savedHubCategory}
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
