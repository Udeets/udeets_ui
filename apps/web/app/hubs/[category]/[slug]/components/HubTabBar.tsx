"use client";

import { CARD, cn } from "./hubUtils";
import type { HubPanel, HubTab, PendingNavigation } from "./hubTypes";

export function HubTabBar({
  visibleTabs,
  activeSection,
  activePanel,
  membersPanelMode,
  activePeopleView,
  onNavigate,
}: {
  visibleTabs: HubTab[];
  activeSection: HubTab;
  activePanel: HubPanel;
  membersPanelMode: "list" | "invite";
  activePeopleView: "members" | "admins";
  onNavigate: (next: PendingNavigation) => void;
}) {
  return (
    <section className={cn(CARD, "mt-6 p-2")}>
      <div className="flex w-full items-center justify-between gap-1 whitespace-nowrap">
        {visibleTabs.map((tab) => {
          const isActive =
            (tab === "Members" &&
              (activePanel === "members" || activePanel === "invite") &&
              membersPanelMode !== undefined &&
              activePeopleView !== undefined) ||
            (tab !== "Members" && activePanel === "posts" && activeSection === tab);

          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === "Members") {
                  onNavigate({ tab, panel: "members", membersMode: "list", membersView: "members" });
                  return;
                }
                if (tab === "Attachments") {
                  onNavigate({ tab, panel: "posts", attachmentsView: "photos" });
                  return;
                }
                onNavigate({ tab, panel: "posts" });
              }}
              aria-label={tab === "Posts" ? "Deets" : tab}
              title={tab === "Posts" ? "Deets" : tab}
              className={cn(
                "flex-1 rounded-lg px-2 py-2.5 text-center text-[12px] font-semibold tracking-tight transition-colors duration-150 sm:px-2.5 sm:text-[13px] lg:text-sm",
                isActive ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]" : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-brand-light)] hover:text-[var(--ud-brand-primary)]"
              )}
            >
              {tab === "Posts" ? "Deets" : tab}
            </button>
          );
        })}
      </div>
    </section>
  );
}
