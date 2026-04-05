"use client";

import { Camera, Calendar, FileText, Images, MapPin, Megaphone, Paperclip, Smile, BarChart3 } from "lucide-react";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import type { ComposerChildFlow } from "./deetTypes";

const ACTION_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)] hover:text-[var(--ud-brand-primary)]";
const ACTION_ICON_CLS = "h-[18px] w-[18px] stroke-[1.5]";

export function DeetComposerCard({
  isDemoPreview,
  isCreatorAdmin,
  userAvatarSrc,
  userName,
  onOpenComposer,
}: {
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  userAvatarSrc?: string;
  userName?: string;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
}) {
  const displayName = userName || "You";

  const actionButtons: Array<{
    key: Exclude<ComposerChildFlow, "quit_confirm" | "settings">;
    icon: typeof Images;
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
        className="flex items-center gap-3 px-4 py-3"
      >
        {/* User avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
          <ImageWithFallback
            src={userAvatarSrc || ""}
            sources={userAvatarSrc ? [userAvatarSrc] : []}
            alt={displayName}
            className="h-full w-full object-cover"
            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-semibold text-[var(--ud-brand-primary)]"
            fallback={initials(displayName)}
          />
        </div>

        {/* Tap-to-compose button */}
        <button
          type="button"
          data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
          disabled={!isCreatorAdmin}
          onClick={() => onOpenComposer()}
          className={cn(
            "h-10 w-full flex-1 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-4 text-left text-sm text-[var(--ud-text-muted)] transition",
            isCreatorAdmin
              ? "hover:border-[var(--ud-border-focus)] hover:bg-[var(--ud-bg-input)]"
              : "cursor-not-allowed opacity-60"
          )}
        >
          Write something...
        </button>
      </div>

      {/* Quick-action icon row */}
      <div className="flex items-center justify-around border-t border-[var(--ud-border-subtle)] px-2 py-1.5">
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
