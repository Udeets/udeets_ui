"use client";

import { Check, Copy, Loader2, QrCode, Search, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../hubUtils";
import { searchProfiles, type SearchedProfile } from "@/lib/services/profile/search-profiles";
import { inviteUserToHub } from "@/lib/services/hubs/invite-user-to-hub";

type InviteTab = "search" | "qr";

export function InviteModal({
  hubName,
  hubSlug,
  hubCategory,
  hubId,
  onClose,
}: {
  hubName: string;
  hubSlug: string;
  hubCategory: string;
  hubId: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<InviteTab>("search");

  // ── Search tab state ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchedProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [invitingIds, setInvitingIds] = useState<Set<string>>(new Set());
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // ── Shared state ──────────────────────────────────────────────────
  const joinUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/hubs/${hubCategory}/${hubSlug}/join`;
    }
    return `/hubs/${hubCategory}/${hubSlug}/join`;
  }, [hubCategory, hubSlug]);

  const [copiedLink, setCopiedLink] = useState(false);

  // Show a short-lived toast
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  // Focus search input when landing on the Search tab
  useEffect(() => {
    if (activeTab !== "search") return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [activeTab]);

  // Resolve current user + existing member/invite sets once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled && user) setCurrentUserId(user.id);

      const [{ data: members }, { data: invites }] = await Promise.all([
        supabase.from("hub_members").select("user_id, status").eq("hub_id", hubId),
        supabase.from("hub_invitations").select("invited_user_id, status").eq("hub_id", hubId).eq("status", "pending"),
      ]);
      if (cancelled) return;
      if (members) {
        setMemberIds(new Set(members.filter((m: { status: string }) => m.status === "active").map((m: { user_id: string }) => m.user_id)));
      }
      if (invites) {
        setInvitedIds(new Set(invites.map((r: { invited_user_id: string }) => r.invited_user_id)));
      }
    })();
    return () => { cancelled = true; };
  }, [hubId]);

  // Debounced search — only fires once the user has typed 2+ chars and the
  // query has settled for 250ms. Cancels older requests so rapid typing
  // doesn't race into out-of-order results.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        const rows = await searchProfiles(q, 10);
        if (!controller.signal.aborted) {
          setResults(rows);
          setIsSearching(false);
        }
      } catch {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleInvite = async (userId: string) => {
    if (invitingIds.has(userId)) return;
    setInvitingIds((prev) => new Set(prev).add(userId));
    try {
      const result = await inviteUserToHub(hubId, userId);
      if (result.status === "invited") {
        setInvitedIds((prev) => new Set(prev).add(userId));
        showToast("Invitation sent");
      } else if (result.status === "already_invited") {
        setInvitedIds((prev) => new Set(prev).add(userId));
        showToast("Already invited");
      } else if (result.status === "already_member") {
        setMemberIds((prev) => new Set(prev).add(userId));
        showToast("Already a member");
      } else {
        showToast(result.message || "Could not send invite");
      }
    } finally {
      setInvitingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      showToast("Link copied");
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      showToast("Could not copy link");
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.[0] || "?").toUpperCase();
  };

  const visibleResults = results.filter((u) => u.id !== currentUserId);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--ud-bg-overlay)]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-[var(--ud-bg-card)] shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--ud-border-subtle)] p-5">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[var(--ud-text-primary)]">
                Invite to {hubName}
              </h2>
              <p className="mt-1 text-xs text-[var(--ud-text-muted)]">
                Find uDeets members or share a QR code anyone can scan to request joining.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-[var(--ud-border-subtle)] px-3">
            {([
              { key: "search" as const, label: "Search", icon: Search },
              { key: "qr" as const, label: "QR Code", icon: QrCode },
            ]).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                      : "border-transparent text-[var(--ud-text-secondary)] hover:text-[var(--ud-text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4 stroke-[1.8]" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="p-5">
            {activeTab === "search" ? (
              <div className="flex flex-col gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ud-text-muted)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] py-2.5 pl-9 pr-3 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-brand-primary)] focus:ring-1 focus:ring-[var(--ud-brand-primary)]"
                  />
                </div>

                {/* Results */}
                <div className="min-h-[120px] max-h-[300px] overflow-y-auto rounded-lg border border-[var(--ud-border-subtle)]">
                  {searchQuery.trim().length < 2 ? (
                    <p className="px-4 py-8 text-center text-xs text-[var(--ud-text-muted)]">
                      Type at least 2 characters to search.
                    </p>
                  ) : isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-brand-primary)]" />
                    </div>
                  ) : visibleResults.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-[var(--ud-text-muted)]">
                      No matches. Try a different name or email.
                    </p>
                  ) : (
                    visibleResults.map((user) => {
                      const isMember = memberIds.has(user.id);
                      const isInvited = invitedIds.has(user.id);
                      const isInviting = invitingIds.has(user.id);

                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 border-b border-[var(--ud-border-subtle)] px-3 py-2.5 last:border-b-0"
                        >
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                            {user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--ud-brand-primary)]">
                                {getInitials(user.fullName)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--ud-text-primary)]">{user.fullName}</p>
                            {user.email ? (
                              <p className="truncate text-xs text-[var(--ud-text-muted)]">{user.email}</p>
                            ) : null}
                          </div>
                          {isMember ? (
                            <span className="shrink-0 rounded-full bg-[var(--ud-bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ud-text-muted)]">
                              Member
                            </span>
                          ) : isInvited ? (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                              <Check className="h-3 w-3" /> Invited
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isInviting}
                              onClick={() => handleInvite(user.id)}
                              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--ud-brand-primary)] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {isInviting ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                              Invite
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[11px] text-[var(--ud-text-muted)]">
                  Invitees will see this hub in their <span className="font-medium">Profile → Invitations</span>.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-sm text-[var(--ud-text-secondary)]">
                  Anyone who scans this code lands on the hub with a prompt to request joining.
                  You still approve each request in Members.
                </p>
                <div className="rounded-2xl border border-[var(--ud-border-subtle)] bg-white p-4 shadow-sm">
                  <QRCodeSVG
                    value={joinUrl}
                    size={220}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0C5C57"
                  />
                </div>
                <div className="w-full">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-3 py-2">
                    <input
                      type="text"
                      readOnly
                      value={joinUrl}
                      className="flex-1 bg-transparent text-xs text-[var(--ud-text-secondary)] outline-none"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--ud-brand-primary)] px-2.5 py-1 text-xs font-medium text-white transition hover:opacity-90"
                    >
                      {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toast */}
          {toast ? (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ud-text-primary)] px-4 py-2 text-xs font-medium text-white shadow-lg">
              {toast}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
