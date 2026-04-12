"use client";

import type { LucideIcon } from "lucide-react";
import { Camera, Check, ChevronDown, Facebook, Globe, Instagram, Loader2, MapPin, Pencil, Phone, Settings, UsersRound, X, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import type { HubCTARecord } from "@/lib/services/ctas/cta-types";
import type { HubSection } from "@/lib/services/sections/section-types";
import type { HubColorTheme } from "@/lib/hub-color-themes";
import { CTADisplay } from "../ctas/CTADisplay";
import { CustomSectionDisplay } from "./custom/CustomSectionDisplay";
import { ACTION_ICON, ACTION_ICON_BUTTON, CARD, displayLinkValue, ImageWithFallback, initials, cn } from "../hubUtils";



/* ── Collapsible Card ────────────────────────────────────────────── */

function CollapsibleCard({
  title,
  defaultOpen = true,
  headerAction,
  children,
  accentTheme,
}: {
  title: string;
  defaultOpen?: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  accentTheme?: HubColorTheme;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border border-[var(--ud-border)]"
      style={{ backgroundColor: accentTheme?.wash }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen((v) => !v); } }}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3"
      >
        <p className="text-sm font-medium text-[var(--ud-text-muted)]">{title}</p>
        <div className="flex items-center gap-1.5">
          {headerAction}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[var(--ud-text-muted)] transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>
      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export function AboutSection({
  CategoryIcon,
  categoryLabel,
  hubName,
  hubDescription,
  hubTagline,
  settingsVisibility,
  memberCount,
  settingsLocation,
  hubLocationLabel,
  connectLinks,
  isCreatorAdmin,
  userRole,
  onMembershipAction,
  onInviteMembers,
  onOpenConnectEditor,
  onOpenSettings,
  connectSuccess,
  connectError,
  isUploadingGallery,
  onOpenGalleryUpload,
  galleryInputRef,
  onGalleryChange,
  recentPhotos,
  creatorAvatarSrc,
  creatorDisplayName,
  creatorDetail,
  status,
  onOpenAdminsEditor,
  adminImages,
  dpImageSrc,
  coverImageSrc,
  hubCTAs,
  onOpenCTAEditor,
  onSaveDescription,
  onOpenViewer,
  customSections,
  onOpenSectionEditor,
  onLeaveHub,
  accentTheme,
}: {
  CategoryIcon: LucideIcon;
  categoryLabel: string;
  hubName: string;
  hubDescription: string;
  hubTagline: string;
  settingsVisibility: "Public" | "Private";
  memberCount: number;
  settingsLocation: string;
  hubLocationLabel: string;
  connectLinks: { website: string; facebook: string; instagram: string; youtube: string; phone: string };
  isCreatorAdmin: boolean;
  userRole: string | null;
  onMembershipAction: () => void;
  onLeaveHub?: () => void;
  onInviteMembers: () => void;
  onOpenConnectEditor: () => void;
  onOpenSettings: () => void;
  connectSuccess: string | null;
  connectError: string | null;
  isUploadingGallery: boolean;
  onOpenGalleryUpload: () => void;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onGalleryChange: React.ChangeEventHandler<HTMLInputElement>;
  recentPhotos: string[];
  creatorAvatarSrc: string;
  creatorDisplayName: string;
  creatorDetail: string;
  status: string;
  onOpenAdminsEditor: () => void;
  adminImages: string[];
  dpImageSrc: string;
  coverImageSrc: string;
  hubCTAs?: HubCTARecord[];
  onOpenCTAEditor?: () => void;
  onSaveDescription?: (description: string) => Promise<void>;
  onOpenViewer?: (images: string[], index: number, title: string, body: string) => void;
  customSections?: HubSection[];
  onOpenSectionEditor?: () => void;
  accentTheme?: HubColorTheme;
}) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState(hubDescription);
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  // Sync draft when prop changes (e.g. after settings save or hub navigation)
  useEffect(() => {
    if (!isEditingDesc) {
      setDraftDesc(hubDescription || "");
    }
  }, [hubDescription, isEditingDesc]);

  const handleStartEditDesc = () => {
    setDraftDesc(hubDescription || "");
    setIsEditingDesc(true);
  };

  const handleSaveDesc = async () => {
    if (!onSaveDescription) return;
    setIsSavingDesc(true);
    try {
      await onSaveDescription(draftDesc);
      setIsEditingDesc(false);
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleCancelEditDesc = () => {
    setDraftDesc(hubDescription || "");
    setIsEditingDesc(false);
  };

  const connectItems = [
    { icon: Globe,     label: "Website",   value: connectLinks.website,   href: connectLinks.website },
    { icon: Phone,     label: "Phone",     value: connectLinks.phone,     href: connectLinks.phone ? `tel:${connectLinks.phone}` : "" },
    { icon: Facebook,  label: "Facebook",  value: connectLinks.facebook,  href: connectLinks.facebook },
    { icon: Instagram, label: "Instagram", value: connectLinks.instagram, href: connectLinks.instagram },
    { icon: Youtube,   label: "YouTube",   value: connectLinks.youtube,   href: connectLinks.youtube },
  ].filter((item) => item.value);

  const locationValue = settingsLocation || hubLocationLabel;
  const photoStack = recentPhotos.slice(0, 6);

  const showConnectCard = connectItems.length > 0 || isCreatorAdmin;
  const showPhotosCard = recentPhotos.length > 0 || isCreatorAdmin;

  return (
    <section className={cn(CARD, "w-full min-w-0 p-5 sm:p-6")}>
      <div className="space-y-6">

        {/* ═══ BLOCK 1 — Welcome + Join/Requested + Color Picker ═══ */}
        <div className="border-b border-[var(--ud-border)] pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Welcome to {hubName}!</h2>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {userRole === "pending" ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  Requested
                </span>
              ) : (userRole === "member" || userRole === "admin") && onLeaveHub ? (
                <button
                  type="button"
                  onClick={onLeaveHub}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Leave
                </button>
              ) : !userRole ? (
                <button
                  type="button"
                  onClick={onMembershipAction}
                  className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150"
                  style={{
                    backgroundColor: accentTheme?.primary,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentTheme?.primaryHover ?? accentTheme?.primary ?? "";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentTheme?.primary ?? "";
                  }}
                >
                  Join
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* ═══ BLOCK 2 — Editable Description ═══ */}
        <div className="border-b border-[var(--ud-border)] pb-5">
          {isEditingDesc ? (
            <div className="space-y-2">
              <textarea
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value.slice(0, 300))}
                placeholder={`Tell people what ${hubName} is about, who it's for, and what they can expect...`}
                rows={3}
                autoFocus
                className="w-full rounded-lg border border-[var(--ud-brand-primary)] bg-[var(--ud-bg-card)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none transition-colors duration-150 focus:ring-2 focus:ring-[var(--ud-brand-primary)]"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--ud-text-muted)]">{draftDesc.length}/300</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleCancelEditDesc} disabled={isSavingDesc} className="rounded-lg border border-[var(--ud-border)] p-1.5 text-[var(--ud-text-secondary)] transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)]">
                    <X className="h-3.5 w-3.5 stroke-2" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDesc}
                    disabled={isSavingDesc}
                    className="rounded-lg p-1.5 text-white transition-colors duration-150"
                    style={{
                      backgroundColor: accentTheme?.primary,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentTheme?.primaryHover ?? accentTheme?.primary ?? "";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentTheme?.primary ?? "";
                    }}
                  >
                    {isSavingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin stroke-2" /> : <Check className="h-3.5 w-3.5 stroke-2" />}
                  </button>
                </div>
              </div>
            </div>
          ) : hubDescription ? (
            <div className="group flex items-start gap-2">
              <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)]">{hubDescription}</p>
              {isCreatorAdmin ? (
                <button
                  type="button"
                  onClick={handleStartEditDesc}
                  className="shrink-0 rounded p-1 text-[var(--ud-text-muted)] opacity-0 transition group-hover:opacity-100"
                  style={{ "--hover-color": accentTheme?.primary } as React.CSSProperties & { "--hover-color": string }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = accentTheme?.primary ?? "#0C5C57";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--ud-text-muted)";
                  }}
                  aria-label="Edit description"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : isCreatorAdmin ? (
            <button
              type="button"
              onClick={handleStartEditDesc}
              className="w-full rounded-lg border border-dashed px-4 py-3 text-left text-sm text-[var(--ud-text-secondary)] transition-colors duration-150"
              style={{
                borderColor: "var(--ud-border)",
                backgroundColor: "var(--ud-bg-subtle)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = accentTheme?.surface ?? "#A9D1CA";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ud-border)";
              }}
            >
              <span className="font-medium text-[var(--ud-text-primary)]">Add a description</span>
              {" — "}Tell people what {hubName} is about, who it&apos;s for, and what they can expect.
            </button>
          ) : null}
        </div>

        {/* ═══ BLOCK 3 — Connect + About this hub + Members (collapsible cards in row) ═══ */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Connect card */}
          {showConnectCard ? (
            <CollapsibleCard
              title="Connect"
              accentTheme={accentTheme}
              headerAction={
                isCreatorAdmin ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenConnectEditor(); }}
                    className={ACTION_ICON_BUTTON}
                    aria-label="Edit connect links"
                    title="Edit connect links"
                  >
                    <Settings className={ACTION_ICON} />
                  </button>
                ) : undefined
              }
            >
              {connectItems.length > 0 ? (
                <div className="space-y-1.5">
                  {connectItems.map(({ icon: LinkIcon, label, value, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={label === "Phone" ? undefined : "_blank"}
                      rel={label === "Phone" ? undefined : "noreferrer"}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)]"
                    >
                      <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ud-text-muted)] stroke-2" />
                      <span className="shrink-0 text-xs text-[var(--ud-text-muted)]">{label}</span>
                      <span className="min-w-0 truncate text-xs font-medium text-[var(--ud-text-primary)]">
                        {label === "Phone" ? value : displayLinkValue(value)}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenConnectEditor}
                  className="text-sm transition hover:underline"
                  style={{ color: accentTheme?.primary }}
                >
                  Add contact info
                </button>
              )}
              {connectSuccess ? <p className="mt-2 text-xs font-medium" style={{ color: accentTheme?.primary }}>{connectSuccess}</p> : null}
              {connectError ? <p className="mt-2 text-xs font-medium text-red-600">{connectError}</p> : null}
            </CollapsibleCard>
          ) : null}

          {/* About this hub card */}
          <CollapsibleCard title="About this hub" accentTheme={accentTheme}>
            <div className="space-y-1.5">
              {[
                { icon: CategoryIcon, label: "Category",   value: categoryLabel },
                { icon: Globe,        label: "Visibility", value: settingsVisibility },
                { icon: UsersRound,   label: "Members",    value: `${memberCount} ${memberCount === 1 ? "member" : "members"}` },
                ...(locationValue ? [{ icon: MapPin, label: "Location", value: locationValue }] : []),
              ].map(({ icon: FactIcon, label, value }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                  <FactIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ud-text-muted)] stroke-2" />
                  <span className="shrink-0 text-xs text-[var(--ud-text-muted)]">{label}</span>
                  <span className="min-w-0 truncate text-xs font-medium text-[var(--ud-text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Members / Community leadership card */}
          <CollapsibleCard
            title="Members"
            accentTheme={accentTheme}
            headerAction={
              isCreatorAdmin ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenAdminsEditor(); }}
                  className={ACTION_ICON_BUTTON}
                  aria-label="Manage hub admins"
                  title="Manage hub admins"
                >
                  <Settings className={ACTION_ICON} />
                </button>
              ) : undefined
            }
          >
            <div className="flex items-center gap-3 rounded-xl bg-[var(--ud-bg-subtle)] px-3 py-3">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--ud-border)] bg-[var(--ud-brand-primary)]">
                <ImageWithFallback
                  src={creatorAvatarSrc}
                  sources={[creatorAvatarSrc, ...adminImages, dpImageSrc, coverImageSrc, ...recentPhotos]}
                  alt={creatorDisplayName}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-primary)] text-xs font-semibold text-[var(--ud-text-primary)]"
                  fallback={initials(creatorDisplayName)}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">{creatorDisplayName}</p>
                <p className="text-xs text-[var(--ud-text-muted)]">{creatorDetail}</p>
              </div>
            </div>
            {status === "loading" ? (
              <p className="mt-2 text-xs text-[var(--ud-text-muted)]">Loading details...</p>
            ) : null}
          </CollapsibleCard>
        </div>

        {/* ═══ BLOCK 4 — Photos row ═══ */}
        {showPhotosCard ? (
          <div className="border-t border-[var(--ud-border)] pt-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-sm font-medium text-[var(--ud-text-muted)]">Photos</p>
              {isCreatorAdmin ? (
                <button
                  type="button"
                  onClick={onOpenGalleryUpload}
                  disabled={isUploadingGallery}
                  className={cn(
                    "rounded-xl border border-[var(--ud-border)] px-2.5 py-1 text-xs font-medium text-[var(--ud-text-secondary)] transition",
                    isUploadingGallery && "cursor-not-allowed opacity-60"
                  )}
                  style={{
                    borderColor: "var(--ud-border)",
                    color: "var(--ud-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = accentTheme?.surface ?? "#A9D1CA";
                    (e.currentTarget as HTMLButtonElement).style.color = accentTheme?.primary ?? "#0C5C57";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ud-border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--ud-text-secondary)";
                  }}
                >
                  {isUploadingGallery ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin stroke-2" />
                      Uploading
                    </span>
                  ) : (
                    "Add Photo"
                  )}
                </button>
              ) : null}
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGalleryChange} className="hidden" />

            {photoStack.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photoStack.map((photo, i) => (
                  <button
                    key={`${photo}-${i}`}
                    type="button"
                    onClick={() => onOpenViewer?.(recentPhotos, i, `${hubName} Album`, "Recent photos from this hub.")}
                    className="shrink-0 h-28 w-28 overflow-hidden rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] shadow-sm transition hover:shadow-md"
                  >
                    <ImageWithFallback
                      src={photo}
                      sources={[photo, coverImageSrc, dpImageSrc].filter(Boolean)}
                      alt={`${hubName} photo ${i + 1}`}
                      className="h-full w-full object-cover"
                      fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-primary)]/35 text-xs text-[var(--ud-brand-primary)]"
                      fallback="Photo"
                    />
                  </button>
                ))}
                {recentPhotos.length > 6 ? (
                  <button
                    type="button"
                    onClick={() => onOpenViewer?.(recentPhotos, 0, `${hubName} Album`, "Recent photos from this hub.")}
                    className="flex shrink-0 h-28 w-28 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm font-semibold transition"
                    style={{
                      backgroundColor: accentTheme?.wash,
                      color: accentTheme?.primary,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentTheme?.surface ?? "#EAF6F3";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentTheme?.wash ?? "#F7FBFA";
                    }}
                  >
                    +{recentPhotos.length - 6} more
                  </button>
                ) : null}
              </div>
            ) : (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: accentTheme?.wash }}
              >
                <Camera className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)] stroke-2" />
                <button
                  type="button"
                  onClick={onOpenGalleryUpload}
                  className="text-sm transition-colors duration-150 hover:underline"
                  style={{ color: accentTheme?.primary }}
                >
                  Add photos to bring this hub to life
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* ═══ BLOCK 5 — Custom sections ═══ */}
        {((customSections && customSections.length > 0) || isCreatorAdmin) ? (
          <div className="border-t border-[var(--ud-border)] pt-5">
            <CustomSectionDisplay
              sections={customSections ?? []}
              isCreatorAdmin={isCreatorAdmin}
              onEdit={onOpenSectionEditor}
            />
          </div>
        ) : null}

      </div>
    </section>
  );
}
