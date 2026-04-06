"use client";

import { Camera, Calendar, FileText, MapPin, Megaphone, Smile, BarChart3 } from "lucide-react";
import { cn } from "../hubUtils";
import type { ComposerChildFlow } from "./deetTypes";

const ACTION_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)] hover:text-[var(--ud-brand-primary)]";
const ACTION_ICON_CLS = "h-[18px] w-[18px] stroke-[1.5]";

export function DeetComposerCard({
  isDemoPreview,
  isCreatorAdmin,
  onOpenComposer,
}: {
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
}) {
  const actionButtons: Array<{
    key: Exclude<ComposerChildFlow, "quit_confirm" | "settings">;
    icon: typeof Camera;
    label: string;
  }> = [
    { key: "photo", icon: Camera, label: "Photo" },
    { key: "emoji", icon: Smile, label: "Sticker" },
    { key: "announcement", icon: Megaphone, label: "Announcement" },
    { key: "notice", icon: FileText, label: "Notice" },
    { key: "poll", icon: BarChart3, label: "Poll" },
    { key: "event", icon: Calendar, label: "Event" },
    { key: "checkin", icon: MapPin, label: "Check-in" },
  ];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
      {/* Compose input row */}
      <div
        data-demo-target={isDemoPreview ? "hub-composer-section" : undefined}
        className="px-4 py-3"
      >
        <button
          type="button"
          data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
          disabled={!isCreatorAdmin}
          onClick={() => onOpenComposer()}
          className={cn(
            "h-10 w-full rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-4 text-left text-sm text-[var(--ud-text-muted)] transition",
            isCreatorAdmin
              ? "hover:border-[var(--ud-border-focus)] hover:bg-[var(--ud-bg-input)]"
              : "cursor-not-allowed opacity-60"
          )}
        >
          Write something...
        </button>
      </div>

      {/* Quick-action icon row */}
      <div className="flex items-center justify-around border-t border-[var(--ud-border-subtle)] px-1 py-1.5 overflow-x-auto">
        {actionButtons.map(({ key, icon: Icon, label }, idx) => (
          <button
            key={`${key}-${idx}`}
            type="button"
            disabled={!isCreatorAdmin}
            onClick={() => {
              if (!isCreatorAdmin) return;
              onOpenComposer(key);
            }}
            aria-label={label}
            title={label}
            className={cn(
              ACTION_BTN,
              !isCreatorAdmin && "cursor-not-allowed opacity-40"
            )}
          >
            <Icon className={ACTION_ICON_CLS} />
          </button>
        ))}
      </div>
    </div>
  );
}
