"use client";

import { useEffect, useState } from "react";
import type { HubPanel, HubTab, PendingNavigation } from "../components/hubTypes";
import { HUB_TABS } from "../components/hubUtils";

type UseHubSectionStateArgs = {
  requestedTab: string | null;
  canAccessAdmins: boolean;
  isDirty: boolean;
  /**
   * When present (from ?focus= in the URL) we default to the Posts tab so the
   * deet feed is rendered and the caller's scroll-to-deet effect can find
   * the element. Without this, notification clicks that only specify focus
   * would land on About and silently miss the deet.
   */
  hasFocusTarget?: boolean;
};

function normalizeRequestedTab(requestedTab: string | null, hasFocusTarget = false): HubTab {
  if (!requestedTab) return hasFocusTarget ? "Posts" : "About";
  if (requestedTab === "Photos" || requestedTab === "Files") return "Attachments";
  if (requestedTab === "Admins") return "Members";
  if (requestedTab === "Events") return "Posts";
  return HUB_TABS.includes(requestedTab as HubTab) ? (requestedTab as HubTab) : "About";
}

export function useHubSectionState({
  requestedTab,
  canAccessAdmins,
  isDirty,
  hasFocusTarget = false,
}: UseHubSectionStateArgs) {
  const initialActiveSection = normalizeRequestedTab(requestedTab, hasFocusTarget);

  const [activeSection, setActiveSection] = useState<HubTab>(initialActiveSection);
  const [activePanel, setActivePanel] = useState<HubPanel>("posts");

  // Reset tab when URL search params change (e.g. after settings save redirect)
  useEffect(() => {
    setActiveSection(normalizeRequestedTab(requestedTab, hasFocusTarget));
  }, [requestedTab, hasFocusTarget]);
  const [membersPanelMode, setMembersPanelMode] = useState<"list" | "invite">("list");
  const [activePeopleView, setActivePeopleView] = useState<"members" | "admins">(
    requestedTab === "Admins" && canAccessAdmins ? "admins" : "members"
  );
  const [activeAttachmentView, setActiveAttachmentView] = useState<"photos" | "files">(
    requestedTab === "Files" ? "files" : "photos"
  );
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [isUnsavedChangesOpen, setIsUnsavedChangesOpen] = useState(false);
  const resolvedActivePeopleView =
    !canAccessAdmins && activePeopleView === "admins" ? "members" : activePeopleView;

  const applyNavigation = ({ tab, panel, membersMode, membersView, attachmentsView }: PendingNavigation) => {
    setActiveSection(tab);
    if (membersMode) setMembersPanelMode(membersMode);
    if (membersView) setActivePeopleView(canAccessAdmins || membersView === "members" ? membersView : "members");
    if (attachmentsView) setActiveAttachmentView(attachmentsView);
    setActivePanel(panel);
  };

  const requestNavigation = (next: PendingNavigation) => {
    const sameSection = activeSection === next.tab;
    const samePanel = activePanel === next.panel;
    const sameMembersMode = next.membersMode ? membersPanelMode === next.membersMode : true;
    const sameMembersView = next.membersView ? resolvedActivePeopleView === next.membersView : true;
    const sameAttachmentView = next.attachmentsView ? activeAttachmentView === next.attachmentsView : true;

    if (sameSection && samePanel && sameMembersMode && sameMembersView && sameAttachmentView) return;

    if (isDirty) {
      setPendingNavigation(next);
      setIsUnsavedChangesOpen(true);
      return;
    }

    applyNavigation(next);
  };

  return {
    activeSection,
    setActiveSection,
    activePanel,
    membersPanelMode,
    activePeopleView: resolvedActivePeopleView,
    activeAttachmentView,
    pendingNavigation,
    setPendingNavigation,
    isUnsavedChangesOpen,
    setIsUnsavedChangesOpen,
    applyNavigation,
    requestNavigation,
  };
}
