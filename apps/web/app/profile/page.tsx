"use client";

export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SIDEBAR_ITEMS = [
  "My Info",
  "My Hubs",
  "My Posts",
  "Requests",
  "Invitations",
  "Account Settings",
] as const;

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export default function ProfilePage() {
  const { user, status } = useAuthSession();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hubStats, setHubStats] = useState({ created: 0, joined: 0 });

  // Load profile from DB
  useEffect(() => {
    if (status !== "authenticated" || !user?.id) return;
    let cancelled = false;

    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, email")
        .eq("id", user!.id)
        .single();

      if (!cancelled && data) setProfile(data);
      setIsLoadingProfile(false);
    }

    load();
    return () => { cancelled = true; };
  }, [status, user?.id]);

  // Load hub stats
  useEffect(() => {
    if (status !== "authenticated" || !user?.id) return;
    let cancelled = false;

    async function loadStats() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const [{ count: createdCount }, { count: joinedCount }] = await Promise.all([
        supabase.from("hubs").select("*", { count: "exact", head: true }).eq("created_by", user!.id),
        supabase.from("hub_members").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active"),
      ]);

      if (!cancelled) setHubStats({ created: createdCount ?? 0, joined: joinedCount ?? 0 });
    }

    loadStats();
    return () => { cancelled = true; };
  }, [status, user?.id]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name as string || user?.email || "uDeets User";
  const displayEmail = user?.email || profile?.email || "";
  const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined) || "";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploadingAvatar(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error("[profile] avatar upload error:", uploadError);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
    } catch (err) {
      console.error("[profile] avatar upload failed:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditDraft(currentValue);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditDraft("");
  };

  const saveField = async (field: string) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const updatePayload: Record<string, string> = { updated_at: new Date().toISOString() };
      if (field === "full_name") updatePayload.full_name = editDraft;

      await supabase.from("profiles").update(updatePayload).eq("id", user.id);
      setProfile((prev) => prev ? { ...prev, ...updatePayload } : prev);
      setEditingField(null);
      setEditDraft("");
    } catch (err) {
      console.error("[profile] save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const infoRows: Array<{ label: string; field: string; value: string; editable: boolean }> = [
    { label: "Full Name", field: "full_name", value: profile?.full_name || "", editable: true },
    { label: "Email", field: "email", value: displayEmail, editable: false },
  ];

  return (
    <MockAppShell activeNav="home">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className={cardClass("h-fit p-5 sm:p-6")}>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile Menu</p>
            <h1 className="mt-2 text-2xl font-serif font-semibold tracking-tight text-[#111111]">My Info</h1>
          </div>
          <nav className="space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              const active = item === "My Info";
              return (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                    active
                      ? "bg-[#A9D1CA]/55 text-[#0C5C57] shadow-sm"
                      : "text-slate-600 hover:bg-[#F7FBFA]"
                  )}
                >
                  <span>{item}</span>
                  {active ? <span className="h-2.5 w-2.5 rounded-full bg-[#0C5C57]" /> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="space-y-6">

          {/* SECTION 1 — Profile Card */}
          <section className={cardClass("p-6 sm:p-8")}>
            <div className="flex items-start gap-5">
              <div className="shrink-0">
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="relative h-20 w-20 overflow-hidden rounded-full"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
                      <span className="text-2xl font-semibold text-white/80">{displayName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {isUploadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-2 block w-full text-center text-xs text-[#0C5C57] hover:underline"
                >
                  Edit photo
                </button>
              </div>
              <div className="min-w-0 pt-1">
                <h2 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">
                  {isLoadingProfile ? "Loading..." : displayName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{displayEmail}</p>
                <p className="mt-3 text-sm text-slate-500">
                  Member of {hubStats.joined} {hubStats.joined === 1 ? "hub" : "hubs"} · Created {hubStats.created} {hubStats.created === 1 ? "hub" : "hubs"}
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2 — Personal Information */}
          <section className={cardClass("p-6 sm:p-8")}>
            <div className="mb-5">
              <h2 className={sectionTitleClass()}>Personal Information</h2>
              <p className="mt-1 text-sm text-slate-500">Keep your profile details up to date.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {infoRows.map(({ label, field, value, editable }) => (
                <div key={label} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  {editingField === field && editable ? (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <p className="w-32 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-[#111111] outline-none ring-[#A9D1CA] focus:ring-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveField(field)}
                          disabled={isSaving}
                          className="rounded-lg bg-[#0C5C57] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#094a46] disabled:opacity-60"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                        <p className="mt-1 text-sm font-medium text-[#111111]">{value || "Not set"}</p>
                      </div>
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => startEditing(field, value)}
                          className="shrink-0 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Change
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3 — Connected Accounts */}
          <section className={cardClass("p-6 sm:p-8")}>
            <div className="mb-5">
              <h2 className={sectionTitleClass()}>Connected Accounts</h2>
              <p className="mt-1 text-sm text-slate-500">Manage linked sign-in providers.</p>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">Google</p>
                    <p className="text-xs text-slate-500">{displayEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#0C5C57]">
                  <Check className="h-4 w-4" />
                  Connected
                </div>
              </div>

              <div className="flex items-center justify-between py-4 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">Apple</p>
                    <p className="text-xs text-slate-500">Not connected</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Connect
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </MockAppShell>
  );
}
