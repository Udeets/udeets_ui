"use client";

import type { HubContent } from "@/lib/hub-content";
import { Eye, Heart, Loader2, Megaphone, MessageSquare, Search, SlidersHorizontal, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ACTION_ICON, ICON, PREMIUM_ICON_WRAPPER, FeedItemIcon, ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";
import type { DeetComment } from "@/lib/services/deets/deet-interactions";

function sanitizeHtmlContent(html: string): string {
  // Remove script tags and event handlers to prevent XSS
  const div = document.createElement("div");
  div.innerHTML = html;

  // Remove all script tags
  const scripts = div.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  // Remove event handler attributes
  const allElements = div.querySelectorAll("*");
  allElements.forEach((el) => {
    // Remove all on* event handlers
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return div.innerHTML;
}

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

      // Clear previous timeout
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }

      // Auto-hide toast after 2 seconds
      copiedTimeoutRef.current = setTimeout(() => {
        setCopiedDeetId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

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
                className="w-36 bg-transparent text-sm text-[var(--ud-text-secondary)] outline-none placeholder:text-[var(--ud-text-muted)] sm:w-44"
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
            <Search className={ACTION_ICON} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleFeedFilter}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)] shadow-sm transition hover:text-[var(--ud-brand-primary)]"
              aria-label="Filter deets"
              title="Filter deets"
            >
              <SlidersHorizontal className={ACTION_ICON} />
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
        <div className="w-full space-y-4">
          <DeetComposerCard
            isDemoPreview={isDemoPreview}
            isCreatorAdmin={isCreatorAdmin}
            dpImageSrc={dpImageSrc}
            coverImageSrc={coverImageSrc}
            recentPhotos={recentPhotos}
            hubName={hubName}
            onOpenComposer={onOpenComposer}
          />
          <div className="grid min-h-[280px] w-full place-items-center rounded-[28px] border border-dashed border-[#CFE4DE] bg-[linear-gradient(180deg,#FCFEFD_0%,#F5FBF9_100%)] p-6 text-center">
            <div className="w-full">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)] shadow-sm">
                <Megaphone className="h-7 w-7 stroke-[1.8]" />
              </div>
              <h3 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
                {normalizedPostSearch ? "No matching deets" : "This deets stream is ready"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ud-text-secondary)]">
                {normalizedPostSearch
                  ? "Try another keyword or filter to find the update, moment, or announcement you had in mind."
                  : isCreatorAdmin
                    ? "Kick things off with a welcome note, event reminder, community update, or a first shared photo."
                    : "Check back soon for announcements, reminders, photos, and conversations as this community starts sharing more deets."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <DeetComposerCard
            isDemoPreview={isDemoPreview}
            isCreatorAdmin={isCreatorAdmin}
            dpImageSrc={dpImageSrc}
            coverImageSrc={coverImageSrc}
            recentPhotos={recentPhotos}
            hubName={hubName}
            onOpenComposer={onOpenComposer}
          />

          {showDemoPostedText ? (
            <section className="w-full rounded-[26px] border border-[#D8ECE7] bg-[linear-gradient(180deg,#FCFEFD_0%,#F6FBF9_100%)] p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <Megaphone className={ICON} />
                </span>
                <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">Featured deet</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{demoPostedText}</p>
            </section>
          ) : null}

          {showDemoPoll ? (
            <section
              data-demo-target={isDemoPreview ? "hub-poll-section" : undefined}
              className="w-full rounded-[26px] border border-[#D8ECE7] bg-[linear-gradient(180deg,#FCFEFD_0%,#F6FBF9_100%)] p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">Free Pet Check-up in Mechanicsville</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
                Would you attend the complimentary pet wellness check this Saturday?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-poll-yes" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    demoPollVote === "yes" ? "bg-[var(--ud-brand-primary)] text-white" : "border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-secondary)]"
                  )}
                >
                  Yes
                </button>
                <button type="button" className="rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-4 py-2 text-sm font-medium text-[var(--ud-text-muted)]">
                  Maybe
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-like-button" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    demoLiked ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]" : "border border-[var(--ud-border)] bg-[var(--ud-bg-card)] text-[var(--ud-text-muted)]"
                  )}
                >
                  Like
                </button>
                <span className="text-xs font-medium text-[var(--ud-text-muted)]">214 people engaged</span>
              </div>
            </section>
          ) : null}

          <section className="w-full space-y-4">
            {filteredFeedItems.map((item) => (
              <article
                id={item.id}
                key={item.id}
                className={cn(
                  "w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-5 shadow-sm transition",
                  highlightedItemId === item.id && "ring-2 ring-[var(--ud-brand-primary)] ring-offset-2 ring-offset-white",
                  (item.kind === "hazard" || item.kind === "alert") && "border-l-4 border-l-red-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--ud-border)] bg-[var(--ud-brand-light)]">
                    <ImageWithFallback
                      src={dpImageSrc}
                      sources={[dpImageSrc, coverImageSrc, ...recentPhotos]}
                      alt={`${item.author} avatar`}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-xs font-semibold text-[var(--ud-text-primary)]"
                      fallback={initials(item.author)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--ud-text-primary)]">{item.author}</h3>
                      {item.role && (
                        <span className="inline-flex items-center rounded-full bg-[var(--ud-brand-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                          {item.role === "creator" ? "Creator" : item.role === "admin" ? "Admin" : "Member"}
                        </span>
                      )}
                      <span className="text-xs text-[var(--ud-text-muted)]">•</span>
                      <span className="text-xs text-[var(--ud-text-muted)]">{item.time}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ud-bg-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ud-brand-primary)]">
                        <FeedItemIcon kind={item.kind} />
                        {item.title}
                      </span>
                    </div>

                    <div
                      className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtmlContent(item.body),
                      }}
                    />

                    {item.image ? (
                      <button
                        type="button"
                        className="mt-4 block w-full overflow-hidden rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)]"
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
                        <div className="aspect-video max-h-[280px] w-full bg-[#EAF4F1]">
                          <ImageWithFallback
                            src={item.image}
                            sources={item.images?.length ? item.images : [item.image, coverImageSrc]}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/25 text-sm font-medium text-[var(--ud-brand-primary)]"
                            fallback="Image unavailable"
                            loading="lazy"
                          />
                        </div>
                      </button>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ud-border)] pt-3 text-sm text-[var(--ud-text-secondary)]">
                      <div className="flex flex-wrap items-center gap-5">
                        <button
                          type="button"
                          onClick={() => onToggleLike?.(item.id)}
                          disabled={likingDeetIds?.has(item.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]",
                            likedDeetIds?.has(item.id) && "text-[var(--ud-brand-primary)] font-medium"
                          )}
                        >
                          {likingDeetIds?.has(item.id) ? (
                            <Loader2 className={cn(ICON, "animate-spin")} />
                          ) : (
                            <Heart
                              className={ICON}
                              fill={likedDeetIds?.has(item.id) ? "currentColor" : "none"}
                            />
                          )}
                          <span>{likeCountOverrides?.[item.id] ?? item.likes}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleComments?.(item.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]",
                            expandedCommentDeetId === item.id && "text-[var(--ud-brand-primary)] font-medium"
                          )}
                        >
                          <MessageSquare className={ICON} />
                          <span>{item.comments}</span>
                        </button>
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => handleShareDeet(item.id)}
                            className="inline-flex items-center gap-1.5 transition hover:text-[var(--ud-brand-primary)]"
                          >
                            <Send className={ICON} />
                            <span>{copiedDeetId === item.id ? "Copied!" : "Share"}</span>
                          </button>
                          {copiedDeetId === item.id && (
                            <span className="absolute -top-8 left-0 whitespace-nowrap text-xs font-medium text-[var(--ud-brand-primary)] bg-[var(--ud-bg-card)] border border-[var(--ud-border)] rounded px-2 py-1 shadow-sm">
                              Copied to clipboard
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-[var(--ud-text-muted)]">
                        <Eye className={ICON} />
                        <span>{item.views}</span>
                      </div>
                    </div>

                    {expandedCommentDeetId === item.id && (
                      <DeetCommentsSection
                        deetId={item.id}
                        comments={commentsByDeetId?.[item.id] ?? []}
                        isLoading={commentLoadingDeetIds?.has(item.id) ?? false}
                        isSubmitting={commentSubmittingDeetId === item.id}
                        onSubmitComment={onSubmitComment}
                        dpImageSrc={dpImageSrc}
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </SectionShell>
  );
}

function DeetCommentsSection({
  deetId,
  comments,
  isLoading,
  isSubmitting,
  onSubmitComment,
  dpImageSrc,
}: {
  deetId: string;
  comments: DeetComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmitComment?: (deetId: string, body: string) => void;
  dpImageSrc: string;
}) {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = () => {
    if (commentText.trim() && !isSubmitting) {
      onSubmitComment?.(deetId, commentText);
      setCommentText("");
    }
  };

  return (
    <div className="mt-3 rounded-b-lg border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] p-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ud-text-muted)]" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-[var(--ud-text-muted)] italic">No comments yet. Be the first!</p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto space-y-3 mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--ud-text-primary)]">{comment.authorName || "User"}</span>
                <span className="text-xs text-[var(--ud-text-muted)]">{formatCommentTime(comment.createdAt)}</span>
              </div>
              <p className="text-[var(--ud-text-secondary)] mt-1">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm text-[var(--ud-text-secondary)] placeholder:text-[var(--ud-text-muted)] outline-none focus:border-[var(--ud-brand-primary)] focus:ring-2 focus:ring-[var(--ud-brand-light)] disabled:opacity-75"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!commentText.trim() || isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--ud-brand-primary)] to-[#1a8a82] text-white px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          aria-label="Send comment"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function formatCommentTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
