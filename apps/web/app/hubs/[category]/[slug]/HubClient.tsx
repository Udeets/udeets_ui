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
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader } from "@/components/udeets-navigation";
import type { HubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { AttachmentsSection } from "./components/attachments/AttachmentsSection";
import { HubHeroHeader } from "./components/HubHeroHeader";
import { HubTabBar } from "./components/HubTabBar";
import { MembersSection } from "./components/members/MembersSection";
import { AboutSection } from "./components/sections/AboutSection";
import { DeetsSection } from "./components/sections/DeetsSection";
import { SettingsSection } from "./components/sections/SettingsSection";
import { CreateDeetModal } from "./components/deets/CreateDeetModal";
import { DeetChildModal } from "./components/deets/DeetChildModal";
import { DeetSettingsModal } from "./components/deets/DeetSettingsModal";
import type { HubTab } from "./components/hubTypes";
import { useHubConnectFlow } from "./hooks/useHubConnectFlow";
import { useDeetComposer } from "./hooks/useDeetComposer";
import { useHubFilters } from "./hooks/useHubFilters";
import { useHubLiveFeed } from "./hooks/useHubLiveFeed";
import { useHubMediaFlow } from "./hooks/useHubMediaFlow";
import { useHubSettingsFlow } from "./hooks/useHubSettingsFlow";
import { useHubSectionState } from "./hooks/useHubSectionState";
import { useHubViewerState } from "./hooks/useHubViewerState";
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

  const dpInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const isCreatorAdmin = Boolean(user?.id && hub.createdBy && user.id === hub.createdBy);
  const canAccessAdmins = isCreatorAdmin;
  const creatorMetadata = user?.user_metadata;
  const creatorDisplayName = isCreatorAdmin ? creatorMetadata?.full_name || creatorMetadata?.name || user?.email || "You" : "Hub Creator";
  const creatorDetail = isCreatorAdmin ? user?.email || "Admin" : hub.createdBy ? `Admin • ${compactId(hub.createdBy)}` : "Admin";
  const creatorAvatarSrc = isCreatorAdmin && typeof creatorMetadata?.avatar_url === "string" ? creatorMetadata.avatar_url : "";
  const deetAuthorName =
    creatorMetadata?.full_name ||
    creatorMetadata?.name ||
    user?.email?.split("@")[0] ||
    "You";
  const [isJoined, setIsJoined] = useState(isCreatorAdmin);
  const { liveFeedItems, prependCreatedDeet } = useHubLiveFeed(hub.id);
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
  const recentPhotos = galleryImages.slice(0, 6);
  const displayCoverImageSrc = galleryImages.find((image) => image && image !== coverImageSrc) || coverImageSrc;
  const adminImages = (hub.adminImages ?? []).map(normalizePublicSrc).filter(Boolean);
  const albumChoices = galleryImages.filter((image) => image !== dpImageSrc && image !== coverImageSrc);
  const categoryMeta = categoryMetaFor(savedHubCategory);
  const CategoryIcon = categoryMeta.icon;
  const memberCount = Math.max(1, Number.parseInt(hub.membersLabel, 10) || 0);
  const headerHubName = hub.name?.trim() || hubName;
  const visibilityLabel: "Public" | "Private" = hub.visibility;
  const visibleTabs = HUB_TABS;
  const allFeedItems = [...liveFeedItems, ...hubContent.feed];
  const feedItemCount = allFeedItems.length;
  const totalEngagement = allFeedItems.reduce((sum, item) => sum + item.likes + item.comments, 0);
  const totalViews = allFeedItems.reduce((sum, item) => sum + item.views, 0);
  const announcementCount = allFeedItems.filter((item) => item.kind === "announcement" || item.kind === "notice").length;
  const photoDeetCount = allFeedItems.filter((item) => item.kind === "photo").length;
  const activeAdminCount = 1;
  const knownActivityCount = feedItemCount + hubContent.events.length + recentPhotos.length;
  const fileItems: string[] = [];
  const [memberItems, setMemberItems] = useState<Array<{ userId: string; role: string; fullName: string; avatarUrl: string | null; email: string | null }>>([]);
  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Step 1: get members
      const { data: members, error: membersError } = await supabase
        .from("hub_members")
        .select("user_id, role")
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
          return {
            userId: m.user_id,
            role: m.role,
            fullName: profile?.full_name ?? m.user_id.slice(0, 8),
            avatarUrl: profile?.avatar_url ?? null,
            email: profile?.email ?? null,
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
      }
    }

    init();
    return () => { ignore = true; };
  }, [hub.id]);
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
    handleDeetPhotoFiles,
    handleSubmitDeet,
  } = useDeetComposer({
    hubId: hub.id,
    hubSlug: hub.slug,
    demoComposerText,
    isCreatorAdmin,
    authorName: deetAuthorName,
    onDeetCreated: prependCreatedDeet,
  });

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

  const navigateToFocus = (focusId: string, tab?: HubTab) => {
    const params = new URLSearchParams();
    params.set("focus", focusId);
    if (tab) params.set("tab", tab);
    router.push(`${hubBaseHref}?${params.toString()}`, { scroll: false });
    if (tab) setActiveSection(tab);
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

  const handleMembershipAction = () => {
    setIsJoined((current) => !current);
  };

  const renderMainContent = () => {
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
          settingsSaveSuccess={settingsSaveSuccess}
          settingsSaveError={settingsSaveError}
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
          onInviteMembers={() => openCenterMembers("invite")}
          onOpenSettings={openSettingsPanel}
          onOpenAdminsEditor={() => setIsAdminsEditorOpen(true)}
          onOpenPosts={() => setActiveSection("Posts")}
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
          userRole={isCreatorAdmin ? "creator" : isJoined ? "member" : null}
          onMembershipAction={handleMembershipAction}
          onInviteMembers={() => openCenterMembers("invite")}
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
        onOpenComposer={openDeetComposer}
        onOpenViewer={openViewer}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <UdeetsHeader />

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-10">
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
          visibilityLabel={visibilityLabel}
          isJoined={isJoined}
          onMembershipActionClick={handleMembershipAction}
          onMembersClick={() => requestNavigation({ tab: "Members", panel: "members", membersMode: "list", membersView: "members" })}
          onInviteMembers={() => openCenterMembers("invite")}
          onOpenSettings={openSettingsPanel}
        />

        {mediaSuccess ? <p className="mt-3 text-sm font-medium text-[#0C5C57]">{mediaSuccess}</p> : null}
        {mediaError ? <p className="mt-3 text-sm font-medium text-[#B42318]">{mediaError}</p> : null}

        <HubTabBar
          visibleTabs={visibleTabs}
          activeSection={activeSection}
          activePanel={activePanel}
          membersPanelMode={membersPanelMode}
          activePeopleView={activePeopleView}
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
                  onClick={() => handleChooseFromAlbums(albumChoices)}
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
              <button type="button" onClick={closeConnectEditor} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Close connect editor">
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
