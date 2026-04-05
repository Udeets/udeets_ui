"use client";

import type { HubContent } from "@/lib/hub-content";
import { Eye, Heart, Loader2, Megaphone, MessageCircle, Search, SlidersHorizontal, Send, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ICON, FeedItemIcon, ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";
import type { DeetComment } from "@/lib/services/deets/deet-interactions";

function sanitizeHtmlContent(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  const scripts = div.querySelectorAll("script");
  scripts.forEach((script) => script.remove());
  const allElements = div.querySelectorAll("*");
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return div.innerHTML;
}

/* ── Band-style icon sizing ── */
const POST_ICON = "h-[18px] w-[18px] stroke-[1.5]";
const FILTER_ICON = "h-5 w-5 stroke-[1.5]";

export function DeetsSection({
  normalizedPostSearch,
  postSearchQuery,
  onPostSearchQueryChange,
  isFeedSearchOpen,
  onToggleFeedSearch,
  isFeedFilterOpen,
  onToggleFeedFilter,
  feedFilter,
  onSelectFeedFilter,
  filteredFeedItems,
  showDemoPostedText,
  demoPostedText,
  showDemoPoll,
  demoPollVote,
  demoLiked,
  highlightedItemId,
  isDemoPreview,
  isCreatorAdmin,
  dpImageSrc,
  coverImageSrc,
  recentPhotos,
  hubName,
  hubCategory,
  hubSlug,
  userAvatarSrc,
  userName,
  onOpenComposer,
  onOpenViewer,
  likedDeetIds,
  likingDeetIds,
  likeCountOverrides,
  onToggleLike,
  expandedCommentDeetId,
  commentsByDeetId,
  commentLoadingDeetIds,
  commentSubmittingDeetId,
  onToggleComments,
  onSubmitComment,
}: {
  normalizedPostSearch: string;
  postSearchQuery: string;
  onPostSearchQueryChange: (value: string) => void;
  isFeedSearchOpen: boolean;
  onToggleFeedSearch: () => void;
  isFeedFilterOpen: boolean;
  onToggleFeedFilter: () => void;
  feedFilter: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos" | "News" | "Deals" | "Alerts";
  onSelectFeedFilter: (value: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos" | "News" | "Deals" | "Alerts") => void;
  filteredFeedItems: HubContent["feed"];
  showDemoPostedText: boolean;
  demoPostedText: string;
  showDemoPoll: boolean;
  demoPollVote: string | null;
  demoLiked: boolean;
  highlightedItemId: string | null;
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  dpImageSrc: string;
  coverImageSrc: string;
  recentPhotos: string[];
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  userAvatarSrc?: string;
  userName?: string;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string) => void;
  likedDeetIds?: Set<string>;
  likingDeetIds?: Set<string>;
  likeCountOverrides?: Record<string, number>;
  onToggleLike?: (deetId: string) => void;
  expandedCommentDeetId?: string | null;
  commentsByDeetId?: Record<string, DeetComment[]>;
  commentLoadingDeetIds?: Set<string>;
  commentSubmittingDeetId?: string | null;
  onToggleComments?: (deetId: string) => void;
  onSubmitComment?: (deetId: string, body: string) => void;
}) {
  const [copiedDeetId, setCopiedDeetId] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleShareDeet = async (deetId: string) => {
    const shareUrl = `${window.location.origin}/hubs/${hubCategory}/${hubSlug}?focus=${deetId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedDeetId(deetId);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopiedDeetId(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  /* ── Composer card (shared between empty & populated states) ── */
  const composerCard = (
    <DeetComposerCard
      isDemoPreview={isDemoPreview}
      isCreatorAdmin={isCreatorAdmin}
      onOpenComposer={onOpenComposer}
    />
  );

  return (
    <SectionShell
      title="Deets"
      description={
        normalizedPostSearch
          ? "Showing filtered updates, announcements, moments, reminders, and conversations from this hub."
          : "Updates, announcements, moments, reminders, and conversations from this hub."
      }
      actions={
        <div className="flex items-center gap-2">
          {isFeedSearchOpen ? (
            <label className="flex h-10 items-center gap-2 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 shadow-sm">
              <Search className="h-4 w-4 text-[var(--ud-text-muted)]" />
              <input
                value={postSearchQuery}
                onChange={(event) => onPostSearchQueryChange(event.target.value)}
                placeholder="Search deets"
                className="w-24 min-w-0 bg-transparent text-sm text-[var(--ud-text-secondary)] outline-none placeholder:text-[var(--ud-text-muted)] sm:w-44"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={onToggleFeedSearch}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)] shadow-sm transition hover:text-[var(--ud-brand-primary)]",
              isFeedSearchOpen && "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
            )}
            aria-label="Search deets"
            title="Search deets"
          >
            <Search className={FILTER_ICON} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleFeedFilter}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)] shadow-sm transition hover:text-[var(--ud-brand-primary)]"
              aria-label="Filter deets"
              title="Filter deets"
            >
              <SlidersHorizontal className={FILTER_ICON} />
            </button>
            {isFeedFilterOpen ? (
              <div className="absolute right-0 top-12 z-20 min-w-[180px] rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-2 shadow-lg">
                {["Newest", "Oldest", "Announcements", "Events", "Polls", "Photos", "News", "Deals", "Alerts"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSelectFeedFilter(option as typeof feedFilter)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                      feedFilter === option ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]" : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                    )}
                  >
                    <span>{option}</span>
                    {feedFilter === option ? <span className="h-2 w-2 rounded-full bg-[var(--ud-brand-primary)]" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      }
    >
      {filteredFeedItems.length === 0 && !showDemoPostedText && !showDemoPoll ? (
        <div className="w-full space-y-3">
          {composerCard}
          <div className="grid min-h-[280px] w-full place-items-center rounded-xl border border-dashed border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] p-6 text-center">
            <div className="w-full">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]">
                <Megaphone className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
                {normalizedPostSearch ? "No matching deets" : "This deets stream is ready"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--ud-text-muted)]">
                {normalizedPostSearch
                  ? "Try another keyword or filter."
                  : isCreatorAdmin
                    ? "Kick things off with a welcome note, event reminder, or a first shared photo."
                    : "Check back soon for updates and conversations."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {composerCard}

          {showDemoPostedText ? (
            <article className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
              <div className="px-4 pb-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold text-[var(--ud-text-primary)]">Featured deet</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{demoPostedText}</p>
              </div>
            </article>
          ) : null}

          {showDemoPoll ? (
            <article
              data-demo-target={isDemoPreview ? "hub-poll-section" : undefined}
              className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm"
            >
              <div className="px-4 pb-3 pt-4">
                <h3 className="text-[15px] font-semibold text-[var(--ud-text-primary)]">Free Pet Check-up in Mechanicsville</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
                  Would you attend the complimentary pet wellness check this Saturday?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    data-demo-target={isDemoPreview ? "hub-poll-yes" : undefined}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition",
                      demoPollVote === "yes" ? "bg-[var(--ud-brand-primary)] text-white" : "border border-[var(--ud-border)] text-[var(--ud-text-secondary)]"
                    )}
                  >
                    Yes
                  </button>
                  <button type="button" className="rounded-full border border-[var(--ud-border)] px-4 py-1.5 text-sm font-medium text-[var(--ud-text-muted)]">
                    Maybe
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--ud-border-subtle)] px-4 py-2.5">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-like-button" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm transition",
                    demoLiked ? "text-[var(--ud-brand-primary)] font-medium" : "text-[var(--ud-text-muted)]"
                  )}
                >
                  <Heart className={POST_ICON} fill={demoLiked ? "currentColor" : "none"} />
                  Like
                </button>
                <span className="text-xs text-[var(--ud-text-muted)]">214 engaged</span>
              </div>
            </article>
          ) : null}

          {/* ── Feed items ── */}
          <section className="w-full space-y-3">
            {filteredFeedItems.map((item) => (
              <article
                id={item.id}
                key={item.id}
                className={cn(
                  "w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm transition",
                  highlightedItemId === item.id && "ring-2 ring-[var(--ud-brand-primary)] ring-offset-2",
                  (item.kind === "hazard" || item.kind === "alert") && "border-l-4 border-l-red-500"
                )}
              >
                {/* ── Author header ── */}
                <div className="flex items-center gap-3 px-4 pt-4">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                    <ImageWithFallback
                      src=""
                      sources={[]}
                      alt={item.author}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]"
                      fallback={initials(item.author)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-[var(--ud-text-primary)]">{item.author}</span>
                      {item.role && (
                        <span className="rounded-full bg-[var(--ud-brand-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                          {item.role === "creator" ? "Creator" : item.role === "admin" ? "Admin" : "Member"}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--ud-text-muted)]">{item.time}</span>
                  </div>
                  {/* Subtle type indicator */}
                  <span className="inline-flex items-center gap-1 text-[var(--ud-text-muted)]" title={item.title}>
                    <FeedItemIcon kind={item.kind} />
                  </span>
                </div>

                {/* ── Body content ── */}
                {item.body ? (
                  <div
                    className="px-4 pt-3 text-[15px] leading-relaxed text-[var(--ud-text-primary)]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.body) }}
                  />
                ) : null}

                {/* ── Image / gallery ── */}
                {item.image ? (
                  <button
                    type="button"
                    className="mt-3 block w-full bg-[var(--ud-bg-subtle)]"
                    onClick={() =>
                      onOpenViewer(
                        item.images?.length ? item.images : [item.image!],
                        0,
                        item.title,
                        item.body,
                        item.id
                      )
                    }
                  >
                    <div className="aspect-video max-h-[320px] w-full">
                      <ImageWithFallback
                        src={item.image}
                        sources={item.images?.length ? item.images : [item.image]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-sm text-[var(--ud-text-muted)]"
                        fallback="Image unavailable"
                        loading="lazy"
                      />
                    </div>
                  </button>
                ) : null}

                {/* ── Action bar ── */}
                <div className="flex items-center justify-between border-t border-[var(--ud-border-subtle)] px-4 py-1.5 mt-3">
                  {/* Left group: Like · Comment · Share */}
                  <div className="flex items-center gap-4">
                    {/* Like */}
                    <button
                      type="button"
                      onClick={() => onToggleLike?.(item.id)}
                      disabled={likingDeetIds?.has(item.id)}
                      title="Like"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg py-2 text-sm transition-colors hover:text-[var(--ud-brand-primary)]",
                        likedDeetIds?.has(item.id)
                          ? "text-[var(--ud-brand-primary)] font-medium"
                          : "text-[var(--ud-text-muted)]"
                      )}
                    >
                      {likingDeetIds?.has(item.id) ? (
                        <Loader2 className={cn(POST_ICON, "animate-spin")} />
                      ) : (
                        <Heart className={POST_ICON} fill={likedDeetIds?.has(item.id) ? "currentColor" : "none"} />
                      )}
                      <span>{likeCountOverrides?.[item.id] ?? item.likes}</span>
                    </button>

                    {/* Comment */}
                    <button
                      type="button"
                      onClick={() => onToggleComments?.(item.id)}
                      title="Comment"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg py-2 text-sm transition-colors hover:text-[var(--ud-brand-primary)]",
                        expandedCommentDeetId === item.id
                          ? "text-[var(--ud-brand-primary)] font-medium"
                          : "text-[var(--ud-text-muted)]"
                      )}
                    >
                      <MessageCircle className={POST_ICON} />
                      <span>{item.comments}</span>
                    </button>

                    {/* Share */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => handleShareDeet(item.id)}
                        title="Share"
                        className="inline-flex items-center gap-1.5 rounded-lg py-2 text-sm text-[var(--ud-text-muted)] transition-colors hover:text-[var(--ud-brand-primary)]"
                      >
                        <Share2 className={POST_ICON} />
                        <span>Share</span>
                      </button>
                      {copiedDeetId === item.id && (
                        <span className="absolute -top-8 left-0 whitespace-nowrap rounded border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-2 py-1 text-xs font-medium text-[var(--ud-brand-primary)] shadow-sm">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Views */}
                  <div
                    className="inline-flex items-center gap-1.5 py-2 text-sm text-[var(--ud-text-muted)]"
                    title="Views"
                  >
                    <Eye className={POST_ICON} />
                    <span>{item.views}</span>
                  </div>
                </div>

                {/* ── Comments section ── */}
                {expandedCommentDeetId === item.id && (
                  <DeetCommentsSection
                    deetId={item.id}
                    comments={commentsByDeetId?.[item.id] ?? []}
                    isLoading={commentLoadingDeetIds?.has(item.id) ?? false}
                    isSubmitting={commentSubmittingDeetId === item.id}
                    onSubmitComment={onSubmitComment}
                    userAvatarSrc={userAvatarSrc}
                    userName={userName}
                  />
                )}
              </article>
            ))}
          </section>
        </div>
      )}
    </SectionShell>
  );
}

/* ── Comments panel (Band-style inline) ── */
function DeetCommentsSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  onSubmitComment,
  userAvatarSrc,
  userName,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmitComment?: (deetId: string, body: string) => void;
  userAvatarSrc?: string;
  userName?: string;
}) {
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    onSubmitComment?.(deetId, trimmed);
    setCommentText("");
  };

  return (
    <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50">
      {/* Existing comments */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--ud-text-muted)]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-0 divide-y divide-[var(--ud-border-subtle)]">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5 px-4 py-3">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
                <ImageWithFallback
                  src={comment.authorAvatar || ""}
                  sources={comment.authorAvatar ? [comment.authorAvatar] : []}
                  alt={comment.authorName ?? "User"}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]"
                  fallback={initials(comment.authorName ?? "User")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[var(--ud-text-primary)]">{comment.authorName ?? "User"}</span>
                  <span className="text-[11px] text-[var(--ud-text-muted)]">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-center text-xs text-[var(--ud-text-muted)]">No comments yet</p>
      )}

      {/* Comment input */}
      <div className="flex items-center gap-2 border-t border-[var(--ud-border-subtle)] px-4 py-2.5">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-light)]">
          <ImageWithFallback
            src={userAvatarSrc || ""}
            sources={userAvatarSrc ? [userAvatarSrc] : []}
            alt={userName || "You"}
            className="h-full w-full object-cover"
            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]"
            fallback={initials(userName || "You")}
          />
        </div>
        <input
          ref={inputRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Write a comment..."
          className="h-9 flex-1 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3.5 text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)] focus:border-[var(--ud-brand-primary)]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !commentText.trim()}
          title="Send comment"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            commentText.trim()
              ? "bg-[var(--ud-brand-primary)] text-white hover:opacity-90"
              : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]"
          )}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
