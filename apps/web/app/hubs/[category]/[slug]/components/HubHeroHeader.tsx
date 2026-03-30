"use client";

import { HubHeaderActions } from "./header/HubHeaderActions";
import { CARD, EMPTY_MEDIA_BG, ImageWithFallback, MediaEmptyState, cn, initials } from "./hubUtils";

export function HubHeroHeader({
  dpInputRef,
  coverInputRef,
  onDpChange,
  onCoverChange,
  onOpenDpChooser,
  onOpenCoverChooser,
  isCreatorAdmin,
  isUploadingDp,
  isUploadingCover,
  dpImageSrc,
  displayCoverImageSrc,
  coverImageSrc,
  headerHubName,
  hubName,
  memberCount,
  visibilityLabel,
  isJoined,
  onMembershipActionClick,
  onMembersClick,
  onInviteMembers,
  onOpenSettings,
}: {
  dpInputRef: React.RefObject<HTMLInputElement | null>;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  onDpChange: React.ChangeEventHandler<HTMLInputElement>;
  onCoverChange: React.ChangeEventHandler<HTMLInputElement>;
  onOpenDpChooser: () => void;
  onOpenCoverChooser: () => void;
  isCreatorAdmin: boolean;
  isUploadingDp: boolean;
  isUploadingCover: boolean;
  dpImageSrc: string;
  displayCoverImageSrc: string;
  coverImageSrc: string;
  headerHubName: string;
  hubName: string;
  memberCount: number;
  visibilityLabel: "Public" | "Private";
  isJoined: boolean;
  onMembershipActionClick: () => void;
  onMembersClick: () => void;
  onInviteMembers: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className={cn(CARD, "flex min-h-[340px] flex-col items-center justify-start p-6 pt-7 sm:min-h-[352px] sm:pt-8 md:h-[368px]")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <input ref={dpInputRef} type="file" accept="image/*" onChange={onDpChange} className="hidden" />
          <button
            type="button"
            onClick={onOpenDpChooser}
            disabled={!isCreatorAdmin || isUploadingDp}
            className={cn(
              "h-[210.375px] w-[210.375px] overflow-hidden rounded-full border-[3px] border-white bg-[#A9D1CA] shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:h-[245.4375px] sm:w-[245.4375px]",
              isCreatorAdmin && "cursor-pointer"
            )}
          >
            {dpImageSrc ? (
              <ImageWithFallback
                src={dpImageSrc}
                sources={[dpImageSrc]}
                alt={`${headerHubName} display`}
                className="h-full w-full object-cover"
                fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-2xl font-semibold text-[#111111]"
                fallback={initials(headerHubName)}
              />
            ) : (
              <MediaEmptyState />
            )}
          </button>

          <div className="w-full min-w-0 space-y-3 pt-2">
            <h1 className="truncate text-lg font-serif font-semibold tracking-tight text-[#111111] sm:text-xl">{headerHubName}</h1>
            <HubHeaderActions
              memberCount={memberCount}
              visibilityLabel={visibilityLabel}
              canManageHub={isCreatorAdmin}
              isJoined={isJoined}
              onMembersClick={onMembersClick}
              onInviteClick={onInviteMembers}
              onSettingsClick={onOpenSettings}
              onMembershipActionClick={onMembershipActionClick}
            />
          </div>
        </div>
      </div>

      <div className={cn(CARD, "relative overflow-hidden min-h-[340px] sm:min-h-[352px] md:h-[368px]")}>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="hidden" />
        <button
          type="button"
          onClick={onOpenCoverChooser}
          disabled={!isCreatorAdmin || isUploadingCover}
          className={cn("relative z-0 h-full min-h-[340px] w-full sm:min-h-[352px] md:min-h-[368px]", isCreatorAdmin && "cursor-pointer")}
          style={!displayCoverImageSrc ? { backgroundColor: EMPTY_MEDIA_BG } : undefined}
        >
          {displayCoverImageSrc ? (
            <ImageWithFallback
              src={displayCoverImageSrc}
              sources={[displayCoverImageSrc, coverImageSrc].filter(Boolean)}
              alt={`${hubName} cover`}
              className="h-full w-full object-cover"
              fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-sm font-medium text-[#0C5C57]"
              fallback="Cover photo"
            />
          ) : (
            <MediaEmptyState />
          )}
        </button>
      </div>
    </section>
  );
}
