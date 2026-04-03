"use client";

import type { LucideIcon } from "lucide-react";
import { Camera, Check, Facebook, Globe, Instagram, Loader2, MapPin, Pencil, Phone, Settings, UsersRound, X, Youtube } from "lucide-react";
import { useState } from "react";
import type { HubCTARecord } from "@/lib/services/ctas/cta-types";
import type { HubSection } from "@/lib/services/sections/section-types";
import { CTADisplay } from "../ctas/CTADisplay";
import { CustomSectionDisplay } from "./custom/CustomSectionDisplay";
import { ACTION_ICON, ACTION_ICON_BUTTON, CARD, displayLinkValue, ImageWithFallback, initials, cn } from "../hubUtils";

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
}) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState(hubDescription);
  const [isSavingDesc, setIsSavingDesc] = useState(false);

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
  const photoStack = recentPhotos.slice(0, 4);
  const extraPhotos = recentPhotos.length > 4 ? recentPhotos.length - 4 : 0;
  const rotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

  const showConnectCard = connectItems.length > 0 || isCreatorAdmin;
  const showPhotosCard = recentPhotos.length > 0 || isCreatorAdmin;

  return (
    <section className={cn(CARD, "w-full min-w-0 p-5 sm:p-6")}>
      <div className="space-y-6">

        {/* BLOCK 1 — Welcome row */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#111111]">Welcome to {hubName}!</h2>
            <div className="flex shrink-0 items-center gap-2">
              {userRole === "pending" ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  Requested
                </span>
              ) : !userRole ? (
                <button
                  type="button"
                  onClick={onMembershipAction}
                  className="rounded-lg bg-[#0C5C57] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#094a46]"
                >
                  Join
                </button>
              ) : null}
              {userRole === "creator" || userRole === "admin" ? (
                <button
                  type="button"
                  onClick={onInviteMembers}
                  className="rounded-lg border border-[#0C5C57] px-4 py-1.5 text-sm font-medium text-[#0C5C57] transition hover:bg-[#f0faf8]"
                >
                  Invite
                </button>
              ) : null}
            </div>
          </div>

          {/* Editable description */}
          <div className="mt-2">
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value.slice(0, 300))}
                  placeholder={`Tell people what ${hubName} is about, who it's for, and what they can expect...`}
                  rows={3}
                  autoFocus
                  className="w-full rounded-lg border border-[#A9D1CA] bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#A9D1CA]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{draftDesc.length}/300</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleCancelEditDesc} disabled={isSavingDesc} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={handleSaveDesc} disabled={isSavingDesc} className="rounded-lg bg-[#0C5C57] p-1.5 text-white transition hover:bg-[#094a46]">
                      {isSavingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : hubDescription ? (
              <div className="group flex items-start gap-2">
                <p className="text-sm leading-relaxed text-slate-600">{hubDescription}</p>
                {isCreatorAdmin ? (
                  <button type="button" onClick={handleStartEditDesc} className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition hover:text-[#0C5C57] group-hover:opacity-100" aria-label="Edit description">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : isCreatorAdmin ? (
              <button
                type="button"
                onClick={handleStartEditDesc}
                className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-500 transition hover:border-[#A9D1CA]"
              >
                <span className="font-medium text-[#111111]">Add a description</span>
                {" — "}Tell people what {hubName} is about, who it&apos;s for, and what they can expect.
              </button>
            ) : null}
          </div>
        </div>

        {/* BLOCK 1.5 — CTA Buttons */}
        {((hubCTAs && hubCTAs.length > 0) || isCreatorAdmin) ? (
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-sm font-medium text-slate-500">Quick Actions</p>
              {isCreatorAdmin && onOpenCTAEditor ? (
                <button type="button" onClick={onOpenCTAEditor} className={ACTION_ICON_BUTTON} aria-label="Edit CTAs" title="Edit CTA buttons">
                  <Pencil className={ACTION_ICON} />
                </button>
              ) : null}
            </div>
            {hubCTAs && hubCTAs.length > 0 ? (
              <CTADisplay ctas={hubCTAs} />
            ) : isCreatorAdmin && onOpenCTAEditor ? (
              <button
                type="button"
                onClick={onOpenCTAEditor}
                className="text-sm text-[#0C5C57] transition hover:underline"
              >
                Add call-to-action buttons →
              </button>
            ) : null}
          </div>
        ) : null}

        {/* BLOCK 2 — Connect + Photos */}
        {(showConnectCard || showPhotosCard) ? (
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Connect */}
            {showConnectCard ? (
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">Connect</p>
                  {isCreatorAdmin ? (
                    <button type="button" onClick={onOpenConnectEditor} className={ACTION_ICON_BUTTON} aria-label="Edit connect links" title="Edit connect links">
                      <Settings className={ACTION_ICON} />
                    </button>
                  ) : null}
                </div>
                {connectItems.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {connectItems.map(({ icon: LinkIcon, label, value, href }) => (
                      <a
                        key={label}
                        href={href}
                        target={label === "Phone" ? undefined : "_blank"}
                        rel={label === "Phone" ? undefined : "noreferrer"}
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition hover:bg-[#F7FBFA]"
                      >
                        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="shrink-0 text-xs text-slate-400">{label}</span>
                        <span className="min-w-0 truncate text-xs font-medium text-[#111111]">
                          {label === "Phone" ? value : displayLinkValue(value)}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenConnectEditor}
                    className="mt-2 text-sm text-[#0C5C57] transition hover:underline"
                  >
                    Add contact info →
                  </button>
                )}
                {connectSuccess ? <p className="mt-2 text-xs font-medium text-[#0C5C57]">{connectSuccess}</p> : null}
                {connectError ? <p className="mt-2 text-xs font-medium text-[#B42318]">{connectError}</p> : null}
              </div>
            ) : null}

            {/* Photos */}
            {showPhotosCard ? (
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">Photos</p>
                  {isCreatorAdmin ? (
                    <button
                      type="button"
                      onClick={onOpenGalleryUpload}
                      disabled={isUploadingGallery}
                      className={cn(
                        "rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]",
                        isUploadingGallery && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {isUploadingGallery ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
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
                  <button
                    type="button"
                    onClick={() => onOpenViewer?.(recentPhotos, 0, `${hubName} Album`, "Recent photos from this hub.")}
                    className="mt-3 flex items-center justify-start"
                  >
                    <div className="relative h-36 w-36">
                      {photoStack.map((photo, i) => (
                        <div
                          key={`${photo}-${i}`}
                          className={cn(
                            "absolute inset-0 overflow-hidden rounded-xl border-4 border-white bg-slate-100 shadow",
                            rotations[i] ?? ""
                          )}
                          style={{ zIndex: i + 1 }}
                        >
                          <ImageWithFallback
                            src={photo}
                            sources={[photo, coverImageSrc, dpImageSrc].filter(Boolean)}
                            alt={`${hubName} photo ${i + 1}`}
                            className="h-full w-full object-cover"
                            fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-xs text-[#0C5C57]"
                            fallback="Photo"
                          />
                        </div>
                      ))}
                      {extraPhotos > 0 ? (
                        <div className="absolute -bottom-2 -right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#0C5C57] text-[11px] font-bold text-white shadow">
                          +{extraPhotos}
                        </div>
                      ) : null}
                    </div>
                  </button>
                ) : (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7FBFA] px-4 py-3">
                    <Camera className="h-4 w-4 shrink-0 text-slate-400" />
                    <button
                      type="button"
                      onClick={onOpenGalleryUpload}
                      className="text-sm text-[#0C5C57] transition hover:underline"
                    >
                      Add photos to bring this hub to life
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* BLOCK 2.5 — Custom sections */}
        {((customSections && customSections.length > 0) || isCreatorAdmin) ? (
          <div className="border-b border-slate-100 pb-5">
            <CustomSectionDisplay
              sections={customSections ?? []}
              isCreatorAdmin={isCreatorAdmin}
              onEdit={onOpenSectionEditor}
            />
          </div>
        ) : null}

        {/* BLOCK 3 — Quick facts + Community leadership */}
        <div className="grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">

          {/* Quick facts */}
          <div>
            <p className="text-sm font-medium text-slate-500">About this hub</p>
            <div className="mt-2 space-y-1.5">
              {[
                { icon: CategoryIcon, label: "Category",   value: categoryLabel },
                { icon: Globe,        label: "Visibility", value: settingsVisibility },
                { icon: UsersRound,   label: "Members",    value: `${memberCount} ${memberCount === 1 ? "member" : "members"}` },
                ...(locationValue ? [{ icon: MapPin, label: "Location", value: locationValue }] : []),
              ].map(({ icon: FactIcon, label, value }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                  <FactIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="shrink-0 text-xs text-slate-400">{label}</span>
                  <span className="min-w-0 truncate text-xs font-medium text-[#111111]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community leadership */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">Community leadership</p>
              {isCreatorAdmin ? (
                <button type="button" onClick={onOpenAdminsEditor} className={ACTION_ICON_BUTTON} aria-label="Manage hub admins" title="Manage hub admins">
                  <Settings className={ACTION_ICON} />
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#F7FBFA] px-3 py-3">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                <ImageWithFallback
                  src={creatorAvatarSrc}
                  sources={[creatorAvatarSrc, ...adminImages, dpImageSrc, coverImageSrc, ...recentPhotos]}
                  alt={creatorDisplayName}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                  fallback={initials(creatorDisplayName)}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111111]">{creatorDisplayName}</p>
                <p className="text-xs text-slate-400">{creatorDetail}</p>
              </div>
            </div>
            {status === "loading" ? (
              <p className="mt-2 text-xs text-slate-400">Loading details...</p>
            ) : null}
          </div>
        </div>

      </div>
    </section>
  );
}
