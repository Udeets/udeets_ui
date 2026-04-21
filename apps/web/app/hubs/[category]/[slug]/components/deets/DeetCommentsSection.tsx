"use client";

import type { DeetComment } from "@/lib/services/deets/deet-interactions";
import {
  Loader2,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Pencil,
  Reply,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUserProfileModal } from "@/components/UserProfileModalProvider";
import { EMOJI_TEXT_MAP } from "./feedEmojiReact";
import { ImageWithFallback, cn, initials } from "../hubUtils";

/** Relative time helper */
function commentTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Single comment row — used for both top-level and replies */
function CommentRow({
  comment,
  deetId: _deetId,
  isOwn,
  isNested,
  editingCommentId,
  editText,
  confirmDeleteId,
  menuOpenCommentId,
  reactedEmoji,
  onSetReactedEmoji,
  onSetEditText,
  onStartEdit,
  onSaveEdit,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelEdit,
  onToggleMenu,
  onReply,
  onOpenViewer,
  menuRef,
  editInputRef,
}: {
  comment: DeetComment;
  deetId: string;
  isOwn: boolean;
  isNested: boolean;
  editingCommentId: string | null;
  editText: string;
  confirmDeleteId: string | null;
  menuOpenCommentId: string | null;
  reactedEmoji: string | null;
  onSetReactedEmoji: (commentId: string, emoji: string | null) => void;
  onSetEditText: (v: string) => void;
  onStartEdit: (c: DeetComment) => void;
  onSaveEdit: () => void;
  onStartDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onCancelEdit: () => void;
  onToggleMenu: (id: string) => void;
  onReply?: (commentId: string, authorName: string) => void;
  onOpenViewer?: (images: string[], index: number, comment?: DeetComment) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  editInputRef: RefObject<HTMLInputElement | null>;
}) {
  const isEditing = editingCommentId === comment.id;
  const isConfirmingDelete = confirmDeleteId === comment.id;
  const avatarSize = isNested ? "h-7 w-7" : "h-9 w-9";
  const [showReactPicker, setShowReactPicker] = useState(false);
  const { openProfileModal } = useUserProfileModal();

  return (
    <div className="group relative flex items-start gap-2.5 py-3">
      <button
        type="button"
        onClick={() => comment.userId && openProfileModal(comment.userId)}
        aria-label={`Open ${comment.authorName ?? "user"}'s profile`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40",
          avatarSize,
        )}
      >
        <ImageWithFallback
          src={comment.authorAvatar || ""}
          sources={comment.authorAvatar ? [comment.authorAvatar] : []}
          alt={comment.authorName ?? "User"}
          className="h-full w-full object-cover"
          fallbackClassName={cn("grid h-full w-full place-items-center bg-[var(--ud-brand-light)] font-bold text-[var(--ud-brand-primary)]", isNested ? "text-[8px]" : "text-[10px]")}
          fallback={initials(comment.authorName ?? "User")}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--ud-text-primary)]">{comment.authorName ?? "User"}</span>
          {isOwn && !isEditing && !isConfirmingDelete && (
            <div className="relative ml-auto" ref={menuOpenCommentId === comment.id ? menuRef : undefined}>
              <button
                type="button"
                onClick={() => onToggleMenu(comment.id)}
                className={cn(
                  "rounded-full p-2 text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]",
                  "[@media(pointer:coarse)]:opacity-100",
                  "[@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
                )}
                title="More options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpenCommentId === comment.id && (
                <div className="absolute right-0 top-6 z-20 min-w-[120px] rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] py-1 shadow-lg">
                  <button type="button" onClick={() => onStartEdit(comment)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)]">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => onStartDelete(comment.id)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 flex items-center gap-1.5">
            <input
              ref={editInputRef}
              value={editText}
              onChange={(e) => onSetEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); onSaveEdit(); }
                if (e.key === "Escape") onCancelEdit();
              }}
              className="h-7 flex-1 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-2.5 text-xs text-[var(--ud-text-primary)] outline-none focus:border-[var(--ud-brand-primary)]"
            />
            <button type="button" onClick={onSaveEdit} disabled={!editText.trim()} className="rounded-lg bg-[var(--ud-brand-primary)] px-2 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-50">Save</button>
            <button type="button" onClick={onCancelEdit} className="rounded-lg px-2 py-1 text-[11px] text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]">Cancel</button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-red-500">Delete?</span>
            <button type="button" onClick={() => onConfirmDelete(comment.id)} className="rounded-lg bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-red-600">Yes</button>
            <button type="button" onClick={onCancelDelete} className="rounded-lg px-2 py-0.5 text-[11px] text-[var(--ud-text-muted)]">No</button>
          </div>
        ) : (
          <>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{comment.body}</p>
            {comment.imageUrl && (
              <button
                type="button"
                onClick={() => onOpenViewer?.([comment.imageUrl!], 0, comment)}
                className="mt-1.5 block overflow-hidden rounded-lg border border-[var(--ud-border-subtle)] transition hover:opacity-90"
                style={{ width: 180, height: 120 }}
              >
                <img src={comment.imageUrl} alt="Comment image" style={{ width: 180, height: 120, objectFit: "cover" }} loading="lazy" />
              </button>
            )}
            {comment.attachmentUrl && (
              <a
                href={comment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-2.5 py-1.5 text-xs text-[var(--ud-brand-primary)] hover:bg-[var(--ud-bg-card)] transition"
              >
                <Paperclip className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="max-w-[180px] truncate">{comment.attachmentName || "Attachment"}</span>
              </a>
            )}
          </>
        )}

        {!isEditing && !isConfirmingDelete && (
          <div className="relative mt-1 flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--ud-text-muted)]">
            <span className="inline-flex min-h-10 items-center">{comment.createdAt ? commentTimeAgo(comment.createdAt) : ""}</span>
            <span className="inline-flex min-h-10 items-center">·</span>
            <button
              type="button"
              onClick={() => setShowReactPicker((v) => !v)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-md px-2 font-medium transition -mx-1",
                reactedEmoji ? "text-[var(--ud-brand-primary)]" : "hover:text-[var(--ud-text-secondary)]",
              )}
            >
              {reactedEmoji ? <span className="mr-0.5 text-sm">{reactedEmoji}</span> : <Smile className="mr-0.5 inline h-3 w-3 stroke-[1.5]" />}
              {reactedEmoji ? (EMOJI_TEXT_MAP[reactedEmoji] ?? "Reacted") : "React"}
            </button>
            {showReactPicker && (
              <div className="absolute bottom-full left-8 z-30 mb-1 flex items-center gap-0.5 rounded-full border border-[var(--ud-border)] bg-white px-1.5 py-1 shadow-lg">
                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSetReactedEmoji(comment.id, reactedEmoji === emoji ? null : emoji);
                      setShowReactPicker(false);
                    }}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-transform hover:scale-125 active:scale-95",
                      reactedEmoji === emoji && "bg-[var(--ud-brand-light)] ring-1 ring-[var(--ud-brand-primary)]",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
                {reactedEmoji && (
                  <button
                    type="button"
                    onClick={() => { onSetReactedEmoji(comment.id, null); setShowReactPicker(false); }}
                    className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs text-[var(--ud-text-muted)] transition-transform hover:scale-110 hover:bg-red-50 hover:text-red-500 active:scale-95"
                    title="Remove reaction"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            {!isNested && onReply && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onReply(comment.id, comment.authorName ?? "User")}
                  className="inline-flex min-h-10 items-center rounded-md px-2 font-medium transition -mx-1 hover:text-[var(--ud-text-secondary)]"
                >
                  Reply
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DeetCommentsSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  error,
  currentUserId,
  onSubmitComment,
  onEditComment,
  onDeleteComment,
  onOpenViewer,
  userAvatarSrc,
  userName,
  layout = "inline",
  autoFocusComposer = false,
  onAutoFocusConsumed,
  showComposerFooter = true,
  onRequestComposerFooter,
  onDismissComposerFooter,
  allowNewComments = true,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string | null;
  currentUserId?: string;
  onSubmitComment?: (deetId: string, body: string, parentId?: string, attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string }) => Promise<{ success: boolean }> | void;
  onEditComment?: (commentId: string, deetId: string, newBody: string) => Promise<{ success: boolean }> | void;
  onDeleteComment?: (commentId: string, deetId: string) => Promise<{ success: boolean }> | void;
  onOpenViewer?: (images: string[], index: number, comment?: DeetComment) => void;
  userAvatarSrc?: string;
  userName?: string;
  layout?: "inline" | "sheet" | "embedded";
  autoFocusComposer?: boolean;
  onAutoFocusConsumed?: () => void;
  /** When false, hides the reply strip and sticky composer (e.g. hub image viewer until user taps Comment). */
  showComposerFooter?: boolean;
  /** Called when the user taps Reply while the composer footer is hidden; parent should show the footer. */
  onRequestComposerFooter?: () => void;
  /** When set (e.g. image viewer), second tap on Reply for the same comment closes the composer. */
  onDismissComposerFooter?: () => void;
  /** When false, hide composer and replies — post has comments disabled in settings. */
  allowNewComments?: boolean;
}) {
  const [commentText, setCommentText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpenCommentId, setMenuOpenCommentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [repliesExpandedByParentId, setRepliesExpandedByParentId] = useState<Record<string, boolean>>({});

  const [commentReactions, setCommentReactions] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const allIds = comments.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]);
    if (!allIds.length || !currentUserId) return;
    let cancelled = false;
    import("@/lib/services/deets/deet-interactions").then(({ getCommentReactions }) => {
      getCommentReactions(allIds).then((map) => {
        if (cancelled) return;
        setCommentReactions((prev) => {
          const next = { ...prev };
          for (const id of allIds) {
            if (!(id in prev)) {
              next[id] = map[id] ?? null;
            }
          }
          return next;
        });
      }).catch(() => {});
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length, currentUserId]);

  const handleSetCommentReaction = useCallback((commentId: string, emoji: string | null) => {
    const prevEmoji = commentReactions[commentId] ?? null;

    setCommentReactions((prev) => ({ ...prev, [commentId]: emoji }));

    const emojiToSend = emoji ?? prevEmoji;
    if (emojiToSend) {
      import("@/lib/services/deets/deet-interactions").then(({ toggleCommentReaction }) => {
        toggleCommentReaction(commentId, emojiToSend).then((result) => {
          setCommentReactions((prev) => ({ ...prev, [commentId]: result.emoji }));
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [commentReactions]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpenCommentId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenCommentId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenCommentId]);

  useEffect(() => { if (editingCommentId) editInputRef.current?.focus(); }, [editingCommentId]);

  const autoFocusComposerDoneRef = useRef(false);
  useEffect(() => {
    if (!autoFocusComposer) {
      autoFocusComposerDoneRef.current = false;
      return;
    }
    if (isLoading) return;
    if (autoFocusComposerDoneRef.current) return;
    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
      autoFocusComposerDoneRef.current = true;
      onAutoFocusConsumed?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocusComposer, isLoading, onAutoFocusConsumed]);

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    setLocalError(null);

    const result = await onSubmitComment?.(deetId, trimmed, replyToId ?? undefined);
    if (result && result.success) {
      setCommentText("");
      setReplyToId(null);
      setReplyToName("");
    } else if (result && !result.success) {
      setLocalError("Couldn't post. Tap send to retry.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    const result = await onEditComment?.(editingCommentId, deetId, trimmed);
    if (result && result.success) { setEditingCommentId(null); setEditText(""); }
    else if (result && !result.success) setLocalError("Couldn't save edit. Try again.");
  };

  const handleDelete = async (commentId: string) => {
    const result = await onDeleteComment?.(commentId, deetId);
    if (result && result.success) setConfirmDeleteId(null);
    else if (result && !result.success) setLocalError("Couldn't delete. Try again.");
  };

  const startReply = (commentId: string, authorName: string) => {
    if (replyToId === commentId && showComposerFooter) {
      cancelReply();
      onDismissComposerFooter?.();
      return;
    }
    onRequestComposerFooter?.();
    setReplyToId(commentId);
    setReplyToName(authorName);
    queueMicrotask(() => textareaRef.current?.focus({ preventScroll: true }));
  };

  const cancelReply = () => { setReplyToId(null); setReplyToName(""); };

  const startEdit = (comment: DeetComment) => { setEditingCommentId(comment.id); setEditText(comment.body); setMenuOpenCommentId(null); };
  const startDelete = (commentId: string) => { setConfirmDeleteId(commentId); setMenuOpenCommentId(null); };
  const cancelEdit = () => { setEditingCommentId(null); setEditText(""); };

  const displayError = localError || error;

  const commonRowProps = {
    deetId,
    editingCommentId,
    editText,
    confirmDeleteId,
    menuOpenCommentId,
    onSetReactedEmoji: handleSetCommentReaction,
    onSetEditText: setEditText,
    onStartEdit: startEdit,
    onSaveEdit: handleSaveEdit,
    onStartDelete: startDelete,
    onConfirmDelete: handleDelete,
    onCancelDelete: () => setConfirmDeleteId(null),
    onCancelEdit: cancelEdit,
    onToggleMenu: (id: string) => setMenuOpenCommentId((prev) => (prev === id ? null : id)),
    onOpenViewer: onOpenViewer
      ? (images: string[], index: number, comment?: DeetComment) => {
          if (comment) {
            const enrichedComment = Object.assign({}, comment, { _clientReaction: commentReactions[comment.id] ?? null });
            onOpenViewer(images, index, enrichedComment);
          } else {
            onOpenViewer(images, index);
          }
        }
      : undefined,
    menuRef,
    editInputRef,
  };

  const addEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [commentText]);

  useEffect(() => {
    if (!showComposerFooter) {
      setReplyToId(null);
      setReplyToName("");
    }
  }, [showComposerFooter]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/20",
        (layout === "inline" || layout === "embedded") && "rounded-b-xl border-x border-b border-[var(--ud-border-subtle)]",
        layout === "embedded" && "flex-1",
        layout === "sheet" && "flex-1 border-t-0 bg-transparent",
      )}
    >
      <div
        className={cn(
          "min-h-0 overflow-y-auto overscroll-contain",
          layout === "inline" && "max-h-[min(360px,45vh)]",
          layout === "sheet" && "flex-1",
          layout === "embedded" && "flex-1",
        )}
      >
        {!allowNewComments ? (
          <p className="border-b border-[var(--ud-border-subtle)] px-4 py-2.5 text-center text-xs text-[var(--ud-text-muted)]">
            Comments are turned off for this post.
          </p>
        ) : null}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-text-muted)]" />
          </div>
        ) : comments.length > 0 ? (
          <div className={cn("flex flex-col gap-4 px-4 pb-3 pt-1")}>
            {comments.map((comment) => {
              const replies = comment.replies ?? [];
              const showReplies = replies.length <= 2 || repliesExpandedByParentId[comment.id];
              return (
                <div key={comment.id} className="rounded-2xl bg-[var(--ud-bg-subtle)]/50 px-2 py-1">
                  <CommentRow
                    comment={comment}
                    isOwn={!!(currentUserId && comment.userId === currentUserId)}
                    isNested={false}
                    reactedEmoji={commentReactions[comment.id] ?? null}
                    onReply={allowNewComments ? startReply : undefined}
                    {...commonRowProps}
                  />
                  {replies.length > 2 && !repliesExpandedByParentId[comment.id] && (
                    <button
                      type="button"
                      onClick={() => setRepliesExpandedByParentId((p) => ({ ...p, [comment.id]: true }))}
                      className="mb-1 ml-11 mt-0.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-[var(--ud-brand-primary)] hover:bg-[var(--ud-bg-card)]"
                    >
                      Show {replies.length} replies
                    </button>
                  )}
                  {replies.length > 0 && showReplies && (
                    <div className="ml-[42px] border-l border-[var(--ud-border-subtle)] pl-3">
                      {replies.map((reply) => (
                        <CommentRow
                          key={reply.id}
                          comment={reply}
                          isOwn={!!(currentUserId && reply.userId === currentUserId)}
                          isNested={true}
                          reactedEmoji={commentReactions[reply.id] ?? null}
                          {...commonRowProps}
                        />
                      ))}
                      {replies.length > 2 && repliesExpandedByParentId[comment.id] && (
                        <button
                          type="button"
                          onClick={() => setRepliesExpandedByParentId((p) => ({ ...p, [comment.id]: false }))}
                          className="mb-2 mt-1 rounded-md px-2 py-1.5 text-left text-xs font-medium text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-card)] hover:text-[var(--ud-text-secondary)]"
                        >
                          Hide replies
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <MessageCircle className="h-8 w-8 text-[var(--ud-text-muted)] opacity-70" aria-hidden />
            <p className="text-sm text-[var(--ud-text-muted)]">
              {allowNewComments
                ? "Be the first to comment and join the discussion."
                : "Comments are turned off for this post."}
            </p>
          </div>
        )}
      </div>

      {allowNewComments && showComposerFooter && replyToId ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/80 px-4 py-1.5">
          <Reply className="h-3.5 w-3.5 text-[var(--ud-text-muted)]" />
          <span className="text-xs text-[var(--ud-text-muted)]">
            Replying to <strong className="text-[var(--ud-text-secondary)]">{replyToName}</strong>
          </span>
          <button
            type="button"
            onClick={cancelReply}
            className="ml-auto text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {allowNewComments && showComposerFooter ? (
      <div
        className={cn(
          "sticky bottom-0 z-10 shrink-0 border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-4 py-2.5 shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.08)]",
          (layout === "inline" || layout === "embedded") && "rounded-b-xl",
        )}
      >
        {displayError ? (
          <p className="mb-2 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-600" role="alert">
            {displayError}
          </p>
        ) : null}

        <div className={cn("relative flex min-w-0 items-center gap-2", layout === "embedded" && "gap-1.5")} aria-busy={isSubmitting}>
          {layout !== "embedded" ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
              <ImageWithFallback
                src={userAvatarSrc || ""}
                sources={userAvatarSrc ? [userAvatarSrc] : []}
                alt={userName || "You"}
                className="h-full w-full object-cover"
                fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]"
                fallback={initials(userName || "You")}
              />
            </div>
          ) : null}
          <div className="relative flex min-h-[44px] min-w-0 flex-1 items-center gap-1 rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] py-2 pl-3 pr-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onInput={() => {
                const el = textareaRef.current;
                if (!el) return;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
                if (e.key === "Escape" && replyToId) cancelReply();
              }}
              placeholder={
                replyToId
                  ? `Reply to ${replyToName}…`
                  : "Write a comment… Shift+Enter for new line"
              }
              aria-label={replyToId ? `Reply to ${replyToName}` : "Write a comment"}
              className="max-h-32 min-h-[22px] min-w-0 flex-1 resize-none bg-transparent py-0.5 text-sm leading-snug text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)]"
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                title="Add emoji"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
              >
                <Smile className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !commentText.trim()}
            title="Send comment"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              commentText.trim()
                ? "bg-[var(--ud-brand-primary)] text-white hover:opacity-90"
                : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]",
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <Send className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>
        </div>

        {showEmojiPicker && (
          <div
            className={cn(
              "absolute bottom-full z-30 mb-1 flex items-center gap-1 rounded-full border border-[var(--ud-border)] bg-white px-2 py-1.5 shadow-lg",
              layout === "embedded" ? "left-2" : "left-10",
            )}
          >
            {["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      ) : null}
    </div>
  );
}
