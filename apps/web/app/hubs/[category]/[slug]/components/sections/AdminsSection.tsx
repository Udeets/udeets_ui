"use client";

import { BarChart3, Bell, Eye, Heart, Images, Megaphone, MessageSquare, Settings, UserCog, UserPlus, UsersRound } from "lucide-react";
import { ICON, PREMIUM_ICON_WRAPPER } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export function AdminsSection({
  headerHubName,
  memberCount,
  knownActivityCount,
  feedItemCount,
  announcementCount,
  photoDeetCount,
  totalViews,
  totalEngagement,
  activeAdminCount,
  eventCount,
  recentPhotoCount,
  onInviteMembers,
  onOpenSettings,
  onOpenAdminsEditor,
  onOpenPosts,
}: {
  headerHubName: string;
  memberCount: number;
  knownActivityCount: number;
  feedItemCount: number;
  announcementCount: number;
  photoDeetCount: number;
  totalViews: number;
  totalEngagement: number;
  activeAdminCount: number;
  eventCount: number;
  recentPhotoCount: number;
  onInviteMembers: () => void;
  onOpenSettings: () => void;
  onOpenAdminsEditor: () => void;
  onOpenPosts: () => void;
}) {
  return (
    <SectionShell
      title="Admins"
      description="An admin-only workspace for hub health, engagement signals, and operational controls."
      actions={
        <span className="inline-flex items-center gap-2 rounded-full bg-[#F7FBFA] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0C5C57] ring-1 ring-[#0C5C57]/10">
          <UserCog className="h-4 w-4" />
          Admin only
        </span>
      }
    >
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#F7FBFA_0%,#E6F4F1_55%,#FDFCF8_100%)] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0C5C57] ring-1 ring-[#0C5C57]/10">
                <UserCog className="h-3.5 w-3.5" />
                Admin workspace
              </div>
              <h3 className="mt-4 text-3xl font-serif font-semibold tracking-tight text-[#111111] sm:text-4xl">Keep {headerHubName} running smoothly</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Review the current community footprint, see what activity is already happening, and jump into the most useful management actions for this hub.
              </p>
            </div>

            <div className="grid gap-3 rounded-[24px] bg-white/80 p-4 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <UsersRound className={ICON} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Community size</p>
                  <p className="mt-1 text-sm font-medium text-[#111111]">{memberCount} connected members</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <BarChart3 className={ICON} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Known activity</p>
                  <p className="mt-1 text-sm font-medium text-[#111111]">{knownActivityCount} visible hub signals</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Operational snapshot</h3>
            <p className="mt-1 text-sm text-slate-600">A quick KPI view built from the hub data that is available right now.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Members", value: String(memberCount), helper: "Current connected member count for this hub.", icon: UsersRound },
              { label: "Engagement", value: String(totalEngagement), helper: "Known likes and comments across current deets.", icon: Heart },
              { label: "Active admins", value: String(activeAdminCount), helper: "Only confirmed admin access that is currently wired.", icon: UserCog },
              { label: "Recent activity", value: String(knownActivityCount), helper: "Combined view of deets, events, and gallery activity.", icon: Bell },
            ].map(({ label, value, helper, icon: StatIcon }) => (
              <article key={label} className="rounded-[24px] bg-[#F7FBFA] p-5 shadow-sm ring-1 ring-[#0C5C57]/6">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <StatIcon className={ICON} />
                </span>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-serif font-semibold tracking-tight text-[#111111]">{value}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{helper}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Engagement overview</h3>
            <p className="mt-1 text-sm text-slate-600">Track what is already happening in deets, announcements, and community interactions.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Published deets", value: feedItemCount, icon: MessageSquare },
                { label: "Announcement items", value: announcementCount, icon: Megaphone },
                { label: "Photo deets", value: photoDeetCount, icon: Images },
                { label: "Known views", value: totalViews, icon: Eye },
              ].map(({ label, value, icon: InsightIcon }) => (
                <div key={label} className="rounded-[20px] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className={PREMIUM_ICON_WRAPPER}>
                      <InsightIcon className={ICON} />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <p className="mt-1 text-xl font-semibold tracking-tight text-[#111111]">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Reach and participation</h3>
            <p className="mt-1 text-sm text-slate-600">A quick read on how visible and active this hub currently appears.</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Events in motion</p>
                <p className="mt-2 text-2xl font-serif font-semibold tracking-tight text-[#111111]">{eventCount}</p>
              </div>
              <div className="rounded-[20px] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recent gallery activity</p>
                <p className="mt-2 text-2xl font-serif font-semibold tracking-tight text-[#111111]">{recentPhotoCount}</p>
              </div>
              <div className="rounded-[20px] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pending admin workflows</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Invite approvals, admin task routing, and moderation queues can surface here as those workflows are wired.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Admin tools</h3>
            <p className="mt-1 text-sm text-slate-600">Shortcuts into the management actions that already exist today.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={onInviteMembers} className="rounded-[20px] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={PREMIUM_ICON_WRAPPER}>
                    <UserPlus className={ICON} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">Invite members</p>
                    <p className="mt-1 text-sm text-slate-600">Open invite tools and grow the hub intentionally.</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={onOpenSettings} className="rounded-[20px] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={PREMIUM_ICON_WRAPPER}>
                    <Settings className={ICON} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">Manage visibility</p>
                    <p className="mt-1 text-sm text-slate-600">Adjust hub settings, posting preferences, and discovery controls.</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={onOpenAdminsEditor} className="rounded-[20px] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={PREMIUM_ICON_WRAPPER}>
                    <UserCog className={ICON} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">Manage admins</p>
                    <p className="mt-1 text-sm text-slate-600">Review current admin access and prepare for more advanced roles.</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={onOpenPosts} className="rounded-[20px] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={PREMIUM_ICON_WRAPPER}>
                    <BarChart3 className={ICON} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">Review deets activity</p>
                    <p className="mt-1 text-sm text-slate-600">Jump back into the live feed to assess what members are seeing now.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Operational notes</h3>
            <p className="mt-1 text-sm text-slate-600">Areas that can evolve as deeper admin analytics are added later.</p>
            <div className="mt-5 space-y-3">
              {[
                "Subscriber growth and invite conversion can surface here once membership analytics are wired.",
                "Content moderation and report queues can plug into this workspace without reshaping the layout.",
                "Announcement performance and event engagement can expand these cards when richer tracking is available.",
              ].map((note) => (
                <div key={note} className="rounded-[20px] bg-white p-4">
                  <p className="text-sm leading-relaxed text-slate-600">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}
