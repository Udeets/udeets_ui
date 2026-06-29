"use client";

export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import { AlertCircle, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { useVerification } from "@/components/auth/VerificationProvider";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { changeContact } from "@/lib/api/auth";
import { notifyAuthSessionChanged } from "@/lib/auth/auth-session-events";
import { formatUsPhoneDisplay } from "@/lib/auth/verification-routes";
import { getProfileSummary } from "@/lib/services/profile/get-profile-summary";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import { listDeets } from "@/lib/services/deets/list-deets";
import { listMyMembershipsFromApi } from "@/lib/api/members";
import { cancelMyHubJoinRequestApi, prepareMyAvatarUploadApi, updateMyProfileApi } from "@/lib/api/profiles";
import { acceptInvitationFromApi, declineInvitationFromApi, listPendingInvitationsFromApi } from "@/lib/api/invites";
import { uploadToSignedUrl } from "@/lib/api/deet-media";

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
  const { user, status, session } = useAuthSession();
  const { openVerification } = useVerification();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<SidebarItem>("My Info");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      try {
        const summary = await getProfileSummary(user!.id);
        if (!cancelled && summary) {
          setProfile({
            full_name: summary.fullName,
            avatar_url: summary.avatarUrl,
            email: summary.email,
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [status, user?.id]);

  // Load hub stats
  useEffect(() => {
    if (status !== "authenticated" || !user?.id || !session?.access_token) return;
    let cancelled = false;

    async function loadStats() {
      const [hubs, memberships] = await Promise.all([
        listHubs(),
        listMyMembershipsFromApi(session.access_token),
      ]);
      if (cancelled) return;
      const createdCount = hubs.filter((hub) => hub.created_by === user.id).length;
      const joinedCount = memberships.filter((membership) => membership.status === "active").length;
      setHubStats({ created: createdCount, joined: joinedCount });
    }

    void loadStats();
    return () => { cancelled = true; };
  }, [status, user?.id, session?.access_token]);

  // Load user hubs when My Hubs tab is active
  useEffect(() => {
    if (activeTab !== "My Hubs" || status !== "authenticated" || !user?.id || !session?.access_token) return;
    if (userHubs.length > 0) return;
    let cancelled = false;

    async function loadHubs() {
      setIsLoadingHubs(true);
      try {
        const [memberships, hubs] = await Promise.all([
          listMyMembershipsFromApi(session.access_token),
          listHubs(),
        ]);

        if (cancelled) return;

        const activeMemberships = memberships.filter((membership) => membership.status === "active");
        if (!activeMemberships.length) {
          setIsLoadingHubs(false);
          return;
        }

        const roleMap = new Map(activeMemberships.map((membership) => [membership.hubId, membership.role]));
        const hubMap = new Map(hubs.map((hub) => [hub.id, hub]));

        setUserHubs(
          activeMemberships
            .map((membership) => {
              const hub = hubMap.get(membership.hubId);
              if (!hub) return null;
              return {
                hubId: hub.id,
                hubName: hub.name,
                hubCategory: hub.category,
                hubSlug: hub.slug,
                dpImage: hub.dp_image_url || "",
                role: roleMap.get(hub.id) || "member",
              } as UserHub;
            })
            .filter((hub): hub is UserHub => hub !== null),
        );
      } finally {
        setIsLoadingHubs(false);
      }
    }

    void loadHubs();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, session?.access_token, userHubs.length]);

  // Load user deets when My Posts tab is active
  useEffect(() => {
    if (activeTab !== "My Posts" || status !== "authenticated" || !user?.id) return;
    if (userDeets.length > 0) return;
    let cancelled = false;

    async function loadDeets() {
      setIsLoadingDeets(true);
      try {
        const [deets, hubs] = await Promise.all([
          listDeets({ publishedOnly: true }),
          listHubs(),
        ]);
        if (cancelled) return;

        const hubNameMap = new Map(hubs.map((hub) => [hub.id, hub.name]));
        const mine = deets
          .filter((deet) => deet.created_by === user.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 50)
          .map((deet) => ({
            id: deet.id,
            title: deet.title || "",
            body: deet.body || "",
            hubName: hubNameMap.get(deet.hub_id) || "Hub",
            createdAt: deet.created_at,
          }));
        setUserDeets(mine);
      } finally {
        setIsLoadingDeets(false);
      }
    }

    void loadDeets();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, userDeets.length]);

  // Load pending hub-join requests
  useEffect(() => {
    if (activeTab !== "Requests" || status !== "authenticated" || !user?.id || !session?.access_token) return;
    if (requestsLoaded) return;
    let cancelled = false;

    async function loadRequests() {
      setIsLoadingRequests(true);
      try {
        const [memberships, hubs] = await Promise.all([
          listMyMembershipsFromApi(session.access_token),
          listHubs(),
        ]);
        if (cancelled) return;

        const pending = memberships
          .filter((membership) => membership.status === "pending")
          .sort((a, b) => {
            const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
            const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
            return bTime - aTime;
          });

        if (!pending.length) {
          setPendingRequests([]);
          setRequestsLoaded(true);
          return;
        }

        const hubMap = new Map(hubs.map((hub) => [hub.id, hub]));
        const rows: PendingRequest[] = pending
          .map((membership) => {
            const hub = hubMap.get(membership.hubId);
            if (!hub) return null;
            return {
              membershipId: membership.id || "",
              hubId: hub.id,
              hubName: hub.name,
              hubCategory: hub.category,
              hubSlug: hub.slug,
              dpImage: hub.dp_image_url || "",
              requestedAt: membership.joinedAt ?? new Date().toISOString(),
            } as PendingRequest;
          })
          .filter((row): row is PendingRequest => row !== null && Boolean(row.membershipId));

        setPendingRequests(rows);
        setRequestsLoaded(true);
      } finally {
        setIsLoadingRequests(false);
      }
    }

    void loadRequests();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, session?.access_token, requestsLoaded]);

  // Load pending hub invitations
  useEffect(() => {
    if (activeTab !== "Invitations" || status !== "authenticated" || !user?.id || !session?.access_token) return;
    if (invitationsLoaded) return;
    let cancelled = false;

    async function loadInvitations() {
      setIsLoadingInvitations(true);
      try {
        const rows = await listPendingInvitationsFromApi(session.access_token);
        if (cancelled) return;
        setPendingInvitations(rows);
        setInvitationsLoaded(true);
      } catch (error) {
        console.warn("[profile] FastAPI invitations path failed:", error);
        if (cancelled) return;
        setPendingInvitations([]);
        setInvitationsLoaded(true);
      } finally {
        setIsLoadingInvitations(false);
      }
    }

    void loadInvitations();
    return () => { cancelled = true; };
  }, [activeTab, status, user?.id, session?.access_token, invitationsLoaded]);

  const cancelRequest = async (membershipId: string) => {
    if (!user?.id || cancellingRequestId) return;
    setCancellingRequestId(membershipId);
    const previous = pendingRequests;
    setPendingRequests((prev) => prev.filter((r) => r.membershipId !== membershipId));
    try {
      const ok = await cancelMyHubJoinRequestApi(membershipId);
      if (!ok) {
        console.error("[profile] cancel request error");
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
    if (!user?.id || !session?.access_token || respondingInvitationId) return;
    setRespondingInvitationId(invitation.invitationId);
    const previous = pendingInvitations;
    setPendingInvitations((prev) => prev.filter((i) => i.invitationId !== invitation.invitationId));
    try {
      const ok = await acceptInvitationFromApi(invitation.invitationId, session.access_token);
      if (ok) {
        setHubStats((prev) => ({ ...prev, joined: prev.joined + 1 }));
        setUserHubs([]);
        return;
      }
      setPendingInvitations(previous);
    } catch (err) {
      console.error("[profile] accept invitation failed:", err);
      setPendingInvitations(previous);
    } finally {
      setRespondingInvitationId(null);
    }
  };

  const declineInvitation = async (invitation: PendingInvitation) => {
    if (!user?.id || !session?.access_token || respondingInvitationId) return;
    setRespondingInvitationId(invitation.invitationId);
    const previous = pendingInvitations;
    setPendingInvitations((prev) => prev.filter((i) => i.invitationId !== invitation.invitationId));
    try {
      const ok = await declineInvitationFromApi(invitation.invitationId, session.access_token);
      if (ok) return;
      setPendingInvitations(previous);
    } catch (err) {
      console.error("[profile] decline invitation failed:", err);
      setPendingInvitations(previous);
    } finally {
      setRespondingInvitationId(null);
    }
  };

  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string) || user?.email || "uDeets User";
  const displayEmail = user?.email || profile?.email || "";
  const displayPhone = formatUsPhoneDisplay(user?.phone);
  const isGoogleConnected = Boolean(user?.oauthProviders?.includes("google"));
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
      const prepared = await prepareMyAvatarUploadApi({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      await uploadToSignedUrl(prepared.signedUploadUrl, file, file.type || "application/octet-stream");
      const publicUrl = `${prepared.publicUrl}?t=${Date.now()}`;
      const updated = await updateMyProfileApi({ avatarUrl: publicUrl });
      if (!updated) {
        setAvatarError("Profile update failed. Please try again.");
        return;
      }
      setAvatarLoadFailed(false);
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
    } catch (err) {
      console.error("[profile] avatar upload failed:", err);
      setAvatarError("Something went wrong. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setSaveError(null);
    setEditingField(field);
    if (field === "phone") {
      const digits = (user?.phone ?? "").replace(/\D/g, "");
      const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
      setEditDraft(national);
    } else {
      setEditDraft(currentValue);
    }
  };
  const cancelEditing = () => { setEditingField(null); setEditDraft(""); setSaveError(null); };

  const saveField = async (field: string) => {
    if (!user?.id) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (field === "full_name") {
        const ok = await updateMyProfileApi({ fullName: editDraft });
        if (!ok) return;
        setProfile((prev) => prev ? { ...prev, full_name: editDraft } : prev);
        setEditingField(null);
        setEditDraft("");
        return;
      }

      if (field === "email" || field === "phone") {
        await changeContact({ channel: field, value: editDraft });
        notifyAuthSessionChanged();
        setEditingField(null);
        setEditDraft("");
        // New/changed contact is unverified — prompt verification immediately.
        openVerification(field);
        return;
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save. Try again.");
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

  type ContactRow = {
    label: string;
    field: string;
    value: string;
    editable: boolean;
    verified?: boolean;
    showVerifyAction?: boolean;
    verifyFocus?: "phone" | "email";
  };

  const infoRows: ContactRow[] = [
    { label: "Full Name", field: "full_name", value: profile?.full_name || "", editable: true },
    {
      label: "Email",
      field: "email",
      value: displayEmail,
      editable: !isGoogleConnected,
      verified: user?.email ? Boolean(user?.emailVerified) : undefined,
      showVerifyAction: Boolean(user?.email && !user.emailVerified && !isGoogleConnected),
      verifyFocus: "email",
    },
    {
      label: "Phone",
      field: "phone",
      value: displayPhone,
      editable: true,
      verified: user?.phone ? Boolean(user?.phoneVerified) : undefined,
      showVerifyAction: Boolean(user?.phone && !user.phoneVerified),
      verifyFocus: "phone",
    },
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
                  {infoRows.map(({ label, field, value, editable, verified, showVerifyAction, verifyFocus }) => (
                    <div key={label} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      {editingField === field && editable ? (
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                            <p className="w-32 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                            {field === "phone" ? (
                              <div className="flex-1">
                                <PhoneInput value={editDraft} onChange={setEditDraft} />
                              </div>
                            ) : (
                              <input
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                type={field === "email" ? "email" : "text"}
                                className="flex-1 rounded-xl border border-[var(--ud-border)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none ring-[#A9D1CA] focus:ring-2"
                                autoFocus
                              />
                            )}
                            <div className="flex gap-2">
                              <button type="button" onClick={() => saveField(field)} disabled={isSaving} className="rounded-lg bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button type="button" onClick={cancelEditing} className="rounded-lg border border-[var(--ud-border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                Cancel
                              </button>
                            </div>
                          </div>
                          {field !== "full_name" ? (
                            <p className="text-xs text-slate-500">
                              {field === "email"
                                ? "We'll send a verification link to confirm this email."
                                : "We'll text a 6-digit code to confirm this number."}
                            </p>
                          ) : null}
                          {saveError ? <p className="text-xs text-red-600">{saveError}</p> : null}
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                              {typeof verified === "boolean" ? (
                                verified ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                    <Check className="h-3.5 w-3.5" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Not verified
                                  </span>
                                )
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm font-medium text-[var(--ud-text-primary)]">{value || "Not set"}</p>
                            {showVerifyAction ? (
                              <p className="mt-1 text-xs text-amber-700">
                                Verify this {label.toLowerCase()} to unlock full account access.
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {showVerifyAction && verifyFocus ? (
                              <button
                                type="button"
                                onClick={() => openVerification(verifyFocus)}
                                className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                              >
                                Verify
                              </button>
                            ) : null}
                            {editable ? (
                              <button type="button" onClick={() => startEditing(field, value)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                                {value ? "Change" : "Add"}
                              </button>
                            ) : null}
                          </div>
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
                        <p className="text-xs text-slate-500">{isGoogleConnected ? displayEmail : "Not connected"}</p>
                      </div>
                    </div>
                    {isGoogleConnected ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)]">
                        <Check className="h-4 w-4" />
                        Connected
                      </div>
                    ) : (
                      <a
                        href="/auth/google?next=/profile"
                        className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Connect
                      </a>
                    )}
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
              <p className="mt-1 mb-5 text-sm text-slate-500">
                Hubs you&apos;ve asked to join, pending approval.
              </p>
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
