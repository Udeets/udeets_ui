"use client";

import { DoorOpen, Globe, Settings, Share2, UserPlus, UsersRound } from "lucide-react";
import { cn } from "../hubUtils";

type HubHeaderActionsProps = {
  memberCount: number;
  visibilityLabel: "Public" | "Private";
  canManageHub: boolean;
  isJoined: boolean;
  onMembersClick: () => void;
  onInviteClick: () => void;
  onSettingsClick: () => void;
  onMembershipActionClick: () => void;
};

const ACTION_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]";

export function HubHeaderActions({
  memberCount,
  visibilityLabel,
  canManageHub,
  isJoined,
  onMembersClick,
  onInviteClick,
  onSettingsClick,
  onMembershipActionClick,
}: HubHeaderActionsProps) {
  return (
    <div className="flex w-full items-center justify-between px-1 text-sm font-medium text-[var(--ud-text-secondary)] sm:px-2">
      <button
        type="button"
        onClick={onMembersClick}
        className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]"
        aria-label="Open members"
        title="Members"
      >
        <UsersRound className="h-4 w-4 shrink-0" />
        <span>{memberCount}</span>
      </button>

      <button
        type="button"
        onClick={onInviteClick}
        className={ACTION_BUTTON}
        aria-label="Invite members"
        title="Invite members"
      >
        <Share2 className="h-4 w-4 shrink-0" />
      </button>

      <button
        type="button"
        onClick={canManageHub ? onSettingsClick : undefined}
        disabled={!canManageHub}
        className={cn(
          ACTION_BUTTON,
          !canManageHub && "cursor-default hover:bg-transparent hover:text-[var(--ud-text-secondary)]"
        )}
        aria-label={`Visibility: ${visibilityLabel}`}
        title={`Visibility: ${visibilityLabel}`}
      >
        <Globe className="h-4 w-4 shrink-0" />
      </button>

      <button
        type="button"
        onClick={onSettingsClick}
        className={ACTION_BUTTON}
        aria-label="Hub settings"
        title="Hub settings"
      >
        <Settings className="h-4 w-4 shrink-0" />
      </button>

      <button
        type="button"
        onClick={onMembershipActionClick}
        className={ACTION_BUTTON}
        aria-label={isJoined ? "Leave hub" : "Join hub"}
        title={isJoined ? "Leave hub" : "Join hub"}
      >
        {isJoined ? (
          <DoorOpen className="h-4 w-4 shrink-0" />
        ) : (
          <UserPlus className="h-4 w-4 shrink-0" />
        )}
      </button>
    </div>
  );
}
