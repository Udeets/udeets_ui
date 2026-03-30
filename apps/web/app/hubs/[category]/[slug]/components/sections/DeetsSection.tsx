"use client";

import type { HubContent } from "@/lib/hub-content";
import { Eye, Heart, Megaphone, MessageSquare, Search, Share2, SlidersHorizontal } from "lucide-react";
import { DeetComposerCard } from "../deets/DeetComposerCard";
import { ACTION_ICON, ICON, PREMIUM_ICON_WRAPPER, FeedItemIcon, ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";
import type { ComposerChildFlow } from "../deets/deetTypes";

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
  onOpenComposer,
  onOpenViewer,
}: {
  normalizedPostSearch: string;
  postSearchQuery: string;
  onPostSearchQueryChange: (value: string) => void;
  isFeedSearchOpen: boolean;
  onToggleFeedSearch: () => void;
  isFeedFilterOpen: boolean;
  onToggleFeedFilter: () => void;
  feedFilter: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos";
  onSelectFeedFilter: (value: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos") => void;
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
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
  onOpenViewer: (images: string[], index: number, title: string, body: string, focusId?: string) => void;
}) {
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
            <label className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={postSearchQuery}
                onChange={(event) => onPostSearchQueryChange(event.target.value)}
                placeholder="Search deets"
                className="w-36 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:w-44"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={onToggleFeedSearch}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0C5C57]",
              isFeedSearchOpen && "border-[#A9D1CA] text-[#0C5C57]"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0C5C57]"
              aria-label="Filter deets"
              title="Filter deets"
            >
              <SlidersHorizontal className={ACTION_ICON} />
            </button>
            {isFeedFilterOpen ? (
              <div className="absolute right-0 top-12 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {["Newest", "Oldest", "Announcements", "Events", "Polls", "Photos"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSelectFeedFilter(option as "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                      feedFilter === option ? "bg-[#EAF6F3] text-[#0C5C57]" : "text-slate-600 hover:bg-slate-50 hover:text-[#0C5C57]"
                    )}
                  >
                    <span>{option}</span>
                    {feedFilter === option ? <span className="h-2 w-2 rounded-full bg-[#0C5C57]" /> : null}
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
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57] shadow-sm">
                <Megaphone className="h-7 w-7 stroke-[1.8]" />
              </div>
              <h3 className="mt-6 text-3xl font-serif font-semibold tracking-tight text-[#111111]">
                {normalizedPostSearch ? "No matching deets" : "This deets stream is ready"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
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
                <h3 className="text-base font-semibold text-[#111111]">Featured deet</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{demoPostedText}</p>
            </section>
          ) : null}

          {showDemoPoll ? (
            <section
              data-demo-target={isDemoPreview ? "hub-poll-section" : undefined}
              className="w-full rounded-[26px] border border-[#D8ECE7] bg-[linear-gradient(180deg,#FCFEFD_0%,#F6FBF9_100%)] p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-[#111111]">Free Pet Check-up in Mechanicsville</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Would you attend the complimentary pet wellness check this Saturday?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-poll-yes" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    demoPollVote === "yes" ? "bg-[#0C5C57] text-white" : "border border-slate-200 bg-white text-slate-600"
                  )}
                >
                  Yes
                </button>
                <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500">
                  Maybe
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  data-demo-target={isDemoPreview ? "hub-like-button" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    demoLiked ? "bg-[#EAF6F3] text-[#0C5C57]" : "border border-slate-200 bg-white text-slate-500"
                  )}
                >
                  Like
                </button>
                <span className="text-xs font-medium text-slate-400">214 people engaged</span>
              </div>
            </section>
          ) : null}

          <section className="w-full space-y-4">
            {filteredFeedItems.map((item) => (
              <article
                id={item.id}
                key={item.id}
                className={cn(
                  "w-full rounded-[28px] border border-[#DCECE7] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFB_100%)] p-5 shadow-sm transition",
                  highlightedItemId === item.id && "ring-2 ring-[#A9D1CA] ring-offset-2 ring-offset-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                    <ImageWithFallback
                      src={dpImageSrc}
                      sources={[dpImageSrc, coverImageSrc, ...recentPhotos]}
                      alt={`${item.author} avatar`}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                      fallback={initials(item.author)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#111111]">{item.author}</h3>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{item.time}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0C5C57]">
                        <FeedItemIcon kind={item.kind} />
                        {item.title}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>

                    {item.image ? (
                      <button
                        type="button"
                        className="mt-4 block w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
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
                        <div className="w-full bg-[#EAF4F1]">
                          <ImageWithFallback
                            src={item.image}
                            sources={item.images?.length ? item.images : [item.image, coverImageSrc]}
                            alt={item.title}
                            className="max-h-[28rem] w-full object-contain"
                            fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-sm font-medium text-[#0C5C57]"
                            fallback="Image unavailable"
                            loading="lazy"
                          />
                        </div>
                      </button>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <div className="flex flex-wrap items-center gap-5">
                        <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                          <Heart className={ICON} />
                          <span>{item.likes}</span>
                        </button>
                        <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                          <MessageSquare className={ICON} />
                          <span>{item.comments}</span>
                        </button>
                        <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0C5C57]">
                          <Share2 className={ICON} />
                          <span>Share</span>
                        </button>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-slate-500">
                        <Eye className={ICON} />
                        <span>{item.views}</span>
                      </div>
                    </div>
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
