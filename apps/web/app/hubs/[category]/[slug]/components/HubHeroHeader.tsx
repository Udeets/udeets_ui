"use client";

/* eslint-disable @next/next/no-img-element */
import { Globe, Lock, Settings, Users } from "lucide-react";
import type { HubColorTheme, HubColorThemeKey } from "@/lib/hub-color-themes";
import { HUB_COLOR_THEMES } from "@/lib/hub-color-themes";
import { ImageWithFallback, cn, initials } from "./hubUtils";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

/* ── Color Theme Circle Button (inline in action row) ── */
function ActionRowColorPicker({
  selectedColor,
  onColorChange,
}: {
  selectedColor?: HubColorThemeKey;
  onColorChange: (color: HubColorThemeKey) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updateDropdownPos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      left: Math.max(8, rect.left - 60),
    });
  };

  const handleButtonClick = () => {
    updateDropdownPos();
    setIsOpen((v) => !v);
  };

  const handleColorSelect = (color: HubColorThemeKey) => {
    onColorChange(color);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-sm transition hover:shadow-md"
        title="Theme color"
        aria-label="Open color theme picker"
      >
        <div
          className="h-5 w-5 rounded-full"
          style={{
            background: `conic-gradient(${HUB_COLOR_THEMES.map((t) => t.swatch).join(", ")})`,
          }}
        />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-50 rounded-lg bg-[var(--ud-bg-card)] shadow-lg border border-[var(--ud-border)] p-3"
            style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: "220px" }}
          >
            <div className="space-y-1.5">
              {HUB_COLOR_THEMES.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => handleColorSelect(theme.key)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]"
                >
                  <div
                    className="h-5 w-5 rounded border border-[var(--ud-border)]"
                    style={{ backgroundColor: theme.swatch }}
                  />
                  <span className="flex-1 text-left text-[var(--ud-text-secondary)]">{theme.label}</span>
                  {selectedColor === theme.key ? (
                    <svg className="h-4 w-4 text-[var(--ud-brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

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
  settingsAccentColor,
  onSettingsAccentColorChange,
  onOpenSettings,
  onOpenMembers,
  onInviteMembers,
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
  settingsAccentColor?: HubColorThemeKey;
  onSettingsAccentColorChange?: (color: HubColorThemeKey) => void;
  onOpenSettings?: () => void;
  onOpenMembers?: () => void;
  onInviteMembers?: () => void;
}) {
  const VisibilityIcon = visibilityLabel === "Public" ? Globe : Lock;

  return (
    <div className="w-full">
      {/* ─── Mobile Layout ─── */}
      <div className="lg:hidden">
        {/* Cover image */}
        <div className="relative h-[200px] overflow-hidden" style={{ backgroundColor: accentTheme?.wash }}>
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

          {/* DP avatar — half overlapping cover bottom (Band-style) */}
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

          {/* ─── Action Row: Members, Invite, Theme, Settings ─── */}
          <div className="mt-3 flex items-center gap-2">
            {/* Members count button — flex-1 to fill space */}
            <button
              type="button"
              onClick={onOpenMembers}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] py-2 text-xs font-medium text-[var(--ud-text-primary)] shadow-sm transition hover:bg-[var(--ud-bg-subtle)]"
            >
              <Users className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{memberCount} {memberCount === 1 ? "Member" : "Members"}</span>
            </button>

            {/* Invite button — flex-1 to fill space */}
            <button
              type="button"
              onClick={onInviteMembers}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2 text-xs font-medium transition hover:bg-[var(--ud-brand-light)]"
              style={{ color: accentTheme?.primary, borderColor: accentTheme?.primary }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-6M19 9v6" />
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span>Invite</span>
            </button>

            {/* Theme color circle */}
            {isCreatorAdmin && onSettingsAccentColorChange && (
              <ActionRowColorPicker
                selectedColor={settingsAccentColor}
                onColorChange={onSettingsAccentColorChange}
              />
            )}

            {/* Settings gear */}
            {isCreatorAdmin && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] shadow-sm transition hover:bg-[var(--ud-bg-subtle)]"
                title="Hub settings"
                aria-label="Open hub settings"
              >
                <Settings className="h-4 w-4 text-[var(--ud-text-secondary)] stroke-[1.5]" />
              </button>
            )}
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
