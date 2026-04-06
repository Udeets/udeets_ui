"use client";

import { Check, Copy, Loader2, Search, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../hubUtils";

interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
}

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
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Member invite state
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [invitingUserIds, setInvitingUserIds] = useState<Set<string>>(new Set());
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use custom subdomain URL if available
  const inviteLink = `https://${hubSlug}.udeets.com?action=join`;

  const showToastMsg = (msg: string, duration = 2000) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), duration);
  };

  const handleCopyLink = async () => {
    // Use native share on mobile when available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Join ${hubName} on uDeets`, url: inviteLink });
        return;
      } catch {
        // Fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    showToastMsg("Link copied to clipboard!");
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  // Fetch all platform users and existing hub members
  const loadUsersAndMembers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .order("full_name", { ascending: true })
        .limit(100);

      if (profiles) {
        setAllUsers(
          profiles.map((p: { id: string; full_name: string | null; avatar_url: string | null; email: string | null }) => ({
            id: p.id,
            fullName: p.full_name || "uDeets User",
            avatarUrl: p.avatar_url,
            email: p.email,
          }))
        );
      }

      // Fetch existing hub members
      const { data: members } = await supabase
        .from("hub_members")
        .select("user_id, status")
        .eq("hub_id", hubId);

      if (members) {
        setExistingMemberIds(new Set(members.map((m: { user_id: string }) => m.user_id)));
        // Mark already-invited users
        const invited = new Set(
          members
            .filter((m: { status: string }) => m.status === "invited")
            .map((m: { user_id: string }) => m.user_id)
        );
        setInvitedUserIds(invited);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [hubId]);

  const handleOpenMemberSearch = () => {
    setShowMemberSearch(true);
    void loadUsersAndMembers();
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleInviteUser = async (userId: string) => {
    setInvitingUserIds((prev) => new Set(prev).add(userId));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Insert as invited member
      const { error } = await supabase
        .from("hub_members")
        .insert({
          hub_id: hubId,
          user_id: userId,
          role: "member",
          status: "invited",
        });

      if (error) {
        // Might already exist — try updating status
        if (error.code === "23505") {
          showToastMsg("User is already a member or invited.");
        } else {
          throw error;
        }
      } else {
        setInvitedUserIds((prev) => new Set(prev).add(userId));
        setExistingMemberIds((prev) => new Set(prev).add(userId));
        showToastMsg("Invitation sent!");
      }
    } catch (err) {
      console.error("Failed to invite user:", err);
      showToastMsg("Failed to send invitation.");
    } finally {
      setInvitingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter((u) => {
    // Exclude current user
    if (u.id === currentUserId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.[0] || "?").toUpperCase();
  };

  return (
    <>
      {/* Modal overlay */}
      <div
        className="fixed inset-0 z-40 bg-[var(--ud-bg-overlay)] transition"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-xl">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-5 pr-8">
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">
              {showMemberSearch ? "Invite uDeets Members" : `Invite people to ${hubName}`}
            </h2>
            {showMemberSearch && (
              <p className="mt-1 text-xs text-[var(--ud-text-muted)]">
                Search and invite registered users to this hub.
              </p>
            )}
          </div>

          {!showMemberSearch ? (
            /* ── Main invite options ── */
            <div className="flex flex-col gap-3">
              {/* Copy invite link button */}
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={copied}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition",
                  "bg-gradient-to-r from-[var(--ud-brand-primary)] to-[var(--ud-brand-primary)] text-white hover:opacity-90"
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Invite Link"}
              </button>

              {/* Invite uDeets member button */}
              <button
                type="button"
                onClick={handleOpenMemberSearch}
                className="flex items-center justify-center gap-2 rounded-lg border border-[var(--ud-brand-primary)] px-4 py-3 font-medium text-[var(--ud-brand-primary)] transition hover:bg-[var(--ud-brand-light)]"
              >
                <UserPlus className="h-4 w-4" />
                Invite uDeets Member
              </button>
            </div>
          ) : (
            /* ── Member search panel ── */
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

              {/* User list */}
              <div className="max-h-[280px] overflow-y-auto rounded-lg border border-[var(--ud-border-subtle)]">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-brand-primary)]" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[var(--ud-text-muted)]">
                    {searchQuery ? "No users found." : "No users available to invite."}
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isMember = existingMemberIds.has(user.id) && !invitedUserIds.has(user.id);
                    const isInvited = invitedUserIds.has(user.id);
                    const isInviting = invitingUserIds.has(user.id);

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 border-b border-[var(--ud-border-subtle)] px-3 py-2.5 last:border-b-0"
                      >
                        {/* Avatar */}
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

                        {/* Name and email */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--ud-text-primary)]">{user.fullName}</p>
                          {user.email && (
                            <p className="truncate text-xs text-[var(--ud-text-muted)]">{user.email}</p>
                          )}
                        </div>

                        {/* Action button */}
                        {isMember ? (
                          <span className="shrink-0 rounded-full bg-[var(--ud-bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ud-text-muted)]">
                            Member
                          </span>
                        ) : isInvited ? (
                          <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                            <Check className="h-3 w-3" /> Invited
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isInviting}
                            onClick={() => handleInviteUser(user.id)}
                            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--ud-brand-primary)] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                          >
                            {isInviting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserPlus className="h-3 w-3" />
                            )}
                            Invite
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setShowMemberSearch(false);
                  setSearchQuery("");
                }}
                className="mt-1 text-sm font-medium text-[var(--ud-brand-primary)] transition hover:opacity-80"
              >
                Back to invite options
              </button>
            </div>
          )}

          {/* Toast message */}
          {showToast && (
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
