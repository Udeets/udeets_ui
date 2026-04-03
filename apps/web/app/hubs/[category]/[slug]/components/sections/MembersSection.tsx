"use client";

import { Check, Loader2, UserPlus, UsersRound, X } from "lucide-react";
import { initials, cn } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export type MemberItem = {
  userId: string;
  role: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
};

export type PendingRequestItem = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  requestedAt?: string | null;
};

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
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#EAF6F3]">
        {request.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={request.avatarUrl} alt={request.fullName} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-xs font-semibold text-[#0C5C57]">
            {initials(request.fullName)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#111111]">{request.fullName}</p>
        {request.email ? <p className="truncate text-xs text-slate-400">{request.email}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF6F3] text-[#0C5C57] transition hover:bg-[#d4eee8]"
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

  return (
    <SectionShell
      title={membersPanelMode === "invite" ? "Invite Members" : `Members (${memberItems.length})`}
      description={membersPanelMode === "invite" ? "Invite people to join your hub." : "People connected to this hub."}
      actions={
        membersPanelMode === "list" ? (
          <button
            type="button"
            onClick={onInviteMembers}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <UsersRound className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-[#111111]">
            {membersPanelMode === "invite" ? "Invite your first members" : "No members yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {membersPanelMode === "invite" ? "Start building your community." : "Members will appear here as they join."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {memberItems.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#EAF6F3]">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatarUrl} alt={member.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs font-semibold text-[#0C5C57]">
                    {initials(member.fullName)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#111111]">{member.fullName}</p>
                {member.email ? <p className="truncate text-xs text-slate-400">{member.email}</p> : null}
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">{member.role}</span>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
