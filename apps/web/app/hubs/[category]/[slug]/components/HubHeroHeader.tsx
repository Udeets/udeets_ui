"use client";

/* eslint-disable @next/next/no-img-element */
import { Bell, Globe, Lock, Users } from "lucide-react";
import type { HubColorTheme } from "@/lib/hub-color-themes";
import { ImageWithFallback, cn } from "./hubUtils";

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
  creatorDisplayName,
  onOpenMembers,
  onInviteMembers,
  onOpenAlerts,
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
  creatorDisplayName?: string;
  onOpenMembers?: () => void;
  onInviteMembers?: () => void;
  onOpenAlerts?: () => void;
}) {
  const VisibilityIcon = visibilityLabel === "Public" ? Globe : Lock;

  return (
    <div className="w-full">
      {/* ─── Mobile Layout ─── */}
      <div className="lg:hidden">
        {/* Cover image */}
        <div className="relative" style={{ backgroundColor: accentTheme?.wash }}>
          {/* Cover image — clipped independently */}
          <div className="h-[200px] overflow-hidden">
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
          </div>

          {/* DP avatar — half inside hero, half below */}
          <div className="absolute -bottom-12 left-4 z-10">
            <input ref={dpInputRef} type="file" accept="image/*" onChange={onDpChange} className="hidden" />
            <button
              type="button"
              onClick={onOpenDpChooser}
              disabled={!isCreatorAdmin || isUploadingDp}
              className={cn(
                "h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg",
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
                  fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)] text-2xl font-semibold text-[var(--ud-brand-primary)]"
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

        {/* Hub info below cover — with padding-top for DP overlap */}
        <div className="bg-[var(--ud-bg-card)] px-4 pb-3 pt-16">
          {/* Hub name */}
          <h1 className="text-xl font-bold tracking-tight text-[var(--ud-text-primary)]">{headerHubName}</h1>

          {/* Category · Visibility icon · Creator name */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ud-text-secondary)]">
            <span>{categoryLabel}</span>
            <span className="text-[var(--ud-text-muted)]">·</span>
            <VisibilityIcon className="h-3 w-3" />
            <span>{visibilityLabel}</span>
            {creatorDisplayName && (
              <>
                <span className="text-[var(--ud-text-muted)]">·</span>
                <span>Creator ({creatorDisplayName})</span>
              </>
            )}
          </div>

          {/* ─── Action Row: Members, Invite, Alert ─── */}
          <div className="mt-3 flex items-center gap-2">
            {/* Members count button */}
            <button
              type="button"
              onClick={onOpenMembers}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] py-2 text-xs font-medium text-[var(--ud-text-primary)] shadow-sm transition hover:bg-[var(--ud-bg-subtle)]"
            >
              <Users className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{memberCount} {memberCount === 1 ? "Member" : "Members"}</span>
            </button>

            {/* Invite button */}
            <button
              type="button"
              onClick={onInviteMembers}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--ud-brand-primary)] py-2 text-xs font-medium text-[var(--ud-brand-primary)] transition hover:bg-[var(--ud-brand-light)]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-6M19 9v6" />
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span>Invite</span>
            </button>

            {/* Alert bell button */}
            <button
              type="button"
              onClick={onOpenAlerts}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-sm transition hover:bg-[var(--ud-bg-subtle)]"
              title="Hub alerts"
              aria-label="View hub alerts"
            >
              <Bell className="h-4 w-4 text-[var(--ud-text-secondary)] stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Desktop Layout ─── */}
      <div className="hidden grid-cols-[240px_1fr] lg:grid">
        {/* Left panel — DP, name, meta */}
        <div className="relative flex min-h-[260px] flex-col items-center justify-between border-r border-[var(--ud-border-subtle)] px-4 py-4" style={{ backgroundColor: accentTheme?.wash }}>
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
              <div className="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]">
                <span className="text-6xl font-semibold text-[var(--ud-brand-primary)]">{headerHubName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </button>

          <div className="w-full text-center">
            <h1 className="break-words text-center text-[15px] font-semibold tracking-tight text-[var(--ud-text-primary)]">{headerHubName}</h1>
            <p className="mt-1 text-center text-[12px] text-[var(--ud-text-secondary)]">{categoryLabel} · {memberCount} {memberCount === 1 ? "Member" : "Members"}</p>
          </div>
        </div>

        {/* Right panel — cover image */}
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
              <div className="h-full w-full" style={{ backgroundColor: accentTheme?.surface ?? "#A9D1CA" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
