"use client";

import { Home, MessageSquare, Paperclip, Settings, Users, Calendar, Star, FileText, BarChart3 } from "lucide-react";
import type { HubTab } from "./hubTypes";
import type { PendingNavigation } from "./hubTypes";
import type { HubTemplateConfig } from "@/lib/hub-templates";

const TAB_ICON_MAP: Record<string, typeof Home> = {
  About: Home,
  Posts: MessageSquare,
  Attachments: Paperclip,
  Members: Users,
  Events: Calendar,
  Reviews: Star,
  Documents: FileText,
  Polls: BarChart3,
  Notices: MessageSquare,
  Settings: Settings,
};

const DEFAULT_NAV_ITEMS: Array<{ tab: HubTab; label: string; icon: typeof Home }> = [
  { tab: "About", label: "About", icon: Home },
  { tab: "Posts", label: "Deets", icon: MessageSquare },
  { tab: "Attachments", label: "Attachments", icon: Paperclip },
  { tab: "Members", label: "Members", icon: Users },
];

export function HubSidebarNav({
  activeSection,
  activePanel,
  isCreatorAdmin,
  canAccessFullContent = true,
  templateConfig,
  onNavigate,
}: {
  activeSection: HubTab;
  activePanel: string;
  isCreatorAdmin: boolean;
  canAccessFullContent?: boolean;
  templateConfig?: HubTemplateConfig;
  onNavigate: (next: PendingNavigation) => void;
}) {
  // Build nav items from template config, or use defaults
  const navItems = templateConfig
    ? templateConfig.tabs
        .filter((tab) => tab !== "Settings") // Settings is handled separately
        .map((tab) => ({
          tab,
          label:
            tab === "About"
              ? templateConfig.terminology.about
              : tab === "Posts"
                ? templateConfig.terminology.deets
                : tab === "Members"
                  ? templateConfig.terminology.members
                  : tab,
          icon: TAB_ICON_MAP[tab] ?? MessageSquare,
        }))
    : DEFAULT_NAV_ITEMS;

  const visibleItems = canAccessFullContent
    ? navItems
    : navItems.filter((item) => item.tab === "About");

  return (
    <nav className="flex flex-col py-2">
      {visibleItems.map(({ tab, label, icon: Icon }) => {
        const isActive = activeSection === tab && activePanel !== "settings";
        return (
          <button
            key={tab}
            type="button"
            onClick={() => {
              if (tab === "Members") {
                onNavigate({ tab, panel: "members", membersMode: "list", membersView: "members" });
              } else if (tab === "Attachments") {
                onNavigate({ tab, panel: "posts", attachmentsView: "photos" });
              } else {
                onNavigate({ tab, panel: "posts" });
              }
            }}
            className={
              isActive
                ? "flex items-center gap-3 border-l-2 border-[#0C5C57] bg-[#E3F1EF] px-4 py-2.5 text-[13px] font-medium text-[#0C5C57]"
                : "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-[13px] text-[#6b7280] transition-colors duration-150 hover:bg-[#fafafa] hover:text-[#0C5C57]"
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        );
      })}

      {isCreatorAdmin ? (
        <>
          <div className="mx-4 my-2 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => onNavigate({ tab: activeSection, panel: "settings" })}
            className={
              activePanel === "settings"
                ? "flex items-center gap-3 border-l-2 border-[#0C5C57] bg-[#E3F1EF] px-4 py-2.5 text-[13px] font-medium text-[#0C5C57]"
                : "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-[13px] text-[#6b7280] transition-colors duration-150 hover:bg-[#fafafa] hover:text-[#0C5C57]"
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </button>
        </>
      ) : null}
    </nav>
  );
}
