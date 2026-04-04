"use client";

import { BarChart3, Calendar, FileText, Images, MapPin, Megaphone, Paperclip, Smile } from "lucide-react";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import type { ComposerChildFlow } from "./deetTypes";

const ACTION_BTN =
  "inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]";
const ACTION_ICON_CLS = "h-5 w-5 stroke-[1.5]";

export function DeetComposerCard({
  isDemoPreview,
  isCreatorAdmin,
  dpImageSrc,
  coverImageSrc,
  recentPhotos,
  hubName,
  onOpenComposer,
}: {
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  dpImageSrc: string;
  coverImageSrc: string;
  recentPhotos: string[];
  hubName: string;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
}) {
  const actionButtons: Array<{
    key: Exclude<ComposerChildFlow, "quit_confirm" | "settings">;
    icon: typeof Images;
    label: string;
  }> = [
    { key: "photo", icon: Images, label: "Photo/Video" },
    { key: "emoji", icon: Smile, label: "Sticker/Emoji" },
    { key: "announcement", icon: Megaphone, label: "Announcement" },
    { key: "notice", icon: FileText, label: "Notice" },
    { key: "poll", icon: BarChart3, label: "Poll" },
    { key: "photo", icon: Paperclip, label: "Attach File" },
    { key: "event", icon: Calendar, label: "Event" },
    { key: "checkin", icon: MapPin, label: "Check-in" },
  ];

  return (
    <section className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
      <div
        data-demo-target={isDemoPreview ? "hub-composer-section" : undefined}
        className="flex items-start gap-4 p-4 sm:p-5"
      >
        {/* Hub avatar */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--ud-border)] bg-[var(--ud-brand-primary)]">
          <ImageWithFallback
            src={dpImageSrc}
            sources={[dpImageSrc, coverImageSrc, ...recentPhotos]}
            alt={`${hubName} avatar`}
            className="h-full w-full object-cover"
            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-primary)] text-sm font-semibold text-[var(--ud-text-primary)]"
            fallback={initials(hubName)}
          />
        </div>

        {/* Text area button */}
        <button
          type="button"
          data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
          disabled={!isCreatorAdmin}
          onClick={() => onOpenComposer()}
          className={cn(
            "min-h-[80px] w-full flex-1 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-4 py-3 text-left text-base text-[var(--ud-text-muted)] transition",
            isCreatorAdmin
              ? "hover:border-[var(--ud-border)] hover:bg-[var(--ud-bg-subtle)]"
              : "cursor-not-allowed"
          )}
        >
          Write something...
        </button>
      </div>

      {/* Action buttons row — matches CreateDeetModal style */}
      <div className="flex flex-wrap items-center gap-1 border-t border-[var(--ud-border-subtle)] px-4 py-2 text-[var(--ud-text-muted)]">
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
              !isCreatorAdmin && "cursor-not-allowed opacity-50"
            )}
          >
            <Icon className={ACTION_ICON_CLS} />
          </button>
        ))}
      </div>
    </section>
  );
}
