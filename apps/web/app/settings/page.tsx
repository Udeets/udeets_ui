"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { SETTINGS_SECTIONS } from "@/lib/mock-account";
import { signOut } from "@/services/auth/signOut";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [settingsState, setSettingsState] = useState(() =>
    Object.fromEntries(
      SETTINGS_SECTIONS.flatMap((section) =>
        section.items.map((item) => [item.label, item.enabled])
      )
    ) as Record<string, boolean>
  );

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <MockAppShell activeNav="home">
      <section className="mb-4">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Manage preferences, privacy, and account controls for your account.
        </p>
      </section>

      <section className={cardClass("p-6 sm:p-8")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account</p>
            <h2 className="mt-2 text-2xl font-serif font-semibold text-[#111111]">
              {(user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "uDeets User"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{user?.email ?? "Email coming soon"}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Update Account
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => (
          <section key={section.title} className={cardClass("p-5 sm:p-6")}>
            <h2 className={sectionTitleClass()}>{section.title}</h2>
            <div className="mt-5 space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl bg-[#F7FBFA] p-4">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{item.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settingsState[item.label]}
                    aria-label={item.label}
                    onClick={() =>
                      setSettingsState((current) => ({
                        ...current,
                        [item.label]: !current[item.label],
                      }))
                    }
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-all duration-200",
                      settingsState[item.label]
                        ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15"
                        : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
                        settingsState[item.label] ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className={cardClass("mt-6 p-5 sm:p-6")}>
        <h2 className={sectionTitleClass("text-rose-600")}>Sign Out</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          End your current session on this device.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 rounded-full border border-rose-200 px-5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          Sign out
        </button>
      </section>
    </MockAppShell>
  );
}
