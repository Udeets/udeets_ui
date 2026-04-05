"use client";

import { Check, Loader2, UserPlus, UsersRound, X } from "lucide-react";
import { useState } from "react";
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
            {member.role}
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
}: {
  membersPanelMode: "list" | "invite";
  memberItems: MemberItem[];
  onInviteMembers: () => void;
  isCreatorAdmin?: boolean;
  pendingRequests?: PendingRequestItem[];
  processingUserIds?: Set<string>;
  onApproveRequest?: (userId: string) => void;
  onRejectRequest?: (userId: string) => void;
}) {
  const hasPending = isCreatorAdmin && pendingRequests && pendingRequests.length > 0;
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

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
        {memberItems.length === 0 ? (
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
            {memberItems.map((member) => (
              <button
                key={member.userId}
                type="button"
                onClick={() => setSelectedMember(member)}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[var(--ud-bg-subtle)] first:pt-0 last:pb-0 rounded-lg px-2 -mx-2"
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
                  <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{member.fullName}</p>
                  <p className="text-xs text-[var(--ud-text-muted)]">{member.role}</p>
                </div>
              </button>
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
