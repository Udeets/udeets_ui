"use client";

import { UserPlus, UsersRound } from "lucide-react";
import { BUTTON_PRIMARY, initials } from "../hubUtils";
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
      title={membersPanelMode === "invite" ? "Invite Members" : "Members"}
      description={
        membersPanelMode === "invite"
          ? "Invite tools can plug in here next. This area will handle invitations and join requests."
          : "Manage and review the people connected to this hub."
      }
      actions={
        membersPanelMode === "list" ? (
          <button type="button" onClick={onInviteMembers} className={BUTTON_PRIMARY}>
            Invite Members
          </button>
        ) : null
      }
    >
      {memberItems.length === 0 ? (
        <div className="w-full rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
          <div className="grid min-h-[260px] w-full place-items-center text-center">
            <div className="w-full">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
                {membersPanelMode === "invite" ? <UserPlus className="h-6 w-6 stroke-[1.8]" /> : <UsersRound className="h-6 w-6 stroke-[1.8]" />}
              </div>
              <h3 className="mt-5 text-2xl font-serif font-semibold tracking-tight text-[#111111]">
                {membersPanelMode === "invite" ? "Invite your first members" : "No members yet"}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {membersPanelMode === "invite"
                  ? "Invite people to join and start building your community."
                  : "This member list will populate as people join your hub."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
          <div className="w-full space-y-3">
            {memberItems.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.fullName} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#111111]">
                    {initials(member.fullName)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{member.fullName}</p>
                  <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}
