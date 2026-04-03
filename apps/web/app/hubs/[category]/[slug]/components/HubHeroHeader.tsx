"use client";

/* eslint-disable @next/next/no-img-element */
import { Globe, Lock } from "lucide-react";
import type { HubColorTheme } from "@/lib/hub-color-themes";
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
  accentTheme,
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
  accentTheme?: HubColorTheme;
}) {
  const VisibilityIcon = visibilityLabel === "Public" ? Globe : Lock;

  return (
    <div className="grid w-full grid-cols-1 lg:grid-cols-[240px_1fr]">
      {/* Mobile: Cover image on top */}
      <div className="relative h-[180px] overflow-hidden lg:hidden" style={{ backgroundColor: accentTheme?.wash }}>
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
              fallbackClassName="h-full w-full"
              fallbackStyle={{ backgroundColor: accentTheme?.surface }}
              fallback=""
            />
          ) : (
            <div className="h-full w-full" style={{ backgroundColor: accentTheme?.surface }} />
          )}
        </button>

        {/* Overlapping DP avatar on mobile */}
        <div className="absolute -bottom-10 left-4 z-10">
          <button
            type="button"
            onClick={onOpenDpChooser}
            disabled={!isCreatorAdmin || isUploadingDp}
            className={cn(
              "h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-md",
              isCreatorAdmin && "cursor-pointer"
            )}
            style={{ backgroundColor: accentTheme?.wash }}
          >
            {dpImageSrc ? (
              <ImageWithFallback
                src={dpImageSrc}
                sources={[dpImageSrc]}
                alt={`${headerHubName} display`}
                className="h-full w-full object-cover"
                fallbackClassName="grid h-full w-full place-items-center bg-[#E3F1EF] text-2xl font-semibold text-[#0C5C57]"
                fallback={headerHubName.charAt(0).toUpperCase()}
              />
            ) : (
              <div className="grid h-full w-full place-items-center" style={{ backgroundColor: accentTheme?.wash }}>
                <span className="text-2xl font-semibold" style={{ color: accentTheme?.primary }}>{headerHubName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile: Hub info row below cover */}
      <div className="flex items-end justify-between border-b border-slate-100 bg-white px-4 pb-3 pt-12 lg:hidden">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#111111]">{headerHubName}</h1>
          <p className="text-xs text-gray-500">
            {categoryLabel} · {memberCount} {memberCount === 1 ? "Member" : "Members"}
          </p>
        </div>
        <VisibilityIcon className="text-[#1a3a35]" style={{ width: 15, height: 15 }} />
      </div>

      {/* Desktop: Left panel — DP, name, meta */}
      <div className="relative hidden min-h-[260px] flex-col items-center justify-between border-r border-slate-100 px-4 py-4 lg:flex" style={{ backgroundColor: accentTheme?.wash }}>
        <input ref={dpInputRef} type="file" accept="image/*" onChange={onDpChange} className="hidden" />

        <VisibilityIcon className="absolute right-3 top-3 text-[#1a3a35]" style={{ width: 15, height: 15 }} />

        <button
          type="button"
          onClick={onOpenDpChooser}
          disabled={!isCreatorAdmin || isUploadingDp}
          className={cn(
            "h-40 w-40 shrink-0 overflow-hidden rounded-full",
            isCreatorAdmin && "cursor-pointer"
          )}
          style={{ backgroundColor: accentTheme?.wash }}
        >
          {dpImageSrc ? (
            <ImageWithFallback
              src={dpImageSrc}
              sources={[dpImageSrc]}
              alt={`${headerHubName} display`}
              className="h-full w-full object-cover"
              fallbackClassName="grid h-full w-full place-items-center text-6xl font-semibold"
              fallbackStyle={{ backgroundColor: accentTheme?.wash, color: accentTheme?.primary }}
              fallback={headerHubName.charAt(0).toUpperCase()}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#E3F1EF]">
              <span className="text-6xl font-semibold text-[#0C5C57]">{headerHubName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </button>

        <div className="w-full text-center">
          <h1 className="break-words text-center text-[15px] font-semibold tracking-tight text-[#111111]">{headerHubName}</h1>
          <p className="mt-1 text-center text-[12px] text-gray-500">{categoryLabel} · {memberCount} {memberCount === 1 ? "Member" : "Members"}</p>
        </div>
      </div>

      {/* Desktop: Right panel — cover image */}
      <div className="relative hidden h-[260px] overflow-hidden lg:block" style={{ backgroundColor: accentTheme?.surface }}>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} className="hidden lg:hidden" />
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
              fallbackClassName="h-full w-full"
              fallbackStyle={{ backgroundColor: accentTheme?.surface }}
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
