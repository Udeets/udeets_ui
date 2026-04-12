"use client";

import { Check, Loader2, UserPlus, UsersRound, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { initials, cn } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export type MemberItem = {
  userId: string;
  role: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  joinedAt?: string | null;
};

export type PendingRequestItem = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  requestedAt?: string | null;
};

/* ── Helper: format a date nicely ── */
function formatJoinDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ── Role label helper ── */
function formatRole(role: string): string {
  if (!role) return "Member";
  // Capitalize first letter of each word
  return role
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/* ── Settings dropdown menu ── */
function MemberSettingsMenu({
  isOpen,
  onClose,
  onLeaveHub,
  onMuteNotifications,
  onReportHub,
  anchorRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLeaveHub?: () => void;
  onMuteNotifications?: () => void;
  onReportHub?: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-[var(--ud-border)] bg-white py-1 shadow-lg"
    >
      {onMuteNotifications ? (
        <button
          type="button"
          onClick={() => { onMuteNotifications(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--ud-text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          Mute Notifications
        </button>
      ) : null}
      {onReportHub ? (
        <button
          type="button"
          onClick={() => { onReportHub(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--ud-text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          Report Hub
        </button>
      ) : null}
      {onLeaveHub ? (
        <>
          <div className="my-1 border-t border-[var(--ud-border)]" />
          <button
            type="button"
            onClick={() => { onLeaveHub(); onClose(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Leave Hub
          </button>
        </>
      ) : null}
    </div>
  );
}

/* ── Pending request card ── */
function PendingRequestCard({
  request,
  isProcessing,
  onApprove,
  onReject,
}: {
  request: PendingRequestItem;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
        {request.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={request.avatarUrl} alt={request.fullName} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-xs font-semibold text-[var(--ud-brand-primary)]">
            {initials(request.fullName)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--ud-text-primary)]">{request.fullName}</p>
        {request.email ? <p className="truncate text-xs text-[var(--ud-text-muted)]">{request.email}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-text-muted)]" />
        ) : (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)] transition hover:bg-[var(--ud-brand-light)]/60"
              title="Approve"
              aria-label={`Approve ${request.fullName}`}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
              title="Reject"
              aria-label={`Reject ${request.fullName}`}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Band-style member profile popup ── */
function MemberProfilePopup({
  member,
  onClose,
}: {
  member: MemberItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs overflow-hidden rounded-2xl bg-[var(--ud-bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner / accent strip */}
        <div className="h-20 bg-gradient-to-br from-[var(--ud-brand-primary)] to-[var(--ud-gradient-to,var(--ud-brand-primary))]" />

        {/* Avatar overlapping the banner */}
        <div className="flex flex-col items-center -mt-10 px-6 pb-6">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-[var(--ud-bg-card)] bg-[var(--ud-brand-light)]">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt={member.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-lg font-bold text-[var(--ud-brand-primary)]">
                {initials(member.fullName)}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="mt-3 text-lg font-semibold text-[var(--ud-text-primary)]">
            {member.fullName}
          </h3>

          {/* Role badge */}
          <span
            className={cn(
              "mt-1 rounded-full px-3 py-0.5 text-xs font-semibold",
              member.role === "Creator"
                ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                : member.role === "Admin"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]"
            )}
          >
            {formatRole(member.role)}
          </span>

          {/* Info rows */}
          <div className="mt-5 w-full space-y-3">
            {member.joinedAt ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ud-text-muted)]">Joined</span>
                <span className="font-medium text-[var(--ud-text-primary)]">{formatJoinDate(member.joinedAt)}</span>
              </div>
            ) : null}
            {member.email ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ud-text-muted)]">Email</span>
                <span className="truncate pl-4 font-medium text-[var(--ud-text-primary)]">{member.email}</span>
              </div>
            ) : null}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-full border border-[var(--ud-border)] py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Single member row ── */
function MemberRow({
  member,
  isCurrentUser,
  isCreatorAdmin,
  onClickProfile,
  onLeaveHub,
  onMuteNotifications,
  onReportHub,
}: {
  member: MemberItem;
  isCurrentUser: boolean;
  isCreatorAdmin: boolean;
  onClickProfile: () => void;
  onLeaveHub?: () => void;
  onMuteNotifications?: () => void;
  onReportHub?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  // Show settings icon for: the current user (if member, not creator), or creator/admin viewing other members
  const showSettings = isCurrentUser && !["creator", "Creator"].includes(member.role);

  return (
    <div className="flex w-full items-center gap-3 py-3 first:pt-0 last:pb-0">
      {/* Clickable profile area */}
      <button
        type="button"
        onClick={onClickProfile}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:bg-[var(--ud-bg-subtle)] rounded-lg px-2 -mx-2 py-1 -my-1"
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatarUrl} alt={member.fullName} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-xs font-bold text-[var(--ud-brand-primary)]">
              {initials(member.fullName)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">
            {member.fullName}
            {isCurrentUser ? <span className="ml-1 text-xs font-normal text-[var(--ud-text-muted)]">(You)</span> : null}
          </p>
        </div>
      </button>

      {/* Right side: Role label + settings icon */}
      <div className="relative flex shrink-0 items-center gap-2">
        <span className="text-xs font-medium text-[var(--ud-text-muted)]">
          {formatRole(member.role)}
        </span>
        {showSettings ? (
          <>
            <button
              ref={settingsBtnRef}
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              title="Settings"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <MemberSettingsMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              onLeaveHub={onLeaveHub}
              onMuteNotifications={onMuteNotifications}
              onReportHub={onReportHub}
              anchorRef={settingsBtnRef}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ── Main Members Section ── */
export function MembersSection({
  membersPanelMode,
  memberItems,
  onInviteMembers,
  isCreatorAdmin,
  pendingRequests,
  processingUserIds,
  onApproveRequest,
  onRejectRequest,
  currentUserId,
  onLeaveHub,
  onMuteNotifications,
  onReportHub,
}: {
  membersPanelMode: "list" | "invite";
  memberItems: MemberItem[];
  onInviteMembers: () => void;
  isCreatorAdmin?: boolean;
  pendingRequests?: PendingRequestItem[];
  processingUserIds?: Set<string>;
  onApproveRequest?: (userId: string) => void;
  onRejectRequest?: (userId: string) => void;
  currentUserId?: string;
  onLeaveHub?: () => void;
  onMuteNotifications?: () => void;
  onReportHub?: () => void;
}) {
  const hasPending = isCreatorAdmin && pendingRequests && pendingRequests.length > 0;
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  // Sort: creator first, then admins, then members. Current user within their role group.
  const sortedMembers = [...memberItems].sort((a, b) => {
    const roleOrder = (role: string) => {
      const r = role.toLowerCase();
      if (r === "creator") return 0;
      if (r === "super admin" || r === "superadmin") return 1;
      if (r === "admin") return 2;
      return 3;
    };
    const diff = roleOrder(a.role) - roleOrder(b.role);
    if (diff !== 0) return diff;
    // Within same role, current user first
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  return (
    <>
      <SectionShell
        title={membersPanelMode === "invite" ? "Invite Members" : `Members (${memberItems.length})`}
        description={membersPanelMode === "invite" ? "Invite people to join your hub." : "People connected to this hub."}
        actions={
          membersPanelMode === "list" ? (
            <button
              type="button"
              onClick={onInviteMembers}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ud-brand-primary)] to-[var(--ud-gradient-to,var(--ud-brand-primary))] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>
          ) : null
        }
      >
        {/* Pending Requests Queue (visible to admins only) */}
        {hasPending ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
              <h3 className="text-sm font-semibold text-amber-800">
                Pending {pendingRequests.length === 1 ? "Request" : "Requests"}
              </h3>
            </div>
            <p className="mb-3 text-xs text-amber-700">
              These people have requested to join your hub. Approve or reject their requests below.
            </p>
            <div className="divide-y divide-amber-200/60">
              {pendingRequests.map((request) => (
                <PendingRequestCard
                  key={request.userId}
                  request={request}
                  isProcessing={processingUserIds?.has(request.userId) ?? false}
                  onApprove={() => onApproveRequest?.(request.userId)}
                  onReject={() => onRejectRequest?.(request.userId)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Active Members List */}
        {sortedMembers.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ud-bg-subtle)]">
              <UsersRound className="h-5 w-5 text-[var(--ud-text-muted)]" />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--ud-text-primary)]">
              {membersPanelMode === "invite" ? "Invite your first members" : "No members yet"}
            </p>
            <p className="mt-1 text-xs text-[var(--ud-text-muted)]">
              {membersPanelMode === "invite" ? "Start building your community." : "Members will appear here as they join."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--ud-border)]">
            {sortedMembers.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                isCreatorAdmin={isCreatorAdmin ?? false}
                onClickProfile={() => setSelectedMember(member)}
                onLeaveHub={member.userId === currentUserId && !["creator", "Creator"].includes(member.role) ? onLeaveHub : undefined}
                onMuteNotifications={member.userId === currentUserId && !["creator", "Creator"].includes(member.role) ? onMuteNotifications : undefined}
                onReportHub={member.userId === currentUserId && !["creator", "Creator"].includes(member.role) ? onReportHub : undefined}
              />
            ))}
          </div>
        )}
      </SectionShell>

      {/* Profile popup */}
      {selectedMember ? (
        <MemberProfilePopup
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
    </>
  );
}
