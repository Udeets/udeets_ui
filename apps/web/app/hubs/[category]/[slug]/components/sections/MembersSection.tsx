"use client";

import { UserPlus, UsersRound } from "lucide-react";
import { initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export type MemberItem = {
  userId: string;
  role: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
};

export function MembersSection({
  membersPanelMode,
  memberItems,
  onInviteMembers,
}: {
  membersPanelMode: "list" | "invite";
  memberItems: MemberItem[];
  onInviteMembers: () => void;
}) {
  return (
    <SectionShell
      title={membersPanelMode === "invite" ? "Invite Members" : `Members (${memberItems.length})`}
      description={membersPanelMode === "invite" ? "Invite people to join your hub." : "People connected to this hub."}
      actions={
        membersPanelMode === "list" ? (
          <button
            type="button"
            onClick={onInviteMembers}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C5C57] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#094a46]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        ) : null
      }
    >
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
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.fullName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EAF6F3] text-xs font-semibold text-[#0C5C57]">
                  {initials(member.fullName)}
                </span>
              )}
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
