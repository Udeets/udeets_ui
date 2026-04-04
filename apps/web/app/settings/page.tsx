"use client";

export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MockAppShell, { cardClass } from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { signOut } from "@/services/auth/signOut";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SettingsNav = "Notifications" | "Privacy" | "Appearance" | "Account" | "Danger Zone";

const NAV_ITEMS: SettingsNav[] = ["Notifications", "Privacy", "Appearance", "Account", "Danger Zone"];

type NotifPrefs = { push_new_posts: boolean; weekly_digest: boolean; event_reminders: boolean };
type PrivacyPrefs = { show_profile: boolean; allow_invites: boolean };

const DEFAULT_NOTIF: NotifPrefs = { push_new_posts: true, weekly_digest: true, event_reminders: false };
const DEFAULT_PRIVACY: PrivacyPrefs = { show_profile: true, allow_invites: false };

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-all duration-200",
        enabled ? "bg-[var(--ud-brand-light)] ring-1 ring-[var(--ud-brand-primary)]/15" : "bg-slate-300"
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 border-b border-[var(--ud-border-subtle)] pb-3 text-lg font-semibold text-[var(--ud-text-primary)]">{children}</h2>;
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ud-brand-primary)] animate-pulse">
      <Check className="h-3 w-3" /> Saved
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, status } = useAuthSession();

  const [activeSection, setActiveSection] = useState<SettingsNav>("Notifications");
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);
  const [fullName, setFullName] = useState("");
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Load prefs from profiles table
  useEffect(() => {
    if (status !== "authenticated" || !user?.id) return;
    let cancelled = false;

    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name, notification_preferences, privacy_settings")
        .eq("id", user!.id)
        .single();

      if (cancelled) return;

      if (data) {
        setFullName(data.full_name ?? "");
        if (data.notification_preferences) setNotifPrefs(data.notification_preferences as NotifPrefs);
        if (data.privacy_settings) setPrivacyPrefs(data.privacy_settings as PrivacyPrefs);
      }
      setIsLoadingPrefs(false);
    }

    load();
    return () => { cancelled = true; };
  }, [status, user?.id]);

  const showSaved = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 1500);
  };

  const updateNotifPref = async (key: keyof NotifPrefs) => {
    if (!user?.id) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("profiles").update({ notification_preferences: updated, updated_at: new Date().toISOString() }).eq("id", user.id);
    showSaved(key);
  };

  const updatePrivacyPref = async (key: keyof PrivacyPrefs) => {
    if (!user?.id) return;
    const updated = { ...privacyPrefs, [key]: !privacyPrefs[key] };
    setPrivacyPrefs(updated);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("profiles").update({ privacy_settings: updated, updated_at: new Date().toISOString() }).eq("id", user.id);
    showSaved(key);
  };

  const saveName = async () => {
    if (!user?.id) return;
    setIsSavingName(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: nameDraft, updated_at: new Date().toISOString() }).eq("id", user.id);
    setFullName(nameDraft);
    setEditingName(false);
    setIsSavingName(false);
    showSaved("full_name");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
    router.refresh();
  };

  const displayEmail = user?.email ?? "";
  const displayName = fullName || (user?.user_metadata?.full_name as string) || displayEmail || "uDeets User";

  return (
    <AuthGuard>
    <MockAppShell activeNav="home">
      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">

        {/* Sidebar */}
        <aside className={cardClass("h-fit p-5")}>
          <div className="mb-4">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Settings</h1>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSection(item)}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-[var(--ud-brand-light)]/55 text-[var(--ud-brand-primary)]"
                      : item === "Danger Zone"
                        ? "text-rose-500 hover:bg-rose-50"
                        : "text-slate-600 hover:bg-[#F7FBFA]"
                  )}
                >
                  {item}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div>

          {/* Notifications */}
          {activeSection === "Notifications" ? (
            <section className={cardClass("p-6")}>
              <SectionTitle>Notifications</SectionTitle>
              {isLoadingPrefs ? (
                <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : (
                <div className="space-y-4">
                  {([
                    { key: "push_new_posts" as const, label: "Push alerts for new hub posts", desc: "Stay updated when subscribed hubs publish important updates." },
                    { key: "weekly_digest" as const, label: "Weekly community digest", desc: "Receive a recap of trending updates every Friday morning." },
                    { key: "event_reminders" as const, label: "Event reminders", desc: "Get reminder nudges before saved events begin." },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--ud-border-subtle)] p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--ud-text-primary)]">{label}</p>
                          <SavedBadge show={savedKey === key} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                      </div>
                      <Toggle enabled={notifPrefs[key]} onToggle={() => updateNotifPref(key)} label={label} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* Privacy */}
          {activeSection === "Privacy" ? (
            <section className={cardClass("p-6")}>
              <SectionTitle>Privacy</SectionTitle>
              {isLoadingPrefs ? (
                <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : (
                <div className="space-y-4">
                  {([
                    { key: "show_profile" as const, label: "Show profile in joined hubs", desc: "Let other members see your display name in shared communities." },
                    { key: "allow_invites" as const, label: "Allow direct community invites", desc: "Receive invite requests from local organizers." },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--ud-border-subtle)] p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--ud-text-primary)]">{label}</p>
                          <SavedBadge show={savedKey === key} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                      </div>
                      <Toggle enabled={privacyPrefs[key]} onToggle={() => updatePrivacyPref(key)} label={label} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* Appearance */}
          {activeSection === "Appearance" ? (
            <section className={cardClass("p-6")}>
              <SectionTitle>Appearance</SectionTitle>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--ud-text-primary)]">Theme</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Coming soon</span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    {(["Light", "Dark", "System"] as const).map((theme) => (
                      <label key={theme} className={cn(
                        "flex cursor-not-allowed items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
                        theme === "Light" ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]" : "border-[var(--ud-border)] text-slate-500"
                      )}>
                        <input type="radio" name="theme" value={theme} checked={theme === "Light"} readOnly className="accent-[#0C5C57]" />
                        {theme}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--ud-text-primary)]">Language</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Coming soon</span>
                  </div>
                  <select disabled className="mt-3 rounded-xl border border-[var(--ud-border)] bg-white px-4 py-2.5 text-sm text-slate-700 opacity-60">
                    <option>English</option>
                  </select>
                </div>
              </div>
            </section>
          ) : null}

          {/* Account */}
          {activeSection === "Account" ? (
            <section className={cardClass("p-6")}>
              <SectionTitle>Account</SectionTitle>
              <div className="divide-y divide-slate-100">
                {/* Full Name */}
                <div className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  {editingName ? (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <p className="w-28 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full Name</p>
                      <input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="flex-1 rounded-xl border border-[var(--ud-border)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none ring-[var(--ud-border-focus)] focus:ring-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={saveName} disabled={isSavingName} className="rounded-lg bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                          {isSavingName ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={() => setEditingName(false)} className="rounded-lg border border-[var(--ud-border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full Name</p>
                        <p className="mt-1 text-sm font-medium text-[var(--ud-text-primary)]">{displayName}</p>
                      </div>
                      <button type="button" onClick={() => { setNameDraft(fullName); setEditingName(true); }} className="shrink-0 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        Change
                      </button>
                    </>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-medium text-[var(--ud-text-primary)]">{displayEmail || "Not set"}</p>
                  </div>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password</p>
                    <p className="mt-1 text-sm text-slate-500">Managed by your sign-in provider</p>
                  </div>
                  <button type="button" disabled className="shrink-0 rounded-full border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-slate-400 opacity-60">
                    Change password
                  </button>
                </div>

                {/* Connected Accounts */}
                <div className="py-4 last:pb-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Connected Accounts</p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-[var(--ud-border-subtle)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[var(--ud-text-primary)]">Google</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-[var(--ud-brand-primary)]"><Check className="h-3 w-3" /> Connected</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-[var(--ud-border-subtle)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[var(--ud-text-primary)]">Apple</span>
                      </div>
                      <span className="text-xs text-slate-400">Not connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Danger Zone */}
          {activeSection === "Danger Zone" ? (
            <section className={cardClass("p-6")}>
              <SectionTitle>Danger Zone</SectionTitle>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-[var(--ud-border-subtle)] p-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--ud-text-primary)]">Sign out</p>
                    <p className="mt-1 text-sm text-slate-500">End your current session on this device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 rounded-full border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Sign out
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                  <div>
                    <p className="text-sm font-medium text-rose-600">Delete account</p>
                    <p className="mt-1 text-sm text-slate-500">Permanently remove your account and all data.</p>
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Contact support to delete your account"
                    className="shrink-0 rounded-full border border-rose-300 px-5 py-2 text-sm font-medium text-rose-400 opacity-60"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </section>
          ) : null}

        </div>
      </div>
    </MockAppShell>
    </AuthGuard>
  );
}
