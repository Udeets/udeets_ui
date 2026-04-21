"use client";

import { cn } from "../hubUtils";
import type { ComposerChildFlow } from "./deetTypes";
import type { OpenComposerArg } from "../../hooks/useDeetComposer";
import {
  ComposerAnnouncementIcon,
  ComposerPollIcon,
  ComposerJobsIcon,
  ComposerCalendarIcon,
  ComposerAlertIcon,
  ComposerSurveyIcon,
  ComposerPaymentIcon,
} from "./ComposerIcons";

const ACTION_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)] hover:text-[var(--ud-brand-primary)]";

type ComposerIcon = typeof ComposerAnnouncementIcon;

export function DeetComposerCard({
  isDemoPreview,
  isCreatorAdmin,
  onOpenComposer,
}: {
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  onOpenComposer: (arg?: OpenComposerArg) => void;
}) {
  const actionButtons: Array<{
    key: Exclude<ComposerChildFlow, "quit_confirm">;
    icon: ComposerIcon;
    label: string;
  }> = [
    { key: "announcement", icon: ComposerAnnouncementIcon, label: "Announcement" },
    { key: "poll", icon: ComposerPollIcon, label: "Poll" },
    { key: "jobs", icon: ComposerJobsIcon, label: "Jobs" },
    { key: "event", icon: ComposerCalendarIcon, label: "Event" },
    { key: "alert", icon: ComposerAlertIcon, label: "Alert" },
    { key: "survey", icon: ComposerSurveyIcon, label: "Survey" },
    { key: "payment", icon: ComposerPaymentIcon, label: "Fundraiser" },
  ];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
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
          What&apos;s on your mind?
        </button>
      </div>

      <div className="flex items-center justify-start border-t border-[var(--ud-border-subtle)] px-1 py-1.5 overflow-x-auto">
        {actionButtons.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
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
            <Icon className="h-[22px] w-[22px]" />
          </button>
        ))}
      </div>
    </div>
  );
}
