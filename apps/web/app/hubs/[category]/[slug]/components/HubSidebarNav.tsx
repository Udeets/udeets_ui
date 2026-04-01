"use client";

import { Home, MessageSquare, Paperclip, Settings, Users } from "lucide-react";
import type { HubTab } from "./hubTypes";
import type { PendingNavigation } from "./hubTypes";

const NAV_ITEMS: Array<{ tab: HubTab; label: string; icon: typeof Home }> = [
  { tab: "About", label: "About", icon: Home },
  { tab: "Posts", label: "Deets", icon: MessageSquare },
  { tab: "Attachments", label: "Attachments", icon: Paperclip },
  { tab: "Members", label: "Members", icon: Users },
];

export function HubSidebarNav({
  activeSection,
  isCreatorAdmin,
  onNavigate,
}: {
  activeSection: HubTab;
  isCreatorAdmin: boolean;
  onNavigate: (next: PendingNavigation) => void;
}) {
  return (
    <nav className="flex flex-col py-2">
      {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
        const isActive = activeSection === tab;
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
                ? "flex items-center gap-3 border-l-2 border-[#0C5C57] bg-[#f0faf8] px-4 py-2.5 text-[13px] font-medium text-[#0C5C57]"
                : "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-[13px] text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
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
            className="flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-[13px] text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </button>
        </>
      ) : null}
    </nav>
  );
}
