"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Flag, Image as ImageIcon, Loader2, Pencil, Trash2 } from "lucide-react";

import {
  chatApiAddReaction,
  chatApiRemoveReaction,
  chatApiSignedAttachmentUrl,
} from "@/lib/chat/chat-browser-api";
import type { ChatMessageViewModel } from "@/lib/chat/chat-message-view";
import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";
import { normalizeChatReactionEmoji, sameChatReactionEmoji } from "@/lib/services/chat/chat-reaction-emoji";
import { useUserProfileModal } from "@/components/UserProfileModalProvider";
import { ACTION_ICON_BUTTON, cn, initials, normalizePublicSrc } from "../hubUtils";
import { ChatPollBlock } from "./ChatPollBlock";
import { ChatReactionBar } from "./ChatReactionBar";
import { ChatSafeText } from "./ChatSafeText";

function ChatInlineImage({ roomId, attachmentId }: { roomId: string; attachmentId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { url } = await chatApiSignedAttachmentUrl(roomId, attachmentId);
        if (!cancelled) setSrc(url);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, attachmentId]);
  if (failed) {
    return (
      <div className="flex max-h-48 max-w-sm items-center justify-center rounded-lg border border-dashed border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-4 py-6 text-xs text-[var(--ud-text-muted)]">
        Image unavailable
      </div>
    );
  }
  if (!src) {
    return (
      <div
        className="h-48 max-w-sm animate-pulse rounded-lg bg-[var(--ud-bg-subtle)]"
        aria-busy="true"
        aria-label="Loading attachment"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="max-h-72 max-w-full rounded-lg border border-[var(--ud-border-subtle)] object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function ChatMessageRow({
  roomId,
  message,
  currentUserId,
  pollTick,
  onReport,
  onRetrySend,
  onEdit,
  onDelete,
  onDiscardOutbound,
  onReactionRemoved,
}: {
  roomId: string;
  message: ChatMessageViewModel;
  currentUserId: string | undefined;
  pollTick: number;
  onReport: (messageId: string) => void;
  onRetrySend?: (clientLocalId: string) => void;
  onEdit?: (messageId: string, currentBody: string) => void;
  onDelete?: (messageId: string) => void;
  onDiscardOutbound?: (clientLocalId: string) => void;
  /** Called after API remove succeeds so the chip updates without waiting for Realtime. */
  onReactionRemoved?: (
    messageId: string,
    reactionId: string,
    fallback?: { userId: string; emoji: string },
  ) => void;
}) {
  const { openProfileModal } = useUserProfileModal();
  const [rxBusy, setRxBusy] = useState<string | null>(null);
  const reactionCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of message.reactions) m[r.emoji] = (m[r.emoji] ?? 0) + 1;
    return m;
  }, [message.reactions]);
  const isPubliclyRedacted = message.redacted;
  const isModViewOfRemoved = !message.redacted && !!message.deletedAt;
  const isRemovedFromThread = isPubliclyRedacted || isModViewOfRemoved;
  const name = message.senderDisplayName ?? "Member";
  const initial = initials(name);
  const pending = message.clientSendState === "pending";
  const failed = message.clientSendState === "failed";
  const outbound = Boolean(message.clientLocalId);
  const isOwn = Boolean(currentUserId && message.senderId === currentUserId);
  /** Own messages read as "You" (same idea as redacted own lines and feed conventions). */
  const authorLabel = isOwn ? "You" : name;
  const peerUserId = message.senderId ?? undefined;
  const canOpenPeerProfile = Boolean(!isOwn && peerUserId);
  const serverMessageId = outbound ? null : message.id;
  const canReact = Boolean(currentUserId && !isRemovedFromThread && serverMessageId && !pending && !failed);
  const canEdit =
    isOwn &&
    message.messageKind === "text" &&
    !isRemovedFromThread &&
    !pending &&
    !failed &&
    serverMessageId &&
    onEdit;
  const canDelete =
    isOwn &&
    (message.messageKind === "text" ||
      message.messageKind === "attachment" ||
      message.messageKind === "media") &&
    !isRemovedFromThread &&
    !pending &&
    serverMessageId &&
    onDelete;
  const showReport = !isRemovedFromThread && serverMessageId && !pending && !failed;

  const toggleReaction = async (emoji: string) => {
    if (!canReact || !serverMessageId) return;
    const normalized = normalizeChatReactionEmoji(emoji);
    if (!normalized) return;
    const mine = message.reactions.find(
      (r) => r.userId === currentUserId && sameChatReactionEmoji(r.emoji, normalized),
    );
    setRxBusy(normalized);
    try {
      if (mine && currentUserId) {
        await chatApiRemoveReaction(roomId, serverMessageId, normalized);
        onReactionRemoved?.(serverMessageId, mine.id, { userId: currentUserId, emoji: normalized });
      } else await chatApiAddReaction(roomId, serverMessageId, normalized);
    } catch {
      /* optional parent toast */
    } finally {
      setRxBusy(null);
    }
  };

  const downloadAtt = async (attachmentId: string) => {
    try {
      const { url } = await chatApiSignedAttachmentUrl(roomId, attachmentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore */
    }
  };

  const imageAttachments = message.attachments.filter((a) => a.mimeType.startsWith("image/"));
  const otherAttachments = message.attachments.filter((a) => !a.mimeType.startsWith("image/"));
  const bodyTrim = message.body.trim();
  const singleImageFilenameCaption =
    message.messageKind !== "text" &&
    imageAttachments.length === 1 &&
    bodyTrim === (imageAttachments[0]?.originalFilename ?? "").trim();
  const showCaptionUnderImages =
    !isPubliclyRedacted &&
    bodyTrim.length > 0 &&
    !singleImageFilenameCaption &&
    imageAttachments.length > 0;

  const rowKey = message.clientLocalId ?? message.id;

  return (
    <article
      className="flex gap-3 border-b border-[var(--ud-border-subtle)] py-3 last:border-b-0"
      aria-labelledby={`msg-${rowKey}-author`}
    >
      <div className="shrink-0">
        {canOpenPeerProfile ? (
          <button
            type="button"
            onClick={() => openProfileModal(peerUserId!)}
            aria-label={`Open ${name}'s profile`}
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40"
          >
            {message.senderAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={normalizePublicSrc(message.senderAvatarUrl)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-xs font-bold text-[var(--ud-brand-primary)]">
                {initial}
              </span>
            )}
          </button>
        ) : message.senderAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalizePublicSrc(message.senderAvatarUrl)}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]">
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-2">
          {canOpenPeerProfile ? (
            <button
              id={`msg-${rowKey}-author`}
              type="button"
              onClick={() => openProfileModal(peerUserId!)}
              className="text-sm font-semibold text-[var(--ud-text-primary)] transition hover:underline"
            >
              {authorLabel}
            </button>
          ) : (
            <span id={`msg-${rowKey}-author`} className="text-sm font-semibold text-[var(--ud-text-primary)]">
              {authorLabel}
            </span>
          )}
          <time className="text-xs text-[var(--ud-text-muted)]" dateTime={message.createdAt}>
            {new Date(message.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
          </time>
          {pending ? (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--ud-text-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Sending…
            </span>
          ) : null}
          {failed ? (
            <span className="text-xs font-medium text-[var(--ud-danger)]" role="status">
              {message.clientSendError ?? "Failed to send"}
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
            {showReport ? (
              <button
                type="button"
                className={cn(ACTION_ICON_BUTTON, "text-xs font-medium")}
                onClick={() => onReport(serverMessageId!)}
                aria-label="Report message"
              >
                <Flag className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                Report
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                className={cn(ACTION_ICON_BUTTON, "text-xs font-medium")}
                onClick={() => onEdit!(serverMessageId!, message.body)}
                aria-label="Edit message"
              >
                <Pencil className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className={cn(ACTION_ICON_BUTTON, "text-xs font-medium text-[var(--ud-danger)]")}
                onClick={() => onDelete!(serverMessageId!)}
                aria-label="Delete message"
              >
                <Trash2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                Delete
              </button>
            ) : null}
          </div>
        </header>

        {isModViewOfRemoved && message.moderationReason ? (
          <p className="mt-1 text-xs font-medium text-[var(--ud-danger)]" role="note">
            Hidden: {message.moderationReason}
          </p>
        ) : null}

        {message.messageKind !== "poll" && !isPubliclyRedacted && imageAttachments.length > 0 ? (
          <div className="mt-1 space-y-2">
            {imageAttachments.map((a) => (
              <ChatInlineImage key={a.id} roomId={roomId} attachmentId={a.id} />
            ))}
            {otherAttachments.length > 0 ? (
              <ul className="space-y-1">
                {otherAttachments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-[var(--ud-text-secondary)]">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{a.originalFilename ?? "Attachment"}</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-[var(--ud-brand-primary)] underline"
                      onClick={() => void downloadAtt(a.id)}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {showCaptionUnderImages ? (
              <div className="text-sm text-[var(--ud-text-primary)]">
                <ChatSafeText text={message.body} />
              </div>
            ) : null}
          </div>
        ) : message.messageKind !== "poll" ? (
          <div
            className={cn(
              "mt-1 text-sm",
              isPubliclyRedacted ? "text-[var(--ud-text-muted)] italic" : "text-[var(--ud-text-primary)]",
            )}
          >
            <ChatSafeText text={isPubliclyRedacted ? CHAT_DELETED_MESSAGE_PLACEHOLDER : message.body} />
          </div>
        ) : null}

        {message.messageKind !== "poll" && !isPubliclyRedacted && imageAttachments.length === 0 && message.attachments.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {message.attachments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-[var(--ud-text-secondary)]">
                {a.mimeType.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5" aria-hidden /> : null}
                <span className="truncate">{a.originalFilename ?? "Attachment"}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-[var(--ud-brand-primary)] underline"
                  onClick={() => void downloadAtt(a.id)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {message.messageKind === "poll" && !isRemovedFromThread ? (
          <div className="mt-2">
            <ChatPollBlock roomId={roomId} messageId={serverMessageId ?? message.id} pollTick={pollTick} />
          </div>
        ) : null}

        {failed && message.clientLocalId && onRetrySend ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(ACTION_ICON_BUTTON, "text-xs font-semibold text-[var(--ud-brand-primary)]")}
              onClick={() => onRetrySend(message.clientLocalId!)}
            >
              Retry
            </button>
            {onDiscardOutbound ? (
              <button
                type="button"
                className={cn(ACTION_ICON_BUTTON, "text-xs text-[var(--ud-text-muted)]")}
                onClick={() => onDiscardOutbound(message.clientLocalId!)}
              >
                Discard
              </button>
            ) : null}
          </div>
        ) : null}

        {canReact ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {Object.entries(reactionCounts).map(([emoji, count]) => {
              const mine = Boolean(
                currentUserId &&
                  message.reactions.some((r) => r.userId === currentUserId && sameChatReactionEmoji(r.emoji, emoji)),
              );
              return (
                <button
                  key={emoji}
                  type="button"
                  disabled={rxBusy !== null}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs transition",
                    mine
                      ? "border-emerald-500/50 bg-emerald-50 text-[var(--ud-text-primary)] dark:bg-emerald-950/35"
                      : "border-transparent bg-[var(--ud-bg-subtle)] text-[var(--ud-text-primary)] hover:border-[var(--ud-border-subtle)]",
                  )}
                  title={mine ? "Tap to remove your reaction" : "Tap to add this reaction"}
                  aria-label={mine ? `Remove reaction ${emoji}` : `Add reaction ${emoji}`}
                  onClick={() => void toggleReaction(emoji)}
                >
                  <span aria-hidden>{emoji}</span> <span className="tabular-nums text-[var(--ud-text-muted)]">{count}</span>
                </button>
              );
            })}
            <span className="hidden h-4 w-px bg-[var(--ud-border-subtle)] sm:block" aria-hidden />
            <ChatReactionBar disabled={rxBusy !== null} onReact={(emoji) => void toggleReaction(emoji)} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
