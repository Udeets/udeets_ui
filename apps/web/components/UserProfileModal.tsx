"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Heart, Loader2, MessageSquare, MoreVertical, Send, Trash2, X } from "lucide-react";
import { getProfileSummary, type ProfileSummary } from "@/lib/services/profile/get-profile-summary";
import { useAuthSession } from "@/services/auth/useAuthSession";
import {
  addProfileComment,
  deleteProfileComment,
  listProfileComments,
  listProfileLikers,
  reportUser,
  toggleProfileLike,
  type ProfileComment,
  type ProfileLiker,
} from "@/lib/services/profile/profile-interactions";

type ModalView = "card" | "photo";
type PhotoPaneTab = "comments" | "likes";
type ReportDialogState = { open: boolean; submitting: boolean; reason: string; success: boolean };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatJoined(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(iso: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function Initials({ name }: { name: string }) {
  const text = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return <span>{text || "U"}</span>;
}

export function UserProfileModal({
  userId,
  onClose,
  context,
}: {
  userId: string;
  onClose: () => void;
  /** Optional context string appended to reports (e.g. a hub slug or deet id). */
  context?: string;
}) {
  const { user: viewer } = useAuthSession();
  // Self-likes are allowed (per April 19 product call), so the Like button
  // is shown on every profile including your own. We still hide the Report
  // menu item on your own profile since reporting yourself is nonsensical.
  const isOwnProfile = Boolean(viewer?.id && viewer.id === userId);

  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ModalView>("card");

  // Like + comment state — mirrors the server but kept local for optimistic updates.
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // Likers list (lazy-loaded when the Likes tab in the photo pane is opened).
  const [paneTab, setPaneTab] = useState<PhotoPaneTab>("comments");
  const [likers, setLikers] = useState<ProfileLiker[]>([]);
  const [likersLoaded, setLikersLoaded] = useState(false);

  // 3-dot menu + Report dialog state.
  const [menuOpen, setMenuOpen] = useState(false);
  const [report, setReport] = useState<ReportDialogState>({ open: false, submitting: false, reason: "", success: false });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // ── Initial fetch ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const s = await getProfileSummary(userId);
      if (cancelled) return;
      if (s) {
        setSummary(s);
        setLiked(s.viewerHasLiked);
        setLikeCount(s.likeCount);
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Lazy-load comments only when we open the photo view.
  useEffect(() => {
    if (view !== "photo" || commentsLoaded) return;
    let cancelled = false;
    (async () => {
      const list = await listProfileComments(userId);
      if (cancelled) return;
      setComments(list);
      setCommentsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [view, commentsLoaded, userId]);

  // Lazy-load likers the first time the Likes tab is opened. After that,
  // reloads happen on explicit user action (toggleLike handler invalidates
  // the cache, see below) so we don't hit the network on every tab toggle.
  useEffect(() => {
    if (view !== "photo" || paneTab !== "likes" || likersLoaded) return;
    let cancelled = false;
    (async () => {
      const list = await listProfileLikers(userId);
      if (cancelled) return;
      setLikers(list);
      setLikersLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [view, paneTab, likersLoaded, userId]);

  // ── Close on Escape + outside click ───────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (report.open) {
        setReport((r) => ({ ...r, open: false }));
        return;
      }
      if (view === "photo") {
        setView("card");
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, view, report.open]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleToggleLike = useCallback(async () => {
    if (isTogglingLike) return;
    if (!summary) return;
    setIsTogglingLike(true);
    const prev = { liked, count: likeCount };
    // Optimistic flip
    setLiked(!prev.liked);
    setLikeCount(prev.count + (prev.liked ? -1 : 1));
    const result = await toggleProfileLike(summary.id);
    if (result) {
      setLiked(result.liked);
      setLikeCount(result.count);
      // Invalidate likers cache so the Likes tab re-fetches next time it's
      // opened. If the user is currently on the Likes tab, refresh inline
      // so they see the change immediately.
      setLikersLoaded(false);
      if (view === "photo" && paneTab === "likes") {
        const fresh = await listProfileLikers(summary.id);
        setLikers(fresh);
        setLikersLoaded(true);
      }
    } else {
      // revert
      setLiked(prev.liked);
      setLikeCount(prev.count);
    }
    setIsTogglingLike(false);
  }, [isTogglingLike, liked, likeCount, summary, view, paneTab]);

  const handlePostComment = async () => {
    if (isPostingComment || !summary || !commentDraft.trim()) return;
    setIsPostingComment(true);
    const added = await addProfileComment(summary.id, commentDraft);
    if (added) {
      setComments((prev) => [added, ...prev]);
      setCommentDraft("");
    }
    setIsPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const prev = comments;
    setComments(prev.filter((c) => c.id !== commentId));
    const ok = await deleteProfileComment(commentId);
    if (!ok) setComments(prev);
  };

  const handleSubmitReport = async () => {
    if (!summary || report.submitting || !report.reason.trim()) return;
    setReport((r) => ({ ...r, submitting: true }));
    const ok = await reportUser(summary.id, report.reason, context);
    setReport({ open: true, submitting: false, reason: "", success: ok });
    // Auto-close the report dialog after a moment if it succeeded.
    if (ok) setTimeout(() => setReport({ open: false, submitting: false, reason: "", success: false }), 1800);
  };

  const displayName = summary?.fullName ?? "uDeets User";
  const joinedLabel = summary?.joinedAt ? `Joined on ${formatJoined(summary.joinedAt)}` : "";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} profile`}
      onClick={(e) => {
        // Outside-click close, unless the user is clicking inside the card/viewer.
        if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-3xl bg-[var(--ud-bg-card)] shadow-2xl",
          view === "card"
            ? "w-full max-w-md"
            : "flex h-[min(90vh,820px)] w-full max-w-5xl flex-col lg:flex-row"
        )}
      >
        {/* ── Top bar (common) ── */}
        <div className={cn(
          "flex items-center justify-between gap-3 px-4 py-3",
          view === "photo" ? "lg:absolute lg:inset-x-0 lg:top-0 lg:z-10 lg:bg-black/30 lg:text-white lg:backdrop-blur" : "border-b border-[var(--ud-border-subtle)]"
        )}>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                view === "photo" ? "text-white hover:bg-white/10" : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]"
              )}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div className="absolute left-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] text-[var(--ud-text-primary)] shadow-lg">
                {!isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setReport({ open: true, submitting: false, reason: "", success: false }); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--ud-bg-subtle)]"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Report this profile
                  </button>
                ) : (
                  <p className="px-3 py-2.5 text-xs text-[var(--ud-text-muted)]">No options available for your own profile.</p>
                )}
              </div>
            ) : null}
          </div>

          <p className={cn("text-xs font-medium", view === "photo" ? "text-white/80" : "text-[var(--ud-text-muted)]")}>
            {joinedLabel}
          </p>

          <button
            type="button"
            onClick={() => (view === "photo" ? setView("card") : onClose())}
            aria-label={view === "photo" ? "Back to profile" : "Close"}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
              view === "photo" ? "text-white hover:bg-white/10" : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]"
            )}
          >
            {view === "photo" ? <ArrowLeft className="h-4 w-4" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Card view ── */}
        {view === "card" ? (
          <div className="px-8 pb-8 pt-5">
            <button
              type="button"
              onClick={() => setView("photo")}
              aria-label="View profile photo"
              className="mx-auto block h-56 w-56 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] shadow-md transition hover:brightness-105"
            >
              {summary?.avatarUrl ? (
                <img src={summary.avatarUrl} alt={`${displayName}'s profile photo`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl font-semibold text-white/85">
                  <Initials name={displayName} />
                </div>
              )}
            </button>

            <h2 className="mt-5 text-center text-2xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
              {isLoading ? "Loading…" : displayName}
            </h2>

            <div className="mt-5 flex items-center justify-center gap-2">
              {/* Like button is always available — you can like your own
                  profile too, so the count reflects your own endorsement. */}
              <button
                type="button"
                disabled={isTogglingLike || !summary}
                onClick={handleToggleLike}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-60",
                  liked
                    ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                    : "border-[var(--ud-border)] text-[var(--ud-text-primary)] hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]"
                )}
                title={liked ? "Unlike profile" : "Like profile"}
              >
                <Heart className={cn("h-4 w-4 stroke-[1.8]", liked && "fill-current")} />
                {likeCount > 0 ? likeCount : "Like"}
              </button>
              <button
                type="button"
                onClick={() => setView("photo")}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-[var(--ud-text-primary)] transition hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]"
                title="Open profile photo and comments"
              >
                <MessageSquare className="h-4 w-4 stroke-[1.8]" />
                {summary && summary.commentCount > 0 ? summary.commentCount : "Comment"}
              </button>
              <button
                type="button"
                onClick={() => setView("photo")}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-[var(--ud-text-primary)] transition hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]"
                title="View posts and activity"
              >
                {summary && summary.postCount > 0 ? `${summary.postCount} Posts` : "Posts"}
              </button>
            </div>
          </div>
        ) : (
          // ── Photo viewer ── Big photo on the left, likes/comments on the right.
          <>
            <div className="relative flex min-h-[320px] flex-1 items-center justify-center bg-black lg:pt-14">
              {summary?.avatarUrl ? (
                <img
                  src={summary.avatarUrl}
                  alt={`${displayName}'s profile photo`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex h-60 w-60 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-6xl font-semibold text-white/85">
                  <Initials name={displayName} />
                </div>
              )}
            </div>

            <aside className="flex h-full w-full flex-col border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] lg:w-[360px] lg:border-l lg:border-t-0">
              <div className="border-b border-[var(--ud-border-subtle)] px-5 py-4">
                <p className="text-sm font-semibold text-[var(--ud-text-primary)]">{displayName}</p>
                <p className="mt-0.5 text-xs text-[var(--ud-text-muted)]">{joinedLabel}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTogglingLike || !summary}
                    onClick={handleToggleLike}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-60",
                      liked
                        ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                        : "border-[var(--ud-border)] text-[var(--ud-text-primary)] hover:border-[var(--ud-brand-primary)]"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5 stroke-[1.8]", liked && "fill-current")} />
                    {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ud-bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--ud-text-secondary)]">
                    <MessageSquare className="h-3.5 w-3.5 stroke-[1.8]" />
                    {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                  </span>
                </div>
              </div>

              {/* Tab switcher between Comments and Likes */}
              <div className="flex items-center gap-1 border-b border-[var(--ud-border-subtle)] px-3 py-2">
                {(
                  [
                    { key: "comments" as const, label: "Comments", count: comments.length, icon: MessageSquare },
                    { key: "likes" as const, label: "Likes", count: likeCount, icon: Heart },
                  ]
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = paneTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPaneTab(tab.key)}
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                          : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
                      {tab.label}
                      <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", active ? "bg-[var(--ud-bg-card)] text-[var(--ud-brand-primary)]" : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]")}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3">
                {paneTab === "comments" ? (
                  !commentsLoaded ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-brand-primary)]" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[var(--ud-text-muted)]">No comments yet. Be the first.</p>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((c) => (
                        <li key={c.id} className="flex items-start gap-2.5">
                          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                            {c.authorAvatar ? (
                              <img src={c.authorAvatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                                <Initials name={c.authorName} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-semibold text-[var(--ud-text-primary)]">{c.authorName}</p>
                              <span className="text-[10px] text-[var(--ud-text-muted)]">{formatRelative(c.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--ud-text-secondary)]">
                              {c.body}
                            </p>
                          </div>
                          {(c.isOwn || summary?.id === userId) ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              className="shrink-0 rounded p-1 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-red-500"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  // ── Likes tab: list of everyone who has liked this profile ──
                  !likersLoaded ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-brand-primary)]" />
                    </div>
                  ) : likers.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[var(--ud-text-muted)]">
                      No likes yet. {isOwnProfile ? "Like your profile to be the first." : null}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {likers.map((l) => (
                        <li key={l.userId} className="flex items-center gap-2.5 py-1">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                            {l.avatarUrl ? (
                              <img src={l.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                                <Initials name={l.fullName} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--ud-text-primary)]">
                              {l.fullName}{l.isOwn ? <span className="ml-1 font-normal text-[var(--ud-text-muted)]">(You)</span> : null}
                            </p>
                            <p className="text-[10px] text-[var(--ud-text-muted)]">Liked {formatRelative(l.likedAt)}</p>
                          </div>
                          <Heart className="h-3.5 w-3.5 shrink-0 fill-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)] stroke-[1.8]" />
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>

              {/* Comment input — only shown on the Comments tab */}
              {paneTab === "comments" ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); void handlePostComment(); }}
                  className="flex items-center gap-2 border-t border-[var(--ud-border-subtle)] px-3 py-3"
                >
                  <input
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value.slice(0, 500))}
                    placeholder={`Write a comment for ${displayName}...`}
                    className="flex-1 rounded-full border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none focus:border-[var(--ud-brand-primary)]"
                  />
                  <button
                    type="submit"
                    disabled={isPostingComment || !commentDraft.trim()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ud-brand-primary)] text-white transition hover:opacity-90 disabled:opacity-40"
                    aria-label="Post comment"
                  >
                    {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              ) : null}
            </aside>
          </>
        )}
      </div>

      {/* ── Report dialog (inline on top of the modal) ── */}
      {report.open ? (
        <div
          className="fixed inset-0 z-[270] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.currentTarget === e.target) setReport((r) => ({ ...r, open: false })); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">Report {displayName}</h3>
                <p className="mt-1 text-xs text-[var(--ud-text-muted)]">
                  Your report is sent to uDeets admins for review. Please describe the issue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReport({ open: false, submitting: false, reason: "", success: false })}
                className="rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {report.success ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Thanks — your report was sent. We&apos;ll review it shortly.
              </p>
            ) : (
              <>
                <textarea
                  value={report.reason}
                  onChange={(e) => setReport((r) => ({ ...r, reason: e.target.value.slice(0, 1000) }))}
                  placeholder="What's going on? Give admins enough detail to act on it."
                  rows={4}
                  className="mt-4 w-full rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--ud-brand-primary)]"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-[var(--ud-text-muted)]">
                  <span>{report.reason.length}/1000</span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReport({ open: false, submitting: false, reason: "", success: false })}
                    className="rounded-full border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={report.submitting || !report.reason.trim()}
                    onClick={handleSubmitReport}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {report.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Send report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
