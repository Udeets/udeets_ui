"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { UDEETS_LOGO_SRC } from "@/lib/branding";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SIDEBAR_ITEMS = [
  "My Info",
  "My Hubs",
  "My Posts",
  "Saved",
  "Requests",
  "Invitations",
  "Account Settings",
] as const;

const OVERVIEW_STATS = [
  { label: "Joined Hubs", value: "12" },
  { label: "My Posts", value: "18" },
  { label: "Requests", value: "4" },
];

const PERSONAL_INFO = [
  { label: "Full Name", value: "Demo User" },
  { label: "Display Name", value: "DemoUser" },
  { label: "Date of Birth", value: "August 12, 1993" },
  { label: "Gender", value: "Female" },
  { label: "Phone", value: "(804) 555-0188" },
  { label: "Email", value: "demo@udeets.com" },
];

const HUB_ACTIVITY = [
  { label: "Joined Hubs", value: "12", detail: "Across community, fitness, and local business hubs." },
  { label: "Owned Hubs", value: "2", detail: "Actively managing updates for two mock organizer spaces." },
  { label: "Pending Requests", value: "4", detail: "Membership requests waiting for review this week." },
  { label: "Saved Hubs", value: "9", detail: "Quick access to hubs you want to revisit later." },
];

const PREFERENCES = [
  { label: "Google account", value: "Connected", action: "Manage", kind: "action" },
  { label: "Apple account", value: "Not connected", action: "Connect", kind: "action" },
  { label: "Email notifications", value: "Weekly digest + alerts", kind: "toggle", enabled: true },
  { label: "SMS alerts", value: "Important updates only", kind: "toggle", enabled: false },
  { label: "Push notifications", value: "Realtime app activity", kind: "toggle", enabled: true },
  { label: "Private profile visibility", value: "Limit profile details to joined hubs", kind: "toggle", enabled: false },
  { label: "Activity status", value: "Show when you are active around hub updates and activity", kind: "toggle", enabled: true },
];

function InfoRow({
  label,
  value,
  action = "Change",
}: {
  label: string;
  value: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#F7FBFA] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-medium text-[#111111] sm:text-base">{value}</p>
      </div>
      <button
        type="button"
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        {action}
      </button>
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-200",
        enabled ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
          enabled ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}

function PreferenceRow({
  label,
  value,
  action,
  enabled,
  onToggle,
}: {
  label: string;
  value: string;
  action?: string;
  enabled?: boolean;
  onToggle?: () => void;
}) {
  const isToggle = typeof enabled === "boolean" && onToggle;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#F7FBFA] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-medium text-[#111111] sm:text-base">{value}</p>
      </div>

      {isToggle ? (
        <ToggleSwitch enabled={enabled} onToggle={onToggle} label={label} />
      ) : (
        <button
          type="button"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthSession();
  const [preferenceState, setPreferenceState] = useState(() =>
    Object.fromEntries(
      PREFERENCES.filter((item) => item.kind === "toggle").map((item) => [
        item.label,
        Boolean(item.enabled),
      ])
    ) as Record<string, boolean>
  );

  return (
    <MockAppShell activeNav="home">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={cardClass("h-fit p-5 sm:p-6")}>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile Menu</p>
            <h1 className="mt-2 text-2xl font-serif font-semibold tracking-tight text-[#111111]">
              My Info
            </h1>
          </div>

          <nav className="space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              const active = item === "My Info";
              return (
                <button
                  key={item}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[#A9D1CA]/55 text-[#0C5C57] shadow-sm"
                      : "text-slate-600 hover:bg-[#F7FBFA]"
                  }`}
                >
                  <span>{item}</span>
                  {active ? <span className="h-2.5 w-2.5 rounded-full bg-[#0C5C57]" /> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          <section className={cardClass("p-6 sm:p-8")}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200">
                  <Image
                    src={(user?.user_metadata?.avatar_url as string | undefined) ?? UDEETS_LOGO_SRC}
                    alt={user?.email ? `${user.email} profile photo` : "User profile photo"}
                    fill
                    className="object-cover object-center"
                    sizes="80px"
                  />
                </div>

                <div>
                  <h2 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">
                    {(user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "uDeets User"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{user?.email ?? "Email coming soon"}</p>
                  <p className="mt-1 text-sm text-slate-500">Richmond, VA</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {OVERVIEW_STATS.map((stat) => (
                      <div key={stat.label} className="rounded-full border border-slate-200 bg-[#F7FBFA] px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {stat.label}
                        </span>
                        <span className="ml-2 text-sm font-semibold text-[#111111]">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-medium text-white hover:bg-[#094a46]"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Manage Account
                </button>
              </div>
            </div>
          </section>

          <section className={cardClass("p-6 sm:p-8")}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className={sectionTitleClass()}>Personal Information</h2>
              <p className="text-sm text-slate-500">Keep your profile details up to date.</p>
            </div>

            <div className="space-y-3">
              {PERSONAL_INFO.map((item) => (
                <InfoRow
                  key={item.label}
                  label={item.label}
                  value={
                    item.label === "Full Name"
                      ? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? item.value
                      : item.label === "Email"
                        ? user?.email ?? item.value
                        : item.value
                  }
                />
              ))}
            </div>
          </section>

          <section className={cardClass("p-6 sm:p-8")}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className={sectionTitleClass()}>Hub Activity</h2>
              <p className="text-sm text-slate-500">A quick view of your community footprint.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {HUB_ACTIVITY.map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#F7FBFA] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-serif font-semibold text-[#111111]">{item.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass("p-6 sm:p-8")}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className={sectionTitleClass()}>Preferences & Linked Accounts</h2>
              <p className="text-sm text-slate-500">Manage connected services and alert preferences.</p>
            </div>

            <div className="space-y-3">
              {PREFERENCES.map((item) => (
                <PreferenceRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  action={item.kind === "action" ? item.action : undefined}
                  enabled={item.kind === "toggle" ? preferenceState[item.label] : undefined}
                  onToggle={
                    item.kind === "toggle"
                      ? () =>
                          setPreferenceState((current) => ({
                            ...current,
                            [item.label]: !current[item.label],
                          }))
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </MockAppShell>
  );
}
