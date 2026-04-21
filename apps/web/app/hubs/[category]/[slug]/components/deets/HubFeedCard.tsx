"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Eye, Flag, Loader2, MessageSquare, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DeetSharePopover } from "@/components/deets/DeetSharePopover";
import { useUserProfileModal } from "@/components/UserProfileModalProvider";
import type { HubContent } from "@/lib/hub-content";
import type { DeetReactor, DeetViewer } from "@/lib/services/deets/deet-interactions";
import type { OpenComposerArg } from "../../hooks/useDeetComposer";
import { FeedPostBody } from "@/components/deets/FeedPostBody";
import { isGenericDeetTitle } from "@/lib/deets/deet-title";
import { FeedMedia } from "./FeedMedia";
import {
  DeetTypeContent,
  DeetTypeKindChip,
  getStructuredHeadlineForFeed,
  headlineForHubFeedPoll,
  PollContent,
  resolveDeetType,
  StructuredDescriptionShell,
} from "./feedDeetTypeBlocks";
import { EmojiReactButton, POST_ICON } from "./feedEmojiReact";
import { ImageWithFallback, cn, feedKindMeta, initials } from "../hubUtils";
import { ReactionSummary } from "./ReactionSummary";
import { CollapsibleEngagementPanel } from "./CollapsibleEngagementPanel";

export type HubFeedItem = HubContent["feed"][number];

export type HubFeedCardProps = {
  item: HubFeedItem;
  highlighted: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  currentUserId?: string;
  isCreatorAdmin: boolean;
  onOpenComposer: (arg?: OpenComposerArg | null) => void;
  onConfirmDelete: (deetId: string) => void;
  onRecordShare?: (deetId: string) => void;
  shareUrl: string;
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string) => void;
  likeCount: number;
  commentCount: number;
  expandedComments: boolean;
  onToggleComments: () => void;
  /** Post author or hub admin: can open viewer list from the menu. */
  canSeeViewers: boolean;
  viewersOpen: boolean;
  viewersLoading?: boolean;
  viewers: DeetViewer[];
  onToggleViewers: () => void;
  copied: boolean;
  onCopied?: () => void;
  onToggleLike?: (deetId: string, reactionType?: string) => void;
  /** Canonical emoji the current user used (from server / hook). */
  myReactionType?: string | null;
  isLiked: boolean;
  isLiking: boolean;
  onOpenReactionsSummary?: () => void;
  /** Recent reactors for the summary row (avatars + emoji mix). */
  reactors?: DeetReactor[];
  commentsSlot?: ReactNode | null;
};

export function HubFeedCard({
  item,
  highlighted,
  menuOpen,
  onToggleMenu,
  currentUserId,
  isCreatorAdmin,
  onOpenComposer,
  onConfirmDelete,
  onRecordShare,
  shareUrl,
  onOpenViewer,
  likeCount,
  commentCount,
  expandedComments,
  onToggleComments,
  canSeeViewers,
  viewersOpen,
  viewersLoading,
  viewers,
  onToggleViewers,
  copied,
  onCopied,
  onToggleLike,
  myReactionType,
  isLiked,
  isLiking,
  onOpenReactionsSummary,
  reactors = [],
  commentsSlot,
}: HubFeedCardProps) {
  const { openProfileModal } = useUserProfileModal();
  const commentsEnabled = item.deetOptions?.commentsEnabled !== false;
  const reactionsEnabled = item.deetOptions?.reactionsEnabled !== false;
  const deetType = resolveDeetType(item.kind, item.deetAttachments);
  const hasRichSection = Boolean(deetType && item.deetAttachments?.some((a) => a.type === deetType));
  const showStructuredRichBody = Boolean(hasRichSection && deetType && deetType !== "poll");
  const structuredHeadline = deetType
    ? getStructuredHeadlineForFeed(deetType, item.deetAttachments, item.title)
    : null;
  /** Plain hub post: no structured attachment type — title (h3) and body are separate; do not strip body against title. */
  const isPlainFeedPost = deetType === null;
  const headline =
    deetType === "poll"
      ? headlineForHubFeedPoll(structuredHeadline, item.deetAttachments, item.title)
      : structuredHeadline ||
        (item.title?.trim() && !isGenericDeetTitle(item.title) ? item.title.trim() : null);
  const showPollDescriptionBody = Boolean(deetType === "poll" && item.body?.trim());
  const showBodyBlock = Boolean(item.body?.trim() && (!hasRichSection || showPollDescriptionBody));
  const kindMeta = feedKindMeta(item.kind);
  const showEngagementSummary = likeCount > 0 || commentCount > 0;

  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const postMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (postMenuRef.current?.contains(t)) return;
      if (postMenuButtonRef.current?.contains(t)) return;
      onToggleMenu();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpen, onToggleMenu]);

  const isAuthorOrAdmin = currentUserId === item.authorId || isCreatorAdmin;

  return (
    <article
      id={item.id}
      className={cn(
        "w-full overflow-visible rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm transition",
        highlighted && "ring-2 ring-[var(--ud-brand-primary)] ring-offset-2",
      )}
    >
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          onClick={() => item.authorId && openProfileModal(item.authorId)}
          aria-label={`Open ${item.author}'s profile`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)] transition hover:ring-2 hover:ring-[var(--ud-brand-primary)]/40"
        >
          <ImageWithFallback
            src={item.authorAvatar || ""}
            sources={item.authorAvatar ? [item.authorAvatar] : []}
            alt={item.author}
            className="h-full w-full object-cover"
            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
            fallback={initials(item.author)}
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => item.authorId && openProfileModal(item.authorId)}
              className="text-[15px] font-semibold text-[var(--ud-text-primary)] transition hover:underline"
            >
              {item.author}
            </button>
            {item.role ? (
              <span className="rounded-full border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
                {item.role === "creator" ? "Creator" : item.role === "admin" ? "Admin" : ""}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="text-xs text-[var(--ud-text-muted)]">{item.time}</span>
            <span className="select-none text-xs text-[var(--ud-text-muted)]/70" aria-hidden>
              ·
            </span>
            {deetType ? (
              <DeetTypeKindChip type={deetType} />
            ) : (
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", kindMeta.badgeClass)}>
                {kindMeta.label}
              </span>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            ref={postMenuButtonRef}
            type="button"
            onClick={onToggleMenu}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <MoreVertical className="h-[18px] w-[18px] stroke-[1.5]" />
          </button>
          {menuOpen && (
            <div
              ref={postMenuRef}
              className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg"
              role="menu"
            >
              {/* Delete, Edit, Report, Viewers */}
              {isAuthorOrAdmin ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleMenu();
                    onConfirmDelete(item.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  Delete
                </button>
              ) : null}
              {isAuthorOrAdmin ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleMenu();
                    onOpenComposer({ editFeedItem: item });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  Edit
                </button>
              ) : null}
              {!isAuthorOrAdmin ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleMenu();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                >
                  <Flag className="h-3.5 w-3.5 shrink-0" />
                  Report
                </button>
              ) : null}
              {canSeeViewers ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleViewers();
                    onToggleMenu();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  Viewers
                </button>
              ) : null}
            </div>
          )}

          {viewersOpen && canSeeViewers && (
            <div className="absolute right-0 top-full z-30 mt-1 w-[min(calc(100vw-2rem),16rem)] rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-lg">
              <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] px-3 py-2">
                <span className="text-[11px] font-semibold text-[var(--ud-text-primary)]">Viewers</span>
                <button
                  type="button"
                  onClick={onToggleViewers}
                  className="text-[10px] text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {viewersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-text-muted)]" />
                  </div>
                ) : viewers.length > 0 ? (
                  <div className="py-1">
                    {viewers.map((viewer) => (
                      <div key={viewer.userId} className="flex items-center gap-2 px-3 py-1.5">
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                          <ImageWithFallback
                            src={viewer.avatar || ""}
                            sources={viewer.avatar ? [viewer.avatar] : []}
                            alt={viewer.name}
                            className="h-full w-full object-cover"
                            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[7px] font-bold text-[var(--ud-brand-primary)]"
                            fallback={initials(viewer.name)}
                          />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-xs text-[var(--ud-text-primary)]">{viewer.name}</span>
                        <span className="shrink-0 text-[9px] text-[var(--ud-text-muted)]">
                          {viewer.viewedAt ? new Date(viewer.viewedAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-4 text-center text-[11px] text-[var(--ud-text-muted)]">No views yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {headline ? (
        <h3 className="px-4 pt-3 text-[15px] font-semibold leading-snug tracking-tight text-[var(--ud-text-primary)]">
          {headline}
        </h3>
      ) : null}

      {showBodyBlock ? (
        deetType === "poll" ? (
          <StructuredDescriptionShell type="poll" className={headline ? "mt-2" : "mt-3"}>
            <FeedPostBody
              body={item.body}
              title={item.title}
              dedupeBodyAgainstTitle={false}
              className="text-[15px] leading-relaxed text-[var(--ud-text-secondary)]"
            />
          </StructuredDescriptionShell>
        ) : isPlainFeedPost ? (
          <StructuredDescriptionShell type="post" className={headline ? "mt-2" : "mt-3"}>
            <FeedPostBody
              body={item.body}
              title={item.title}
              dedupeBodyAgainstTitle={false}
              className="text-[15px] leading-relaxed text-[var(--ud-text-primary)]"
            />
          </StructuredDescriptionShell>
        ) : (
          <FeedPostBody
            body={item.body}
            title={item.title}
            dedupeBodyAgainstTitle
            className={cn("px-4 text-[15px] leading-relaxed text-[var(--ud-text-primary)]", headline ? "pt-2" : "pt-3")}
          />
        )
      ) : null}
      {deetType === "poll" ? (
        <PollContent
          deetId={item.id}
          attachments={item.deetAttachments}
          className={showPollDescriptionBody ? "mt-2" : undefined}
        />
      ) : deetType ? (
        <DeetTypeContent
          type={deetType}
          attachments={item.deetAttachments}
          bodyHtml={showStructuredRichBody ? item.body : undefined}
          deetId={item.id}
          currentUserId={currentUserId}
        />
      ) : null}

      <FeedMedia
        imageUrls={item.images?.length ? item.images : item.image ? [item.image] : []}
        alt={item.title}
        feedKind={item.kind}
        sizesVariant={item.images && item.images.length > 1 ? "mosaic" : "hero"}
        onOpen={(index) =>
          onOpenViewer(
            item.images?.length ? item.images : [item.image!],
            index,
            item.title,
            item.body,
            item.id,
          )
        }
      />

      <div className="border-t border-[var(--ud-border-subtle)]">
        {showEngagementSummary ? (
          <ReactionSummary
            likeCount={likeCount}
            commentCount={commentCount}
            reactors={reactors}
            isLiked={isLiked}
            currentUserId={currentUserId}
            onOpenReactionsModal={onOpenReactionsSummary}
            onToggleComments={onToggleComments}
            commentsInteractive={commentsEnabled}
          />
        ) : null}

        <div
          className={cn(
            "flex gap-1 px-1 py-1 sm:px-2",
            showEngagementSummary && "bg-[var(--ud-bg-subtle)]/30",
          )}
        >
          <div className="min-w-0 flex-1 rounded-lg motion-reduce:active:scale-100">
            <EmojiReactButton
              deetId={item.id}
              isLiked={isLiked}
              isLiking={isLiking}
              onToggleLike={onToggleLike}
              syncedReaction={myReactionType ?? null}
              interactionsEnabled={reactionsEnabled}
              triggerClassName="max-sm:min-h-[44px] rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!commentsEnabled) return;
              onToggleComments();
            }}
            disabled={!commentsEnabled}
            title={!commentsEnabled ? "Comments are turned off for this post" : undefined}
            aria-expanded={expandedComments}
            className={cn(
              "flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors motion-reduce:transition-none sm:min-h-0 sm:py-2.5",
              expandedComments
                ? "font-semibold text-[var(--ud-brand-primary)]"
                : "text-[var(--ud-text-muted)]",
              commentsEnabled
                ? "hover:bg-[var(--ud-bg-subtle)] active:scale-[0.98] motion-reduce:active:scale-100"
                : "cursor-not-allowed opacity-50",
            )}
          >
            <MessageSquare className={POST_ICON} />
            <span>Comment</span>
          </button>
          <DeetSharePopover
            shareUrl={shareUrl}
            title={item.title}
            deetId={item.id}
            onRecordShare={onRecordShare}
            onCopySuccess={onCopied}
            copied={copied}
            triggerClassName="max-sm:min-h-[44px] rounded-lg active:scale-[0.98] motion-reduce:active:scale-100"
          />
        </div>
      </div>

      <CollapsibleEngagementPanel open={commentsEnabled && expandedComments && Boolean(commentsSlot)}>
        {commentsSlot}
      </CollapsibleEngagementPanel>
    </article>
  );
}
