"use client";

export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SidebarItem = "My Info" | "My Hubs" | "My Posts" | "Requests" | "Invitations" | "Account Settings";

const SIDEBAR_ITEMS: SidebarItem[] = [
  "My Info",
  "My Hubs",
  "My Posts",
  "Requests",
  "Invitations",
  "Account Settings",
];

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

type UserHub = {
  hubId: string;
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  dpImage: string;
  role: string;
};

type UserDeet = {
  id: string;
  title: string;
  body: string;
  hubName: string;
  createdAt: string;
};

type PendingRequest = {
  membershipId: string;
  hubId: string;
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  dpImage: string;
  requestedAt: string;
};

type PendingInvitation = {
  invitationId: string;
  hubId: string;
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  dpImage: string;
  invitedAt: string;
  invitedByName: string;
};

function formatTimeAgo(dateStr: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, status } = useAuthSession();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<SidebarItem>("My Info");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hubStats, setHubStats] = useState({ created: 0, joined: 0 });
  const [userHubs, setUserHubs] = useState<UserHub[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(false);
  const [userDeets, setUserDeets] = useState<UserDeet[]>([]);
  const [isLoadingDeets, setIsLoadingDeets] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null);
  const [invitationsLoaded, setInvitationsLoaded] = useState(false);

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

  // Load user hubs when My Hubs tab is active
  useEffect(() => {
    if (activeTab !== "My Hubs" || status !== "authenticated" || !user?.id) return;
    if (userHubs.length > 0) return;
    let cancelled = false;

    async function loadHubs() {
      setIsLoadingHubs(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: memberships } = await supabase
        .from("hub_members")
        .select("hub_id, role")
        .eq("user_id", user!.id)
        .eq("status", "active");

      if (!memberships || memberships.length === 0 || cancelled) {
        setIsLoadingHubs(false);
        return;
      }

      const hubIds = memberships.map((m) => m.hub_id);
      const roleMap = new Map(memberships.map((m) => [m.hub_id, m.role]));

      const { data: hubs } = await supabase
        .from("hubs")
        .select("id, name, category, slug, dp_image_url")
        .in("id", hubIds);

      if (!cancelled && hubs) {
        setUserHubs(hubs.map((h) => ({
          hubId: h.id,
          hubName: h.name,
          hubCategory: h.category,
          hubSlug: h.slug,
          dpImage: h.dp_image_url || "",
          role: roleMap.get(h.id) || "member",
        })));
      }
      setIsLoadingHubs(false);
    }

    loadHubs();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, userHubs.length]);

  // Load user deets when My Posts tab is active
  useEffect(() => {
    if (activeTab !== "My Posts" || status !== "authenticated" || !user?.id) return;
    if (userDeets.length > 0) return;
    let cancelled = false;

    async function loadDeets() {
      setIsLoadingDeets(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = await supabase
        .from("deets")
        .select("id, title, body, hub_id, created_at")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled && data) {
        const hubIds = [...new Set(data.map((d) => d.hub_id).filter(Boolean))];
        let hubNameMap = new Map<string, string>();

        if (hubIds.length > 0) {
          const { data: hubs } = await supabase.from("hubs").select("id, name").in("id", hubIds);
          if (hubs) hubNameMap = new Map(hubs.map((h) => [h.id, h.name]));
        }

        setUserDeets(data.map((d) => ({
          id: d.id,
          title: d.title || "",
          body: d.body || "",
          hubName: hubNameMap.get(d.hub_id) || "Hub",
          createdAt: d.created_at,
        })));
      }
      setIsLoadingDeets(false);
    }

    loadDeets();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, userDeets.length]);

  // Load pending hub-join requests
  useEffect(() => {
    if (activeTab !== "Requests" || status !== "authenticated" || !user?.id) return;
    if (requestsLoaded) return;
    let cancelled = false;

    async function loadRequests() {
      setIsLoadingRequests(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: memberships } = await supabase
        .from("hub_members")
        .select("id, hub_id, created_at")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (!memberships || memberships.length === 0) {
        setPendingRequests([]);
        setIsLoadingRequests(false);
        setRequestsLoaded(true);
        return;
      }

      const hubIds = memberships.map((m) => m.hub_id);
      const { data: hubs } = await supabase
        .from("hubs")
        .select("id, name, category, slug, dp_image_url")
        .in("id", hubIds);

      if (cancelled) return;

      const hubMap = new Map((hubs ?? []).map((h) => [h.id, h]));
      const rows: PendingRequest[] = memberships
        .map((m) => {
          const hub = hubMap.get(m.hub_id);
          if (!hub) return null;
          return {
            membershipId: m.id,
            hubId: hub.id,
            hubName: hub.name,
            hubCategory: hub.category,
            hubSlug: hub.slug,
            dpImage: hub.dp_image_url || "",
            requestedAt: m.created_at,
          } as PendingRequest;
        })
        .filter((r): r is PendingRequest => r !== null);

      setPendingRequests(rows);
      setIsLoadingRequests(false);
      setRequestsLoaded(true);
    }

    loadRequests();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, requestsLoaded]);

  // Load pending hub invitations
  useEffect(() => {
    if (activeTab !== "Invitations" || status !== "authenticated" || !user?.id) return;
    if (invitationsLoaded) return;
    let cancelled = false;

    async function loadInvitations() {
      setIsLoadingInvitations(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: invitations, error } = await supabase
        .from("hub_invitations")
        .select("id, hub_id, invited_by, created_at")
        .eq("invited_user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      // If the table doesn't exist yet (migration not applied), fail gracefully.
      if (error) {
        console.warn("[profile] invitations query failed:", error.message);
        setPendingInvitations([]);
        setIsLoadingInvitations(false);
        setInvitationsLoaded(true);
        return;
      }

      if (!invitations || invitations.length === 0) {
        setPendingInvitations([]);
        setIsLoadingInvitations(false);
        setInvitationsLoaded(true);
        return;
      }

      const hubIds = [...new Set(invitations.map((i) => i.hub_id))];
      const inviterIds = [...new Set(invitations.map((i) => i.invited_by).filter(Boolean) as string[])];

      const [{ data: hubs }, { data: inviters }] = await Promise.all([
        supabase.from("hubs").select("id, name, category, slug, dp_image_url").in("id", hubIds),
        inviterIds.length > 0
          ? supabase.from("profiles").select("id, full_name, email").in("id", inviterIds)
          : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string | null }> }),
      ]);

      if (cancelled) return;

      const hubMap = new Map((hubs ?? []).map((h) => [h.id, h]));
      const inviterMap = new Map(
        (inviters ?? []).map((p) => {
          const name = p.full_name || (p.email ? p.email.split("@")[0] : "Someone");
          return [p.id, name];
        })
      );

      const rows: PendingInvitation[] = invitations
        .map((inv) => {
          const hub = hubMap.get(inv.hub_id);
          if (!hub) return null;
          return {
            invitationId: inv.id,
            hubId: hub.id,
            hubName: hub.name,
            hubCategory: hub.category,
            hubSlug: hub.slug,
            dpImage: hub.dp_image_url || "",
            invitedAt: inv.created_at,
            invitedByName: inv.invited_by ? (inviterMap.get(inv.invited_by) || "Someone") : "Someone",
          } as PendingInvitation;
        })
        .filter((r): r is PendingInvitation => r !== null);

      setPendingInvitations(rows);
      setIsLoadingInvitations(false);
      setInvitationsLoaded(true);
    }

    loadInvitations();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, invitationsLoaded]);

  const cancelRequest = async (membershipId: string) => {
    if (!user?.id || cancellingRequestId) return;
    setCancellingRequestId(membershipId);
    const previous = pendingRequests;
    setPendingRequests((prev) => prev.filter((r) => r.membershipId !== membershipId));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("hub_members")
        .delete()
        .eq("id", membershipId)
        .eq("user_id", user.id);
      if (error) {
        console.error("[profile] cancel request error:", error);
        setPendingRequests(previous); // restore on failure
      }
    } catch (err) {
      console.error("[profile] cancel request failed:", err);
      setPendingRequests(previous);
    } finally {
      setCancellingRequestId(null);
    }
  };

  const acceptInvitation = async (invitation: PendingInvitation) => {
    if (!user?.id || respondingInvitationId) return;
    setRespondingInvitationId(invitation.invitationId);
    const previous = pendingInvitations;
    setPendingInvitations((prev) => prev.filter((i) => i.invitationId !== invitation.invitationId));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Upsert hub_members first so failures don't leave invitation marked accepted
      const { error: memberError } = await supabase
        .from("hub_members")
        .upsert({ hub_id: invitation.hubId, user_id: user.id, status: "active", role: "member" }, { onConflict: "hub_id,user_id" });
      if (memberError) {
        console.error("[profile] accept invitation membership error:", memberError);
        setPendingInvitations(previous);
        return;
      }

      const { error: invError } = await supabase
        .from("hub_invitations")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", invitation.invitationId)
        .eq("invited_user_id", user.id);
      if (invError) {
        console.warn("[profile] accept invitation update warning:", invError);
        // Membership already in place; not critical to restore UI.
      }

      // Bump joined hub stat + invalidate My Hubs cache so next visit refetches.
      setHubStats((prev) => ({ ...prev, joined: prev.joined + 1 }));
      setUserHubs([]);
    } catch (err) {
      console.error("[profile] accept invitation failed:", err);
      setPendingInvitations(previous);
    } finally {
      setRespondingInvitationId(null);
    }
  };

  const declineInvitation = async (invitation: PendingInvitation) => {
    if (!user?.id || respondingInvitationId) return;
    setRespondingInvitationId(invitation.invitationId);
    const previous = pendingInvitations;
    setPendingInvitations((prev) => prev.filter((i) => i.invitationId !== invitation.invitationId));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("hub_invitations")
        .update({ status: "declined", responded_at: new Date().toISOString() })
        .eq("id", invitation.invitationId)
        .eq("invited_user_id", user.id);
      if (error) {
        console.error("[profile] decline invitation error:", error);
        setPendingInvitations(previous);
      }
    } catch (err) {
      console.error("[profile] decline invitation failed:", err);
      setPendingInvitations(previous);
    } finally {
      setRespondingInvitationId(null);
    }
  };

  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string) || user?.email || "uDeets User";
  const displayEmail = user?.email || profile?.email || "";
  const rawAvatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined) || "";
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarUrl = avatarLoadFailed ? "" : rawAvatarUrl;

  // Reset avatar load state when url changes
  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [rawAvatarUrl]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) {
        console.error("[profile] avatar upload error:", uploadError);
        setAvatarError(uploadError.message.includes("not found") ? "Avatar storage is not set up yet. Please run the latest database migration." : `Upload failed: ${uploadError.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (updateError) { console.error("[profile] avatar update error:", updateError); setAvatarError(`Profile update failed: ${updateError.message}`); return; }
      // Also sync avatar to auth user metadata so navigation header updates
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarLoadFailed(false);
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
    } catch (err) {
      console.error("[profile] avatar upload failed:", err);
      setAvatarError("Something went wrong. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const startEditing = (field: string, currentValue: string) => { setEditingField(field); setEditDraft(currentValue); };
  const cancelEditing = () => { setEditingField(null); setEditDraft(""); };

  const saveField = async (field: string) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const updatePayload: Record<string, string> = { updated_at: new Date().toISOString() };
      if (field === "full_name") updatePayload.full_name = editDraft;
      const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
      if (error) { console.error("[profile] save error:", error); return; }

      // Also update Supabase auth user metadata so navigation header reflects changes
      if (field === "full_name") {
        await supabase.auth.updateUser({ data: { full_name: editDraft } });
      }

      setProfile((prev) => prev ? { ...prev, full_name: field === "full_name" ? editDraft : prev.full_name } : prev);
      setEditingField(null);
      setEditDraft("");
    } catch (err) {
      console.error("[profile] save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavClick = (item: SidebarItem) => {
    if (item === "Account Settings") {
      router.push("/settings");
      return;
    }
    setActiveTab(item);
  };

  const infoRows: Array<{ label: string; field: string; value: string; editable: boolean }> = [
    { label: "Full Name", field: "full_name", value: profile?.full_name || "", editable: true },
    { label: "Email", field: "email", value: displayEmail, editable: false },
  ];

  return (
    <AuthGuard>
    <MockAppShell activeNav="home">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className={cardClass("h-fit p-5 sm:p-6")}>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile Menu</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ud-text-primary)]">{activeTab}</h1>
          </div>
          <nav className="space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              const active = item === activeTab;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                    active
                      ? "bg-[var(--ud-brand-light)]/55 text-[var(--ud-brand-primary)] shadow-sm"
                      : "text-slate-600 hover:bg-[#F7FBFA]"
                  )}
                >
                  <span>{item}</span>
                  {active ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--ud-brand-primary)]" /> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="space-y-6">

          {/* ===== MY INFO ===== */}
          {activeTab === "My Info" ? (
            <>
              <section className={cardClass("p-6 sm:p-8")}>
                <div className="flex items-start gap-5">
                  <div className="shrink-0">
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar} className="group relative h-20 w-20 overflow-hidden rounded-full">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" onError={() => setAvatarLoadFailed(true)} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
                          <span className="text-2xl font-semibold text-white/80">{displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U"}</span>
                        </div>
                      )}
                      {isUploadingAvatar ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="mt-2 block w-full text-center text-xs text-[var(--ud-brand-primary)] hover:underline">
                      Change photo
                    </button>
                    {avatarError ? <p className="mt-1 text-xs text-red-500">{avatarError}</p> : null}
                  </div>
                  <div className="min-w-0 pt-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
                      {isLoadingProfile ? "Loading..." : displayName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{displayEmail}</p>
                    <p className="mt-3 text-sm text-slate-500">
                      Member of {hubStats.joined} {hubStats.joined === 1 ? "hub" : "hubs"} · Created {hubStats.created} {hubStats.created === 1 ? "hub" : "hubs"}
                    </p>
                  </div>
                </div>
              </section>

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
                          <input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="flex-1 rounded-xl border border-[var(--ud-border)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none ring-[#A9D1CA] focus:ring-2" autoFocus />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => saveField(field)} disabled={isSaving} className="rounded-lg bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={cancelEditing} className="rounded-lg border border-[var(--ud-border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                            <p className="mt-1 text-sm font-medium text-[var(--ud-text-primary)]">{value || "Not set"}</p>
                          </div>
                          {editable ? (
                            <button type="button" onClick={() => startEditing(field, value)} className="shrink-0 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                              Change
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>

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
                        <p className="text-sm font-medium text-[var(--ud-text-primary)]">Google</p>
                        <p className="text-xs text-slate-500">{displayEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)]">
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
                        <p className="text-sm font-medium text-[var(--ud-text-primary)]">Apple</p>
                        <p className="text-xs text-slate-500">Not connected</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => alert("Apple Sign-In is coming soon!")} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      Connect
                    </button>
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {/* ===== MY HUBS ===== */}
          {activeTab === "My Hubs" ? (
            <section className={cardClass("p-6 sm:p-8")}>
              <h2 className={sectionTitleClass()}>My Hubs</h2>
              <p className="mt-1 mb-5 text-sm text-slate-500">Hubs you have created or joined.</p>
              {isLoadingHubs ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading hubs...</div>
              ) : userHubs.length === 0 ? (
                <div className="rounded-xl border border-[var(--ud-border-subtle)] px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">You haven&apos;t joined any hubs yet.</p>
                  <Link href="/discover" className="mt-3 inline-block text-sm font-medium text-[var(--ud-brand-primary)] hover:underline">
                    Discover hubs →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userHubs.map((hub) => (
                    <Link
                      key={hub.hubId}
                      href={`/hubs/${hub.hubCategory}/${hub.hubSlug}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--ud-border-subtle)] p-4 transition hover:border-[var(--ud-border)] hover:bg-gray-50"
                    >
                      {hub.dpImage ? (
                        <img src={hub.dpImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
                          <span className="text-sm font-semibold text-white/80">{hub.hubName.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{hub.hubName}</p>
                        <p className="text-xs text-slate-500">{hub.hubCategory}</p>
                      </div>
                      <span className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                        hub.role === "creator" ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                          : hub.role === "admin" ? "bg-blue-50 text-blue-600"
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {hub.role}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* ===== MY POSTS ===== */}
          {activeTab === "My Posts" ? (
            <section className={cardClass("p-6 sm:p-8")}>
              <h2 className={sectionTitleClass()}>My Posts</h2>
              <p className="mt-1 mb-5 text-sm text-slate-500">Posts you have shared across your hubs.</p>
              {isLoadingDeets ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading posts...</div>
              ) : userDeets.length === 0 ? (
                <div className="rounded-xl border border-[var(--ud-border-subtle)] px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">No posts yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userDeets.map((deet) => (
                    <article key={deet.id} className="rounded-xl border border-[var(--ud-border-subtle)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[var(--ud-brand-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ud-brand-primary)]">{deet.hubName}</span>
                        <span className="text-xs text-slate-400">{formatTimeAgo(deet.createdAt)}</span>
                      </div>
                      {(() => {
                        const genericTitles = new Set(["Deet", "Notice", "News", "Deal", "Hazard", "Alert", "Photo"]);
                        const cleanBody = deet.body ? deet.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
                        const displayTitle = deet.title && !genericTitles.has(deet.title) ? deet.title : "";
                        const titleFromBody = !displayTitle && cleanBody ? cleanBody.slice(0, 100) : "";
                        // Strip body text that starts with the title to avoid duplication
                        const dedupedBody = (cleanBody && displayTitle && cleanBody.startsWith(displayTitle))
                          ? cleanBody.slice(displayTitle.length).trim()
                          : cleanBody;
                        return (
                          <>
                            {(displayTitle || titleFromBody) && (
                              <p className="mt-2 text-sm font-semibold text-[var(--ud-text-primary)]">{displayTitle || titleFromBody}</p>
                            )}
                            {dedupedBody && displayTitle && (
                              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{dedupedBody}</p>
                            )}
                          </>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* ===== REQUESTS ===== */}
          {activeTab === "Requests" ? (
            <section className={cardClass("p-6 sm:p-8")}>
              <h2 className={sectionTitleClass()}>Requests</h2>
              <p className="mt-1 mb-5 text-sm text-slate-500">Hubs you've asked to join, pending approval.</p>
              {isLoadingRequests ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="rounded-xl border border-[var(--ud-border-subtle)] px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">No pending requests.</p>
                  <Link href="/discover" className="mt-3 inline-block text-sm font-medium text-[var(--ud-brand-primary)] hover:underline">
                    Discover hubs →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.membershipId}
                      className="flex items-center gap-3 rounded-xl border border-[var(--ud-border-subtle)] p-4"
                    >
                      <Link
                        href={`/hubs/${req.hubCategory}/${req.hubSlug}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        {req.dpImage ? (
                          <img src={req.dpImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
                            <span className="text-sm font-semibold text-white/80">{req.hubName.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{req.hubName}</p>
                          <p className="text-xs text-slate-500">Requested {formatTimeAgo(req.requestedAt)}</p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => cancelRequest(req.membershipId)}
                        disabled={cancellingRequestId === req.membershipId}
                        className="shrink-0 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {cancellingRequestId === req.membershipId ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Cancelling</span>
                        ) : (
                          "Cancel"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* ===== INVITATIONS ===== */}
          {activeTab === "Invitations" ? (
            <section className={cardClass("p-6 sm:p-8")}>
              <h2 className={sectionTitleClass()}>Invitations</h2>
              <p className="mt-1 mb-5 text-sm text-slate-500">Hubs that have invited you to join.</p>
              {isLoadingInvitations ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading invitations...</div>
              ) : pendingInvitations.length === 0 ? (
                <div className="rounded-xl border border-[var(--ud-border-subtle)] px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">No pending invitations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((inv) => (
                    <div
                      key={inv.invitationId}
                      className="flex flex-col gap-3 rounded-xl border border-[var(--ud-border-subtle)] p-4 sm:flex-row sm:items-center"
                    >
                      <Link
                        href={`/hubs/${inv.hubCategory}/${inv.hubSlug}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        {inv.dpImage ? (
                          <img src={inv.dpImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
                            <span className="text-sm font-semibold text-white/80">{inv.hubName.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{inv.hubName}</p>
                          <p className="text-xs text-slate-500">Invited by {inv.invitedByName} · {formatTimeAgo(inv.invitedAt)}</p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => acceptInvitation(inv)}
                          disabled={respondingInvitationId === inv.invitationId}
                          className="rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {respondingInvitationId === inv.invitationId ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Working</span>
                          ) : (
                            "Accept"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => declineInvitation(inv)}
                          disabled={respondingInvitationId === inv.invitationId}
                          className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

        </div>
      </div>
    </MockAppShell>
    </AuthGuard>
  );
}
