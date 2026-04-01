"use client";

/* eslint-disable @next/next/no-img-element */
import { Globe, Lock } from "lucide-react";
import { ImageWithFallback, cn, initials } from "./hubUtils";

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
  categoryLabel,
  visibilityLabel,
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
  categoryLabel: string;
  visibilityLabel: "Public" | "Private";
}) {
  const VisibilityIcon = visibilityLabel === "Public" ? Globe : Lock;

  return (
    <div className="grid w-full grid-cols-[240px_1fr]">
      {/* Left panel — DP, name, meta, CTAs */}
      <div className="relative flex min-h-[260px] flex-col items-center justify-between border-r border-slate-100 bg-white px-4 py-4">
        <input ref={dpInputRef} type="file" accept="image/*" onChange={onDpChange} className="hidden" />

        <VisibilityIcon className="absolute right-3 top-3 text-[#1a3a35]" style={{ width: 15, height: 15 }} />

        <button
          type="button"
          onClick={onOpenDpChooser}
          disabled={!isCreatorAdmin || isUploadingDp}
          className={cn(
            "h-40 w-40 shrink-0 overflow-hidden rounded-full bg-[#E3F1EF]",
            isCreatorAdmin && "cursor-pointer"
          )}
        >
          {dpImageSrc ? (
            <ImageWithFallback
              src={dpImageSrc}
              sources={[dpImageSrc]}
              alt={`${headerHubName} display`}
              className="h-full w-full object-cover"
              fallbackClassName="grid h-full w-full place-items-center bg-[#E3F1EF] text-6xl font-semibold text-[#0C5C57]"
              fallback={headerHubName.charAt(0).toUpperCase()}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#E3F1EF]">
              <span className="text-6xl font-semibold text-[#0C5C57]">{headerHubName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </button>

        <div className="w-full text-center">
          <h1 className="break-words text-center text-[15px] font-bold text-gray-900">{headerHubName}</h1>
          <p className="mt-1 text-center text-[12px] text-gray-500">{categoryLabel} · {memberCount} {memberCount === 1 ? "Member" : "Members"}</p>
        </div>
      </div>

      {/* Right panel — cover image */}
      <div className="relative h-[260px] overflow-hidden">
        <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="hidden" />
        <button
          type="button"
          onClick={onOpenCoverChooser}
          disabled={!isCreatorAdmin || isUploadingCover}
          className={cn("h-full w-full", isCreatorAdmin && "cursor-pointer")}
        >
          {displayCoverImageSrc ? (
            <ImageWithFallback
              src={displayCoverImageSrc}
              sources={[displayCoverImageSrc, coverImageSrc].filter(Boolean)}
              alt={`${hubName} cover`}
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full bg-[#A9D1CA]"
              fallback=""
            />
          ) : (
            <div className="h-full w-full bg-[#A9D1CA]" />
          )}
        </button>
      </div>
    </div>
  );
}
