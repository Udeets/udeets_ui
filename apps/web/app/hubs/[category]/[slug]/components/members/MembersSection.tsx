"use client";

import { AdminsSection } from "../sections/AdminsSection";
import { MembersSection as HubMembersSection, type MemberItem } from "../sections/MembersSection";

type MembersPeopleSectionProps = {
  activePeopleView: "members" | "admins";
  membersPanelMode: "list" | "invite";
  memberItems: MemberItem[];
  canAccessAdmins: boolean;
  headerHubName: string;
  memberCount: number;
  knownActivityCount: number;
  feedItemCount: number;
  announcementCount: number;
  photoDeetCount: number;
  totalViews: number;
  totalEngagement: number;
  activeAdminCount: number;
  eventCount: number;
  recentPhotoCount: number;
  onInviteMembers: () => void;
  onOpenSettings: () => void;
  onOpenAdminsEditor: () => void;
  onOpenPosts: () => void;
};

export function MembersSection({
  activePeopleView,
  membersPanelMode,
  memberItems,
  canAccessAdmins,
  headerHubName,
  memberCount,
  knownActivityCount,
  feedItemCount,
  announcementCount,
  photoDeetCount,
  totalViews,
  totalEngagement,
  activeAdminCount,
  eventCount,
  recentPhotoCount,
  onInviteMembers,
  onOpenSettings,
  onOpenAdminsEditor,
  onOpenPosts,
}: MembersPeopleSectionProps) {
  if (activePeopleView === "admins") {
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
        eventCount={eventCount}
        recentPhotoCount={recentPhotoCount}
        onInviteMembers={onInviteMembers}
        onOpenSettings={onOpenSettings}
        onOpenAdminsEditor={onOpenAdminsEditor}
        onOpenPosts={onOpenPosts}
      />
    ) : null;
  }

  return <HubMembersSection membersPanelMode={membersPanelMode} memberItems={memberItems} onInviteMembers={onInviteMembers} />;
}
